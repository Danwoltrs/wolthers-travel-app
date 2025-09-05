import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface VehicleAvailabilityRequest {
  startDate: string;
  endDate: string;
  startingPoint?: string;
  participantCount?: number;
  requirements?: {
    seatingCapacity?: number;
    cargoSpace?: boolean;
    terrainCapability?: string[];
    fuelType?: string;
    specialEquipment?: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
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

    const body: VehicleAvailabilityRequest = await request.json();
    const { startDate, endDate, startingPoint, participantCount = 1, requirements = {} } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    // Get all vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id,
        model,
        year,
        color,
        license_plate,
        vehicle_type,
        seating_capacity,
        fuel_capacity_liters,
        is_available,
        is_rental,
        rental_company,
        rental_cost_per_day,
        base_location,
        is_suitable_for_terrain,
        availability_status
      `)
      .eq('is_available', true)
      .eq('availability_status', 'available');

    if (vehiclesError) {
      console.error("Error fetching vehicles:", vehiclesError);
      return NextResponse.json(
        { error: "Failed to fetch vehicles" },
        { status: 500 }
      );
    }

    // Get existing vehicle assignments that conflict with requested dates
    const { data: assignments, error: assignmentsError } = await supabase
      .from('trip_vehicles')
      .select('vehicle_id, start_date, end_date')
      .not('vehicle_id', 'is', null)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .neq('status', 'cancelled');

    if (assignmentsError) {
      console.error("Error fetching vehicle assignments:", assignmentsError);
      return NextResponse.json(
        { error: "Failed to check vehicle availability" },
        { status: 500 }
      );
    }

    // Create set of unavailable vehicle IDs
    const unavailableVehicleIds = new Set(
      assignments?.map(assignment => assignment.vehicle_id) || []
    );

    // Filter available vehicles
    const availableVehicles = (vehicles || []).filter(vehicle => 
      !unavailableVehicleIds.has(vehicle.id)
    );

    // Smart vehicle suggestions based on starting point and requirements
    const scoredVehicles = availableVehicles.map(vehicle => {
      let score = 0;
      const suggestions: string[] = [];

      // Location matching bonus
      if (startingPoint && vehicle.base_location === startingPoint) {
        score += 30;
        suggestions.push(`Located in ${startingPoint} - no transfer needed`);
      } else if (startingPoint === 'uberlandia') {
        // Uberlândia typically needs rental cars
        if (vehicle.is_rental) {
          score += 20;
          suggestions.push('Rental option available for Uberlândia trips');
        } else {
          score -= 10;
          suggestions.push('Company vehicle may require transfer to Uberlândia');
        }
      }

      // Seating capacity matching
      if (requirements.seatingCapacity && vehicle.seating_capacity) {
        if (vehicle.seating_capacity >= requirements.seatingCapacity) {
          score += 15;
          suggestions.push(`Seats ${vehicle.seating_capacity} people`);
        } else {
          score -= 20;
          suggestions.push(`Only seats ${vehicle.seating_capacity} - insufficient for ${requirements.seatingCapacity} participants`);
        }
      } else if (participantCount > 1 && vehicle.seating_capacity) {
        if (vehicle.seating_capacity >= participantCount) {
          score += 10;
          suggestions.push(`Suitable for ${participantCount} participants`);
        } else {
          score -= 15;
          suggestions.push(`Insufficient seating for ${participantCount} participants`);
        }
      }

      // Terrain suitability
      if (requirements.terrainCapability && vehicle.is_suitable_for_terrain) {
        const terrainSuitability = vehicle.is_suitable_for_terrain as any;
        requirements.terrainCapability.forEach(terrain => {
          if (terrainSuitability[terrain]) {
            score += 10;
            suggestions.push(`Suitable for ${terrain} terrain`);
          } else {
            score -= 5;
            suggestions.push(`Not ideal for ${terrain} terrain`);
          }
        });
      }

      // Port area suitability for Santos
      if (startingPoint === 'santos' && vehicle.is_suitable_for_terrain) {
        const terrainSuitability = vehicle.is_suitable_for_terrain as any;
        if (terrainSuitability.port) {
          score += 20;
          suggestions.push('Excellent for port area operations');
        }
      }

      // Vehicle type preferences
      const suitabilityRating = getSuitabilityRating(startingPoint, vehicle);
      score += suitabilityRating.score;
      suggestions.push(...suitabilityRating.reasons);

      return {
        ...vehicle,
        availabilityScore: Math.max(0, score),
        suggestions,
        recommendationLevel: getRecommendationLevel(score),
        estimatedTransferCost: getEstimatedTransferCost(startingPoint, vehicle.base_location),
        isRecommended: score >= 20
      };
    });

    // Sort by availability score (highest first)
    scoredVehicles.sort((a, b) => b.availabilityScore - a.availabilityScore);

    // Generate rental car suggestions for scenarios where company vehicles aren't ideal
    const rentalSuggestions = generateRentalSuggestions(startingPoint, requirements, participantCount);

    return NextResponse.json({
      success: true,
      availableVehicles: scoredVehicles,
      rentalSuggestions,
      searchCriteria: {
        startDate,
        endDate,
        startingPoint,
        participantCount,
        requirements
      },
      summary: {
        totalAvailable: scoredVehicles.length,
        recommended: scoredVehicles.filter(v => v.isRecommended).length,
        requiresRental: scoredVehicles.filter(v => v.isRecommended).length === 0
      }
    });

  } catch (error) {
    console.error("Vehicle availability API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getSuitabilityRating(startingPoint: string | undefined, vehicle: any) {
  const rating = { score: 0, reasons: [] as string[] };

  switch (startingPoint) {
    case 'santos':
      if (vehicle.vehicle_type === 'SUV' || vehicle.vehicle_type === 'Pickup') {
        rating.score += 15;
        rating.reasons.push('SUV/Pickup ideal for port area logistics');
      }
      if (vehicle.fuel_capacity_liters && vehicle.fuel_capacity_liters > 50) {
        rating.score += 5;
        rating.reasons.push('Good fuel capacity for port operations');
      }
      break;

    case 'cerrado':
      if (vehicle.vehicle_type === 'SUV' || vehicle.vehicle_type === '4WD') {
        rating.score += 20;
        rating.reasons.push('SUV/4WD excellent for rural Cerrado terrain');
      } else if (vehicle.vehicle_type === 'Sedan') {
        rating.score -= 10;
        rating.reasons.push('Sedan may struggle with rural roads');
      }
      break;

    case 'uberlandia':
      if (vehicle.is_rental) {
        rating.score += 25;
        rating.reasons.push('Rental car recommended for fly-in trips to Uberlândia');
      } else {
        rating.score -= 15;
        rating.reasons.push('Company vehicle transfer to Uberlândia is costly and time-consuming');
      }
      break;

    case 'sao_paulo':
      if (vehicle.vehicle_type === 'Sedan' || vehicle.vehicle_type === 'Executive') {
        rating.score += 15;
        rating.reasons.push('Sedan/Executive ideal for São Paulo metropolitan travel');
      }
      if (vehicle.fuel_capacity_liters && vehicle.fuel_capacity_liters < 60) {
        rating.score += 5;
        rating.reasons.push('Efficient fuel consumption for city driving');
      }
      break;

    default:
      rating.score += 0;
      rating.reasons.push('General purpose vehicle');
  }

  return rating;
}

function getRecommendationLevel(score: number): 'highly_recommended' | 'recommended' | 'suitable' | 'not_ideal' {
  if (score >= 40) return 'highly_recommended';
  if (score >= 20) return 'recommended'; 
  if (score >= 0) return 'suitable';
  return 'not_ideal';
}

function getEstimatedTransferCost(startingPoint: string | undefined, vehicleLocation: string | undefined): number | null {
  if (!startingPoint || !vehicleLocation || startingPoint === vehicleLocation) {
    return null;
  }

  // Estimated transfer costs in USD (rough estimates)
  const transferCosts: Record<string, Record<string, number>> = {
    'santos': {
      'sao_paulo': 150,
      'cerrado': 800,
      'uberlandia': 900,
      'other': 400
    },
    'sao_paulo': {
      'santos': 150,
      'cerrado': 750,
      'uberlandia': 850,
      'other': 350
    },
    'cerrado': {
      'santos': 800,
      'sao_paulo': 750,
      'uberlandia': 200,
      'other': 500
    },
    'uberlandia': {
      'santos': 900,
      'sao_paulo': 850,
      'cerrado': 200,
      'other': 450
    }
  };

  return transferCosts[startingPoint]?.[vehicleLocation] || 500;
}

function generateRentalSuggestions(
  startingPoint: string | undefined, 
  requirements: any, 
  participantCount: number
) {
  const suggestions = [];

  if (startingPoint === 'uberlandia') {
    suggestions.push({
      type: 'rental_recommendation',
      location: 'Uberlândia Airport',
      reason: 'Fly to Uberlândia and rent car at airport for maximum efficiency',
      recommendedVehicles: [
        {
          category: participantCount <= 4 ? 'Compact SUV' : 'Full-size SUV',
          estimatedCost: participantCount <= 4 ? 180 : 280,
          currency: 'BRL',
          period: 'per day',
          features: ['GPS', 'Air conditioning', 'Insurance included']
        }
      ]
    });
  }

  if (startingPoint === 'cerrado') {
    suggestions.push({
      type: 'rental_recommendation', 
      location: 'Local rental in Cerrado region',
      reason: '4WD rental recommended for rural Cerrado terrain',
      recommendedVehicles: [
        {
          category: '4WD Pickup or SUV',
          estimatedCost: 320,
          currency: 'BRL',
          period: 'per day',
          features: ['4WD capability', 'High ground clearance', 'Rural terrain suitable']
        }
      ]
    });
  }

  return suggestions;
}