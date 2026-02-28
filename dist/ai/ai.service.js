"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
let AiService = class AiService {
    get baseUrl() {
        const raw = process.env['AI_BASE_URL']?.trim();
        if (!raw)
            throw new common_1.ServiceUnavailableException('AI not configured');
        return raw.replace(/\/+$/, '');
    }
    get apiKey() {
        const raw = process.env['AI_API_KEY']?.trim();
        if (!raw)
            throw new common_1.ServiceUnavailableException('AI not configured');
        return raw;
    }
    get model() {
        return process.env['AI_MODEL']?.trim() || 'gpt-4o-mini';
    }
    get chatCompletionsUrl() {
        if (this.baseUrl.endsWith('/v1'))
            return `${this.baseUrl}/chat/completions`;
        return `${this.baseUrl}/v1/chat/completions`;
    }
    async chatText(params) {
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
            throw new common_1.ServiceUnavailableException(`AI request failed: ${res.status} ${text}`);
        }
        const data = (await res.json());
        return data.choices?.[0]?.message?.content?.trim() ?? '';
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)()
], AiService);
//# sourceMappingURL=ai.service.js.map