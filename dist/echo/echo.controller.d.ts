import type { Request } from 'express';
import { AdminEchoDto } from './dto/echo.dto';
import { EchoService } from './echo.service';
export declare class EchoController {
    private readonly echoes;
    constructor(echoes: EchoService);
    create(body: AdminEchoDto): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        text: string;
    }>;
    latest(req: Request): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        text: string;
    }[]>;
}
