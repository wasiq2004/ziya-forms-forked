import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import pool from '@/lib/mysql/connection';

const MEDIA_ROOT = path.join(process.cwd(), 'public', 'uploads');

const safeSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');

const mimeToExtension = (mimeType: string) => {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
};

const getRelativePathFromUrl = (url: string) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  if (url.startsWith('/uploads/')) {
    return url.replace(/^\//, '');
  }

  try {
    const parsed = new URL(url);
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
  const normalizedScope = safeSegment(scope || 'media') || 'media';
  const extension = mimeToExtension(file.type || 'image/jpeg');
  const fileName = `${nanoid(16)}.${extension}`;
  const relativeDir = path.join('uploads', normalizedScope);
  const relativePath = path.join(relativeDir, fileName);
  const absoluteDir = path.join(MEDIA_ROOT, normalizedScope);
  const absolutePath = path.join(absoluteDir, fileName);

  await fs.mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return `/${relativePath.replace(/\\/g, '/')}`;
}

export async function deleteManagedMediaUrl(url?: string | null) {
  const relativePath = getRelativePathFromUrl(url || '');

  if (!relativePath) {
    return false;
  }

  const absolutePath = path.join(process.cwd(), 'public', relativePath);

  try {
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
    const mimeType = file.type || 'image/jpeg';
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageId = nanoid();

    if (entityType === 'user') {
      await connection.execute(
        'UPDATE users SET avatar_data = ?, avatar_mime_type = ? WHERE id = ?',
        [buffer, mimeType, entityId]
      );
    } else if (entityType === 'form') {
      await connection.execute(
        'UPDATE forms SET banner_data = ?, banner_mime_type = ? WHERE id = ?',
        [buffer, mimeType, entityId]
      );
    } else if (scope === 'forms/images') {
      await connection.execute(
        `INSERT INTO form_images (id, form_id, image_data, mime_type, file_name, file_size)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [imageId, entityId, buffer, mimeType, file.name, file.size]
      );
    }

    return `/api/images/${entityType}/${entityId}`;
  } finally {
    connection.release();
  }
}

export async function getImageFromDatabase(
  entityId: string,
  entityType: 'user' | 'form'
): Promise<{ data: Buffer; mimeType: string } | null> {
  const connection = await pool.getConnection();
  try {
    if (entityType === 'user') {
      const [rows]: any = await connection.execute(
        'SELECT avatar_data, avatar_mime_type FROM users WHERE id = ?',
        [entityId]
      );
      if (rows && rows.length > 0 && rows[0].avatar_data) {
        return {
          data: rows[0].avatar_data,
          mimeType: rows[0].avatar_mime_type || 'image/jpeg',
        };
      }
    } else if (entityType === 'form') {
      const [rows]: any = await connection.execute(
        'SELECT banner_data, banner_mime_type FROM forms WHERE id = ?',
        [entityId]
      );
      if (rows && rows.length > 0 && rows[0].banner_data) {
        return {
          data: rows[0].banner_data,
          mimeType: rows[0].banner_mime_type || 'image/jpeg',
        };
      }
    }
    return null;
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
    if (entityType === 'user') {
      await connection.execute(
        'UPDATE users SET avatar_data = NULL, avatar_mime_type = NULL WHERE id = ?',
        [entityId]
      );
    } else if (entityType === 'form') {
      await connection.execute(
        'UPDATE forms SET banner_data = NULL, banner_mime_type = NULL WHERE id = ?',
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
