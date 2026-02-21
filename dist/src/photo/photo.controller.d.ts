import type { Request } from 'express';
import { PhotoDto } from './dto/photo.dto';
import { PhotoService } from './photo.service';
export declare class PhotoController {
    private readonly photos;
    constructor(photos: PhotoService);
    upload(req: Request, file: Express.Multer.File, body: PhotoDto): Promise<{
        url: string;
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
    }>;
    latest(req: Request): Promise<{
        url: string;
        id: number;
        createdAt: Date;
        userId: number;
        signalId: number | null;
    }[]>;
}
