import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { verify } from 'jsonwebtoken';

interface VehicleAssignmentRequest {
  tripId: string;
  assignments: {
    vehicleId?: string; // null for rental requests
    driverId?: string;
    assignmentType: 'company_vehicle' | 'rental_request' | 'rental_assigned';
    startDate: string;
    endDate: string;
    assignedParticipants: string[];
    
    // Rental-specific fields
    rentalCompany?: string;
    rentalContactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
    };
    rentalCostPerDay?: number;
    rentalLocation?: string;
    rentalPickupTime?: string;
    rentalReturnTime?: string;
    
    // Additional details
    vehicleRequirements?: {
      seatingCapacity?: number;
      cargoSpace?: boolean;
      terrainCapability?: string[];
      fuelType?: string;
      specialEquipment?: string[];
    };
    notes?: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify token and get user
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
    let user: any = null;
    
    try {
      const decoded = verify(token, secret) as any;
      const supabase = createSupabaseServiceClient();
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();
      
      if (userData) {
        user = userData;
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    const supabase = createSupabaseServiceClient();

    const body: VehicleAssignmentRequest = await request.json();
    const { tripId, assignments } = body;

    if (!tripId || !assignments || assignments.length === 0) {
      return NextResponse.json(
        { error: "Trip ID and assignments are required" },
        { status: 400 }
      );
    }

    // Verify trip exists and user has permission
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, created_by, status')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    // Validate assignments before inserting
    const validationErrors = await validateAssignments(supabase, assignments);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Remove existing assignments for this trip
    const { error: deleteError } = await supabase
      .from('trip_vehicles')
      .delete()
      .eq('trip_id', tripId);

    if (deleteError) {
      console.error("Error removing existing assignments:", deleteError);
      return NextResponse.json(
        { error: "Failed to update vehicle assignments" },
        { status: 500 }
      );
    }

    // Insert new assignments
    const assignmentRecords = assignments.map(assignment => ({
      trip_id: tripId,
      vehicle_id: assignment.vehicleId || null,
      driver_id: assignment.driverId || null,
      assignment_type: assignment.assignmentType,
      start_date: assignment.startDate,
      end_date: assignment.endDate,
      assigned_participants: assignment.assignedParticipants,
      rental_company: assignment.rentalCompany || null,
      rental_contact_info: assignment.rentalContactInfo || null,
      rental_cost_per_day: assignment.rentalCostPerDay || null,
      rental_location: assignment.rentalLocation || null,
      rental_pickup_time: assignment.rentalPickupTime || null,
      rental_return_time: assignment.rentalReturnTime || null,
      vehicle_requirements: assignment.vehicleRequirements || {},
      notes: assignment.notes || null,
      status: 'assigned'
    }));

    const { data: insertedAssignments, error: insertError } = await supabase
      .from('trip_vehicles')
      .insert(assignmentRecords)
      .select(`
        id,
        vehicle_id,
        driver_id,
        assignment_type,
        start_date,
        end_date,
        assigned_participants,
        rental_company,
        rental_contact_info,
        rental_cost_per_day,
        rental_location,
        vehicle_requirements,
        status,
        notes,
        vehicles (
          id,
          model,
          year,
          color,
          license_plate,
          vehicle_type,
          seating_capacity,
          base_location
        ),
        driver:users!driver_id (
          id,
          full_name,
          email
        )
      `);

    if (insertError) {
      console.error("Error inserting vehicle assignments:", insertError);
      return NextResponse.json(
        { error: "Failed to create vehicle assignments" },
        { status: 500 }
      );
    }

    // Update vehicle availability status for assigned company vehicles
    const assignedVehicleIds = assignments
      .filter(a => a.vehicleId && a.assignmentType === 'company_vehicle')
      .map(a => a.vehicleId!);

    if (assignedVehicleIds.length > 0) {
      const { error: updateVehicleError } = await supabase
        .from('vehicles')
        .update({ availability_status: 'reserved' })
        .in('id', assignedVehicleIds);

      if (updateVehicleError) {
        console.warn("Warning: Could not update vehicle availability status:", updateVehicleError);
      }
    }

    // Generate assignment summary
    const summary = generateAssignmentSummary(insertedAssignments || []);

    return NextResponse.json({
      success: true,
      assignments: insertedAssignments,
      summary,
      message: "Vehicle assignments created successfully"
    });

  } catch (error) {
    console.error("Vehicle assignment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get existing assignments for a trip
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: assignments, error } = await supabase
      .from('trip_vehicles')
      .select(`
        id,
        vehicle_id,
        driver_id,
        assignment_type,
        start_date,
        end_date,
        assigned_participants,
        rental_company,
        rental_contact_info,
        rental_cost_per_day,
        rental_location,
        rental_pickup_time,
        rental_return_time,
        vehicle_requirements,
        status,
        notes,
        created_at,
        vehicles (
          id,
          model,
          year,
          color,
          license_plate,
          vehicle_type,
          seating_capacity,
          base_location,
          is_rental
        ),
        driver:users!driver_id (
          id,
          full_name,
          email
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching vehicle assignments:", error);
      return NextResponse.json(
        { error: "Failed to fetch vehicle assignments" },
        { status: 500 }
      );
    }

    const summary = generateAssignmentSummary(assignments || []);

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
      summary
    });

  } catch (error) {
    console.error("Vehicle assignment GET API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function validateAssignments(supabase: any, assignments: any[]) {
  const errors = [];

  for (const [index, assignment] of assignments.entries()) {
    // Check if vehicle exists and is available (for company vehicles)
    if (assignment.vehicleId && assignment.assignmentType === 'company_vehicle') {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, is_available, availability_status')
        .eq('id', assignment.vehicleId)
        .single();

      if (vehicleError || !vehicle) {
        errors.push(`Assignment ${index + 1}: Vehicle not found`);
        continue;
      }

      if (!vehicle.is_available || vehicle.availability_status !== 'available') {
        errors.push(`Assignment ${index + 1}: Vehicle is not available`);
      }

      // Check for conflicting assignments
      const { data: conflicts, error: conflictError } = await supabase
        .from('trip_vehicles')
        .select('id')
        .eq('vehicle_id', assignment.vehicleId)
        .lte('start_date', assignment.endDate)
        .gte('end_date', assignment.startDate)
        .neq('status', 'cancelled');

      if (!conflictError && conflicts && conflicts.length > 0) {
        errors.push(`Assignment ${index + 1}: Vehicle has conflicting assignments`);
      }
    }

    // Check if driver exists (if specified)
    if (assignment.driverId) {
      const { data: driver, error: driverError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', assignment.driverId)
        .single();

      if (driverError || !driver) {
        errors.push(`Assignment ${index + 1}: Driver not found`);
      } else if (driver.role !== 'driver' && driver.role !== 'wolthers_staff') {
        errors.push(`Assignment ${index + 1}: User is not authorized to drive`);
      }
    }

    // Validate rental assignments
    if (assignment.assignmentType === 'rental_request') {
      if (!assignment.rentalLocation) {
        errors.push(`Assignment ${index + 1}: Rental location is required for rental requests`);
      }
      if (!assignment.vehicleRequirements || !assignment.vehicleRequirements.seatingCapacity) {
        errors.push(`Assignment ${index + 1}: Vehicle requirements needed for rental requests`);
      }
    }

    // Validate date format
    if (!isValidDate(assignment.startDate) || !isValidDate(assignment.endDate)) {
      errors.push(`Assignment ${index + 1}: Invalid date format`);
    } else if (new Date(assignment.startDate) >= new Date(assignment.endDate)) {
      errors.push(`Assignment ${index + 1}: Start date must be before end date`);
    }

    // Validate participant assignments
    if (!assignment.assignedParticipants || assignment.assignedParticipants.length === 0) {
      errors.push(`Assignment ${index + 1}: At least one participant must be assigned`);
    }
  }

  return errors;
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function generateAssignmentSummary(assignments: any[]) {
  return {
    totalAssignments: assignments.length,
    companyVehicles: assignments.filter(a => a.assignment_type === 'company_vehicle').length,
    rentalRequests: assignments.filter(a => a.assignment_type === 'rental_request').length,
    rentalAssigned: assignments.filter(a => a.assignment_type === 'rental_assigned').length,
    withDrivers: assignments.filter(a => a.driver_id).length,
    totalParticipants: assignments.reduce((sum, a) => sum + (a.assigned_participants?.length || 0), 0),
    estimatedRentalCosts: assignments
      .filter(a => a.rental_cost_per_day)
      .reduce((sum, a) => {
        const days = Math.ceil((new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) / (1000 * 60 * 60 * 24));
        return sum + (a.rental_cost_per_day * days);
      }, 0)
  };
}