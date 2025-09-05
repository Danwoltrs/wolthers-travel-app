import { NextRequest, NextResponse } from "next/server";
import { authenticateFleetRequest } from "@/lib/fleet-auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateFleetRequest(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;

    // Fetch all vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id,
        model,
        year,
        color,
        license_plate,
        current_mileage,
        is_available,
        last_maintenance_date,
        last_maintenance_mileage,
        insurance_expiry_date,
        vehicle_type,
        seating_capacity,
        fuel_capacity_liters,
        renavam_number,
        notes,
        is_rental,
        rental_company,
        rental_contact_info,
        rental_cost_per_day,
        image_url,
        gallery_images,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (vehiclesError) {
      console.error("Error fetching vehicles:", vehiclesError);
      return NextResponse.json(
        { error: "Failed to fetch vehicles" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vehicles: vehicles || [],
      total: vehicles?.length || 0
    });

  } catch (error) {
    console.error("Fleet vehicles API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateFleetRequest(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;

    const body = await request.json();
    
    // Validate required fields
    if (!body.model || !body.license_plate || !body.color) {
      return NextResponse.json(
        { error: "Missing required fields: model, license_plate, color" },
        { status: 400 }
      );
    }

    // Check if license plate already exists
    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('license_plate', body.license_plate.toUpperCase())
      .single();

    if (existingVehicle) {
      return NextResponse.json(
        { error: "A vehicle with this license plate already exists" },
        { status: 400 }
      );
    }

    // Create new vehicle
    const vehicleData = {
      model: body.model.trim(),
      year: parseInt(body.year) || new Date().getFullYear(),
      color: body.color.trim(),
      license_plate: body.license_plate.toUpperCase().trim(),
      current_mileage: parseInt(body.current_mileage) || 0,
      vehicle_type: body.vehicle_type || null,
      seating_capacity: parseInt(body.seating_capacity) || 5,
      fuel_capacity_liters: parseInt(body.fuel_capacity_liters) || null,
      renavam_number: body.renavam_number || null,
      is_available: body.is_available !== undefined ? body.is_available : true,
      is_rental: body.is_rental || false,
      rental_company: body.rental_company || null,
      rental_contact_info: body.rental_contact_info || null,
      rental_cost_per_day: body.rental_cost_per_day ? parseFloat(body.rental_cost_per_day) : null,
      notes: body.notes || null,
    };

    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select(`
        id,
        model,
        year,
        color,
        license_plate,
        current_mileage,
        is_available,
        last_maintenance_date,
        last_maintenance_mileage,
        insurance_expiry_date,
        vehicle_type,
        seating_capacity,
        fuel_capacity_liters,
        renavam_number,
        notes,
        is_rental,
        rental_company,
        rental_contact_info,
        rental_cost_per_day,
        image_url,
        gallery_images,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error("Error creating vehicle:", insertError);
      return NextResponse.json(
        { error: "Failed to create vehicle" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vehicle: newVehicle,
      message: "Vehicle added successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Fleet vehicles POST API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}