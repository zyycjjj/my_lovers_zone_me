import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import type { Request } from 'express';
import { diskStorage, type FileFilterCallback } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { UserGuard } from '../auth/user.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PhotoDto } from './dto/photo.dto';
import { PhotoService } from './photo.service';

function getUploadDir() {
  const dir = process.env['UPLOAD_DIR'] ?? join(process.cwd(), 'uploads');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function getPublicUrl(filename: string) {
  const base = process.env['PUBLIC_BASE_URL']?.replace(/\/+$/, '');
  if (base) return `${base}/uploads/${filename}`;
  return `/uploads/${filename}`;
}

@ApiTags('photo')
@ApiBearerAuth('UserToken')
@Controller('api/photo')
@UseGuards(UserGuard)
export class PhotoController {
  constructor(
    private readonly photos: PhotoService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: '上传1轻信号照片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        signalId: { type: 'number' },
        targetToken: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _req: Request,
          _file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          cb(null, getUploadDir());
        },
        filename: (
          _req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const ext = extname(file.originalname || '').toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: {
        fileSize: Number(process.env['PHOTO_MAX_MB'] ?? 5) * 1024 * 1024,
      },
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback,
      ) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          cb(null, false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: PhotoDto,
  ) {
    if (!file)
      throw new BadRequestException('Missing file or unsupported type');
    const url = getPublicUrl(file.filename);
    const senderId = req.userId!;
    const recipientIds = new Set<number>([senderId]);

    if (body.targetToken) {
      const recipient = await this.prisma.user.findUnique({
        where: { token: body.targetToken },
        select: { id: true },
      });
      if (recipient) {
        recipientIds.add(recipient.id);
      }
    }

    if (recipientIds.size === 1) {
      const roleRecipients = await this.prisma.user.findMany({
        where: {
          role: { in: ['me', 'girlfriend'] },
          NOT: { id: senderId },
        },
        select: { id: true },
      });
      if (roleRecipients.length) {
        roleRecipients.forEach((item) => recipientIds.add(item.id));
      } else {
        const others = await this.prisma.user.findMany({
          where: { NOT: { id: senderId } },
          select: { id: true },
        });
        others.forEach((item) => recipientIds.add(item.id));
      }
    }

    return this.photos.createForUsers(
      Array.from(recipientIds),
      url,
      body.signalId,
    );
  }

  @Get('latest')
  @ApiOperation({ summary: '最近照片' })
  async latest(@Req() req: Request) {
    return this.photos.latest(req.userId!);
  }
}
