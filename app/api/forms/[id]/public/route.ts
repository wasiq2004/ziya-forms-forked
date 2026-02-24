import { NextRequest, NextResponse } from 'next/server';
import { getFormWithQuestions } from '@/lib/mysql/utils';

type Params = { params: Promise<{ id: string }> };

// GET a specific form with its questions (public endpoint)
export async function GET(request: NextRequest, segmentData: Params) {
  try {
    const { id } = await segmentData.params;
    
    // Fetch the form only if it's published and accepting responses
    const formWithQuestions = await getFormWithQuestions(id);
    
    if (!formWithQuestions || !formWithQuestions.is_published || !formWithQuestions.is_accepting_responses) {
      return NextResponse.json({ error: 'Form not found or not publicly accessible' }, { status: 404 });
    }
    
    return NextResponse.json({ form: formWithQuestions });
  } catch (error) {
    console.error('Error in GET /api/forms/[id]/public:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
