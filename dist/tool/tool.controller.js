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
exports.ToolController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_guard_1 = require("../auth/user.guard");
const commission_dto_1 = require("./dto/commission.dto");
const generate_script_dto_1 = require("./dto/generate-script.dto");
const generate_title_dto_1 = require("./dto/generate-title.dto");
const refine_talk_dto_1 = require("./dto/refine-talk.dto");
const tool_service_1 = require("./tool.service");
let ToolController = class ToolController {
    tools;
    constructor(tools) {
        this.tools = tools;
    }
    async script(req, body) {
        return this.tools.generateScript(req.userId, body);
    }
    async title(req, body) {
        return this.tools.generateTitle(req.userId, body);
    }
    async refine(req, body) {
        return this.tools.refineTalk(req.userId, body);
    }
    async commission(req, body) {
        return this.tools.commission(req.userId, body);
    }
};
exports.ToolController = ToolController;
__decorate([
    (0, common_1.Post)('script'),
    (0, swagger_1.ApiOperation)({ summary: '生成带货脚本' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_script_dto_1.GenerateScriptDto]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "script", null);
__decorate([
    (0, common_1.Post)('title'),
    (0, swagger_1.ApiOperation)({ summary: '生成标题' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_title_dto_1.GenerateTitleDto]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "title", null);
__decorate([
    (0, common_1.Post)('refine'),
    (0, swagger_1.ApiOperation)({ summary: '话术提炼与合规检查' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, refine_talk_dto_1.RefineTalkDto]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "refine", null);
__decorate([
    (0, common_1.Post)('commission'),
    (0, swagger_1.ApiOperation)({ summary: '佣金计算' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, commission_dto_1.CommissionDto]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "commission", null);
exports.ToolController = ToolController = __decorate([
    (0, swagger_1.ApiTags)('tool'),
    (0, swagger_1.ApiBearerAuth)('UserToken'),
    (0, common_1.Controller)('api/tool'),
    (0, common_1.UseGuards)(user_guard_1.UserGuard),
    __metadata("design:paramtypes", [tool_service_1.ToolService])
], ToolController);
//# sourceMappingURL=tool.controller.js.map