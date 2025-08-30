import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { generateOTP, sendOTPEmail } from '@/lib/email';

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number; email: string }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, action } = body;
    
    console.log('=== OTP LOGIN REQUEST ===');
    console.log('Action:', action);
    console.log('Email:', email);
    
    if (action === 'send') {
      // Send OTP for login
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      // Check if user exists
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'User not found. Please contact an administrator.' },
          { status: 404 }
        );
      }

      // Generate OTP
      const otpCode = generateOTP();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP
      otpStore.set(email.toLowerCase(), { otp: otpCode, expires, email: email.toLowerCase() });

      // Send email using custom template
      const result = await sendOTPEmail({
        to: email,
        name: userData.name || email.split('@')[0],
        otp: otpCode,
        purpose: 'signin',
        template: 'minimal'
      });

      console.log('=== OTP LOGIN EMAIL DEBUG ===');
      console.log('Email:', email);
      console.log('OTP:', otpCode);
      console.log('Result:', result);

      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to send login code' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Login code sent to your email'
      });

    } else if (action === 'verify') {
      // Verify OTP and log user in
      if (!email || !otp) {
        return NextResponse.json(
          { error: 'Email and OTP are required' },
          { status: 400 }
        );
      }

      // Verify OTP
      const storedData = otpStore.get(email.toLowerCase());
      if (!storedData) {
        return NextResponse.json(
          { error: 'Invalid or expired login code' },
          { status: 400 }
        );
      }

      if (storedData.otp !== otp || Date.now() > storedData.expires) {
        otpStore.delete(email.toLowerCase());
        return NextResponse.json(
          { error: 'Invalid or expired login code' },
          { status: 400 }
        );
      }

      // Clear OTP after successful verification
      otpStore.delete(email.toLowerCase());

      // Get user data
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, company_id, avatar_url, created_at, updated_at')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Create session using Supabase admin
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email.toLowerCase(),
      });

      if (authError || !authData.properties?.hashed_token) {
        console.error('Failed to generate auth link:', authError);
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }

      // Create a proper Supabase session
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role,
          company_id: userData.company_id,
          avatar_url: userData.avatar_url
        }
      });

      console.log('=== OTP LOGIN SUCCESS ===');
      console.log('User:', userData.email);
      console.log('Role:', userData.role);

      // Set session cookies
      const cookieStore = cookies();
      
      // Create a simple session token (in production, use proper JWT)
      const sessionToken = Buffer.from(JSON.stringify({
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        company_id: userData.company_id,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      })).toString('base64');

      cookieStore.set('wolthers-session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          company_id: userData.company_id,
          avatar_url: userData.avatar_url,
          otp_login: true // Flag to show password change prompt
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('OTP login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}