import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from '../utils/errors';

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Determine upload directory based on file type
    let uploadDir = 'uploads/';
    
    if (file.fieldname === 'documents') {
      uploadDir = 'uploads/documents/';
    } else if (file.fieldname === 'contracts') {
      uploadDir = 'uploads/contracts/';
    } else if (file.fieldname === 'photos') {
      uploadDir = 'uploads/photos/';
    } else if (file.fieldname === 'avatars') {
      uploadDir = 'uploads/avatars/';
    }

    // Add year and month to path
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    uploadDir += `${year}/${month}/`;

    // Create directory if it doesn't exist
    const fullPath = path.join(process.cwd(), uploadDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    // Sanitize filename
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedName}-${uniqueSuffix}${ext}`;
    
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types based on field
  const allowedTypes: { [key: string]: string[] } = {
    documents: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    contracts: ['application/pdf'],
    photos: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    avatars: ['image/jpeg', 'image/jpg', 'image/png'],
  };

  const fieldTypes = allowedTypes[file.fieldname] || allowedTypes.documents;
  
  if (fieldTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${fieldTypes.join(', ')}`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Max 10 files per upload
  },
});

// Middleware wrapper for error handling
export const uploadMiddleware = {
  single: (fieldName: string) => {
    return (req: any, res: any, next: any) => {
      upload.single(fieldName)(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large. Maximum size is 10MB', 400));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError('Too many files. Maximum is 10 files', 400));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError('Unexpected field name', 400));
          }
          return next(new AppError(err.message, 400));
        } else if (err) {
          return next(new AppError(err.message, 400));
        }
        next();
      });
    };
  },
  
  array: (fieldName: string, maxCount?: number) => {
    return (req: any, res: any, next: any) => {
      upload.array(fieldName, maxCount)(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large. Maximum size is 10MB', 400));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError(`Too many files. Maximum is ${maxCount || 10} files`, 400));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError('Unexpected field name', 400));
          }
          return next(new AppError(err.message, 400));
        } else if (err) {
          return next(new AppError(err.message, 400));
        }
        next();
      });
    };
  },
  
  fields: (fields: multer.Field[]) => {
    return (req: any, res: any, next: any) => {
      upload.fields(fields)(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large. Maximum size is 10MB', 400));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError('Too many files', 400));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError('Unexpected field name', 400));
          }
          return next(new AppError(err.message, 400));
        } else if (err) {
          return next(new AppError(err.message, 400));
        }
        next();
      });
    };
  },
  
  none: () => {
    return upload.none();
  },
};

// Helper function to delete uploaded file
export const deleteUploadedFile = (filePath: string): void => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Helper function to validate file size
export const validateFileSize = (file: Express.Multer.File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Helper function to validate file extension
export const validateFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
};

// Helper function to sanitize filename
export const sanitizeFilename = (filename: string): string => {
  // Remove any directory traversal attempts
  const name = path.basename(filename);
  // Replace spaces and special characters
  return name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
};

// Helper function to get file metadata
export const getFileMetadata = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    destination: file.destination,
    encoding: file.encoding,
  };
};

// Helper function to create thumbnail (for images)
export const createThumbnail = async (imagePath: string, thumbnailPath: string): Promise<void> => {
  // This would require an image processing library like sharp
  // For now, we'll just copy the file
  try {
    fs.copyFileSync(imagePath, thumbnailPath);
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw new AppError('Failed to create thumbnail', 500);
  }
};

export default upload;
