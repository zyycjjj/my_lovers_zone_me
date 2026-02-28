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
exports.SignalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_guard_1 = require("../auth/user.guard");
const signal_dto_1 = require("./dto/signal.dto");
const signal_service_1 = require("./signal.service");
let SignalController = class SignalController {
    signals;
    constructor(signals) {
        this.signals = signals;
    }
    async submit(req, body) {
        return this.signals.submit(req.userId, body);
    }
    async today(req) {
        return this.signals.getToday(req.userId);
    }
};
exports.SignalController = SignalController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '提交今日轻信号' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, signal_dto_1.SignalDto]),
    __metadata("design:returntype", Promise)
], SignalController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, swagger_1.ApiOperation)({ summary: '获取今日轻信号' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SignalController.prototype, "today", null);
exports.SignalController = SignalController = __decorate([
    (0, swagger_1.ApiTags)('signal'),
    (0, swagger_1.ApiBearerAuth)('UserToken'),
    (0, common_1.Controller)('api/signal'),
    (0, common_1.UseGuards)(user_guard_1.UserGuard),
    __metadata("design:paramtypes", [signal_service_1.SignalService])
], SignalController);
//# sourceMappingURL=signal.controller.js.map