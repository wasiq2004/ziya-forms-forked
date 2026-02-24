import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFormById, getResponsesWithAnswers } from '@/lib/mysql/utils';

type Params = { params: Promise<{ formId: string }> };

// GET responses for a specific form
export async function GET(request: NextRequest, segmentData: Params) {
  try {
    // Get the current user from NextAuth session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { formId } = await segmentData.params;
    
    // Verify the form belongs to the current user
    const form = await getFormById(formId);
    
    if (!form || form.user_id !== user.id) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }
    
    // Fetch responses with answers for this form
    const responses = await getResponsesWithAnswers(formId);
    
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error in GET /api/responses/[formId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
