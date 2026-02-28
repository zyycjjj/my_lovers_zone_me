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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const date_1 = require("../common/date");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async summary() {
        const date = (0, date_1.getDateKey)();
        const [events, latestSignal, echoes, photos] = await Promise.all([
            this.prisma.event.findMany({
                where: { date },
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.signal.findFirst({
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.echo.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            this.prisma.photo.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        return {
            date,
            events,
            latestSignal,
            echoes,
            photos,
        };
    }
    async photos(limit = 20) {
        return this.prisma.photo.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async users(limit = 50) {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async events(limit = 100) {
        return this.prisma.event.findMany({
            orderBy: { updatedAt: 'desc' },
            take: limit,
        });
    }
    async seedUsers(payload) {
        const toToken = (role) => `love_${role}_${(0, crypto_1.randomBytes)(6).toString('hex')}`;
        const ensureRole = async (role, name) => {
            const existing = await this.prisma.user.findFirst({ where: { role } });
            if (existing) {
                return this.prisma.user.update({
                    where: { id: existing.id },
                    data: { name },
                });
            }
            return this.prisma.user.create({
                data: {
                    token: toToken(role),
                    role,
                    name,
                },
            });
        };
        const [me, girlfriend, test] = await Promise.all([
            ensureRole('me', payload.meName ?? '我'),
            ensureRole('girlfriend', payload.girlfriendName ?? '她'),
            ensureRole('test', payload.testName ?? '测试'),
        ]);
        return { me, girlfriend, test };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map