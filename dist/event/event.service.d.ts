import { PrismaService } from '../prisma/prisma.service';
export type ActivityEvent = {
    type: 'button_used';
    key: string;
    userId: number;
    occurredAt: string;
};
export declare class EventService {
    private readonly prisma;
    private readonly activitySubject;
    constructor(prisma: PrismaService);
    emitActivity(event: ActivityEvent): void;
    activityStream(): import("rxjs").Observable<ActivityEvent>;
    recordEvent(userId: number, type: 'tool_used' | 'signal_sent' | 'button_used', toolKey: string, date: string): Promise<void>;
    incrementToolUsed(userId: number, toolKey: string, date: string): Promise<void>;
    incrementSignalSent(userId: number, date: string): Promise<void>;
}
