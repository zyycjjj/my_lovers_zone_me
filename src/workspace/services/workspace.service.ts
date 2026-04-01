import { Injectable } from '@nestjs/common';
import { WorkspaceDomain } from '../domain/workspace.domain';

@Injectable()
export class WorkspaceService {
  constructor(private readonly domain: WorkspaceDomain) {}

  current(sessionToken: string) {
    return this.domain.getCurrentWorkspace(sessionToken);
  }

  list(sessionToken: string) {
    return this.domain.listMyWorkspaces(sessionToken);
  }
}
