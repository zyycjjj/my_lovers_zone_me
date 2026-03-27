"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../prisma/prisma.service");
const loveKeyText = {
    hug: '给你抱抱',
    miss: '想你了',
    ok: '我很好',
    busy: '忙但想你',
};
let EventService = class EventService {
    prisma;
    activitySubject = new rxjs_1.Subject();
    constructor(prisma) {
        this.prisma = prisma;
    }
    emitActivity(event) {
        this.activitySubject.next(event);
    }
    activityStream() {
        return this.activitySubject.asObservable();
    }
    async recordEvent(userId, type, toolKey, date, _targetToken) {
        const key = type === 'signal_sent' ? '' : toolKey;
        try {
            await this.prisma.event.upsert({
                where: {
                    userId_type_toolKey_date: {
                        userId,
                        type,
                        toolKey: key,
                        date,
                    },
                },
                create: {
                    userId,
                    type,
                    toolKey: key,
                    date,
                    count: 1,
                },
                update: {
                    count: { increment: 1 },
                },
            });
            if (type === 'button_used') {
                const parts = key.split('.');
                const action = parts.length > 1 ? parts[1] : key;
                const sender = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true },
                });
                const senderRole = sender?.role ?? (parts.length > 1 ? parts[0] : null);
                const text = loveKeyText[action];
                if (!text)
                    return;
                let recipients = [];
                if (senderRole === 'me' && _targetToken) {
                    const targetUser = await this.prisma.user.findUnique({
                        where: { token: _targetToken },
                        select: { id: true },
                    });
                    if (targetUser) {
                        recipients = [targetUser];
                    }
                }
                if (!recipients.length) {
                    recipients = await this.prisma.user.findMany({
                        where: { role: 'me' },
                        select: { id: true },
                    });
                }
                if (recipients.length > 0) {
                    await this.prisma.echo.createMany({
                        data: recipients.map((recipient) => ({
                            userId: recipient.id,
                            text,
                        })),
                    });
                    return;
                }
                await this.prisma.echo.create({
                    data: { userId, text },
                });
            }
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                await this.prisma.event.update({
                    where: {
                        userId_type_toolKey_date: {
                            userId,
                            type,
                            toolKey: key,
                            date,
                        },
                    },
                    data: {
                        count: { increment: 1 },
                    },
                });
                return;
            }
            throw error;
        }
    }
    async incrementToolUsed(userId, toolKey, date) {
        await this.recordEvent(userId, 'tool_used', toolKey, date);
    }
    async incrementSignalSent(userId, date) {
        await this.recordEvent(userId, 'signal_sent', '', date);
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventService);
//# sourceMappingURL=event.service.js.map