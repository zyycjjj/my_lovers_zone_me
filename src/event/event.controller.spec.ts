import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { Subject } from 'rxjs';
import { UserGuard } from '../auth/guards/user.guard';
import { PrismaService } from '../prisma/prisma.service';
import { EventController } from './event.controller';
import type { ActivityEvent } from './event.service';
import { EventService } from './event.service';

describe('EventController', () => {
  const activity$ = new Subject<ActivityEvent>();
  const mockEvents = {
    recordEvent: jest.fn(),
    emitActivity: jest.fn(),
    activityStream: () => activity$.asObservable(),
  };
  const mockPrisma = {
    authSession: {
      findUnique: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
  };

  let controller: EventController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        { provide: EventService, useValue: mockEvents },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(UserGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(EventController);
    mockEvents.recordEvent.mockReset();
    mockEvents.emitActivity.mockReset();
    mockPrisma.authSession.findUnique.mockReset();
    mockPrisma.account.findUnique.mockReset();
  });

  it('rejects button_used without key', async () => {
    const req = { userId: 1 } as Request;
    await expect(
      controller.record(req, { type: 'button_used' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records button_used with key', async () => {
    const req = { userId: 2 } as Request;
    await controller.record(req, { type: 'button_used', key: 'love' });
    expect(mockEvents.recordEvent).toHaveBeenCalled();
    expect(mockEvents.emitActivity).toHaveBeenCalled();
  });

  it('validates admin session for stream', async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue(null);
    const req = {
      get: () => undefined,
      query: {},
    } as unknown as Request;
    await expect(controller.activityStream(req)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
