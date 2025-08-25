import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get legacy clients with pagination support
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    
    let query = supabase
      .from('legacy_clients')
      .select(`
        id,
        legacy_client_id,
        descricao,
        descricao_fantasia,
        cidade,
        email,
        telefone1,
        ativo,
        company_id
      `)
      .order('legacy_client_id');

    // Add search filter if provided
    if (search) {
      query = query.or(`descricao.ilike.%${search}%,cidade.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching legacy clients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch legacy clients', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      count,
      page,
      limit
    });

  } catch (error) {
    console.error('Unexpected error in legacy-clients API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}