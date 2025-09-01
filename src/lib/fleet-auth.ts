import { NextRequest, NextResponse } from "next/server";
import { verify } from 'jsonwebtoken';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface FleetAuthResult {
  userId: string;
  userData: {
    company_id: string;
    role: string;
    is_global_admin: boolean;
  };
  supabase: any;
}

export async function authenticateFleetRequest(request: NextRequest): Promise<FleetAuthResult | NextResponse> {
  try {
    const supabase = createServerSupabaseClient();

    // Get the auth token from httpOnly cookie
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: "Authentication required" }, 
        { status: 401 }
      );
    }

    // Verify the JWT token
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
    let decoded: any;
    
    try {
      decoded = verify(authToken, secret);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const userId = decoded.sub || decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 401 }
      );
    }

    // Check user permissions - only Wolthers staff and car managers can access fleet
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('company_id, role, is_global_admin')
      .eq('id', userId)
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

    return {
      userId,
      userData,
      supabase
    };

  } catch (error) {
    console.error("Fleet authentication error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function authenticateFleetRequestWithGlobalAdminCheck(request: NextRequest): Promise<FleetAuthResult | NextResponse> {
  const result = await authenticateFleetRequest(request);
  
  if (result instanceof NextResponse) {
    return result;
  }

  // Additional check for global admin only operations (like deletion)
  if (!result.userData.is_global_admin) {
    return NextResponse.json(
      { error: "Access denied - global admin access required" },
      { status: 403 }
    );
  }

  return result;
}