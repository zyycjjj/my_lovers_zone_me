import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    summary(): Promise<{
        date: string;
        events: {
            id: number;
            createdAt: Date;
            type: import("@prisma/client").$Enums.EventType;
            userId: number;
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
            id: number;
            createdAt: Date;
            userId: number;
            signalId: number | null;
            url: string;
        }[];
    }>;
    photos(limit?: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
        url: string;
    }[]>;
    users(limit?: number): Promise<{
        id: number;
        token: string;
        role: import("@prisma/client").$Enums.UserRole | null;
        name: string | null;
        createdAt: Date;
    }[]>;
    events(limit?: number): Promise<{
        id: number;
        createdAt: Date;
        type: import("@prisma/client").$Enums.EventType;
        userId: number;
        toolKey: string;
        count: number;
        date: string;
        updatedAt: Date;
    }[]>;
    seedUsers(payload: {
        meName?: string;
        girlfriendName?: string;
        testName?: string;
    }): Promise<{
        me: {
            id: number;
            token: string;
            role: import("@prisma/client").$Enums.UserRole | null;
            name: string | null;
            createdAt: Date;
        };
        girlfriend: {
            id: number;
            token: string;
            role: import("@prisma/client").$Enums.UserRole | null;
            name: string | null;
            createdAt: Date;
        };
        test: {
            id: number;
            token: string;
            role: import("@prisma/client").$Enums.UserRole | null;
            name: string | null;
            createdAt: Date;
        };
    }>;
}
