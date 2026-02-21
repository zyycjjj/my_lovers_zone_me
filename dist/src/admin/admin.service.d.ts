import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    summary(): Promise<{
        date: string;
        events: {
            id: number;
            createdAt: Date;
            userId: number;
            type: import("@prisma/client").$Enums.EventType;
            toolKey: string;
            count: number;
            date: string;
            updatedAt: Date;
        }[];
        latestSignal: {
            id: number;
            createdAt: Date;
            userId: number;
            date: string;
            updatedAt: Date;
            mood: string;
            status: string;
            message: string | null;
        } | null;
        echoes: {
            id: number;
            createdAt: Date;
            userId: number;
            text: string;
        }[];
        photos: {
            url: string;
            id: number;
            createdAt: Date;
            userId: number;
            signalId: number | null;
        }[];
    }>;
    photos(limit?: number): Promise<{
        url: string;
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
    }[]>;
}
