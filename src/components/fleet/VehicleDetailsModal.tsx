"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Car,
  Calendar,
  Gauge,
  Wrench,
  Shield,
  FileText,
  BarChart3,
  Settings,
  Users,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import VehicleMaintenanceTab from "./VehicleMaintenanceTab";
import VehicleUsageTab from "./VehicleUsageTab";
import VehicleInsuranceTab from "./VehicleInsuranceTab";
import VehicleMileageChart from "./VehicleMileageChart";
import VehicleImageUpload from "./VehicleImageUpload";

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
  focal_point_x?: number | null;
  focal_point_y?: number | null;
  created_at: string;
  updated_at: string;
}

interface VehicleDetailsModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (vehicle: Vehicle) => void;
}

type TabType = "overview" | "usage" | "maintenance" | "insurance" | "analytics" | "documents";

export default function VehicleDetailsModal({
  vehicle,
  isOpen,
  onClose,
  onUpdate,
}: VehicleDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle>(vehicle);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle>(vehicle);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: Car },
    { id: "usage", label: "Usage Log", icon: Clock },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "insurance", label: "Insurance", icon: Shield },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "documents", label: "Documents", icon: FileText },
  ] as const;

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('pt-BR').format(mileage);
  };

  const getStatusDisplay = () => {
    if (currentVehicle.is_available) {
      return {
        label: "Available",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
      };
    } else {
      return {
        label: "In Use",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
      };
    }
  };

  const statusDisplay = getStatusDisplay();

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editedVehicle),
      });

      if (!response.ok) {
        throw new Error("Failed to update vehicle");
      }

      const updatedVehicle = await response.json();
      onUpdate(updatedVehicle.vehicle);
      setCurrentVehicle(updatedVehicle.vehicle);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      // TODO: Add proper error handling/toast notification
    }
  };

  const handleImageUpload = async (files: File[], setPrimary?: boolean, focalPoints?: Array<{x: number, y: number}>) => {
    if (!files.length) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      if (setPrimary) {
        formData.append('set_primary', 'true');
      }
      if (focalPoints && focalPoints.length > 0) {
        formData.append('focal_points', JSON.stringify(focalPoints));
      }

      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      const updatedVehicle = {
        ...currentVehicle,
        image_url: result.data.primaryImage,
        gallery_images: result.data.galleryImages,
        focal_point_x: result.data.focalPointX,
        focal_point_y: result.data.focalPointY,
      };
      
      setCurrentVehicle(updatedVehicle);
      onUpdate(updatedVehicle);
    } catch (error) {
      console.error('Error uploading images:', error);
      // TODO: Add proper error handling/toast notification
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (imageUrl: string) => {
    try {
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}/upload-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      const result = await response.json();
      const updatedVehicle = {
        ...currentVehicle,
        image_url: result.data.primaryImage,
        gallery_images: result.data.galleryImages,
        focal_point_x: result.data.focalPointX,
        focal_point_y: result.data.focalPointY,
      };
      
      setCurrentVehicle(updatedVehicle);
      onUpdate(updatedVehicle);
    } catch (error) {
      console.error('Error deleting image:', error);
      // TODO: Add proper error handling/toast notification
    }
  };

  const handleSetPrimary = async (imageUrl: string) => {
    try {
      const updatedVehicle = {
        ...currentVehicle,
        image_url: imageUrl,
      };
      
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ image_url: imageUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to set primary image");
      }

      setCurrentVehicle(updatedVehicle);
      onUpdate(updatedVehicle);
    } catch (error) {
      console.error('Error setting primary image:', error);
      // TODO: Add proper error handling/toast notification
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-start md:items-center justify-center z-50 p-0 sm:p-2 md:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl max-w-[95vw] xl:max-w-[90vw] max-h-[95vh] min-h-[60vh] flex flex-col border border-pearl-200 dark:border-[#2a2a2a]">
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-[#09261d] text-white px-6 py-4 rounded-t-lg border-b border-pearl-200 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white dark:text-white">
                {currentVehicle.model} ({currentVehicle.year})
              </h2>
              <p className="text-white/90 dark:text-white text-sm">
                {currentVehicle.color} • {currentVehicle.license_plate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
                statusDisplay.bgColor,
                statusDisplay.color
              )}>
                {statusDisplay.label}
              </div>
              {!isEditing && activeTab === "overview" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[#333333] dark:text-golden-400 hover:text-[#006D5B] dark:hover:text-golden-300 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/90 dark:text-white hover:text-white dark:hover:text-white/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4 bg-white/10 dark:bg-black/20 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-white dark:bg-emerald-800/80 text-[#333333] dark:text-golden-400"
                      : "text-[#333333]/70 dark:text-golden-400/70 hover:text-[#333333] dark:hover:text-golden-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-6">
                  {/* Top row - Basic Info and Specifications cards side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
                        Basic Information
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Model
                        </label>
                        <input
                          type="text"
                          value={editedVehicle.model}
                          onChange={(e) => setEditedVehicle({...editedVehicle, model: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Year
                        </label>
                        <input
                          type="number"
                          value={editedVehicle.year}
                          onChange={(e) => setEditedVehicle({...editedVehicle, year: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Color
                        </label>
                        <input
                          type="text"
                          value={editedVehicle.color}
                          onChange={(e) => setEditedVehicle({...editedVehicle, color: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          License Plate
                        </label>
                        <input
                          type="text"
                          value={editedVehicle.license_plate}
                          onChange={(e) => setEditedVehicle({...editedVehicle, license_plate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
                        Specifications
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Mileage (km)
                        </label>
                        <input
                          type="number"
                          value={editedVehicle.current_mileage}
                          onChange={(e) => setEditedVehicle({...editedVehicle, current_mileage: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Seating Capacity
                        </label>
                        <input
                          type="number"
                          value={editedVehicle.seating_capacity}
                          onChange={(e) => setEditedVehicle({...editedVehicle, seating_capacity: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Vehicle Type
                        </label>
                        <select
                          value={editedVehicle.vehicle_type}
                          onChange={(e) => setEditedVehicle({...editedVehicle, vehicle_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">Select type</option>
                          <option value="sedan">Sedan</option>
                          <option value="suv">SUV</option>
                          <option value="hatchback">Hatchback</option>
                          <option value="pickup">Pickup</option>
                          <option value="van">Van</option>
                          <option value="bus">Bus</option>
                          <option value="truck">Truck</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="is_available"
                          type="checkbox"
                          checked={editedVehicle.is_available}
                          onChange={(e) => setEditedVehicle({...editedVehicle, is_available: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-[#2a2a2a] rounded dark:bg-[#1a1a1a]"
                        />
                        <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Currently Available
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes section - full width below the cards */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
                      Additional Notes
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes
                      </label>
                      <textarea
                        rows={6}
                        value={editedVehicle.notes || ""}
                        onChange={(e) => setEditedVehicle({...editedVehicle, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Add any additional notes about this vehicle..."
                      />
                    </div>
                  </div>

                  {/* Vehicle Images section - full width */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
                      Vehicle Images
                    </h3>
                    
                    <VehicleImageUpload
                      vehicleId={vehicle.id}
                      currentImages={currentVehicle.gallery_images || []}
                      primaryImage={currentVehicle.image_url || undefined}
                      onUpload={handleImageUpload}
                      onDelete={handleImageDelete}
                      onSetPrimary={handleSetPrimary}
                      maxImages={10}
                      disabled={uploading}
                      showGallery={true}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-pearl-200 dark:border-[#2a2a2a]">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedVehicle(vehicle);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-[#2a2a2a] rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top row - Basic Info and Status Info cards side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Car className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Model</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {currentVehicle.model} ({currentVehicle.year})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-gray-400" style={{ backgroundColor: currentVehicle.color?.toLowerCase() }} />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Color & Plate</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {currentVehicle.color} • {currentVehicle.license_plate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Gauge className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Current Mileage</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatMileage(currentVehicle.current_mileage)} km
                            </p>
                          </div>
                        </div>
                        {currentVehicle.seating_capacity && (
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Seating Capacity</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {currentVehicle.seating_capacity} seats
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Information Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
                        Status Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Availability</p>
                            <div className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1",
                              statusDisplay.bgColor,
                              statusDisplay.color
                            )}>
                              {statusDisplay.label}
                            </div>
                          </div>
                        </div>
                        {currentVehicle.vehicle_type && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle Type</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                {currentVehicle.vehicle_type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        )}
                        {currentVehicle.last_maintenance_date && (
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Last Service</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {new Date(currentVehicle.last_maintenance_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Card - full width */}
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
                      Notes
                    </h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {currentVehicle.notes ? (
                        <p className="whitespace-pre-wrap">{currentVehicle.notes}</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                          No notes available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Images Card - full width */}
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
                      Vehicle Images
                    </h3>
                    
                    {currentVehicle.gallery_images && currentVehicle.gallery_images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {currentVehicle.gallery_images.map((imageUrl, index) => (
                          <div key={imageUrl} className="relative group">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={`Vehicle image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Primary indicator */}
                            {imageUrl === currentVehicle.image_url && (
                              <div className="absolute top-2 left-2 p-1 bg-yellow-500 text-white rounded-full">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 italic">
                          No vehicle images available
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                          Click the settings gear above to add vehicle photos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "usage" && <VehicleUsageTab vehicle={vehicle} />}
          {activeTab === "maintenance" && <VehicleMaintenanceTab vehicle={vehicle} />}
          {activeTab === "insurance" && <VehicleInsuranceTab vehicle={vehicle} />}
          {activeTab === "analytics" && <VehicleMileageChart vehicle={vehicle} />}
          {activeTab === "documents" && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Documents Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Document management features will be available in a future update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
