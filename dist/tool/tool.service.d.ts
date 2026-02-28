import { AiService } from '../ai/ai.service';
import { EventService } from '../event/event.service';
export declare class ToolService {
    private readonly ai;
    private readonly events;
    constructor(ai: AiService, events: EventService);
    generateScript(userId: number, input: {
        keyword: string;
        price?: number;
        audience?: string;
        scene?: string;
        style?: 'short' | 'live';
    }): Promise<{
        text: string;
    }>;
    generateTitle(userId: number, input: {
        keyword: string;
        style?: string;
    }): Promise<{
        titles: string[];
    }>;
    refineTalk(userId: number, input: {
        text: string;
    }): Promise<{
        summaryLine: string;
        sellingPoints: string[];
        risks: {
            type: string;
            matches: string[];
        }[];
        suggestions: string[];
        safeRewrites: string[];
    }>;
    commission(userId: number, input: {
        price: number;
        commissionRate: number;
        platformRate?: number;
    }): Promise<{
        commission: number;
        comparisons: {
            price: number;
            commission: number;
        }[];
        sellingPoint: string;
    }>;
}
