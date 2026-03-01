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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("@nestjs/platform-express/multer");
const multer_2 = require("multer");
const path_1 = require("path");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const user_guard_1 = require("../auth/user.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const photo_dto_1 = require("./dto/photo.dto");
const photo_service_1 = require("./photo.service");
function getUploadDir() {
    const dir = process.env['UPLOAD_DIR'] ?? (0, path_1.join)(process.cwd(), 'uploads');
    (0, fs_1.mkdirSync)(dir, { recursive: true });
    return dir;
}
function getPublicUrl(filename) {
    const base = process.env['PUBLIC_BASE_URL']?.replace(/\/+$/, '');
    if (base)
        return `${base}/uploads/${filename}`;
    return `/uploads/${filename}`;
}
let PhotoController = class PhotoController {
    photos;
    prisma;
    constructor(photos, prisma) {
        this.photos = photos;
        this.prisma = prisma;
    }
    async upload(req, file, body) {
        if (!file)
            throw new common_1.BadRequestException('Missing file or unsupported type');
        const url = getPublicUrl(file.filename);
        const senderId = req.userId;
        const recipientIds = new Set([senderId]);
        if (body.targetToken) {
            const recipient = await this.prisma.user.findUnique({
                where: { token: body.targetToken },
                select: { id: true },
            });
            if (recipient) {
                recipientIds.add(recipient.id);
            }
        }
        if (recipientIds.size === 1) {
            const roleRecipients = await this.prisma.user.findMany({
                where: {
                    role: { in: ['me', 'girlfriend'] },
                    NOT: { id: senderId },
                },
                select: { id: true },
            });
            if (roleRecipients.length) {
                roleRecipients.forEach((item) => recipientIds.add(item.id));
            }
            else {
                const others = await this.prisma.user.findMany({
                    where: { NOT: { id: senderId } },
                    select: { id: true },
                });
                others.forEach((item) => recipientIds.add(item.id));
            }
        }
        return this.photos.createForUsers(Array.from(recipientIds), url, body.signalId);
    }
    async latest(req) {
        return this.photos.latest(req.userId);
    }
};
exports.PhotoController = PhotoController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '上传1轻信号照片' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                signalId: { type: 'number' },
                targetToken: { type: 'string' },
            },
            required: ['file'],
        },
    }),
    (0, common_1.UseInterceptors)((0, multer_1.FileInterceptor)('file', {
        storage: (0, multer_2.diskStorage)({
            destination: (_req, _file, cb) => {
                cb(null, getUploadDir());
            },
            filename: (_req, file, cb) => {
                const ext = (0, path_1.extname)(file.originalname || '').toLowerCase();
                cb(null, `${(0, crypto_1.randomUUID)()}${ext}`);
            },
        }),
        limits: {
            fileSize: Number(process.env['PHOTO_MAX_MB'] ?? 5) * 1024 * 1024,
        },
        fileFilter: (_req, file, cb) => {
            const allowed = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowed.includes(file.mimetype)) {
                cb(null, false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, photo_dto_1.PhotoDto]),
    __metadata("design:returntype", Promise)
], PhotoController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: '最近照片' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PhotoController.prototype, "latest", null);
exports.PhotoController = PhotoController = __decorate([
    (0, swagger_1.ApiTags)('photo'),
    (0, swagger_1.ApiBearerAuth)('UserToken'),
    (0, common_1.Controller)('api/photo'),
    (0, common_1.UseGuards)(user_guard_1.UserGuard),
    __metadata("design:paramtypes", [photo_service_1.PhotoService,
        prisma_service_1.PrismaService])
], PhotoController);
//# sourceMappingURL=photo.controller.js.map