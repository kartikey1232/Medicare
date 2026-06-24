import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';

@Injectable()
export class AttachmentService {
  private uploadDir = path.join(__dirname, '..', '..', 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processAndUploadFile(file: Express.Multer.File) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException('Unsupported file format');
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new BadRequestException('File exceeds maximum size limit of 100MB');
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Write file locally (serving as Mock S3 object storage)
    await fs.promises.writeFile(filePath, file.buffer);

    let thumbnailUrl: string | null = null;

    // Image compression and thumbnail generation using sharp
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      try {
        const thumbName = `thumb-${filename}`;
        const thumbPath = path.join(this.uploadDir, thumbName);
        
        await sharp(file.buffer)
          .resize(200, 200, { fit: 'cover' })
          .toFile(thumbPath);

        thumbnailUrl = `/uploads/${thumbName}`;
      } catch (err) {
        console.error('Thumbnail generation failed', err);
      }
    }

    // Mock virus scanning queue execution
    const isVirusScanned = true;
    const scanResult = 'SAFE'; // Simulated ClamAV return

    return {
      url: `/uploads/${filename}`,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      isVirusScanned,
      scanResult,
      thumbnailUrl,
    };
  }
}
