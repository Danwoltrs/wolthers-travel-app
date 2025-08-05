import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, sendOTPEmailSMTP } from '@/lib/email-smtp';

// Store OTPs and pending registrations temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number; userData: any }>();

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, template } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store user data with OTP
    otpStore.set(email, { 
      otp, 
      expires, 
      userData: { email, name, password }
    });

    // Send email
    const result = await sendOTPEmailSMTP({
      to: email,
      name,
      otp,
      purpose: 'signup',
      template: template || 'modern'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('Signup error:', error);
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

    // Get user data
    const { userData } = storedData;
    
    // Clear OTP
    otpStore.delete(email);

    // Here you would create the user in your database
    // For now, we'll just return success
    console.log('User verified and ready to create:', userData);

    return NextResponse.json({
      success: true,
      message: 'Account verified successfully',
      user: {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name
      }
    });

  } catch (error) {
    console.error('Verify signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}