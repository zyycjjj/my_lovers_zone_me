import { PrismaService } from '../prisma/prisma.service';
export declare class EventService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    incrementToolUsed(userId: number, toolKey: string, date: string): Promise<void>;
    incrementSignalSent(userId: number, date: string): Promise<void>;
}
