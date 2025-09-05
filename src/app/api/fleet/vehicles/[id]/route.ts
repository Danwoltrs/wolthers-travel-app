import { NextRequest, NextResponse } from "next/server";
import { authenticateFleetRequest } from "@/lib/fleet-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateFleetRequest(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;

    // Fetch specific vehicle
    const { data: vehicle, error: vehicleError } = await supabase
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
        focal_point_x,
        focal_point_y,
        created_at,
        updated_at
      `)
      .eq('id', params.id)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      vehicle
    });

  } catch (error) {
    console.error("Fleet vehicle GET API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateFleetRequest(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;

    const body = await request.json();
    
    // Validate vehicle exists
    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id, license_plate')
      .eq('id', params.id)
      .single();

    if (!existingVehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    // If license plate is being changed, check for duplicates
    if (body.license_plate && body.license_plate.toUpperCase() !== existingVehicle.license_plate) {
      const { data: duplicateVehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', body.license_plate.toUpperCase())
        .neq('id', params.id)
        .single();

      if (duplicateVehicle) {
        return NextResponse.json(
          { error: "A vehicle with this license plate already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.model !== undefined) updateData.model = body.model.trim();
    if (body.year !== undefined) updateData.year = parseInt(body.year);
    if (body.color !== undefined) updateData.color = body.color.trim();
    if (body.license_plate !== undefined) updateData.license_plate = body.license_plate.toUpperCase().trim();
    if (body.current_mileage !== undefined) updateData.current_mileage = parseInt(body.current_mileage);
    if (body.vehicle_type !== undefined) updateData.vehicle_type = body.vehicle_type;
    if (body.seating_capacity !== undefined) updateData.seating_capacity = parseInt(body.seating_capacity);
    if (body.fuel_capacity_liters !== undefined) updateData.fuel_capacity_liters = body.fuel_capacity_liters ? parseInt(body.fuel_capacity_liters) : null;
    if (body.renavam_number !== undefined) updateData.renavam_number = body.renavam_number;
    if (body.is_available !== undefined) updateData.is_available = body.is_available;
    if (body.is_rental !== undefined) updateData.is_rental = body.is_rental;
    if (body.rental_company !== undefined) updateData.rental_company = body.rental_company;
    if (body.rental_contact_info !== undefined) updateData.rental_contact_info = body.rental_contact_info;
    if (body.rental_cost_per_day !== undefined) updateData.rental_cost_per_day = body.rental_cost_per_day ? parseFloat(body.rental_cost_per_day) : null;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Update vehicle
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', params.id)
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
        focal_point_x,
        focal_point_y,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error("Error updating vehicle:", updateError);
      return NextResponse.json(
        { error: "Failed to update vehicle" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vehicle: updatedVehicle,
      message: "Vehicle updated successfully"
    });

  } catch (error) {
    console.error("Fleet vehicle PATCH API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateFleetRequest(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { supabase } = authResult;

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" }, 
        { status: 401 }
      );
    }

    // Check user permissions - only global admins can delete vehicles
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('is_global_admin')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData?.is_global_admin) {
      return NextResponse.json(
        { error: "Access denied - global admin access required for deletion" },
        { status: 403 }
      );
    }

    // Check if vehicle has active trips or maintenance records
    const { data: activeRecords } = await supabase
      .from('trip_vehicles')
      .select('id')
      .eq('vehicle_id', params.id)
      .limit(1);

    if (activeRecords && activeRecords.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete vehicle with existing trip records. Archive instead." },
        { status: 400 }
      );
    }

    // Delete vehicle (this will cascade to related records due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error("Error deleting vehicle:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete vehicle" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Vehicle deleted successfully"
    });

  } catch (error) {
    console.error("Fleet vehicle DELETE API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}