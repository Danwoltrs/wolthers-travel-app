import { NextRequest, NextResponse } from 'next/server';
import { verifyUserPassword } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('=== LOGIN API ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    try {
      // Verify password using Supabase client
      console.log('Verifying password for:', email);
      
      const result = await verifyUserPassword(email, password);
      
      if (result.error || !result.isValid) {
        console.log('Password verification failed:', result.error);
        return NextResponse.json({
          success: false,
          error: 'Invalid email or password'
        }, { status: 401 });
      }

      console.log('Login successful for:', email);

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: result.user
      });

    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}