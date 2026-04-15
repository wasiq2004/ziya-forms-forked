import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import pool from '@/lib/mysql/connection';

const MEDIA_ROOT = path.join(process.cwd(), 'public', 'uploads');
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

const mimeToExtension = (mimeType: string) => {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
};

const getMimeTypeFromExtension = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
};

const getRelativePathFromUrl = (url: string) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

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
  const extension = mimeToExtension(file.type || 'image/jpeg');
  const fileName = `${nanoid(16)}.${extension}`;
  const absoluteDir = path.join(MEDIA_ROOT, normalizedScope);
  const absolutePath = path.join(absoluteDir, fileName);

  await fs.mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return `/uploads/${normalizedScope}/${fileName}`.replace(/\\/g, '/');
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
): Promise<{ data: Buffer; mimeType: string } | null> {
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

    const relativePath = getRelativePathFromUrl(imageUrl);
    if (!relativePath) {
      return null;
    }

    const absolutePath = path.join(process.cwd(), 'public', relativePath);

    try {
      const data = await fs.readFile(absolutePath);
      const mimeType = getMimeTypeFromExtension(absolutePath);
      return { data, mimeType };
    } catch {
      // File not found or other read error
      return null;
    }
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
