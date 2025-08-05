import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, sendOTPEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('=== EMAIL DEBUG ===');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp);
    console.log('Sending to:', email);

    // Send email
    const result = await sendOTPEmail({
      to: email,
      name: 'Daniel',
      otp,
      purpose: 'reset',
      template: 'minimal'
    });

    console.log('Email result:', result);

    return NextResponse.json({
      success: result.success,
      error: result.error,
      otp: otp, // Include for debugging
      hasApiKey: !!process.env.RESEND_API_KEY
    });

  } catch (error) {
    console.error('Debug email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}