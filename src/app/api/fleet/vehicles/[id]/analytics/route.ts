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

    // Get timeframe from query parameters
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '6months';

    // Calculate date range based on timeframe
    let startDate = new Date();
    switch (timeframe) {
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2000); // Set to a very old date for all time
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    // Fetch mileage logs with aggregated data by month
    const { data: mileageLogs, error: mileageError } = await supabase
      .from('vehicle_mileage_logs')
      .select(`
        recorded_date,
        mileage_reading,
        fuel_purchased_liters,
        fuel_cost_brl,
        fuel_efficiency_kmpl,
        vehicle_log_id
      `)
      .eq('vehicle_id', params.id)
      .gte('recorded_date', startDate.toISOString().split('T')[0])
      .order('recorded_date', { ascending: true });

    if (mileageError) {
      console.error("Error fetching mileage logs:", mileageError);
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }

    // Fetch usage logs for trip counting
    const { data: usageLogs, error: usageError } = await supabase
      .from('vehicle_logs')
      .select(`
        usage_start_datetime,
        start_mileage,
        end_mileage,
        usage_type
      `)
      .eq('vehicle_id', params.id)
      .gte('usage_start_datetime', startDate.toISOString())
      .order('usage_start_datetime', { ascending: true });

    if (usageError) {
      console.error("Error fetching usage logs:", usageError);
      return NextResponse.json(
        { error: "Failed to fetch usage data" },
        { status: 500 }
      );
    }

    // Process the data to create monthly aggregations
    const monthlyData: { [key: string]: any } = {};

    // Process mileage logs
    (mileageLogs || []).forEach(log => {
      const monthKey = log.recorded_date.substring(0, 7); // YYYY-MM format
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          distance: 0,
          fuel_cost: 0,
          fuel_purchased: 0,
          efficiency_readings: [],
          trips: 0,
        };
      }

      if (log.fuel_cost_brl) {
        monthlyData[monthKey].fuel_cost += parseFloat(log.fuel_cost_brl);
      }
      if (log.fuel_purchased_liters) {
        monthlyData[monthKey].fuel_purchased += parseFloat(log.fuel_purchased_liters);
      }
      if (log.fuel_efficiency_kmpl) {
        monthlyData[monthKey].efficiency_readings.push(parseFloat(log.fuel_efficiency_kmpl));
      }
    });

    // Process usage logs for distance and trip counting
    (usageLogs || []).forEach(log => {
      const monthKey = log.usage_start_datetime.substring(0, 7); // YYYY-MM format
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          distance: 0,
          fuel_cost: 0,
          fuel_purchased: 0,
          efficiency_readings: [],
          trips: 0,
        };
      }

      // Calculate distance if both start and end mileage are available
      if (log.end_mileage && log.start_mileage) {
        const distance = log.end_mileage - log.start_mileage;
        if (distance > 0) {
          monthlyData[monthKey].distance += distance;
        }
      }

      // Count trips (excluding maintenance)
      if (log.usage_type !== 'maintenance') {
        monthlyData[monthKey].trips += 1;
      }
    });

    // Convert to array and calculate averages
    const mileageData = Object.values(monthlyData).map((month: any) => ({
      month: month.month,
      distance: month.distance,
      fuel_cost: month.fuel_cost,
      efficiency: month.efficiency_readings.length > 0 
        ? month.efficiency_readings.reduce((sum: number, val: number) => sum + val, 0) / month.efficiency_readings.length
        : 0,
      trips: month.trips,
    })).sort((a, b) => a.month.localeCompare(b.month));

    // If no actual data, return mock data for demonstration
    if (mileageData.length === 0) {
      const mockData = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = date.toISOString().substring(0, 7);
        
        mockData.push({
          month: monthKey,
          distance: Math.floor(Math.random() * 1500) + 500, // 500-2000 km
          fuel_cost: Math.floor(Math.random() * 400) + 200, // R$ 200-600
          efficiency: Math.round((Math.random() * 3 + 10) * 10) / 10, // 10-13 km/L
          trips: Math.floor(Math.random() * 15) + 5, // 5-20 trips
        });
      }
      
      return NextResponse.json({
        mileage_data: mockData,
        has_real_data: false,
      });
    }

    return NextResponse.json({
      mileage_data: mileageData,
      has_real_data: true,
    });

  } catch (error) {
    console.error("Vehicle analytics GET API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}