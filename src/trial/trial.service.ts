import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

function truncatePreview(text: string, limit = 168) {
  const normalized = text.trim();
  if (!normalized) {
    return { previewText: '', truncated: false, hiddenChars: 0 };
  }

  if (normalized.length <= limit) {
    return {
      previewText: normalized,
      truncated: false,
      hiddenChars: 0,
    };
  }

  const slice = normalized.slice(0, limit);
  const cutAt = Math.max(
    slice.lastIndexOf('。'),
    slice.lastIndexOf('！'),
    slice.lastIndexOf('？'),
    slice.lastIndexOf('\n'),
  );
  const preview = (
    cutAt >= Math.floor(limit * 0.6) ? slice.slice(0, cutAt + 1) : slice
  ).trim();

  return {
    previewText: `${preview}\n\n......`,
    truncated: true,
    hiddenChars: Math.max(normalized.length - preview.length, 0),
  };
}

function ensureExtendedDraft(text: string, demand: string) {
  const normalized = text.trim();
  if (normalized.length >= 260) {
    return normalized;
  }

  const extension = [
    '这只是一个起稿方向，真正发布时还可以继续往下补细节。',
    `围绕“${demand}”再往下展开时，可以把开头钩子、核心卖点、真实使用感和结尾互动依次补全。`,
    '如果要更像平台上的高转化内容，还可以继续细修标题、段落节奏、情绪词和行动引导，让整篇内容更完整。',
  ].join('');

  return `${normalized}${normalized ? '\n\n' : ''}${extension}`.trim();
}

@Injectable()
export class TrialService {
  constructor(private readonly ai: AiService) {}

  async preview(input: { prompt: string }) {
    const demand = input.prompt.trim();
    let fullText = '';

    try {
      fullText = await this.ai.chatText({
        system:
          '你是一位擅长内容创作的中文助手。请根据用户需求，直接生成一版可继续打磨的内容草稿，只输出正文，不要解释说明。',
        user: [
          '请围绕下面这段需求，生成一版适合继续编辑的内容草稿。',
          '要求：',
          '1. 用中文输出',
          '2. 结果尽量自然、口语化、像真实创作者会发出的内容',
          '3. 不要输出分析过程或解释',
          `用户需求：${demand}`,
        ].join('\n'),
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        fullText = [
          `围绕“${demand}”，这轮内容可以先从最容易被用户感知的卖点切入。`,
          '先把场景讲清楚，再把产品亮点、使用感受和适合的人群顺下来，整段内容会更像真实分享。',
          '如果后面继续细修，可以再补上平台语气、标题方向和结尾互动引导。',
        ].join('');
      } else {
        throw error;
      }
    }

    const preview = truncatePreview(ensureExtendedDraft(fullText, demand));

    return {
      title: '这是你这轮体验预览',
      ...preview,
      continueHint: preview.truncated
        ? '登录后继续查看完整内容，并进入你的工作台继续编辑。'
        : '登录后可以把这轮内容直接接进你的工作台继续编辑。',
    };
  }
}
