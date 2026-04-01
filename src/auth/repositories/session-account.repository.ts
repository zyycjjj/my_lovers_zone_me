import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSessionBundle(sessionToken: string) {
    return this.prisma.authSession.findUnique({
      where: { sessionToken },
      include: {
        account: true,
      },
    });
  }
}
