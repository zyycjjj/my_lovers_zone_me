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
exports.EventController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const user_guard_1 = require("../auth/user.guard");
const date_1 = require("../common/date");
const event_dto_1 = require("./dto/event.dto");
const event_service_1 = require("./event.service");
let EventController = class EventController {
    events;
    constructor(events) {
        this.events = events;
    }
    async record(req, body) {
        if (body.type !== 'signal_sent' && !body.key) {
            throw new common_1.BadRequestException('Missing key');
        }
        const date = (0, date_1.getDateKey)();
        await this.events.recordEvent(req.userId, body.type, body.key ?? '', date);
        if (body.type === 'button_used') {
            this.events.emitActivity({
                type: 'button_used',
                key: body.key ?? '',
                userId: req.userId,
                occurredAt: new Date().toISOString(),
            });
        }
        return { ok: true };
    }
    activityStream(req) {
        const adminPass = process.env['ADMIN_PASS'];
        if (adminPass) {
            const providedHeader = req.get('x-admin-pass');
            const rawQuery = req.query?.['adminPass'];
            const providedQuery = typeof rawQuery === 'string'
                ? rawQuery
                : Array.isArray(rawQuery)
                    ? rawQuery[0]
                    : undefined;
            if (providedHeader !== adminPass && providedQuery !== adminPass) {
                throw new common_1.UnauthorizedException('Unauthorized');
            }
        }
        return this.events.activityStream().pipe((0, rxjs_1.map)((data) => ({ data })));
    }
};
exports.EventController = EventController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '记录事件' }),
    (0, swagger_1.ApiBearerAuth)('UserToken'),
    (0, common_1.UseGuards)(user_guard_1.UserGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, event_dto_1.EventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "record", null);
__decorate([
    (0, common_1.Sse)('stream'),
    (0, swagger_1.ApiOperation)({ summary: '事件实时流' }),
    (0, swagger_1.ApiBearerAuth)('AdminPass'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], EventController.prototype, "activityStream", null);
exports.EventController = EventController = __decorate([
    (0, swagger_1.ApiTags)('event'),
    (0, common_1.Controller)('api/event'),
    __metadata("design:paramtypes", [event_service_1.EventService])
], EventController);
//# sourceMappingURL=event.controller.js.map