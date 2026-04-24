import { v2 as cloudinary } from 'cloudinary';
import pool from '@/lib/mysql/connection';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MANAGED_SCOPES = new Set(['forms/banners', 'users/avatars']);

const safeSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');

const normalizeScope = (scope: string) => {
  const normalized = safeSegment(scope || 'media') || 'media';
  return MANAGED_SCOPES.has(normalized) ? normalized : 'media';
};

const getRelativePathFromUrl = (url: string) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Check if it's a Cloudinary URL
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    return url;
  }

  // Legacy local URLs
  const normalizedUrl = url.replace(/\\/g, '/');

  if (normalizedUrl.startsWith('/uploads/')) {
    return normalizedUrl.replace(/^\//, '');
  }

  if (normalizedUrl.startsWith('uploads/')) {
    return normalizedUrl;
  }

  try {
    const parsed = new URL(normalizedUrl);
    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname.replace(/^\//, '');
    }
  } catch {
    return null;
  }

  return null;
};

export function isManagedMediaUrl(url?: string | null) {
  return Boolean(getRelativePathFromUrl(url || ''));
}

export async function saveUploadedImage(file: File, scope: string) {
  const normalizedScope = normalizeScope(scope);

  // Convert File to Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Cloudinary
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ziya-forms/${normalizedScope}`,
        public_id: undefined, // Let Cloudinary generate unique ID
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' }, // Max dimensions
          { quality: 'auto' }, // Auto quality optimization
        ],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload image to cloud storage'));
          return;
        }

        if (!result?.secure_url) {
          reject(new Error('No URL returned from cloud storage'));
          return;
        }

        resolve(result.secure_url);
      }
    );

    // Write buffer to stream
    uploadStream.end(buffer);
  });
}

export async function deleteManagedMediaUrl(url?: string | null) {
  if (!url) return false;

  // Check if it's a Cloudinary URL
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = url.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];

      // Find the folder structure
      const folderIndex = urlParts.findIndex(part => part === 'ziya-forms');
      if (folderIndex !== -1 && folderIndex + 1 < urlParts.length) {
        const folder = urlParts[folderIndex + 1];
        const fullPublicId = `ziya-forms/${folder}/${publicId}`;

        await cloudinary.uploader.destroy(fullPublicId);
        return true;
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  // Legacy local file deletion (for backward compatibility)
  const relativePath = getRelativePathFromUrl(url);
  if (!relativePath) return false;

  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const absolutePath = path.join(process.cwd(), 'public', relativePath);
    await fs.unlink(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function saveImageToDatabase(
  file: File,
  scope: string,
  entityId: string,
  entityType: 'user' | 'form'
) {
  const connection = await pool.getConnection();
  try {
    const fileUrl = await saveUploadedImage(file, scope);

    if (entityType === 'user') {
      await connection.execute(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [fileUrl, entityId]
      );
    } else if (entityType === 'form') {
      await connection.execute(
        'UPDATE forms SET banner_url = ? WHERE id = ?',
        [fileUrl, entityId]
      );
    }

    return fileUrl;
  } finally {
    connection.release();
  }
}

export async function getImageFromDatabase(
  entityId: string,
  entityType: 'user' | 'form'
): Promise<{ url: string } | null> {
  const connection = await pool.getConnection();
  try {
    let imageUrl: string | null = null;

    if (entityType === 'user') {
      const [rows]: any = await connection.execute(
        'SELECT avatar_url FROM users WHERE id = ?',
        [entityId]
      );
      if (rows && rows.length > 0) {
        imageUrl = rows[0].avatar_url;
      }
    } else if (entityType === 'form') {
      const [rows]: any = await connection.execute(
        'SELECT banner_url FROM forms WHERE id = ?',
        [entityId]
      );
      if (rows && rows.length > 0) {
        imageUrl = rows[0].banner_url;
      }
    }

    if (!imageUrl) {
      return null;
    }

    return { url: imageUrl };
  } finally {
    connection.release();
  }
}

export async function deleteImageFromDatabase(
  entityId: string,
  entityType: 'user' | 'form'
) {
  const connection = await pool.getConnection();
  try {
    let imageUrl: string | null = null;

    // Get current image URL
    if (entityType === 'user') {
      const [rows]: any = await connection.execute(
        'SELECT avatar_url FROM users WHERE id = ?',
        [entityId]
      );
      if (rows && rows.length > 0) {
        imageUrl = rows[0].avatar_url;
      }
    } else if (entityType === 'form') {
      const [rows]: any = await connection.execute(
        'SELECT banner_url FROM forms WHERE id = ?',
        [entityId]
      );
      if (rows && rows.length > 0) {
        imageUrl = rows[0].banner_url;
      }
    }

    // Delete file from file system if it exists
    if (imageUrl && isManagedMediaUrl(imageUrl)) {
      await deleteManagedMediaUrl(imageUrl);
    }

    // Clear URL from database
    if (entityType === 'user') {
      await connection.execute(
        'UPDATE users SET avatar_url = NULL WHERE id = ?',
        [entityId]
      );
    } else if (entityType === 'form') {
      await connection.execute(
        'UPDATE forms SET banner_url = NULL WHERE id = ?',
        [entityId]
      );
    }
    return true;
  } catch {
    return false;
  } finally {
    connection.release();
  }
}
