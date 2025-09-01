"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Camera, Trash2, Star, StarOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleImageUploadProps {
  vehicleId?: string;
  currentImages?: string[];
  primaryImage?: string;
  onImagesChange?: (images: string[], primaryImage?: string) => void;
  onUpload?: (files: File[], setPrimary?: boolean) => Promise<void>;
  onDelete?: (imageUrl: string) => Promise<void>;
  onSetPrimary?: (imageUrl: string) => Promise<void>;
  maxImages?: number;
  disabled?: boolean;
  showGallery?: boolean;
}

export default function VehicleImageUpload({
  vehicleId,
  currentImages = [],
  primaryImage,
  onImagesChange,
  onUpload,
  onDelete,
  onSetPrimary,
  maxImages = 10,
  disabled = false,
  showGallery = true
}: VehicleImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = (files: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    const errors = [];
    
    if (currentImages.length + files.length > maxImages) {
      errors.push(`Maximum ${maxImages} images allowed`);
    }
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Use JPG, PNG, or WebP`);
      }
      
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large. Maximum size is 5MB`);
      }
    }
    
    return errors;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const errors = validateFiles(fileArray);
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setError(null);
    setPreviewFiles(fileArray);
    
    if (onImagesChange && !vehicleId) {
      // For new vehicles, just update the preview
      const imageUrls = fileArray.map(file => URL.createObjectURL(file));
      onImagesChange([...currentImages, ...imageUrls], primaryImage || imageUrls[0]);
    }
  }, [currentImages, primaryImage, maxImages, onImagesChange, vehicleId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const handleUpload = async (setPrimary = false) => {
    if (!onUpload || previewFiles.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      await onUpload(previewFiles, setPrimary);
      setPreviewFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!onDelete) return;
    
    try {
      await onDelete(imageUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleSetPrimary = async (imageUrl: string) => {
    if (!onSetPrimary) return;
    
    try {
      await onSetPrimary(imageUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to set primary image');
    }
  };

  const clearPreview = () => {
    setPreviewFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <Camera className="h-10 w-10 text-gray-400 mx-auto" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Drop vehicle images here or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              JPG, PNG, WebP up to 5MB each • Max {maxImages} images
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Preview Files */}
      {previewFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Ready to Upload ({previewFiles.length})
            </h4>
            <button
              onClick={clearPreview}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previewFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg" />
                <button
                  onClick={() => setPreviewFiles(files => files.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          
          {vehicleId && (
            <div className="flex gap-2">
              <button
                onClick={() => handleUpload(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Add to Gallery'}
              </button>
              <button
                onClick={() => handleUpload(true)}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-emerald-600 bg-white border border-emerald-600 rounded-md hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Set as Primary'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Current Images Gallery */}
      {showGallery && currentImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Vehicle Images ({currentImages.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentImages.map((imageUrl, index) => (
              <div key={imageUrl} className="relative group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Vehicle image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Primary indicator */}
                {imageUrl === primaryImage && (
                  <div className="absolute top-2 left-2 p-1 bg-yellow-500 text-white rounded-full">
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg" />
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {imageUrl !== primaryImage && onSetPrimary && (
                    <button
                      onClick={() => handleSetPrimary(imageUrl)}
                      className="p-1 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                      title="Set as primary"
                    >
                      <StarOff className="h-3 w-3" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => handleDeleteImage(imageUrl)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Delete image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}