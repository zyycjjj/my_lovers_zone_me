import { PrismaService } from '../prisma/prisma.service';
import { EchoDto } from './dto/echo.dto';
export declare class EchoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: number, payload: EchoDto): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        text: string;
    }>;
    createByToken(token: string, payload: EchoDto): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        text: string;
    }>;
    latest(userId: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        text: string;
    }[]>;
}
