import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceDomain } from './workspace.domain';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceService } from './workspace.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceDomain,
    WorkspaceRepository,
    WorkspaceMemberRepository,
  ],
  exports: [
    WorkspaceService,
    WorkspaceDomain,
    WorkspaceRepository,
    WorkspaceMemberRepository,
  ],
})
export class WorkspaceModule {}
