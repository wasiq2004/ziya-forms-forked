import { NextRequest, NextResponse } from 'next/server';
import { createResponse, createAnswer, getFormById } from '@/lib/mysql/utils';
import { nanoid } from 'nanoid';

type Params = { params: Promise<{ id: string }> };

// POST submit a response to a form (simplified structure)
export async function POST(request: NextRequest, segmentData: Params) {
  try {
    const { id: formId } = await segmentData.params;
    const body = await request.json();
    const { response_data } = body;
    
    // Verify the form exists and is accepting responses
    const form = await getFormById(formId);
    
    if (!form || !form.is_published || !form.is_accepting_responses) {
      return NextResponse.json({ error: 'Form not found or not accepting responses' }, { status: 404 });
    }
    
    // Create a new response
    const response = await createResponse({
      form_id: formId,
      respondent_email: response_data?.respondent_email || null,
    });
    
    // Create answers if provided
    if (response_data?.answers && Array.isArray(response_data.answers)) {
      for (const answer of response_data.answers) {
        await createAnswer({
          response_id: response.id,
          question_id: answer.question_id,
          answer_text: answer.answer_text || '',
          answer_data: answer.answer_data || {},
        });
      }
    }
    
    return NextResponse.json({ 
      message: 'Response submitted successfully!',
      response_id: response.id
    });
  } catch (error) {
    console.error('Error in POST /api/forms/[id]/submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}