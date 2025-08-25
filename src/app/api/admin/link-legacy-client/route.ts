import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { legacyClientId, companyId } = await request.json();

    if (!legacyClientId || !companyId) {
      return NextResponse.json(
        { error: 'legacyClientId and companyId are required' },
        { status: 400 }
      );
    }

    // Update the legacy client with the company link
    const { error: updateError } = await supabase
      .from('legacy_clients')
      .update({ company_id: companyId })
      .eq('legacy_client_id', legacyClientId);

    if (updateError) {
      console.error('Error updating legacy client:', updateError);
      return NextResponse.json(
        { error: 'Failed to link legacy client', details: updateError.message },
        { status: 500 }
      );
    }

    // Also update the company with the legacy client link
    const { error: companyUpdateError } = await supabase
      .from('companies')
      .update({ legacy_client_id: legacyClientId })
      .eq('id', companyId);

    if (companyUpdateError) {
      console.error('Error updating company:', companyUpdateError);
      // This is not critical - the main link from legacy_clients is established
      console.warn('Company linking failed but legacy client was updated');
    }

    // Create a client match record for tracking
    const { error: matchError } = await supabase
      .from('client_matches')
      .insert({
        company_id: companyId,
        legacy_client_id: legacyClientId,
        match_confidence: 1.00,
        match_reasons: ['manual_link'],
        status: 'confirmed'
      });

    if (matchError) {
      console.error('Error creating client match:', matchError);
      // This is not critical - the main links are established
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in link-legacy-client API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}