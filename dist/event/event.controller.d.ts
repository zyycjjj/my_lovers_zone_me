import { MessageEvent } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { EventDto } from './dto/event.dto';
import { EventService } from './event.service';
export declare class EventController {
    private readonly events;
    constructor(events: EventService);
    record(req: Request, body: EventDto): Promise<{
        ok: boolean;
    }>;
    activityStream(req: Request): Observable<MessageEvent>;
}
