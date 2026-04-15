import { Injectable } from '@nestjs/common';
import { AuthDomain } from './domain/auth.domain';
import { DevLoginDto } from './dto/request/dev-login.dto';
import { LogoutDto } from './dto/request/logout.dto';
import { NumberLoginDto } from './dto/request/number-login.dto';
import { PasswordLoginDto } from './dto/request/password-login.dto';
import { PasswordRegisterDto } from './dto/request/password-register.dto';
import { RefreshSessionDto } from './dto/request/refresh-session.dto';

@Injectable()
export class AuthService {
  constructor(private readonly domain: AuthDomain) {}

  getNumberAuthToken() {
    return this.domain.getNumberAuthToken();
  }

  getPasswordCaptcha() {
    return this.domain.getPasswordCaptcha();
  }

  numberLogin(payload: NumberLoginDto) {
    return this.domain.numberLogin(payload);
  }

  devLogin(payload: DevLoginDto) {
    return this.domain.devLogin(payload);
  }

  passwordRegister(payload: PasswordRegisterDto) {
    return this.domain.passwordRegister(payload);
  }

  passwordLogin(payload: PasswordLoginDto) {
    return this.domain.passwordLogin(payload);
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
