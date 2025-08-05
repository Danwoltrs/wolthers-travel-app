import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, sendOTPEmail } from '@/lib/email';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number; email: string }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, template } = body;
    
    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('Request body:', body);
    console.log('Email:', email);
    console.log('Template:', template);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, { otp, expires, email });

    // Send email using the same logic as the test endpoint
    const result = await sendOTPEmail({
      to: email,
      name: email.split('@')[0],
      otp,
      purpose: 'reset',
      template: 'minimal'
    });

    console.log('=== FORGOT PASSWORD EMAIL DEBUG ===');
    console.log('Email:', email);
    console.log('OTP:', otp);
    console.log('Result:', result);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset code sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const storedData = otpStore.get(email);
    if (!storedData) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    if (storedData.otp !== otp || Date.now() > storedData.expires) {
      otpStore.delete(email);
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Clear OTP after successful verification
    otpStore.delete(email);

    console.log(`OTP verified successfully for ${email}`);
    
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}