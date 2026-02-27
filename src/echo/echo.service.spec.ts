import type { PrismaService } from '../prisma/prisma.service';
import { EchoService } from './echo.service';

describe('EchoService', () => {
  it('creates echo by token', async () => {
    const prisma = {
      user: {
        upsert: jest.fn().mockResolvedValue({ id: 7 }),
      },
      echo: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };
    const service = new EchoService(prisma as unknown as PrismaService);
    await service.createByToken('token-1', { text: 'hi' });
    expect(prisma.user.upsert).toHaveBeenCalled();
    expect(prisma.echo.create).toHaveBeenCalled();
  });
});
