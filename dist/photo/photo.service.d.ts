import { PrismaService } from '../prisma/prisma.service';
export declare class PhotoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: number, url: string, signalId?: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        url: string;
        signalId: number | null;
    }>;
    latest(userId: number, take?: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        url: string;
        signalId: number | null;
    }[]>;
}
