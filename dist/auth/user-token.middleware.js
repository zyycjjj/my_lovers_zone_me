"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTokenMiddleware = void 0;
const common_1 = require("@nestjs/common");
let UserTokenMiddleware = class UserTokenMiddleware {
    use(req, _res, next) {
        const headerToken = req.header('x-user-token');
        const queryToken = typeof req.query['t'] === 'string' ? req.query['t'] : undefined;
        const cookieToken = typeof req.cookies?.['t'] === 'string' ? req.cookies['t'] : undefined;
        const token = (headerToken ?? queryToken ?? cookieToken)?.trim();
        if (token)
            req.userToken = token;
        next();
    }
};
exports.UserTokenMiddleware = UserTokenMiddleware;
exports.UserTokenMiddleware = UserTokenMiddleware = __decorate([
    (0, common_1.Injectable)()
], UserTokenMiddleware);
//# sourceMappingURL=user-token.middleware.js.map