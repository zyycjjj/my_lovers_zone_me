import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly admin;
    constructor(admin: AdminService);
    summary(): Promise<{
        date: string;
        events: {
            id: number;
            userId: number;
            type: import("@prisma/client").$Enums.EventType;
            toolKey: string;
            count: number;
            date: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        latestSignal: {
            id: number;
            userId: number;
            date: string;
            createdAt: Date;
            updatedAt: Date;
            mood: string;
            status: string;
            message: string | null;
        } | null;
        echoes: {
            id: number;
            userId: number;
            createdAt: Date;
            text: string;
        }[];
        photos: {
            id: number;
            userId: number;
            createdAt: Date;
            signalId: number | null;
            url: string;
        }[];
    }>;
    photos(limit?: string): Promise<{
        id: number;
        userId: number;
        createdAt: Date;
        signalId: number | null;
        url: string;
    }[]>;
    users(limit?: string): Promise<{
        id: number;
        createdAt: Date;
        name: string | null;
        token: string;
        role: import("@prisma/client").$Enums.UserRole | null;
    }[]>;
    events(limit?: string): Promise<{
        id: number;
        userId: number;
        type: import("@prisma/client").$Enums.EventType;
        toolKey: string;
        count: number;
        date: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    seedUsers(body: {
        meName?: string;
        girlfriendName?: string;
        testName?: string;
    }): Promise<{
        me: {
            id: number;
            createdAt: Date;
            name: string | null;
            token: string;
            role: import("@prisma/client").$Enums.UserRole | null;
        };
        girlfriend: {
            id: number;
            createdAt: Date;
            name: string | null;
            token: string;
            role: import("@prisma/client").$Enums.UserRole | null;
        };
        test: {
            id: number;
            createdAt: Date;
            name: string | null;
            token: string;
            role: import("@prisma/client").$Enums.UserRole | null;
        };
    }>;
}
