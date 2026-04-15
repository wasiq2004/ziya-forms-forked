import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mysql/connection';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ message: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      // Verify OTP is still valid
      const [otpRows]: any = await connection.execute(
        `SELECT otp_hash FROM password_reset_otp 
         WHERE email = ? AND expires_at > NOW() 
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );

      if (!otpRows || otpRows.length === 0) {
        return NextResponse.json({ message: 'OTP expired. Please request a new one.' }, { status: 400 });
      }

      // Verify OTP one more time
      const isValidOtp = await bcrypt.compare(otp, otpRows[0].otp_hash);

      if (!isValidOtp) {
        return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update user password
      const [userResult]: any = await connection.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [passwordHash, email]
      );

      if (userResult.affectedRows === 0) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      // Delete used OTP
      await connection.execute(
        'DELETE FROM password_reset_otp WHERE email = ?',
        [email]
      );

      // Clean up expired OTPs (optional maintenance)
      await connection.execute('DELETE FROM password_reset_otp WHERE expires_at <= NOW()');

      return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in reset-password:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
