/**
 * SupplierFolderRow Component
 * Individual supplier folder row in the Finder-style interface
 * Handles folder expansion, selection, and navigation
 */

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Users,
  Star,
  Wifi,
  WifiOff
} from 'lucide-react';
import { SupplierFolder } from '@/types/document-finder';
import { formatDate, formatFileSize } from '@/lib/utils';

interface SupplierFolderRowProps {
  folder: SupplierFolder;
  isSelected: boolean;
  onSelect: (multi?: boolean) => void;
  onNavigate: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  className?: string;
}

const SupplierFolderRow: React.FC<SupplierFolderRowProps> = ({
  folder,
  isSelected,
  onSelect,
  onNavigate,
  onContextMenu,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get supplier type icon
  const getSupplierTypeIcon = () => {
    switch (folder.supplierInfo?.supplierType) {
      case 'farm':
        return <MapPin className="w-4 h-4 text-green-600 dark:text-emerald-400" />;
      case 'cooperative':
        return <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'exporter':
        return <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Building2 className="w-4 h-4 text-latte-600 dark:text-gray-400" />;
    }
  };

  // Get relationship status indicator
  const getRelationshipStatusIndicator = () => {
    const status = folder.supplierInfo?.relationshipStatus;
    switch (status) {
      case 'active':
        return <Wifi className="w-3 h-3 text-green-500" title="Active relationship" />;
      case 'inactive':
        return <WifiOff className="w-3 h-3 text-gray-500" title="Inactive relationship" />;
      case 'pending':
        return <Calendar className="w-3 h-3 text-yellow-500" title="Pending relationship" />;
      case 'terminated':
        return <WifiOff className="w-3 h-3 text-red-500" title="Terminated relationship" />;
      default:
        return null;
    }
  };

  // Get quality grade badge
  const getQualityGradeBadge = () => {
    const grade = folder.supplierInfo?.qualityGrade;
    if (!grade) return null;

    const gradeConfigs = {
      specialty: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: Star },
      premium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: Star },
      commercial: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-700 dark:text-gray-300', icon: null }
    };

    const config = gradeConfigs[grade];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon && <config.icon className="w-3 h-3" />}
        {grade.charAt(0).toUpperCase() + grade.slice(1)}
      </span>
    );
  };

  // Format total size
  const formatTotalSize = () => {
    if (folder.totalSize === 0) return '--';
    return formatFileSize(folder.totalSize);
  };

  // Handle click with proper event handling
  const handleClick = (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      // Multi-select
      onSelect(true);
    } else {
      // Navigate to folder
      onNavigate();
    }
  };

  // Handle selection checkbox
  const handleSelectChange = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(event.shiftKey);
  };

  return (
    <div 
      className={`supplier-folder-row group relative ${isSelected ? 'bg-golden-200/50 dark:bg-emerald-700/30 border-l-4 border-sage-600 dark:border-emerald-400' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`folder-row flex items-center gap-3 px-6 py-3 hover:bg-golden-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 ${isSelected ? 'bg-golden-100/30 dark:bg-emerald-800/20' : ''}`}
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        {/* Name Column with Folder Icon and Details */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Selection Checkbox */}
          {(isHovered || isSelected) && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectChange}
              className="w-4 h-4 text-sage-600 dark:text-emerald-400 bg-white dark:bg-sage-700 border-gray-300 dark:border-gray-600 rounded focus:ring-sage-500 dark:focus:ring-emerald-400"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
            <Folder className="w-5 h-5 text-sage-500 dark:text-emerald-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-latte-800 dark:text-gray-200 truncate">
                {folder.name}
              </span>
              {getSupplierTypeIcon()}
              {getRelationshipStatusIndicator()}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-latte-500 dark:text-gray-500 bg-latte-200 dark:bg-sage-700 px-2 py-1 rounded-full">
                {folder.itemCount} items
              </span>
              {folder.documentCount > 0 && (
                <span className="text-xs text-latte-600 dark:text-gray-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {folder.documentCount} docs
                </span>
              )}
              {getQualityGradeBadge()}
            </div>
            
            {/* Folder Description - Show on hover/select */}
            {(isHovered || isSelected) && (
              <div className="mt-2 text-xs text-latte-600 dark:text-gray-400 space-y-1">
                {/* Show folder description */}
                {(folder as any).folderDescription && (
                  <div className="italic text-latte-700 dark:text-gray-300 mb-2">
                    {(folder as any).folderDescription}
                  </div>
                )}
                
                {/* Supplier Info Preview */}
                {folder.supplierInfo && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <span>
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {folder.supplierInfo.country}
                        {folder.supplierInfo.region && `, ${folder.supplierInfo.region}`}
                      </span>
                      {folder.supplierInfo.primaryCrops.length > 0 && (
                        <span>
                          Crops: {folder.supplierInfo.primaryCrops.slice(0, 2).join(', ')}
                          {folder.supplierInfo.primaryCrops.length > 2 && '...'}
                        </span>
                      )}
                    </div>
                    {folder.supplierInfo.lastContact && (
                      <div>
                        Last contact: {formatDate(folder.supplierInfo.lastContact)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date Modified Column */}
        <div className="text-sm text-latte-600 dark:text-gray-400">
          {formatDate(folder.lastModified)}
        </div>

        {/* Size Column */}
        <div className="text-sm text-latte-600 dark:text-gray-400">
          {formatTotalSize()}
        </div>

        {/* Kind Column */}
        <div className="flex items-center gap-2 text-sm text-latte-600 dark:text-gray-400">
          <span>Company Folder</span>
          {folder.supplierInfo?.certifications && folder.supplierInfo.certifications.length > 0 && (
            <div className="flex gap-1">
              {folder.supplierInfo.certifications.slice(0, 2).map((cert) => (
                <span 
                  key={cert}
                  className="inline-block w-2 h-2 bg-green-500 rounded-full"
                  title={`${cert} certified`}
                />
              ))}
            </div>
          )}
          {(folder as any).isEmpty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
              Empty
            </span>
          )}
        </div>
      </div>

      {/* Recent Documents Preview (shown on hover/selection) */}
      {folder.recentDocuments && folder.recentDocuments.length > 0 && (isHovered || isSelected) && (
        <div className="recent-documents bg-golden-25 dark:bg-emerald-950/20 border-t border-golden-200 dark:border-emerald-600/30 px-6 py-3">
          <div className="text-xs text-latte-600 dark:text-gray-400 mb-2">Recent documents:</div>
          <div className="space-y-1">
            {folder.recentDocuments.slice(0, 3).map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-xs">
                <FileText className="w-3 h-3 text-latte-500 dark:text-gray-500" />
                <span className="text-latte-700 dark:text-gray-300 truncate flex-1" title={doc.name}>
                  {doc.name}
                </span>
                <span className="text-latte-500 dark:text-gray-500">
                  {formatDate(doc.lastModified)}
                </span>
              </div>
            ))}
            {folder.recentDocuments.length > 3 && (
              <div className="text-xs text-latte-500 dark:text-gray-500 italic">
                +{folder.recentDocuments.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierFolderRow;