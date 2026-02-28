import { EventService } from '../event/event.service';
import { PrismaService } from '../prisma/prisma.service';
import { SignalDto } from './dto/signal.dto';
export declare class SignalService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: EventService);
    submit(userId: number, payload: SignalDto): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        date: string;
        updatedAt: Date;
        mood: string;
        status: string;
        message: string | null;
    }>;
    getToday(userId: number): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        date: string;
        updatedAt: Date;
        mood: string;
        status: string;
        message: string | null;
    } | null>;
}
