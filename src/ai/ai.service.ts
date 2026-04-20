import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

@Injectable()
export class AiService {
  private get timeoutMs() {
    const raw = Number(process.env['AI_REQUEST_TIMEOUT_MS'] || 20000);
    if (!Number.isFinite(raw) || raw <= 0) return 20000;
    return raw;
  }

  private get maxTokens() {
    const raw = Number(process.env['AI_MAX_TOKENS'] || 1200);
    if (!Number.isFinite(raw) || raw <= 0) return 1200;
    return raw;
  }

  private get chatCompletionsUrlOverride() {
    return process.env['AI_CHAT_COMPLETIONS_URL']?.trim();
  }

  private get baseUrl() {
    const raw = process.env['AI_BASE_URL']?.trim();
    if (!raw) throw new ServiceUnavailableException('AI not configured');
    return raw.replace(/\/+$/, '');
  }

  private get apiKey() {
    const raw = process.env['AI_API_KEY']?.trim();
    if (!raw) throw new ServiceUnavailableException('AI not configured');
    return raw;
  }

  private get model() {
    return process.env['AI_MODEL']?.trim() || 'gpt-4o-mini';
  }

  private get chatCompletionsUrl() {
    if (this.chatCompletionsUrlOverride) {
      return this.chatCompletionsUrlOverride;
    }

    if (this.baseUrl.endsWith('/chat/completions')) return this.baseUrl;
    if (/\/v\d+$/.test(this.baseUrl)) return `${this.baseUrl}/chat/completions`;

    // GLM 常见基座地址为 https://open.bigmodel.cn/api/paas
    if (this.baseUrl.includes('bigmodel.cn')) {
      return `${this.baseUrl}/v4/chat/completions`;
    }

    // OpenAI 兼容默认回退
    return `${this.baseUrl}/v1/chat/completions`;
  }

  async chatText(params: {
    system?: string;
    user: string;
    model?: string;
    timeoutMs?: number;
    maxTokens?: number;
  }) {
    try {
      const controller = new AbortController();
      const timeoutMs =
        params.timeoutMs && params.timeoutMs > 0 ? params.timeoutMs : this.timeoutMs;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await (async () => {
        try {
          return await fetch(this.chatCompletionsUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: params.model || this.model,
              messages: [
                ...(params.system
                  ? [{ role: 'system', content: params.system }]
                  : []),
                { role: 'user', content: params.user },
              ],
              temperature: 0.7,
              max_tokens:
                params.maxTokens && params.maxTokens > 0
                  ? params.maxTokens
                  : this.maxTokens,
            }),
          });
        } finally {
          clearTimeout(timer);
        }
      })();

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new ServiceUnavailableException(
          `AI request failed: ${res.status} ${text}`,
        );
      }

      const data = (await res.json()) as ChatCompletionResponse;
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('AI request timeout');
      }
      throw new ServiceUnavailableException('AI request failed');
    }
  }
}
