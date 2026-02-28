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
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../prisma/prisma.service");
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
    async recordEvent(userId, type, toolKey, date) {
        const key = type === 'signal_sent' ? '' : toolKey;
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