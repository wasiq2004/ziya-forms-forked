import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getFormById, getResponsesWithAnswers, getFormQuestions } from '@/lib/mysql/utils';

type Params = { params: Promise<{ formId: string }> };

// Export responses as Excel
export async function GET(request: NextRequest, segmentData: Params) {
  try {
    const { formId } = await segmentData.params;
    
    // Fetch form
    const form = await getFormById(formId);
    
    if (!form) {
      return new NextResponse('Form not found', { status: 404 });
    }
    
    // Fetch form questions
    const questions: any[] = await getFormQuestions(formId);
    
    // Fetch responses with answers
    const responses: any[] = await getResponsesWithAnswers(formId);
    
    // Prepare data for Excel export
    const headers = ['Timestamp', 'Respondent Email', ...questions.map((q: any) => q.title)];
    const rows = responses.map((response: any) => {
      const row: any[] = [
        new Date(response.submitted_at).toLocaleString(),
        response.respondent_email || ''
      ];
      
      questions.forEach((question: any) => {
        const answer = response.answers.find((a: any) => a.question_id === question.id);
        if (answer) {
          row.push(answer.answer_text || JSON.stringify(answer.answer_data));
        } else {
          row.push('');
        }
      });
      
      return row;
    });
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');
    
    // Generate buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Return Excel file
    return new NextResponse(wbout, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(form.title || 'form')}_responses.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error in export:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}