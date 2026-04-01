import { Injectable, NotImplementedException } from '@nestjs/common';
import { NumberLoginDto } from '../dto/number-login.dto';
import { RefreshSessionDto } from '../dto/refresh-session.dto';
import { LogoutDto } from '../dto/logout.dto';

@Injectable()
export class AuthDomain {
  async numberLogin(_payload: NumberLoginDto) {
    throw new NotImplementedException('号码认证登录流程待实现');
  }

  async getCurrentAccount(_sessionToken: string) {
    throw new NotImplementedException('当前登录态查询待实现');
  }

  async getRouting(_sessionToken: string) {
    throw new NotImplementedException('登录后分流计算待实现');
  }

  async refreshSession(_sessionToken: string, _payload: RefreshSessionDto) {
    throw new NotImplementedException('刷新会话待实现');
  }

  async logout(_sessionToken: string, _payload: LogoutDto) {
    throw new NotImplementedException('退出登录待实现');
  }
}
