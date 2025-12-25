import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import logger from './logger';
import { ValidationError } from './errors';

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'pdf,image/jpeg,image/png,text/plain').split(',');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Create subdirectory for answer papers
    const answerPaperDir = path.join(UPLOAD_DIR, 'answer-papers');
    if (!fs.existsSync(answerPaperDir)) {
      fs.mkdirSync(answerPaperDir, { recursive: true });
    }
    cb(null, answerPaperDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-uuid-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const fileType = file.mimetype || path.extname(file.originalname).toLowerCase();
  
  // Check if file type is allowed
  const isAllowed = ALLOWED_FILE_TYPES.some(allowed => {
    if (allowed.startsWith('.')) {
      return fileType === allowed;
    }
    return file.mimetype === allowed || fileType.includes(allowed.replace('image/', ''));
  });

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new ValidationError(`File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`));
  }
};

// Multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Max 10 files per upload
  },
  fileFilter
});

// Helper to get file type from extension
export const getFileType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'PDF';
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
      return 'IMAGE';
    case '.txt':
    case '.doc':
    case '.docx':
      return 'TEXT';
    default:
      return 'OTHER';
  }
};

// Helper to delete file
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted', { filePath });
    }
  } catch (error: any) {
    logger.error('Failed to delete file', {
      error: error.message,
      filePath
    });
  }
};

// Helper to get file size
export const getFileSize = (filePath: string): number => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error: any) {
    logger.error('Failed to get file size', {
      error: error.message,
      filePath
    });
    return 0;
  }
};

