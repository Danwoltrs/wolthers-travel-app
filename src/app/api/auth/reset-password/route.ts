import { NextRequest, NextResponse } from 'next/server';
import { updateUserPassword } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    console.log('=== RESET PASSWORD API ===');
    console.log('Email:', email);
    console.log('New password length:', newPassword?.length);

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    try {
      // Update the password in Supabase auth.users table
      console.log(`Updating password for ${email}`);
      
      const result = await updateUserPassword(email, newPassword);
      
      if (!result.success) {
        console.error('Failed to update password:', result.error);
        return NextResponse.json(
          { error: 'Failed to update password in database' },
          { status: 500 }
        );
      }

      console.log(`Password updated successfully for ${email}`);

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update password in database' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}