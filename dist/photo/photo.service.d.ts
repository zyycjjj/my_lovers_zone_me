import { PrismaService } from '../prisma/prisma.service';
export declare class PhotoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: number, url: string, signalId?: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
        url: string;
    }>;
    createForUsers(userIds: number[], url: string, signalId?: number): Promise<import("@prisma/client").Prisma.BatchPayload>;
    latest(userId: number, take?: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
        url: string;
    }[]>;
}
