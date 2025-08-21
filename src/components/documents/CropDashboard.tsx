/**
 * CropDashboard Component
 * Displays crop forecasts and supplier information files in table format
 * Matches DocumentFinder table design for visual consistency within Nordic minimalist aesthetic
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Download, 
  Eye,
  RefreshCw,
  Filter,
  FileSpreadsheet,
  FileBarChart,
  File,
  ArrowUpDown,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { CropInformation, CropDashboardProps } from '@/types/document-finder';
import { formatFileSize, formatDate } from '@/lib/utils';

const CropDashboard: React.FC<CropDashboardProps> = ({
  cropInformation,
  loading = false,
  onDocumentClick,
  onRefresh,
  className = ''
}) => {
  const [filter, setFilter] = useState<'all' | 'forecast' | 'harvest-report' | 'quality-analysis' | 'market-update'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'dateModified' | 'size' | 'kind'>('dateModified');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort crop information
  const filteredAndSortedData = useMemo(() => {
    let filtered = filter === 'all' 
      ? cropInformation 
      : cropInformation.filter(item => item.category === filter);

    // Sort by selected criteria
    filtered.sort((a, b) => {
      let result = 0;
      switch (sortBy) {
        case 'name':
          result = a.filename.localeCompare(b.filename);
          break;
        case 'dateModified':
          result = new Date(a.sharedDate).getTime() - new Date(b.sharedDate).getTime();
          break;
        case 'size':
          result = a.size - b.size;
          break;
        case 'kind':
          result = a.fileType.localeCompare(b.fileType);
          break;
        default:
          result = new Date(b.sharedDate).getTime() - new Date(a.sharedDate).getTime();
      }
      return sortDirection === 'desc' ? -result : result;
    });

    return filtered;
  }, [cropInformation, filter, sortBy, sortDirection]);

  // Handle sorting 
  const handleSort = (column: 'name' | 'dateModified' | 'size' | 'kind') => {
    const newDirection = sortBy === column && sortDirection === 'asc' 
      ? 'desc' 
      : 'asc';
    setSortBy(column);
    setSortDirection(newDirection);
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <SortAsc className="w-3 h-3" />
      : <SortDesc className="w-3 h-3" />;
  };

  // Get file type icon (smaller for table use)
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-emerald-400" />;
      case 'csv':
        return <FileBarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <File className="w-5 h-5 text-latte-600 dark:text-gray-400" />;
    }
  };

  // Get urgency indicator (compact for table)
  const getUrgencyIndicator = (urgency: CropInformation['urgency']) => {
    const configs = {
      critical: { 
        color: 'bg-red-500 dark:bg-red-600', 
        textColor: 'text-red-700 dark:text-red-300',
        icon: AlertTriangle 
      },
      high: { 
        color: 'bg-orange-500 dark:bg-orange-600', 
        textColor: 'text-orange-700 dark:text-orange-300',
        icon: TrendingUp 
      },
      medium: { 
        color: 'bg-yellow-500 dark:bg-yellow-600', 
        textColor: 'text-yellow-700 dark:text-yellow-300',
        icon: Clock 
      },
      low: { 
        color: 'bg-green-500 dark:bg-green-600', 
        textColor: 'text-green-700 dark:text-green-300',
        icon: Clock 
      }
    };

    const config = configs[urgency];

    return (
      <div className={`flex items-center gap-1 text-xs ${config.textColor}`}>
        <div className={`w-2 h-2 ${config.color} rounded-full`} />
        <span className="font-medium capitalize">{urgency}</span>
      </div>
    );
  };

  // Get category badge (compact for table)
  const getCategoryBadge = (category: CropInformation['category']) => {
    const configs = {
      forecast: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Forecast' },
      'harvest-report': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Harvest' },
      'quality-analysis': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Quality' },
      'market-update': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Market' }
    };

    const config = configs[category];
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`crop-dashboard bg-white dark:bg-sage-900/50 border border-golden-200 dark:border-emerald-600/30 rounded-xl shadow-lg overflow-hidden ${className}`}>
        {/* Header */}
        <div className="crop-header bg-gradient-to-r from-sage-600 to-sage-700 dark:from-emerald-700 dark:to-emerald-800 text-white px-6 py-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Crop & Supply Information
          </h2>
        </div>
        {/* Loading State */}
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-sage-600 dark:text-emerald-400 mr-2" />
          <span className="text-latte-600 dark:text-gray-400">Loading crop information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`crop-dashboard bg-white dark:bg-sage-900/50 border border-golden-200 dark:border-emerald-600/30 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header with Controls */}
      <div className="crop-header bg-gradient-to-r from-sage-600 to-sage-700 dark:from-emerald-700 dark:to-emerald-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Crop & Supply Information
            {filteredAndSortedData.length > 0 && (
              <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-normal">
                {filteredAndSortedData.length}
              </span>
            )}
          </h2>

          <div className="flex items-center gap-4">
            {/* Category Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:bg-white/20 focus:border-white/40 transition-all"
            >
              <option value="all">All Categories</option>
              <option value="forecast">Forecasts</option>
              <option value="harvest-report">Harvest Reports</option>
              <option value="quality-analysis">Quality Analysis</option>
              <option value="market-update">Market Updates</option>
            </select>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-white/10 rounded-md transition-colors"
                title="Refresh crop information"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="crop-table">
        {/* Column Headers */}
        <div className="table-header bg-latte-100 dark:bg-sage-800 border-b border-golden-200 dark:border-emerald-600/30">
          <div className="grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 px-6 py-3 text-sm font-semibold text-sage-700 dark:text-emerald-300">
            <button 
              className="flex items-center gap-2 hover:text-sage-900 dark:hover:text-emerald-200 justify-start transition-colors"
              onClick={() => handleSort('name')}
            >
              Name
              {getSortIcon('name')}
            </button>
            <button 
              className="flex items-center gap-2 hover:text-sage-900 dark:hover:text-emerald-200 justify-start transition-colors"
              onClick={() => handleSort('dateModified')}
            >
              Date Modified
              {getSortIcon('dateModified')}
            </button>
            <button 
              className="flex items-center gap-2 hover:text-sage-900 dark:hover:text-emerald-200 justify-start transition-colors"
              onClick={() => handleSort('size')}
            >
              Size
              {getSortIcon('size')}
            </button>
            <button 
              className="flex items-center gap-2 hover:text-sage-900 dark:hover:text-emerald-200 justify-start transition-colors"
              onClick={() => handleSort('kind')}
            >
              Kind
              {getSortIcon('kind')}
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="table-body max-h-80 overflow-y-auto">
          {/* Empty State */}
          {filteredAndSortedData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-latte-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-latte-700 dark:text-gray-300 mb-2">
                No crop information available
              </h3>
              <p className="text-latte-600 dark:text-gray-400">
                {filter === 'all' 
                  ? 'No documents have been shared recently.' 
                  : `No ${filter.replace('-', ' ')} documents available.`}
              </p>
            </div>
          ) : (
            /* Table Rows */
            filteredAndSortedData.map((document, index) => (
              <div 
                key={document.id}
                className={`grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 px-6 py-3 border-b border-golden-200/30 dark:border-emerald-600/20 hover:bg-golden-50/50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors group ${
                  index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-golden-50/20 dark:bg-emerald-900/10'
                }`}
                onClick={() => onDocumentClick(document)}
              >
                {/* Name Column */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    {getFileTypeIcon(document.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-latte-800 dark:text-gray-200 truncate" title={document.filename}>
                        {document.filename}
                      </span>
                      {!document.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" title="New document" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(document.category)}
                      {getUrgencyIndicator(document.urgency)}
                    </div>
                    <div className="text-xs text-latte-600 dark:text-gray-400 mt-1">
                      <span className="font-medium">Supplier:</span> {document.supplier}
                    </div>
                  </div>
                </div>

                {/* Date Modified Column */}
                <div className="flex flex-col justify-center">
                  <span className="text-sm text-latte-800 dark:text-gray-200">{formatDate(document.sharedDate)}</span>
                  <span className="text-xs text-latte-600 dark:text-gray-400">by {document.sharedBy}</span>
                </div>

                {/* Size Column */}
                <div className="flex flex-col justify-center">
                  <span className="text-sm text-latte-800 dark:text-gray-200">{formatFileSize(document.size)}</span>
                  {document.previewData?.expectedHarvest && (
                    <span className="text-xs text-latte-600 dark:text-gray-400" title="Expected harvest">
                      {document.previewData.expectedHarvest} {document.previewData.harvestUnit}
                    </span>
                  )}
                </div>

                {/* Kind Column with Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-latte-800 dark:text-gray-200 capitalize">{document.fileType} File</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-1.5 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors"
                      title="Download document"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle download
                      }}
                    >
                      <Download className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors"
                      title="Preview document"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle preview
                      }}
                    >
                      <Eye className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors"
                      title="Open in new tab"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle external link
                      }}
                    >
                      <ExternalLink className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CropDashboard;