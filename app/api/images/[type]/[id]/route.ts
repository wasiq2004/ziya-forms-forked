import { NextRequest, NextResponse } from 'next/server';
import { getImageFromDatabase } from '@/lib/media';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;

    if (type !== 'user' && type !== 'form') {
      return NextResponse.json({ message: 'Invalid image type' }, { status: 400 });
    }

    const image = await getImageFromDatabase(id, type as 'user' | 'form');

    if (!image) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    return new NextResponse(image.data, {
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error retrieving image:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
