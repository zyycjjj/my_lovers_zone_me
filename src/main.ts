import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const docConfig = new DocumentBuilder()
    .setTitle('My Lovers Zone API')
    .setDescription('My Lovers Zone backend API')
    .setVersion('1.0.0')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-session-token' },
      'SessionToken',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-user-token' },
      'UserToken',
    )
    .build();
  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  const baseUrl =
    process.env['PUBLIC_BASE_URL']?.replace(/\/+$/, '') ??
    `http://localhost:${port}`;
  const swaggerUrl = process.env['SWAGGER_URL']?.trim() ?? `${baseUrl}/docs`;
  console.log(`Swagger: ${swaggerUrl}`);
}
void bootstrap();
