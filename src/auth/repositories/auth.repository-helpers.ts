import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from './repository.types';

export const pickDbClient = (
  prisma: PrismaService,
  tx?: DbClient,
): PrismaService | DbClient => tx ?? prisma;
