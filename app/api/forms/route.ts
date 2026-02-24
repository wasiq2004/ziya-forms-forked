import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_FORM_THEME_COLOR } from '@/lib/config';
import { getCurrentUser } from '@/lib/auth';
import { createForm, getFormsByUserId, createQuestion } from '@/lib/mysql/utils';
import { nanoid } from 'nanoid';

// GET all forms for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the current user from NextAuth session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch forms for the current user from MySQL
    const forms = await getFormsByUserId(user.id);
    
    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Error in GET /api/forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new form
export async function POST(request: NextRequest) {
  try {
    // Get the current user from NextAuth session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, description, theme_color } = body;

    // Create a new form in MySQL
    const formData: any = {
      id: nanoid(),
      user_id: user.id,
      title: title || 'Untitled Form',
      description: description || '',
      theme_color: theme_color || DEFAULT_FORM_THEME_COLOR,
      is_published: false,
      is_accepting_responses: true,
    };

    // Try to insert the form data
    const form = await createForm(formData);
    
    // Create default questions for the new form
    await createDefaultQuestions(form.id);
    
    return NextResponse.json({ form }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/forms:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}

async function createDefaultQuestions(formId: string) {
  const defaultQuestions = [
    {
      id: nanoid(),
      form_id: formId,
      title: 'What is your name?',
      type: 'short_answer',
      options: [],
      is_required: true,
      order_index: 0,
      settings: {},
    },
    {
      id: nanoid(),
      form_id: formId,
      title: 'What is your email?',
      type: 'short_answer',
      options: [],
      is_required: true,
      order_index: 1,
      settings: {},
    }
  ];
  
  // Create each question
  for (const question of defaultQuestions) {
    try {
      await createQuestion(question);
    } catch (error) {
      console.error('Error creating default question:', error);
    }
  }
}