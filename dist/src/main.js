"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: true, credentials: true });
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const docConfig = new swagger_1.DocumentBuilder()
        .setTitle('My Lovers Zone API')
        .setDescription('My Lovers Zone backend API')
        .setVersion('1.0.0')
        .addApiKey({ type: 'apiKey', in: 'header', name: 'x-user-token' }, 'UserToken')
        .addApiKey({ type: 'apiKey', in: 'header', name: 'x-admin-pass' }, 'AdminPass')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, docConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = Number(process.env.PORT ?? 4000);
    await app.listen(port);
    const baseUrl = process.env['PUBLIC_BASE_URL']?.replace(/\/+$/, '') ??
        `http://localhost:${port}`;
    const swaggerUrl = process.env['SWAGGER_URL']?.trim() ?? `${baseUrl}/docs`;
    console.log(`Swagger: ${swaggerUrl}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map