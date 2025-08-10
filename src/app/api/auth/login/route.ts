import { NextRequest, NextResponse } from 'next/server';
import { verifyUserPassword } from '@/lib/supabase-server';
import { createSessionToken } from '@/lib/jwt-utils';

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
      
      // Get user agent from request headers
      const userAgent = request.headers.get('user-agent') || undefined;
      
      const result = await verifyUserPassword(email, password, userAgent);
      
      if (result.error || !result.isValid) {
        console.log('Password verification failed:', result.error);
        return NextResponse.json({
          success: false,
          error: 'Invalid email or password'
        }, { status: 401 });
      }

      console.log('Login successful for:', email);

      // Create a JWT session token for consistent authentication
      const sessionToken = createSessionToken(result.user!.id);

      // Create response with session token
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: result.user!,
        sessionToken
      });

      // Set the session as an HTTP-only cookie (same as Microsoft OAuth)
      response.cookies.set('auth-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return response;

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