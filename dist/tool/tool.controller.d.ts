import type { Request } from 'express';
import { CommissionDto } from './dto/commission.dto';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { GenerateTitleDto } from './dto/generate-title.dto';
import { RefineTalkDto } from './dto/refine-talk.dto';
import { ToolService } from './tool.service';
export declare class ToolController {
    private readonly tools;
    constructor(tools: ToolService);
    script(req: Request, body: GenerateScriptDto): Promise<{
        text: string;
    }>;
    title(req: Request, body: GenerateTitleDto): Promise<{
        titles: string[];
    }>;
    refine(req: Request, body: RefineTalkDto): Promise<{
        summaryLine: string;
        sellingPoints: string[];
        risks: {
            type: string;
            matches: string[];
        }[];
        suggestions: string[];
        safeRewrites: string[];
    }>;
    commission(req: Request, body: CommissionDto): Promise<{
        commission: number;
        comparisons: {
            price: number;
            commission: number;
        }[];
        sellingPoint: string;
    }>;
}
