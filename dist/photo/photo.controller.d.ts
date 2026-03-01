import type { Request } from 'express';
import { PhotoDto } from './dto/photo.dto';
import { PhotoService } from './photo.service';
export declare class PhotoController {
    private readonly photos;
    constructor(photos: PhotoService);
    upload(req: Request, file: Express.Multer.File, body: PhotoDto): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
        url: string;
    }>;
    latest(req: Request): Promise<{
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
        url: string;
    }[]>;
}
