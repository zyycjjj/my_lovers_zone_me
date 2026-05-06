import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { UserTokenMiddleware } from './auth/guards/user-token.middleware';
import { EventModule } from './event/event.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PhotoModule } from './photo/photo.module';
import { PrismaModule } from './prisma/prisma.module';
import { SignalModule } from './signal/signal.module';
import { ToolModule } from './tool/tool.module';
import { EchoModule } from './echo/echo.module';
import { AdminModule } from './admin/admin.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { TrialModule } from './trial/trial.module';
import { PaymentsModule } from './payments/payments.module';
import { ContentAssetsModule } from './content-assets/content-assets.module';
import { ContentPlansModule } from './content-plans/content-plans.module';
import { QuotaUsageModule } from './quota-usage/quota-usage.module';
import { CheckinsModule } from './checkins/checkins.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ViralModule } from './viral/viral.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { SupportersModule } from './supporters/supporters.module';
import { CommunityModule } from './community/community.module';
import { AppController } from './app.controller';

const requestLogger = (req: Request, res: Response, next: () => void) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
    );
  });
  next();
};

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
    OnboardingModule,
    WorkspaceModule,
    TrialModule,
    PaymentsModule,
    ContentAssetsModule,
    ContentPlansModule,
    QuotaUsageModule,
    CheckinsModule,
    RecommendationsModule,
    ViralModule,
    KnowledgeModule,
    SupportersModule,
    CommunityModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(requestLogger, UserTokenMiddleware).forRoutes('*');
  }
}
