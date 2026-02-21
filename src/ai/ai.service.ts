import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

@Injectable()
export class AiService {
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
    if (this.baseUrl.endsWith('/v1')) return `${this.baseUrl}/chat/completions`;
    return `${this.baseUrl}/v1/chat/completions`;
  }

  async chatText(params: { system?: string; user: string }) {
    const res = await fetch(this.chatCompletionsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(params.system
            ? [{ role: 'system', content: params.system }]
            : []),
          { role: 'user', content: params.user },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ServiceUnavailableException(
        `AI request failed: ${res.status} ${text}`,
      );
    }

    const data = (await res.json()) as ChatCompletionResponse;
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  }
}
