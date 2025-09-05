"use client";

import React, { useState } from "react";
import { Target, RotateCcw } from "lucide-react";

interface FocalPoint {
  x: number;
  y: number;
}

interface FocalPointSelectorProps {
  imageUrl: string;
  initialFocalPoint?: FocalPoint;
  onFocalPointSet: (focalPoint: FocalPoint) => void;
}

export default function FocalPointSelector({ 
  imageUrl, 
  initialFocalPoint = { x: 50, y: 50 },
  onFocalPointSet 
}: FocalPointSelectorProps) {
  const [focalPoint, setFocalPoint] = useState<FocalPoint>(initialFocalPoint);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newFocalPoint = { 
      x: Math.round(x * 100) / 100, 
      y: Math.round(y * 100) / 100 
    };
    
    setFocalPoint(newFocalPoint);
    onFocalPointSet(newFocalPoint);
  };

  const resetToCenter = () => {
    const centerPoint = { x: 50, y: 50 };
    setFocalPoint(centerPoint);
    onFocalPointSet(centerPoint);
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Set Focus Point
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Click on the car's center to set the focal point. This will determine how the image is cropped in vehicle cards.
            </p>
          </div>
        </div>
      </div>

      {/* Image Selector */}
      <div className="relative">
        <div className="relative inline-block">
          <img
            src={imageUrl}
            onClick={handleImageClick}
            className="cursor-crosshair max-h-96 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl"
            style={{ maxWidth: '100%' }}
            alt="Click to set focal point"
          />
          
          {/* Focal point indicator */}
          <div
            className="absolute w-6 h-6 border-2 border-red-500 bg-red-500/20 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${focalPoint.x}%`,
              top: `${focalPoint.y}%`,
            }}
          >
            <div className="absolute inset-1 bg-red-500 rounded-full"></div>
          </div>
          
          {/* Crosshair lines */}
          <div
            className="absolute w-full h-0.5 bg-red-500/30 pointer-events-none"
            style={{ top: `${focalPoint.y}%` }}
          ></div>
          <div
            className="absolute h-full w-0.5 bg-red-500/30 pointer-events-none"
            style={{ left: `${focalPoint.x}%` }}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Focal point: {focalPoint.x.toFixed(1)}%, {focalPoint.y.toFixed(1)}%
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetToCenter}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Center
          </button>
          
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            {isPreviewMode ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* Preview */}
      {isPreviewMode && (
        <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Card Preview
          </h5>
          <div className="w-64 h-48 bg-gradient-to-br from-[#D4AF86] to-[#C19A6B] dark:from-[#2D5347] dark:to-[#1E3A2E] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={imageUrl}
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${focalPoint.x}% ${focalPoint.y}%`
              }}
              alt="Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}