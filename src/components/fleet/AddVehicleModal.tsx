"use client";

import React, { useState } from "react";
import { X, Car, Plus } from "lucide-react";
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
  created_at: string;
  updated_at: string;
}

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vehicle: Vehicle) => void;
}

export default function AddVehicleModal({ isOpen, onClose, onAdd }: AddVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vehicleImages, setVehicleImages] = useState<File[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    model: "",
    year: new Date().getFullYear(),
    color: "",
    license_plate: "",
    current_mileage: 0,
    vehicle_type: "",
    seating_capacity: 5,
    fuel_capacity_liters: 50,
    renavam_number: "",
    notes: "",
    is_available: true,
  });

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.model.trim()) {
      newErrors.model = "Model is required";
    }

    if (!formData.color.trim()) {
      newErrors.color = "Color is required";
    }

    if (!formData.license_plate.trim()) {
      newErrors.license_plate = "License plate is required";
    } else if (!/^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(formData.license_plate.replace(/\s/g, ''))) {
      newErrors.license_plate = "Invalid Brazilian license plate format";
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = "Invalid year";
    }

    if (formData.current_mileage < 0) {
      newErrors.current_mileage = "Mileage cannot be negative";
    }

    if (formData.seating_capacity < 1 || formData.seating_capacity > 50) {
      newErrors.seating_capacity = "Seating capacity must be between 1 and 50";
    }

    if (!formData.vehicle_type) {
      newErrors.vehicle_type = "Vehicle type is required";
    }

    if (formData.renavam_number && !/^\d{9,11}$/.test(formData.renavam_number)) {
      newErrors.renavam_number = "RENAVAM must be 9-11 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // First create the vehicle
      const response = await fetch("/api/fleet/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add vehicle");
      }

      const result = await response.json();
      const newVehicle = result.vehicle;

      // Upload images if any
      if (vehicleImages.length > 0) {
        try {
          const imageFormData = new FormData();
          vehicleImages.forEach(image => {
            imageFormData.append('images', image);
          });
          imageFormData.append('set_primary', 'true');

          const imageResponse = await fetch(`/api/fleet/vehicles/${newVehicle.id}/upload-image`, {
            method: "POST",
            credentials: "include",
            body: imageFormData,
          });

          if (imageResponse.ok) {
            const imageResult = await imageResponse.json();
            // Update vehicle with image URLs
            newVehicle.image_url = imageResult.data.primaryImage;
            newVehicle.gallery_images = imageResult.data.galleryImages;
          }
        } catch (imageError) {
          console.warn("Image upload failed:", imageError);
          // Don't fail the whole operation for image upload issues
        }
      }

      onAdd(newVehicle);
      
      // Reset form
      setFormData({
        model: "",
        year: new Date().getFullYear(),
        color: "",
        license_plate: "",
        current_mileage: 0,
        vehicle_type: "",
        seating_capacity: 5,
        fuel_capacity_liters: 50,
        renavam_number: "",
        notes: "",
        is_available: true,
      });
      setVehicleImages([]);
      setPrimaryImageIndex(0);
      
    } catch (error) {
      console.error("Error adding vehicle:", error);
      setErrors({ submit: error instanceof Error ? error.message : "Failed to add vehicle" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-[#09261d] text-white dark:text-golden-400 px-6 py-4 rounded-t-lg border-b border-emerald-700 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Add New Vehicle</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white dark:text-golden-400 hover:text-gray-200 dark:hover:text-golden-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.model ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="e.g., Honda Civic, Toyota Corolla"
                />
                {errors.model && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.model}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange("year", parseInt(e.target.value))}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.year ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.year}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color *
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.color ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="e.g., White, Black, Silver"
                />
                {errors.color && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.color}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  License Plate *
                </label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => handleChange("license_plate", e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.license_plate ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="e.g., ABC-1234 or ABC1D34"
                />
                {errors.license_plate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.license_plate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RENAVAM Number
                </label>
                <input
                  type="text"
                  value={formData.renavam_number}
                  onChange={(e) => handleChange("renavam_number", e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.renavam_number ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter RENAVAM number"
                  maxLength={11}
                />
                {errors.renavam_number && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.renavam_number}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
                Specifications
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vehicle Type *
                </label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => handleChange("vehicle_type", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.vehicle_type ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <option value="">Select vehicle type</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="pickup">Pickup Truck</option>
                  <option value="van">Van</option>
                  <option value="bus">Bus</option>
                  <option value="truck">Truck</option>
                </select>
                {errors.vehicle_type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vehicle_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seating Capacity *
                </label>
                <input
                  type="number"
                  value={formData.seating_capacity}
                  onChange={(e) => handleChange("seating_capacity", parseInt(e.target.value))}
                  min="1"
                  max="50"
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.seating_capacity ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.seating_capacity && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.seating_capacity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Mileage (km) *
                </label>
                <input
                  type="number"
                  value={formData.current_mileage}
                  onChange={(e) => handleChange("current_mileage", parseInt(e.target.value))}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.current_mileage ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.current_mileage && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.current_mileage}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fuel Tank Capacity (L)
                </label>
                <input
                  type="number"
                  value={formData.fuel_capacity_liters}
                  onChange={(e) => handleChange("fuel_capacity_liters", parseInt(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is_available"
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => handleChange("is_available", e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded dark:bg-[#1a1a1a]"
                />
                <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Currently Available for Use
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Add any additional information about this vehicle..."
            />
          </div>

          {/* Vehicle Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle Photos
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files) {
                    setVehicleImages(Array.from(e.target.files));
                  }
                }}
                className="hidden"
                id="vehicle-images"
                disabled={loading}
              />
              <label 
                htmlFor="vehicle-images" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Car className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Upload vehicle photos
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    JPG, PNG, WebP up to 5MB each
                  </p>
                </div>
              </label>
              
              {vehicleImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {vehicleImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setVehicleImages(files => files.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Adding..." : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}