import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, sendOTPEmail, EmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, template, purpose, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const validTemplates: EmailTemplate[] = ['minimal', 'classic', 'modern'];
    const validPurposes = ['signin', 'signup', 'reset'];

    const testTemplate = validTemplates.includes(template) ? template : 'modern';
    const testPurpose = validPurposes.includes(purpose) ? purpose : 'signin';

    // Generate test OTP
    const otp = generateOTP();

    // Send test email
    const result = await sendOTPEmail({
      to: email,
      name: name || 'Test User',
      otp,
      purpose: testPurpose as any,
      template: testTemplate
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to send ${testTemplate} email: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${testTemplate} email sent successfully`,
      template: testTemplate,
      purpose: testPurpose,
      otp: otp // Include OTP in response for testing purposes
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send all three templates at once
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const purpose = searchParams.get('purpose') || 'signin';
    const name = searchParams.get('name') || 'Test User';

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const templates: EmailTemplate[] = ['minimal', 'classic', 'modern'];
    const results = [];

    for (const template of templates) {
      const otp = generateOTP();
      
      const result = await sendOTPEmail({
        to: email,
        name,
        otp,
        purpose: purpose as any,
        template
      });

      results.push({
        template,
        success: result.success,
        error: result.error,
        otp: result.success ? otp : null
      });

      // Add small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      message: 'All test emails sent',
      results
    });

  } catch (error) {
    console.error('Test all emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}