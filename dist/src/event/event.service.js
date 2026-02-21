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
const prisma_service_1 = require("../prisma/prisma.service");
let EventService = class EventService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async incrementToolUsed(userId, toolKey, date) {
        await this.prisma.event.upsert({
            where: {
                userId_type_toolKey_date: {
                    userId,
                    type: 'tool_used',
                    toolKey,
                    date,
                },
            },
            create: {
                userId,
                type: 'tool_used',
                toolKey,
                date,
                count: 1,
            },
            update: {
                count: { increment: 1 },
            },
        });
    }
    async incrementSignalSent(userId, date) {
        await this.prisma.event.upsert({
            where: {
                userId_type_toolKey_date: {
                    userId,
                    type: 'signal_sent',
                    toolKey: '',
                    date,
                },
            },
            create: {
                userId,
                type: 'signal_sent',
                toolKey: '',
                date,
                count: 1,
            },
            update: {
                count: { increment: 1 },
            },
        });
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventService);
//# sourceMappingURL=event.service.js.map