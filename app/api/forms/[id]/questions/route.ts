import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFormById, createQuestion } from '@/lib/mysql/utils';
import pool from '@/lib/mysql/connection';

type Params = { params: Promise<{ id: string }> };

// POST update questions for a form
export async function POST(request: NextRequest, segmentData: Params) {
  try {
    // Get the current user from NextAuth session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: formId } = await segmentData.params;
    const body = await request.json();
    const { questions } = body;
    
    // Verify the form belongs to the current user
    const form = await getFormById(formId);
    
    if (!form || form.user_id !== user.id) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Delete existing questions for this form
      await connection.execute(
        'DELETE FROM questions WHERE form_id = ?',
        [formId]
      );
      
      // Insert new questions
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          await createQuestion({
            form_id: formId,
            title: question.title,
            description: question.description || '',
            type: question.type,
            options: question.options || [],
            is_required: question.is_required || false,
            order_index: i,
            settings: question.settings || {},
          });
        }
      }
    } finally {
      connection.release();
    }
    
    return NextResponse.json({ message: 'Questions updated successfully' });
  } catch (error) {
    console.error('Error in POST /api/forms/[id]/questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}