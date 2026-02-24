import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/mysql/utils';
import { nanoid } from 'nanoid';
import pool from '@/lib/mysql/connection';

// GET /api/users - Get all users (for testing purposes)
export async function GET(request: NextRequest) {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Fetch users (excluding password hashes for security)
      const [users]: any = await connection.execute(
        'SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC'
      );

      return NextResponse.json({ users });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users - Create a new user (alternative to register endpoint)
export async function POST(request: NextRequest) {
  try {
    const { email, full_name } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' }, 
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' }, 
        { status: 400 }
      );
    }
    
    // Create a user without password (for testing purposes)
    const user = await createUser({
      id: nanoid(),
      email: email,
      full_name: full_name || email.split('@')[0],
    });
    
    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user 
      }, 
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}