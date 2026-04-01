import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildAliyunRpcQuery } from './aliyun-rpc-signature';

type GetAuthTokenResponse = {
  Code?: string;
  Message?: string;
  TokenInfo?: {
    AccessToken?: string;
    JwtToken?: string;
  };
};

type GetPhoneWithTokenResponse = {
  Code?: string;
  Message?: string;
  Data?: {
    Mobile?: string;
  };
};

@Injectable()
export class AliyunNumberAuthClient {
  private readonly endpoint: string;
  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;
  private readonly schemeCode: string;
  private readonly appWebUrl: string;
  private readonly version = '2017-05-25';

  constructor(private readonly config: ConfigService) {
    this.endpoint =
      this.config.get<string>('ALIYUN_NUMBER_AUTH_ENDPOINT')?.trim() ||
      'dypnsapi.aliyuncs.com';
    this.accessKeyId =
      this.config.get<string>('ALIYUN_ACCESS_KEY_ID')?.trim() || '';
    this.accessKeySecret =
      this.config.get<string>('ALIYUN_ACCESS_KEY_SECRET')?.trim() || '';
    this.schemeCode =
      this.config.get<string>('ALIYUN_NUMBER_AUTH_SCHEME_CODE')?.trim() || '';
    this.appWebUrl = this.config.get<string>('APP_WEB_URL')?.trim() || '';
  }

  async getAuthToken() {
    this.assertConfig();
    const response = await this.call<GetAuthTokenResponse>('GetAuthToken', {
      Url: this.appWebUrl.endsWith('/') ? this.appWebUrl : `${this.appWebUrl}/`,
      Origin: this.appWebUrl.replace(/\/+$/, ''),
      SceneCode: this.schemeCode,
      BizType: '1',
    });

    if (response.Code !== 'OK' || !response.TokenInfo?.AccessToken) {
      throw new BadGatewayException(
        response.Message || '阿里云号码认证授权 token 获取失败',
      );
    }

    const now = Date.now();
    return {
      accessToken: response.TokenInfo.AccessToken,
      jwtToken: response.TokenInfo.JwtToken || '',
      accessTokenExpiredAt: new Date(now + 10 * 60 * 1000).toISOString(),
      jwtTokenExpiredAt: new Date(now + 60 * 60 * 1000).toISOString(),
    };
  }

  async getPhoneWithToken(spToken: string) {
    this.assertConfig();
    const response = await this.call<GetPhoneWithTokenResponse>(
      'GetPhoneWithToken',
      {
        SpToken: spToken,
      },
    );

    if (response.Code !== 'OK' || !response.Data?.Mobile) {
      throw new BadGatewayException(
        response.Message || '阿里云号码认证取号失败',
      );
    }

    return {
      phone: response.Data.Mobile,
    };
  }

  private async call<T>(action: string, params: Record<string, string>) {
    const query = buildAliyunRpcQuery(
      this.accessKeyId,
      this.accessKeySecret,
      action,
      this.version,
      params,
    );
    const url = `https://${this.endpoint}/?${query}`;
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new BadGatewayException(`阿里云号码认证请求失败: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private assertConfig() {
    if (
      !this.accessKeyId ||
      !this.accessKeySecret ||
      !this.schemeCode ||
      !this.appWebUrl
    ) {
      throw new InternalServerErrorException(
        '阿里云号码认证配置不完整，请检查环境变量',
      );
    }
  }
}
