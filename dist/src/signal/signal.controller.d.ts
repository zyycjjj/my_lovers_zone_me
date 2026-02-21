import type { Request } from 'express';
import { SignalDto } from './dto/signal.dto';
import { SignalService } from './signal.service';
export declare class SignalController {
    private readonly signals;
    constructor(signals: SignalService);
    submit(req: Request, body: SignalDto): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        date: string;
        updatedAt: Date;
        mood: string;
        status: string;
        message: string | null;
    }>;
    today(req: Request): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        date: string;
        updatedAt: Date;
        mood: string;
        status: string;
        message: string | null;
    } | null>;
}
