/**
 * FileRow Component
 * Individual file row in the Finder-style interface
 * Displays document metadata and provides quick actions
 */

import React, { useState } from 'react';
import {
  File,
  FileText,
  FileSpreadsheet,
  FileBarChart,
  Archive,
  Download,
  Share,
  Eye,
  MoreVertical,
  Star,
  Clock,
  AlertCircle,
  Shield,
  Users,
  Lock,
  Globe,
  Tag
} from 'lucide-react';
import { SupplierDocument } from '@/types/document-finder';
import { formatFileSize, formatDate } from '@/lib/utils';

interface FileRowProps {
  document: SupplierDocument;
  isSelected: boolean;
  onSelect: (multi?: boolean) => void;
  onDoubleClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  showActions?: boolean;
  className?: string;
}

const FileRow: React.FC<FileRowProps> = ({
  document,
  isSelected,
  onSelect,
  onDoubleClick,
  onContextMenu,
  showActions = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get file type icon with color
  const getFileTypeIcon = (extension: string) => {
    switch (extension.toLowerCase()) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-emerald-400" />;
      case 'csv':
        return <FileBarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'zip':
      case 'rar':
        return <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      case 'json':
        return <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <File className="w-5 h-5 text-latte-600 dark:text-gray-400" />;
    }
  };

  // Get access level icon
  const getAccessLevelIcon = (accessLevel: SupplierDocument['accessLevel']) => {
    switch (accessLevel) {
      case 'public':
        return <Globe className="w-3 h-3 text-green-600 dark:text-emerald-400" title="Public access" />;
      case 'team':
        return <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" title="Team access" />;
      case 'supplier-only':
        return <Shield className="w-3 h-3 text-orange-600 dark:text-orange-400" title="Supplier only" />;
      case 'private':
        return <Lock className="w-3 h-3 text-red-600 dark:text-red-400" title="Private" />;
      default:
        return null;
    }
  };

  // Get document status indicators
  const getStatusIndicators = () => {
    const indicators = [];

    if (document.isNew) {
      indicators.push(
        <div key="new" className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          New
        </div>
      );
    }

    if (document.isShared) {
      indicators.push(
        <div key="shared" className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <Share className="w-3 h-3" />
          Shared
        </div>
      );
    }

    if (document.metadata?.approved) {
      indicators.push(
        <div key="approved" className="flex items-center gap-1 text-xs text-green-600 dark:text-emerald-400">
          <Star className="w-3 h-3" />
          Approved
        </div>
      );
    }

    // Show urgency for certain document types
    if (document.metadata?.version && parseFloat(document.metadata.version) > 1) {
      indicators.push(
        <div key="version" className="text-xs text-latte-600 dark:text-gray-400">
          v{document.metadata.version}
        </div>
      );
    }

    return indicators;
  };

  // Get metadata preview based on document type
  const getMetadataPreview = () => {
    const metadata = document.metadata;
    if (!metadata) return null;

    const previews = [];

    // Crop information
    if (metadata.cropSeason || metadata.harvestYear) {
      previews.push(
        <span key="crop" className="text-xs text-latte-600 dark:text-gray-400">
          {metadata.cropSeason} {metadata.harvestYear}
        </span>
      );
    }

    // Quality information
    if (metadata.cupping_score) {
      previews.push(
        <span key="quality" className="text-xs text-latte-600 dark:text-gray-400">
          Score: {metadata.cupping_score}
        </span>
      );
    }

    // Contract information
    if (metadata.contractValue) {
      previews.push(
        <span key="contract" className="text-xs text-latte-600 dark:text-gray-400">
          ${metadata.contractValue?.toLocaleString()} {metadata.contractCurrency}
        </span>
      );
    }

    return previews.length > 0 ? previews : null;
  };

  // Handle click with proper event handling
  const handleClick = (event: React.MouseEvent) => {
    if (event.detail === 2) {
      // Double click
      onDoubleClick();
    } else if (event.metaKey || event.ctrlKey || event.shiftKey) {
      // Multi-select
      onSelect(true);
    } else {
      // Single select
      onSelect(false);
    }
  };

  // Handle selection checkbox
  const handleSelectChange = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(event.shiftKey);
  };

  // Handle action button clicks
  const handleActionClick = (event: React.MouseEvent, action: string) => {
    event.stopPropagation();
    // Implement action handlers
    console.log(`Action: ${action} on document:`, document.id);
  };

  return (
    <div 
      className={`file-row group relative ${isSelected ? 'bg-golden-200/50 dark:bg-emerald-700/30 border-l-4 border-sage-600 dark:border-emerald-400' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`file-content flex items-center gap-3 px-6 py-3 hover:bg-golden-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 ${isSelected ? 'bg-golden-100/30 dark:bg-emerald-800/20' : ''}`}
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        {/* Name Column with File Icon and Details */}
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

          {/* Indent for hierarchy */}
          <div className="w-8 flex justify-center">
            {getFileTypeIcon(document.extension)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-latte-800 dark:text-gray-200 truncate font-medium" title={document.name}>
                {document.name}
              </span>
              {getAccessLevelIcon(document.accessLevel)}
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-3 mt-1">
              {getStatusIndicators()}
            </div>

            {/* Metadata preview on hover/selection */}
            {(isHovered || isSelected) && getMetadataPreview() && (
              <div className="flex items-center gap-3 mt-1">
                {getMetadataPreview()}
              </div>
            )}

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (isHovered || isSelected) && (
              <div className="flex items-center gap-1 mt-1">
                <Tag className="w-3 h-3 text-latte-500 dark:text-gray-500" />
                <div className="flex gap-1">
                  {document.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag}
                      className="inline-block bg-latte-200 dark:bg-sage-700 text-latte-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 3 && (
                    <span className="text-xs text-latte-500 dark:text-gray-500">
                      +{document.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date Modified Column */}
        <div className="text-sm text-latte-600 dark:text-gray-400">
          <div>{formatDate(document.lastModified)}</div>
          {(isHovered || isSelected) && document.createdBy && (
            <div className="text-xs text-latte-500 dark:text-gray-500 mt-1">
              by {document.createdBy}
            </div>
          )}
        </div>

        {/* Size Column */}
        <div className="text-sm text-latte-600 dark:text-gray-400">
          {formatFileSize(document.size)}
        </div>

        {/* Kind Column */}
        <div className="text-sm text-latte-600 dark:text-gray-400">
          {document.kind}
        </div>
      </div>

      {/* Action Buttons (shown on hover) */}
      {showActions && (isHovered || isSelected) && (
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-white dark:bg-sage-800 shadow-sm border border-golden-200 dark:border-emerald-600/30 rounded-lg px-2 py-1">
          <button 
            className="p-1 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors"
            title="Download"
            onClick={(e) => handleActionClick(e, 'download')}
          >
            <Download className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
          </button>
          <button 
            className="p-1 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors"
            title="Preview"
            onClick={(e) => handleActionClick(e, 'preview')}
          >
            <Eye className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
          </button>
          <button 
            className="p-1 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors"
            title="Share"
            onClick={(e) => handleActionClick(e, 'share')}
          >
            <Share className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
          </button>
          <button 
            className="p-1 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors"
            title="More options"
            onClick={(e) => handleActionClick(e, 'more')}
          >
            <MoreVertical className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
          </button>
        </div>
      )}

      {/* Extended metadata panel (shown on selection) */}
      {isSelected && document.metadata && (
        <div className="metadata-panel bg-golden-25 dark:bg-emerald-950/20 border-t border-golden-200 dark:border-emerald-600/30 px-6 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* File Information */}
            <div>
              <div className="font-medium text-latte-700 dark:text-gray-300 mb-1">File Information</div>
              <div className="space-y-1 text-latte-600 dark:text-gray-400">
                <div>Created: {formatDate(document.createdDate)}</div>
                <div>Modified: {formatDate(document.lastModified)}</div>
                <div>Size: {formatFileSize(document.size)}</div>
                <div>Type: {document.mimeType}</div>
              </div>
            </div>

            {/* Crop Information */}
            {(document.metadata.cropSeason || document.metadata.harvestYear || document.metadata.cropTypes) && (
              <div>
                <div className="font-medium text-latte-700 dark:text-gray-300 mb-1">Crop Information</div>
                <div className="space-y-1 text-latte-600 dark:text-gray-400">
                  {document.metadata.cropSeason && <div>Season: {document.metadata.cropSeason}</div>}
                  {document.metadata.harvestYear && <div>Year: {document.metadata.harvestYear}</div>}
                  {document.metadata.cropTypes && document.metadata.cropTypes.length > 0 && (
                    <div>Types: {document.metadata.cropTypes.join(', ')}</div>
                  )}
                  {document.metadata.regions && document.metadata.regions.length > 0 && (
                    <div>Regions: {document.metadata.regions.join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Quality Information */}
            {(document.metadata.cupping_score || document.metadata.defect_count || document.metadata.moisture_content) && (
              <div>
                <div className="font-medium text-latte-700 dark:text-gray-300 mb-1">Quality Metrics</div>
                <div className="space-y-1 text-latte-600 dark:text-gray-400">
                  {document.metadata.cupping_score && <div>Cupping Score: {document.metadata.cupping_score}</div>}
                  {document.metadata.defect_count !== undefined && <div>Defects: {document.metadata.defect_count}</div>}
                  {document.metadata.moisture_content && <div>Moisture: {document.metadata.moisture_content}%</div>}
                </div>
              </div>
            )}

            {/* Contract Information */}
            {(document.metadata.contractValue || document.metadata.contractStartDate) && (
              <div>
                <div className="font-medium text-latte-700 dark:text-gray-300 mb-1">Contract Details</div>
                <div className="space-y-1 text-latte-600 dark:text-gray-400">
                  {document.metadata.contractValue && (
                    <div>
                      Value: ${document.metadata.contractValue.toLocaleString()} {document.metadata.contractCurrency}
                    </div>
                  )}
                  {document.metadata.contractStartDate && (
                    <div>Start: {formatDate(document.metadata.contractStartDate)}</div>
                  )}
                  {document.metadata.contractEndDate && (
                    <div>End: {formatDate(document.metadata.contractEndDate)}</div>
                  )}
                </div>
              </div>
            )}

            {/* Approval Information */}
            {(document.metadata.approved || document.metadata.version) && (
              <div>
                <div className="font-medium text-latte-700 dark:text-gray-300 mb-1">Document Status</div>
                <div className="space-y-1 text-latte-600 dark:text-gray-400">
                  {document.metadata.version && <div>Version: {document.metadata.version}</div>}
                  {document.metadata.revision && <div>Revision: {document.metadata.revision}</div>}
                  {document.metadata.approved && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-green-500" />
                      Approved by {document.metadata.approvedBy}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileRow;