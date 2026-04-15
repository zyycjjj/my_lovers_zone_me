import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

type CaptchaEntry = {
  answerHash: string;
  expiredAt: number;
};

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class AuthCaptchaService {
  private readonly store = new Map<string, CaptchaEntry>();

  createCaptcha() {
    this.cleanup();

    const text = Array.from({ length: 4 }, () =>
      CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)],
    ).join('');
    const captchaId = randomBytes(12).toString('hex');
    const expiredAt = Date.now() + CAPTCHA_TTL_MS;

    this.store.set(captchaId, {
      answerHash: this.hash(text),
      expiredAt,
    });

    return {
      captchaId,
      imageData: this.toDataUri(this.renderSvg(text)),
      expiredAt: new Date(expiredAt).toISOString(),
    };
  }

  verifyCaptcha(captchaId: string, answer: string) {
    this.cleanup();

    const entry = this.store.get(captchaId);
    if (!entry || entry.expiredAt <= Date.now()) {
      this.store.delete(captchaId);
      throw new BadRequestException('图形验证码已失效，请刷新后重试');
    }

    this.store.delete(captchaId);
    if (entry.answerHash !== this.hash(answer)) {
      throw new BadRequestException('图形验证码不正确');
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [captchaId, entry] of this.store.entries()) {
      if (entry.expiredAt <= now) {
        this.store.delete(captchaId);
      }
    }
  }

  private hash(value: string) {
    return createHash('sha256')
      .update(value.trim().toUpperCase())
      .digest('hex');
  }

  private toDataUri(svg: string) {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  private renderSvg(text: string) {
    const chars = text.split('');
    const width = 132;
    const height = 48;
    const letterNodes = chars
      .map((char, index) => {
        const x = 22 + index * 24;
        const rotate = index % 2 === 0 ? -10 + index * 2 : 10 - index * 2;
        const y = 31 + (index % 2 === 0 ? -1 : 2);
        const fill = index % 2 === 0 ? '#4A3168' : '#D4668F';
        return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, sans-serif" font-size="24" font-weight="700" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
      })
      .join('');

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="14" fill="#ffffff"/>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="13.5" fill="none" stroke="#ececf0"/>
  <path d="M8 13 C28 3, 44 25, 64 14 S96 6, 124 18" stroke="#f3d6e4" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M10 35 C28 24, 48 45, 70 32 S98 24, 122 36" stroke="#ded6ea" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="18" cy="11" r="2" fill="#f9cfe3"/>
  <circle cx="116" cy="37" r="2.5" fill="#d9d2e5"/>
  ${letterNodes}
</svg>`.trim();
  }
}
