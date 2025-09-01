"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import FleetDashboard from "@/components/fleet/FleetDashboard";
import { redirect } from "next/navigation";

export default function FleetPage() {
  const { user, isLoading } = useAuth();

  // Check if user has access to fleet management
  const hasFleetAccess = React.useMemo(() => {
    if (!user) return false;
    
    const isWolthersStaff = 
      user.isGlobalAdmin || 
      user.companyId === "840783f4-866d-4bdb-9b5d-5d0facf62db0";
    
    // Allow global admins, wolthers staff, and car managers
    return isWolthersStaff || user.role === "car_manager";
  }, [user]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  // Redirect if no access
  if (!user) {
    redirect("/");
  }

  if (!hasFleetAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-3-5a6 6 0 1112 0v3H6v-3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access the fleet management system. 
            Please contact your administrator for access.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#EDE4D3] dark:from-[#2C2C2C] dark:to-[#1a1a1a]">
      {/* Header spacing for fixed navigation */}
      <div className="pt-40 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-[#F7B731]">
              Fleet Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Comprehensive vehicle tracking, maintenance, and analytics for Wolthers & Associates fleet
            </p>
          </div>
          
          {/* Fleet Dashboard Component */}
          <FleetDashboard />
        </div>
      </div>
    </div>
  );
}