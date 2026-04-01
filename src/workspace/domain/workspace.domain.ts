import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class WorkspaceDomain {
  async getCurrentWorkspace(_sessionToken: string) {
    throw new NotImplementedException('当前工作空间查询待实现');
  }

  async listMyWorkspaces(_sessionToken: string) {
    throw new NotImplementedException('工作空间列表查询待实现');
  }
}
