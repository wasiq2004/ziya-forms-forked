import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mysql/connection';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
    }

    if (otp.length !== 6) {
      return NextResponse.json({ message: 'OTP must be 6 digits' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      // Get OTP record
      const [rows]: any = await connection.execute(
        `SELECT otp_hash, expires_at, attempts, max_attempts FROM password_reset_otp 
         WHERE email = ? AND expires_at > NOW() 
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );

      if (!rows || rows.length === 0) {
        return NextResponse.json({ message: 'OTP expired or not found. Please request a new one.' }, { status: 400 });
      }

      const record = rows[0];

      // Check if max attempts exceeded
      if (record.attempts >= record.max_attempts) {
        return NextResponse.json({ message: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 });
      }

      // Verify OTP
      const isValidOtp = await bcrypt.compare(otp, record.otp_hash);

      if (!isValidOtp) {
        // Increment attempts
        await connection.execute(
          'UPDATE password_reset_otp SET attempts = attempts + 1 WHERE email = ? AND expires_at > NOW()',
          [email]
        );

        const remainingAttempts = record.max_attempts - record.attempts - 1;
        return NextResponse.json(
          { message: `Invalid OTP. ${remainingAttempts} attempts remaining.` },
          { status: 400 }
        );
      }

      // OTP is valid - mark in session or create verification token
      // For now, we'll just return success; the frontend should store the email and proceed to password reset

      return NextResponse.json({ message: 'OTP verified successfully' }, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
