import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly admin;
    constructor(admin: AdminService);
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
    photos(limit?: string): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
        url: string;
    }[]>;
    users(limit?: string): Promise<{
        id: number;
        token: string;
        role: import("@prisma/client").$Enums.UserRole | null;
        name: string | null;
        createdAt: Date;
    }[]>;
    events(limit?: string): Promise<{
        id: number;
        createdAt: Date;
        type: import("@prisma/client").$Enums.EventType;
        userId: number;
        toolKey: string;
        count: number;
        date: string;
        updatedAt: Date;
    }[]>;
    seedUsers(body: {
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
