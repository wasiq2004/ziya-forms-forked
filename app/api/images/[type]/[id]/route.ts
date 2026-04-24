import { NextRequest, NextResponse } from 'next/server';
import { getImageFromDatabase } from '@/lib/media';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;

    if (type !== 'user' && type !== 'form') {
      return NextResponse.json({ message: 'Invalid image type' }, { status: 400 });
    }

    const image = await getImageFromDatabase(id, type as 'user' | 'form');

    if (!image) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    // Redirect to Cloudinary URL for backward compatibility
    return NextResponse.redirect(image.url, { status: 302 });
  } catch (error) {
    console.error('Error retrieving image:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
