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

    // Fetch maintenance records for this vehicle
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('vehicle_maintenance')
      .select(`
        id,
        maintenance_type,
        service_provider,
        maintenance_date,
        mileage_at_service,
        cost_brl,
        next_service_due_date,
        next_service_due_mileage,
        description,
        invoice_attachments,
        warranty_until,
        created_by,
        created_at,
        updated_at
      `)
      .eq('vehicle_id', params.id)
      .order('maintenance_date', { ascending: false });

    if (maintenanceError) {
      console.error("Error fetching maintenance records:", maintenanceError);
      return NextResponse.json(
        { error: "Failed to fetch maintenance records" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      maintenance: maintenance || []
    });

  } catch (error) {
    console.error("Vehicle maintenance GET API error:", error);
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
      .select('id, current_mileage')
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
    if (!body.maintenance_type || !body.maintenance_date) {
      return NextResponse.json(
        { error: "Missing required fields: maintenance_type, maintenance_date" },
        { status: 400 }
      );
    }

    // Prepare maintenance data
    const maintenanceData = {
      vehicle_id: params.id,
      maintenance_type: body.maintenance_type,
      service_provider: body.service_provider || null,
      maintenance_date: body.maintenance_date,
      mileage_at_service: body.mileage_at_service ? parseInt(body.mileage_at_service) : null,
      cost_brl: body.cost_brl ? parseFloat(body.cost_brl) : null,
      next_service_due_date: body.next_service_due_date || null,
      next_service_due_mileage: body.next_service_due_mileage ? parseInt(body.next_service_due_mileage) : null,
      description: body.description || null,
      warranty_until: body.warranty_until || null,
      created_by: user.id,
    };

    // Create maintenance record
    const { data: newMaintenance, error: insertError } = await supabase
      .from('vehicle_maintenance')
      .insert([maintenanceData])
      .select(`
        id,
        maintenance_type,
        service_provider,
        maintenance_date,
        mileage_at_service,
        cost_brl,
        next_service_due_date,
        next_service_due_mileage,
        description,
        invoice_attachments,
        warranty_until,
        created_by,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error("Error creating maintenance record:", insertError);
      return NextResponse.json(
        { error: "Failed to create maintenance record" },
        { status: 500 }
      );
    }

    // Update vehicle's last maintenance info
    const { error: updateVehicleError } = await supabase
      .from('vehicles')
      .update({
        last_maintenance_date: body.maintenance_date,
        last_maintenance_mileage: body.mileage_at_service ? parseInt(body.mileage_at_service) : null,
      })
      .eq('id', params.id);

    if (updateVehicleError) {
      console.error("Error updating vehicle maintenance info:", updateVehicleError);
      // Don't fail the request since the maintenance record was created successfully
    }

    return NextResponse.json({
      maintenance: newMaintenance,
      message: "Maintenance record added successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Vehicle maintenance POST API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}