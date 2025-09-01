"use client";

import React from "react";
import { 
  Car, 
  Calendar, 
  Gauge, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Shield,
  Wrench,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  current_mileage: number;
  is_available: boolean;
  last_maintenance_date: string | null;
  last_maintenance_mileage: number | null;
  insurance_expiry_date: string | null;
  vehicle_type: string;
  seating_capacity: number;
  notes: string | null;
  image_url: string | null;
  gallery_images: string[] | null;
  created_at: string;
  updated_at: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
}

export default function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  // Calculate maintenance status
  const getMaintenanceStatus = () => {
    if (!vehicle.last_maintenance_date && !vehicle.last_maintenance_mileage) {
      return { status: "overdue", label: "Never serviced", color: "text-red-600" };
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const lastMaintenance = vehicle.last_maintenance_date ? new Date(vehicle.last_maintenance_date) : null;
    const mileageDue = vehicle.last_maintenance_mileage ? 
      (vehicle.current_mileage - vehicle.last_maintenance_mileage) > 10000 : false;
    const dateDue = lastMaintenance ? lastMaintenance < sixMonthsAgo : true;
    
    if (mileageDue || dateDue) {
      return { status: "due", label: "Service due", color: "text-orange-600" };
    }
    
    return { status: "good", label: "Up to date", color: "text-green-600" };
  };

  // Calculate insurance status
  const getInsuranceStatus = () => {
    if (!vehicle.insurance_expiry_date) {
      return { status: "unknown", label: "Not set", color: "text-gray-500" };
    }

    const expiryDate = new Date(vehicle.insurance_expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    if (expiryDate < new Date()) {
      return { status: "expired", label: "Expired", color: "text-red-600" };
    }
    
    if (expiryDate <= sevenDaysFromNow) {
      return { status: "urgent", label: "Expires soon", color: "text-red-600" };
    }
    
    if (expiryDate <= thirtyDaysFromNow) {
      return { status: "warning", label: "Expires this month", color: "text-orange-600" };
    }
    
    return { status: "good", label: "Active", color: "text-green-600" };
  };

  const maintenanceStatus = getMaintenanceStatus();
  const insuranceStatus = getInsuranceStatus();

  // Format numbers
  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('pt-BR').format(mileage);
  };

  // Get vehicle status color and icon
  const getStatusDisplay = () => {
    if (vehicle.is_available) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        label: "Available",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30"
      };
    } else {
      return {
        icon: <Clock className="h-4 w-4" />,
        label: "In Use",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30"
      };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      style={{ height: "420px" }} // Fixed height like TripCard
    >
      {/* Vehicle Image */}
      <div className="h-48 bg-gradient-to-br from-[#D4AF86] to-[#C19A6B] dark:from-[#2D5347] dark:to-[#1E3A2E] flex items-center justify-center relative overflow-hidden">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.model} - ${vehicle.license_plate}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <Car className="h-16 w-16 text-[#8B6F47] dark:text-[#A0B3A8]" />
        )}
        
        {/* Status Badge */}
        <div className={cn(
          "absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          statusDisplay.bgColor,
          statusDisplay.color
        )}>
          {statusDisplay.icon}
          {statusDisplay.label}
        </div>
        
        {/* Year Badge */}
        <div className="absolute top-3 left-3 bg-black/20 dark:bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
          {vehicle.year}
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        {/* Vehicle Info */}
        <div className="space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
              {vehicle.model}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {vehicle.color} • {vehicle.license_plate}
            </p>
          </div>

          {/* Mileage */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Gauge className="h-4 w-4" />
            <span>{formatMileage(vehicle.current_mileage)} km</span>
            {vehicle.seating_capacity && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{vehicle.seating_capacity} seats</span>
              </>
            )}
          </div>

          {/* Vehicle Type */}
          {vehicle.vehicle_type && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span className="capitalize">{vehicle.vehicle_type.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="space-y-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          {/* Maintenance Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Maintenance</span>
            </div>
            <span className={cn("font-medium", maintenanceStatus.color)}>
              {maintenanceStatus.label}
            </span>
          </div>

          {/* Insurance Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Insurance</span>
            </div>
            <span className={cn("font-medium", insuranceStatus.color)}>
              {insuranceStatus.label}
            </span>
          </div>

          {/* Last Maintenance Date */}
          {vehicle.last_maintenance_date && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Last Service</span>
              </div>
              <span className="text-gray-500 dark:text-gray-500 text-xs">
                {new Date(vehicle.last_maintenance_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Action Hint */}
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-center">
            Click for detailed view
          </div>
        </div>
      </div>
    </div>
  );
}