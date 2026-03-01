import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { PhotoDto } from './dto/photo.dto';
import { PhotoService } from './photo.service';
export declare class PhotoController {
    private readonly photos;
    private readonly prisma;
    constructor(photos: PhotoService, prisma: PrismaService);
    upload(req: Request, file: Express.Multer.File, body: PhotoDto): Promise<import("@prisma/client").Prisma.BatchPayload>;
    latest(req: Request): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
        url: string;
    }[]>;
}
