import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFormWithQuestions, updateForm, deleteForm, getFormById } from '@/lib/mysql/utils';
import { nanoid } from 'nanoid';

type Params = { params: Promise<{ id: string }> };

// GET a specific form with its questions
export async function GET(request: NextRequest, segmentData: Params) {
  try {
    // Get the current user from NextAuth session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await segmentData.params;
    
    // Fetch the form and verify it belongs to the current user
    const formWithQuestions = await getFormWithQuestions(id);
    
    if (!formWithQuestions || formWithQuestions.user_id !== user.id) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }
    
    return NextResponse.json({ form: formWithQuestions });
  } catch (error) {
    console.error('Error in GET /api/forms/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update a form
export async function PUT(request: NextRequest, segmentData: Params) {
  try {
    // Get the current user from NextAuth session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await segmentData.params;
    const body = await request.json();
    
    // Verify the form belongs to the current user
    const existingForm = await getFormById(id);
    
    if (!existingForm || existingForm.user_id !== user.id) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }
    
    // Update the form
    const updateResult = await updateForm(id, {
      title: body.title,
      description: body.description,
      theme_color: body.theme_color,
      is_published: body.is_published,
      is_accepting_responses: body.is_accepting_responses,
    });
    
    if (!updateResult) {
      return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
    }
    
    // Fetch updated form
    const updatedForm = await getFormById(id);
    
    return NextResponse.json({ form: updatedForm });
  } catch (error) {
    console.error('Error in PUT /api/forms/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a form
export async function DELETE(request: NextRequest, segmentData: Params) {
  try {
    // Get the current user from NextAuth session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await segmentData.params;
    
    // Verify the form belongs to the current user
    const existingForm = await getFormById(id);
    
    if (!existingForm || existingForm.user_id !== user.id) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 });
    }
    
    // Delete the form
    const deleteResult = await deleteForm(id);
    
    if (!deleteResult) {
      return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/forms/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}