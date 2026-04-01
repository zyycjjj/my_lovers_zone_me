import { Module } from '@nestjs/common';
import { WorkspaceController } from './controllers/workspace.controller';
import { WorkspaceDomain } from './domain/workspace.domain';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceService } from './services/workspace.service';

@Module({
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
