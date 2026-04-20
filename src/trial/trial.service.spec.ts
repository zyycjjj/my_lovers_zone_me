import { ServiceUnavailableException } from '@nestjs/common';
import { TrialService } from './trial.service';

describe('TrialService', () => {
  const ai = {
    chatText: jest.fn(),
  };

  let service: TrialService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrialService(ai as never);
  });

  it('体验预览应返回截断后的内容与继续提示', async () => {
    ai.chatText.mockResolvedValue('这是一段足够长的体验预览内容。'.repeat(24));

    const result = await service.preview({
      prompt: '帮我写一段春季新品上新的小红书文案',
    });

    expect(result.title).toBe('这是你这轮体验预览');
    expect(result.truncated).toBe(true);
    expect(result.hiddenChars).toBeGreaterThan(0);
    expect(result.previewText).toContain('......');
    expect(result.continueHint).toContain('登录后继续查看完整内容');
  });

  it('AI 不可用时也应回退到可截断的体验预览', async () => {
    ai.chatText.mockRejectedValue(
      new ServiceUnavailableException('ai offline'),
    );

    const result = await service.preview({
      prompt: '帮我写一段产品体验分享',
    });

    expect(result.truncated).toBe(true);
    expect(result.hiddenChars).toBeGreaterThan(0);
    expect(result.previewText).toContain('......');
  });
});
