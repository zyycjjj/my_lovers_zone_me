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
exports.SignalService = void 0;
const common_1 = require("@nestjs/common");
const date_1 = require("../common/date");
const event_service_1 = require("../event/event.service");
const prisma_service_1 = require("../prisma/prisma.service");
let SignalService = class SignalService {
    prisma;
    events;
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async submit(userId, payload) {
        const date = (0, date_1.getDateKey)();
        const signal = await this.prisma.signal.upsert({
            where: { userId_date: { userId, date } },
            create: {
                userId,
                date,
                mood: payload.mood,
                status: payload.status,
                message: payload.message,
            },
            update: {
                mood: payload.mood,
                status: payload.status,
                message: payload.message,
            },
        });
        await this.events.incrementSignalSent(userId, date);
        return signal;
    }
    async getToday(userId) {
        const date = (0, date_1.getDateKey)();
        return this.prisma.signal.findUnique({
            where: { userId_date: { userId, date } },
        });
    }
};
exports.SignalService = SignalService;
exports.SignalService = SignalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_service_1.EventService])
], SignalService);
//# sourceMappingURL=signal.service.js.map