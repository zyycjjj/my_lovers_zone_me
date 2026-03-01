import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { getDateKey } from '../common/date';
import { EventService } from '../event/event.service';

function tryParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractJson(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  const aStart = text.indexOf('[');
  const aEnd = text.lastIndexOf(']');
  if (aStart >= 0 && aEnd > aStart) return text.slice(aStart, aEnd + 1);
  return text;
}

function detectRisks(text: string) {
  const risks: Array<{ type: string; matches: string[] }> = [];

  const extremeWords = [
    '全网最低',
    '最便宜',
    '绝对',
    '100%有效',
    '根治',
    '秒杀',
  ];
  const extremeMatches = extremeWords.filter((w) => text.includes(w));
  if (extremeMatches.length) {
    risks.push({ type: '极限词检测', matches: extremeMatches });
  }

  const medical = ['治愈', '疗效', '抗癌', '降糖', '降压', '消炎', '止痛'];
  const medicalMatches = medical.filter((w) => text.includes(w));
  if (medicalMatches.length) {
    risks.push({ type: '医疗功效风险', matches: medicalMatches });
  }

  const finance = ['稳赚', '保本', '无风险', '保证收益', '翻倍'];
  const financeMatches = finance.filter((w) => text.includes(w));
  if (financeMatches.length) {
    risks.push({ type: '金融承诺风险', matches: financeMatches });
  }

  return risks;
}

@Injectable()
export class ToolService {
  constructor(
    private readonly ai: AiService,
    private readonly events: EventService,
  ) {}

  async generateScript(
    userId: number,
    input: {
      keyword: string;
      price?: number;
      audience?: string;
      scene?: string;
      style?: 'short' | 'live';
    },
  ) {
    const styleLabel = input.style === 'live' ? '直播口播' : '短视频种草';
    const prompt = [
      `你是资深抖音带货编导。请为商品生成${styleLabel}脚本，面向真实转化。`,
      `要求输出以下结构，用中文，分段清晰：`,
      `1) 3秒开场钩子`,
      `2) 30s脚本`,
      `3) 60s脚本（可选）`,
      `4) 分镜建议（6-8条）`,
      `5) 评论区引导话术`,
      ``,
      `商品关键词：${input.keyword}`,
      input.price != null ? `价格：${input.price}` : '',
      input.audience ? `目标人群：${input.audience}` : '',
      input.scene ? `使用场景：${input.scene}` : '',
      `尽量避免极限词和医疗功效承诺。`,
    ]
      .filter(Boolean)
      .join('\n');

    let text = '';
    try {
      text = await this.ai.chatText({ user: prompt });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        text = [
          `【3秒开场钩子】`,
          `这款${input.keyword}真的太适合${input.audience || '你'}了！`,
          ``,
          `【30s脚本】`,
          `先看颜值，再看细节。${input.keyword}上手就很舒服，${
            input.scene ? `在${input.scene}使用更顺手。` : '日常用也很实用。'
          }`,
          input.price != null ? `价格 ${input.price}，性价比很稳。` : '',
          `现在入手刚好，别等没货再后悔。`,
          ``,
          `【分镜建议】`,
          `1. 开箱特写`,
          `2. 细节展示`,
          `3. 使用场景`,
          `4. 对比亮点`,
          `5. 价格与福利`,
          `6. 下单引导`,
          ``,
          `【评论区引导】`,
          `想要的扣1，我把链接放评论区。`,
        ]
          .filter(Boolean)
          .join('\n');
      } else {
        throw error;
      }
    }
    await this.events.incrementToolUsed(userId, 'script', getDateKey());
    return { text };
  }

  async generateTitle(
    userId: number,
    input: { keyword: string; style?: string },
  ) {
    const prompt = [
      `你是抖音带货标题策划。请生成20条爆款标题，尽量口语化、短、自然。`,
      `要求返回JSON数组，数组元素是字符串标题，不要任何额外文字。`,
      `商品关键词：${input.keyword}`,
      input.style ? `风格：${input.style}` : '',
      `避免极限词、医疗功效、金融承诺。`,
    ]
      .filter(Boolean)
      .join('\n');

    let raw = '';
    try {
      raw = await this.ai.chatText({ user: prompt });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        const base = input.keyword.trim() || '好物';
        const titles = [
          `${base}真的绝了，开箱就爱上`,
          `${base}的隐藏用法，越用越香`,
          `${base}上手体验：这次没踩雷`,
          `${base}值不值？我给你答案`,
          `${base}适合谁？看完就懂`,
          `${base}的细节太加分了`,
          `${base}性价比拉满的选择`,
          `${base}体验感拉满的一天`,
          `想要${base}的看这里`,
          `${base}真实测评，别盲买`,
        ];
        await this.events.incrementToolUsed(userId, 'title', getDateKey());
        return { titles };
      }
      throw error;
    }
    const parsed = tryParseJson<string[]>(extractJson(raw));
    const titles = Array.isArray(parsed)
      ? parsed
          .filter((t) => typeof t === 'string' && t.trim().length)
          .slice(0, 20)
      : raw
          .split('\n')
          .map((l) => l.replace(/^\s*[-\d.、]+/, '').trim())
          .filter(Boolean)
          .slice(0, 20);

    await this.events.incrementToolUsed(userId, 'title', getDateKey());
    return { titles };
  }

  async refineTalk(userId: number, input: { text: string }) {
    const risks = detectRisks(input.text);
    const prompt = [
      `你是直播话术合规与提炼助手。对输入话术做提炼与合规提醒。`,
      `请返回JSON对象，不要任何额外文字，字段如下：`,
      `{`,
      `  "summaryLine": string,`,
      `  "sellingPoints": string[],`,
      `  "suggestions": string[],`,
      `  "safeRewrites": string[]`,
      `}`,
      `要求：sellingPoints 3-5条，summaryLine 一句话，safeRewrites 给3条替换表达。`,
      `输入话术：${input.text}`,
    ].join('\n');

    let raw = '';
    try {
      raw = await this.ai.chatText({ user: prompt });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        const summaryLine = input.text.slice(0, 30);
        await this.events.incrementToolUsed(userId, 'refine', getDateKey());
        return {
          summaryLine,
          sellingPoints: input.text
            ? [input.text.slice(0, 12), input.text.slice(12, 24)]
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          risks,
          suggestions: risks.length
            ? ['适当弱化承诺用语', '避免绝对化表述']
            : ['保持描述真实可信', '突出具体体验点'],
          safeRewrites: [
            '体验感很好，值得一试',
            '表现稳定，适合日常使用',
            '用起来更安心',
          ],
        };
      }
      throw error;
    }
    const parsed = tryParseJson<{
      summaryLine?: string;
      sellingPoints?: unknown;
      suggestions?: unknown;
      safeRewrites?: unknown;
    }>(extractJson(raw));

    const sellingPoints = Array.isArray(parsed?.sellingPoints)
      ? (parsed?.sellingPoints as unknown[])
          .filter((x) => typeof x === 'string')
          .slice(0, 5)
      : [];
    const suggestions = Array.isArray(parsed?.suggestions)
      ? (parsed?.suggestions as unknown[])
          .filter((x) => typeof x === 'string')
          .slice(0, 8)
      : [];
    const safeRewrites = Array.isArray(parsed?.safeRewrites)
      ? (parsed?.safeRewrites as unknown[])
          .filter((x) => typeof x === 'string')
          .slice(0, 5)
      : [];

    await this.events.incrementToolUsed(userId, 'refine', getDateKey());
    return {
      summaryLine: parsed?.summaryLine ?? '',
      sellingPoints,
      risks,
      suggestions,
      safeRewrites,
    };
  }

  async commission(
    userId: number,
    input: { price: number; commissionRate: number; platformRate?: number },
  ) {
    const platformRate = input.platformRate ?? 0;
    const commission = input.price * input.commissionRate * (1 - platformRate);
    const comparisons = [0.8, 1, 1.2].map((k) => {
      const price = Math.round(input.price * k * 100) / 100;
      const value = price * input.commissionRate * (1 - platformRate);
      return { price, commission: Math.round(value * 100) / 100 };
    });

    const sellingPoint = `按当前佣金比例，每单预估约 ${Math.round(commission * 100) / 100} 元佣金。`;

    await this.events.incrementToolUsed(userId, 'commission', getDateKey());
    return {
      commission: Math.round(commission * 100) / 100,
      comparisons,
      sellingPoint,
    };
  }
}
