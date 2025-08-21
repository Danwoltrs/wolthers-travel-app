/**
 * TypeScript interfaces for the macOS Finder-style Document Management System
 * Integrates with coffee supply chain management application
 */

// Core document and folder interfaces
export interface SupplierDocument {
  id: string;
  name: string;
  path: string;
  supplier: string;
  supplierId: string;
  year: number;
  size: number; // in bytes
  lastModified: Date;
  createdDate: Date;
  createdBy: string;
  createdById: string;
  kind: string; // Human readable file type (e.g., "Excel Spreadsheet")
  extension: string; // File extension (e.g., "xlsx")
  mimeType: string;
  isNew?: boolean;
  isShared?: boolean;
  tags?: string[];
  metadata?: DocumentMetadata;
  accessLevel: 'public' | 'private' | 'team' | 'supplier-only';
  downloadUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
}

// Enhanced metadata for specific document types
export interface DocumentMetadata {
  // For crop forecast documents
  cropSeason?: string;
  harvestYear?: number;
  cropTypes?: string[]; // ["arabica", "robusta"]
  regions?: string[];
  
  // For supplier contracts
  contractValue?: number;
  contractCurrency?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  
  // For quality reports
  cupping_score?: number;
  defect_count?: number;
  moisture_content?: number;
  
  // Generic metadata
  version?: string;
  revision?: number;
  approved?: boolean;
  approvedBy?: string;
  approvedDate?: Date;
}

// Supplier folder structure
export interface SupplierFolder {
  id: string;
  name: string; // Supplier company name
  path: string;
  supplierId: string;
  itemCount: number;
  documentCount: number;
  folderCount: number;
  totalSize: number; // Total size of all documents in bytes
  lastModified: Date;
  createdDate: Date;
  isExpanded?: boolean;
  subFolders: YearFolder[];
  recentDocuments: SupplierDocument[]; // For quick access
  supplierInfo: SupplierInfo;
}

// Year-based subfolders for better organization
export interface YearFolder {
  id: string;
  year: number;
  path: string;
  supplierId: string;
  itemCount: number;
  totalSize: number;
  lastModified: Date;
  documents: SupplierDocument[];
  categories: DocumentCategory[]; // Further organization
}

// Document categories within year folders
export interface DocumentCategory {
  id: string;
  name: string; // "Contracts", "Quality Reports", "Crop Forecasts", etc.
  path: string;
  itemCount: number;
  documents: SupplierDocument[];
  color?: string; // For visual distinction
  icon?: string; // Lucide icon name
}

// Supplier information for context
export interface SupplierInfo {
  id: string;
  name: string;
  country: string;
  region?: string;
  contactPerson: string;
  email: string;
  phone?: string;
  lastContact?: Date;
  relationshipStatus: 'active' | 'inactive' | 'pending' | 'terminated';
  supplierType: 'farm' | 'cooperative' | 'exporter' | 'processor' | 'other';
  certifications?: string[]; // ["organic", "fairtrade", "rainforest-alliance"]
  primaryCrops: string[];
  averageAnnualVolume?: number; // in bags/tonnes
  qualityGrade?: 'specialty' | 'premium' | 'commercial';
}

// Crop information dashboard data
export interface CropInformation {
  id: string;
  title: string;
  filename: string;
  supplier: string;
  supplierId: string;
  sharedBy: string;
  sharedById: string;
  sharedDate: Date;
  size: number;
  fileType: string;
  category: 'forecast' | 'harvest-report' | 'quality-analysis' | 'market-update';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  previewData?: CropPreviewData;
  downloadUrl: string;
  thumbnailUrl?: string;
}

// Preview data for crop documents
export interface CropPreviewData {
  summary?: string;
  expectedHarvest?: number;
  harvestUnit?: 'bags' | 'tonnes' | 'containers';
  qualityPrediction?: 'excellent' | 'good' | 'fair' | 'poor';
  weatherImpact?: 'positive' | 'neutral' | 'negative';
  priceIndicator?: 'up' | 'stable' | 'down';
  keyInsights?: string[];
  lastUpdated: Date;
}

// Finder view configuration
export interface FinderViewState {
  viewMode: 'list' | 'grid' | 'columns';
  sortBy: 'name' | 'dateModified' | 'size' | 'kind';
  sortDirection: 'asc' | 'desc';
  groupBy?: 'supplier' | 'year' | 'category' | 'none';
  showHidden: boolean;
  columnWidths: {
    name: number;
    dateModified: number;
    size: number;
    kind: number;
  };
  selectedItems: string[]; // Array of document/folder IDs
  currentPath: string[];
  searchQuery: string;
  filters: FinderFilters;
}

// Advanced filtering options
export interface FinderFilters {
  suppliers?: string[]; // Filter by specific suppliers
  years?: number[]; // Filter by specific years
  categories?: string[]; // Filter by document categories
  fileTypes?: string[]; // Filter by file extensions
  dateRange?: {
    start: Date;
    end: Date;
  };
  sizeRange?: {
    min: number; // in bytes
    max: number; // in bytes
  };
  tags?: string[];
  accessLevel?: ('public' | 'private' | 'team' | 'supplier-only')[];
  isNew?: boolean;
  isShared?: boolean;
}

// Search functionality
export interface SearchResult {
  documents: SupplierDocument[];
  folders: SupplierFolder[];
  totalResults: number;
  searchTime: number; // in milliseconds
  suggestions?: string[]; // Search suggestions for typos/partial matches
  facets?: SearchFacets; // For faceted search navigation
}

export interface SearchFacets {
  suppliers: { name: string; count: number }[];
  years: { year: number; count: number }[];
  categories: { category: string; count: number }[];
  fileTypes: { type: string; count: number }[];
}

// Component state interfaces
export interface DocumentFinderState {
  loading: boolean;
  error: string | null;
  suppliers: SupplierFolder[];
  currentSupplier: SupplierFolder | null;
  currentYear: YearFolder | null;
  currentCategory: DocumentCategory | null;
  cropInformation: CropInformation[];
  viewState: FinderViewState;
  searchResults: SearchResult | null;
  isSearching: boolean;
  bulkActions: BulkActionState;
}

export interface BulkActionState {
  selectedItems: string[];
  availableActions: BulkAction[];
  isProcessing: boolean;
  processingAction: string | null;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  action: 'download' | 'share' | 'move' | 'delete' | 'tag' | 'export';
  requiresConfirmation: boolean;
  destructive?: boolean;
}

// Context menu interfaces
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: string;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

// File upload interfaces
export interface FileUpload {
  id: string;
  file: File;
  supplierId: string;
  year?: number;
  category?: string;
  tags?: string[];
  metadata?: Partial<DocumentMetadata>;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Notification system for document activities
export interface DocumentNotification {
  id: string;
  type: 'upload' | 'share' | 'download' | 'update' | 'delete' | 'approval';
  title: string;
  message: string;
  documentId?: string;
  supplierId?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

// API response interfaces
export interface DocumentApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Hook interfaces for state management
export interface UseDocumentFinderReturn {
  state: DocumentFinderState;
  actions: {
    // Navigation
    navigateToSupplier: (supplierId: string) => Promise<void>;
    navigateToYear: (year: number) => Promise<void>;
    navigateToCategory: (categoryId: string) => Promise<void>;
    navigateBreadcrumb: (pathIndex: number) => void;
    
    // Search and filter
    search: (query: string) => Promise<void>;
    applyFilters: (filters: Partial<FinderFilters>) => Promise<void>;
    clearFilters: () => void;
    
    // View state
    changeViewMode: (mode: 'list' | 'grid' | 'columns') => void;
    changeSorting: (sortBy: string, direction: 'asc' | 'desc') => void;
    toggleGrouping: (groupBy: string) => void;
    
    // Selection
    selectItem: (itemId: string, multi?: boolean) => void;
    selectAll: () => void;
    clearSelection: () => void;
    
    // Document operations
    downloadDocument: (documentId: string) => Promise<void>;
    shareDocument: (documentId: string, shareOptions: ShareOptions) => Promise<void>;
    deleteDocument: (documentId: string) => Promise<void>;
    updateDocument: (documentId: string, updates: Partial<SupplierDocument>) => Promise<void>;
    
    // Bulk operations
    performBulkAction: (action: BulkAction) => Promise<void>;
    
    // File upload
    uploadFiles: (files: FileUpload[]) => Promise<void>;
    
    // Refresh data
    refresh: () => Promise<void>;
  };
}

export interface ShareOptions {
  emails?: string[];
  userIds?: string[];
  accessLevel: 'view' | 'download' | 'edit';
  expirationDate?: Date;
  message?: string;
  allowExternalSharing?: boolean;
}

// Event interfaces for real-time updates
export interface DocumentEvent {
  type: 'document_created' | 'document_updated' | 'document_deleted' | 'document_shared';
  documentId: string;
  supplierId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

export interface SupplierEvent {
  type: 'supplier_created' | 'supplier_updated' | 'supplier_activated' | 'supplier_deactivated';
  supplierId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

// Component prop interfaces
export interface CropDashboardProps {
  cropInformation: CropInformation[];
  loading?: boolean;
  onDocumentClick: (document: CropInformation) => void;
  onRefresh?: () => void;
  className?: string;
}

export interface DocumentFinderProps {
  suppliers: SupplierFolder[];
  viewState: FinderViewState;
  onNavigate: (path: string[]) => void;
  onSelectItem: (itemId: string, multi?: boolean) => void;
  onSearch: (query: string) => void;
  onFilter: (filters: FinderFilters) => void;
  onSort: (sortBy: string, direction: 'asc' | 'desc') => void;
  onBulkAction: (action: BulkAction) => void;
  onUpload?: (files: File[], supplierId?: string) => void;
  loading?: boolean;
  className?: string;
}

export interface SupplierFolderProps {
  folder: SupplierFolder;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelect: (multi?: boolean) => void;
  onNavigate: () => void;
  className?: string;
}

export interface FileRowProps {
  document: SupplierDocument;
  isSelected: boolean;
  onSelect: (multi?: boolean) => void;
  onDoubleClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  showActions?: boolean;
  className?: string;
}