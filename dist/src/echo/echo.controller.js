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
exports.EchoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_guard_1 = require("../auth/user.guard");
const echo_dto_1 = require("./dto/echo.dto");
const echo_service_1 = require("./echo.service");
let EchoController = class EchoController {
    echoes;
    constructor(echoes) {
        this.echoes = echoes;
    }
    async create(req, body) {
        return this.echoes.create(req.userId, body);
    }
    async latest(req) {
        return this.echoes.latest(req.userId);
    }
};
exports.EchoController = EchoController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '新增一句回声' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, echo_dto_1.EchoDto]),
    __metadata("design:returntype", Promise)
], EchoController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: '最近回声列表' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EchoController.prototype, "latest", null);
exports.EchoController = EchoController = __decorate([
    (0, swagger_1.ApiTags)('echo'),
    (0, swagger_1.ApiBearerAuth)('UserToken'),
    (0, common_1.Controller)('echo'),
    (0, common_1.UseGuards)(user_guard_1.UserGuard),
    __metadata("design:paramtypes", [echo_service_1.EchoService])
], EchoController);
//# sourceMappingURL=echo.controller.js.map