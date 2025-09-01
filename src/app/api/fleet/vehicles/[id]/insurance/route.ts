import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" }, 
        { status: 401 }
      );
    }

    // Check user permissions
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('company_id, role, is_global_admin')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 403 }
      );
    }

    const isWolthersStaff = userData.is_global_admin || 
      userData.company_id === "840783f4-866d-4bdb-9b5d-5d0facf62db0";
    const isCarManager = userData.role === "car_manager";

    if (!isWolthersStaff && !isCarManager) {
      return NextResponse.json(
        { error: "Access denied - fleet management access required" },
        { status: 403 }
      );
    }

    // Verify vehicle exists
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Fetch insurance policies for this vehicle
    const { data: insurance, error: insuranceError } = await supabase
      .from('vehicle_insurance')
      .select(`
        id,
        insurance_company,
        policy_number,
        policy_type,
        coverage_amount_brl,
        deductible_brl,
        start_date,
        expiry_date,
        premium_amount_brl,
        payment_frequency,
        agent_name,
        agent_contact,
        policy_documents,
        is_active,
        created_at,
        updated_at
      `)
      .eq('vehicle_id', params.id)
      .order('expiry_date', { ascending: false });

    if (insuranceError) {
      console.error("Error fetching insurance policies:", insuranceError);
      return NextResponse.json(
        { error: "Failed to fetch insurance policies" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      insurance: insurance || []
    });

  } catch (error) {
    console.error("Vehicle insurance GET API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" }, 
        { status: 401 }
      );
    }

    // Check user permissions
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('company_id, role, is_global_admin')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 403 }
      );
    }

    const isWolthersStaff = userData.is_global_admin || 
      userData.company_id === "840783f4-866d-4bdb-9b5d-5d0facf62db0";
    const isCarManager = userData.role === "car_manager";

    if (!isWolthersStaff && !isCarManager) {
      return NextResponse.json(
        { error: "Access denied - fleet management access required" },
        { status: 403 }
      );
    }

    // Verify vehicle exists
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.insurance_company || !body.policy_number || !body.policy_type || !body.start_date || !body.expiry_date) {
      return NextResponse.json(
        { error: "Missing required fields: insurance_company, policy_number, policy_type, start_date, expiry_date" },
        { status: 400 }
      );
    }

    // Check if policy number already exists for this vehicle
    const { data: existingPolicy } = await supabase
      .from('vehicle_insurance')
      .select('id')
      .eq('vehicle_id', params.id)
      .eq('policy_number', body.policy_number)
      .single();

    if (existingPolicy) {
      return NextResponse.json(
        { error: "A policy with this number already exists for this vehicle" },
        { status: 400 }
      );
    }

    // If this policy is being set as active, deactivate others of the same type
    if (body.is_active) {
      await supabase
        .from('vehicle_insurance')
        .update({ is_active: false })
        .eq('vehicle_id', params.id)
        .eq('policy_type', body.policy_type);
    }

    // Prepare insurance data
    const insuranceData = {
      vehicle_id: params.id,
      insurance_company: body.insurance_company.trim(),
      policy_number: body.policy_number.trim(),
      policy_type: body.policy_type,
      coverage_amount_brl: body.coverage_amount_brl ? parseFloat(body.coverage_amount_brl) : null,
      deductible_brl: body.deductible_brl ? parseFloat(body.deductible_brl) : null,
      start_date: body.start_date,
      expiry_date: body.expiry_date,
      premium_amount_brl: body.premium_amount_brl ? parseFloat(body.premium_amount_brl) : null,
      payment_frequency: body.payment_frequency || null,
      agent_name: body.agent_name || null,
      agent_contact: body.agent_contact || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
    };

    // Create insurance policy
    const { data: newInsurance, error: insertError } = await supabase
      .from('vehicle_insurance')
      .insert([insuranceData])
      .select(`
        id,
        insurance_company,
        policy_number,
        policy_type,
        coverage_amount_brl,
        deductible_brl,
        start_date,
        expiry_date,
        premium_amount_brl,
        payment_frequency,
        agent_name,
        agent_contact,
        policy_documents,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error("Error creating insurance policy:", insertError);
      return NextResponse.json(
        { error: "Failed to create insurance policy" },
        { status: 500 }
      );
    }

    // Update vehicle's insurance expiry date if this is an active policy
    if (body.is_active) {
      const { error: updateVehicleError } = await supabase
        .from('vehicles')
        .update({
          insurance_expiry_date: body.expiry_date,
        })
        .eq('id', params.id);

      if (updateVehicleError) {
        console.error("Error updating vehicle insurance expiry:", updateVehicleError);
        // Don't fail the request since the insurance policy was created successfully
      }
    }

    return NextResponse.json({
      insurance: newInsurance,
      message: "Insurance policy added successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Vehicle insurance POST API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}