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
exports.EchoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EchoService = class EchoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, payload) {
        return this.prisma.echo.create({
            data: {
                userId,
                text: payload.text,
            },
        });
    }
    async createByToken(token, payload) {
        const user = await this.prisma.user.upsert({
            where: { token },
            create: { token },
            update: {},
            select: { id: true },
        });
        return this.create(user.id, payload);
    }
    async latest(userId) {
        return this.prisma.echo.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
    }
    async profile(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                name: true,
            },
        });
    }
};
exports.EchoService = EchoService;
exports.EchoService = EchoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EchoService);
//# sourceMappingURL=echo.service.js.map