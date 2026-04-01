import { Injectable } from '@nestjs/common';
import { AuthDomain } from '../domain/auth.domain';
import { LogoutDto } from '../dto/logout.dto';
import { NumberLoginDto } from '../dto/number-login.dto';
import { RefreshSessionDto } from '../dto/refresh-session.dto';

@Injectable()
export class AuthService {
  constructor(private readonly domain: AuthDomain) {}

  getNumberAuthToken() {
    return this.domain.getNumberAuthToken();
  }

  numberLogin(payload: NumberLoginDto) {
    return this.domain.numberLogin(payload);
  }

  me(sessionToken: string) {
    return this.domain.getCurrentAccount(sessionToken);
  }

  routing(sessionToken: string) {
    return this.domain.getRouting(sessionToken);
  }

  refresh(sessionToken: string, payload: RefreshSessionDto) {
    return this.domain.refreshSession(sessionToken, payload);
  }

  logout(sessionToken: string, payload: LogoutDto) {
    return this.domain.logout(sessionToken, payload);
  }
}
