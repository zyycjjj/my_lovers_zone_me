import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { Subject } from 'rxjs';
import { UserGuard } from '../auth/user.guard';
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

  let controller: EventController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventController],
      providers: [{ provide: EventService, useValue: mockEvents }],
    })
      .overrideGuard(UserGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(EventController);
    mockEvents.recordEvent.mockReset();
    mockEvents.emitActivity.mockReset();
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

  it('validates admin pass for stream', () => {
    process.env['ADMIN_PASS'] = 'secret';
    const req = {
      get: (name: string) => (name === 'x-admin-pass' ? 'wrong' : undefined),
      query: {},
    } as unknown as Request;
    expect(() => controller.activityStream(req)).toThrow(UnauthorizedException);
  });
});
