import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { saveImageToDatabase, deleteImageFromDatabase } from '@/lib/media';

export const runtime = 'nodejs';

const allowedScopes = new Set(['forms/banners', 'users/avatars']);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const scope = String(formData.get('scope') || 'media');
    const entityId = String(formData.get('entityId') || user.id);

    if (!allowedScopes.has(scope)) {
      return NextResponse.json({ message: 'Invalid upload scope' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Only image uploads are supported' }, { status: 400 });
    }

    // Determine entity type and save to database
    const entityType = scope === 'users/avatars' ? 'user' : 'form';
    
    // Delete old image if exists
    if (scope === 'users/avatars') {
      await deleteImageFromDatabase(entityId, 'user');
    } else if (scope === 'forms/banners') {
      await deleteImageFromDatabase(entityId, 'form');
    }

    // Save new image to database
    const url = await saveImageToDatabase(file, scope, entityId, entityType);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error in POST /api/uploads/image:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
