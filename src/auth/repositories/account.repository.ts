import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.prisma.account.findUnique({ where: { id } });
  }

  findByPhone(phone: string) {
    return this.prisma.account.findUnique({ where: { phone } });
  }
}
