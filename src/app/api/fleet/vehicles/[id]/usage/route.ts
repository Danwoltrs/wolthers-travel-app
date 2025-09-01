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

    // Fetch usage logs for this vehicle with driver and trip information
    const { data: usageLogs, error: usageError } = await supabase
      .from('vehicle_logs')
      .select(`
        id,
        driver_id,
        trip_id,
        usage_start_datetime,
        usage_end_datetime,
        start_mileage,
        end_mileage,
        start_location,
        end_location,
        fuel_level_start,
        fuel_level_end,
        usage_type,
        notes,
        created_at,
        driver:users!vehicle_logs_driver_id_fkey (
          id,
          name,
          email
        ),
        trip:trips!vehicle_logs_trip_id_fkey (
          id,
          title
        )
      `)
      .eq('vehicle_id', params.id)
      .order('usage_start_datetime', { ascending: false })
      .limit(100); // Limit to last 100 usage logs

    if (usageError) {
      console.error("Error fetching usage logs:", usageError);
      return NextResponse.json(
        { error: "Failed to fetch usage logs" },
        { status: 500 }
      );
    }

    // Transform the data to include driver name and trip title
    const transformedLogs = (usageLogs || []).map(log => ({
      id: log.id,
      driver_id: log.driver_id,
      driver_name: log.driver?.name || log.driver?.email || 'Unknown Driver',
      trip_id: log.trip_id,
      trip_title: log.trip?.title || null,
      usage_start_datetime: log.usage_start_datetime,
      usage_end_datetime: log.usage_end_datetime,
      start_mileage: log.start_mileage,
      end_mileage: log.end_mileage,
      start_location: log.start_location,
      end_location: log.end_location,
      fuel_level_start: log.fuel_level_start,
      fuel_level_end: log.fuel_level_end,
      usage_type: log.usage_type,
      notes: log.notes,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      usage: transformedLogs
    });

  } catch (error) {
    console.error("Vehicle usage GET API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}