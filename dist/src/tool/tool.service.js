"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolService = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("../ai/ai.service");
const date_1 = require("../common/date");
const event_service_1 = require("../event/event.service");
function tryParseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
function extractJson(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start)
        return text.slice(start, end + 1);
    const aStart = text.indexOf('[');
    const aEnd = text.lastIndexOf(']');
    if (aStart >= 0 && aEnd > aStart)
        return text.slice(aStart, aEnd + 1);
    return text;
}
function detectRisks(text) {
    const risks = [];
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
let ToolService = class ToolService {
    ai;
    events;
    constructor(ai, events) {
        this.ai = ai;
        this.events = events;
    }
    async generateScript(userId, input) {
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
        const text = await this.ai.chatText({ user: prompt });
        await this.events.incrementToolUsed(userId, 'script', (0, date_1.getDateKey)());
        return { text };
    }
    async generateTitle(userId, input) {
        const prompt = [
            `你是抖音带货标题策划。请生成20条爆款标题，尽量口语化、短、自然。`,
            `要求返回JSON数组，数组元素是字符串标题，不要任何额外文字。`,
            `商品关键词：${input.keyword}`,
            input.style ? `风格：${input.style}` : '',
            `避免极限词、医疗功效、金融承诺。`,
        ]
            .filter(Boolean)
            .join('\n');
        const raw = await this.ai.chatText({ user: prompt });
        const parsed = tryParseJson(extractJson(raw));
        const titles = Array.isArray(parsed)
            ? parsed
                .filter((t) => typeof t === 'string' && t.trim().length)
                .slice(0, 20)
            : raw
                .split('\n')
                .map((l) => l.replace(/^\s*[-\d.、]+/, '').trim())
                .filter(Boolean)
                .slice(0, 20);
        await this.events.incrementToolUsed(userId, 'title', (0, date_1.getDateKey)());
        return { titles };
    }
    async refineTalk(userId, input) {
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
        const raw = await this.ai.chatText({ user: prompt });
        const parsed = tryParseJson(extractJson(raw));
        const sellingPoints = Array.isArray(parsed?.sellingPoints)
            ? (parsed?.sellingPoints)
                .filter((x) => typeof x === 'string')
                .slice(0, 5)
            : [];
        const suggestions = Array.isArray(parsed?.suggestions)
            ? (parsed?.suggestions)
                .filter((x) => typeof x === 'string')
                .slice(0, 8)
            : [];
        const safeRewrites = Array.isArray(parsed?.safeRewrites)
            ? (parsed?.safeRewrites)
                .filter((x) => typeof x === 'string')
                .slice(0, 5)
            : [];
        await this.events.incrementToolUsed(userId, 'refine', (0, date_1.getDateKey)());
        return {
            summaryLine: parsed?.summaryLine ?? '',
            sellingPoints,
            risks,
            suggestions,
            safeRewrites,
        };
    }
    async commission(userId, input) {
        const platformRate = input.platformRate ?? 0;
        const commission = input.price * input.commissionRate * (1 - platformRate);
        const comparisons = [0.8, 1, 1.2].map((k) => {
            const price = Math.round(input.price * k * 100) / 100;
            const value = price * input.commissionRate * (1 - platformRate);
            return { price, commission: Math.round(value * 100) / 100 };
        });
        const sellingPoint = `按当前佣金比例，每单预估约 ${Math.round(commission * 100) / 100} 元佣金。`;
        await this.events.incrementToolUsed(userId, 'commission', (0, date_1.getDateKey)());
        return {
            commission: Math.round(commission * 100) / 100,
            comparisons,
            sellingPoint,
        };
    }
};
exports.ToolService = ToolService;
exports.ToolService = ToolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        event_service_1.EventService])
], ToolService);
//# sourceMappingURL=tool.service.js.map