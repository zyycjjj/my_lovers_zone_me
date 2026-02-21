import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { UserTokenMiddleware } from './auth/user-token.middleware';
import { EventModule } from './event/event.module';
import { PhotoModule } from './photo/photo.module';
import { PrismaModule } from './prisma/prisma.module';
import { SignalModule } from './signal/signal.module';
import { ToolModule } from './tool/tool.module';
import { EchoModule } from './echo/echo.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    AiModule,
    EventModule,
    ToolModule,
    SignalModule,
    EchoModule,
    PhotoModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserTokenMiddleware).forRoutes('*');
  }
}
