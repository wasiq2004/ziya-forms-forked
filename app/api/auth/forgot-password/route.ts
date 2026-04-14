import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mysql/connection';
import { sendPasswordResetEmail } from '@/lib/mail';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const connection = await pool.getConnection();
    try {
      const [rows]: any = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);

      if (!rows || rows.length === 0) {
        // Don't reveal if email exists or not (security)
        return NextResponse.json({ message: 'If an account exists, OTP will be sent to the email' }, { status: 200 });
      }

      // Generate 6-digit OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      // Hash OTP with bcrypt
      const hashedOtp = await bcrypt.hash(otp, 10);

      // Set expiry to 10 minutes
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Store OTP in database
      const otpId = nanoid();
      await connection.execute(
        `INSERT INTO password_reset_otp (id, email, otp_code, otp_hash, expires_at, attempts)
         VALUES (?, ?, ?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at), attempts = 0`,
        [otpId, email, otp, hashedOtp, expiresAt]
      );

      // Send OTP email
      try {
        await sendPasswordResetEmail({ email, otp });
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Still return success to user for security (don't reveal email sending issues)
      }

      return NextResponse.json({ message: 'OTP sent to your email' }, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
