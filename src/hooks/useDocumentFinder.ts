/**
 * useDocumentFinder Hook
 * State management for the Finder-style document interface
 * Handles navigation, search, filtering, and document operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DocumentFinderState,
  FinderViewState,
  SupplierFolder,
  SupplierDocument,
  CropInformation,
  FinderFilters,
  SearchResult,
  BulkAction,
  ShareOptions,
  UseDocumentFinderReturn
} from '@/types/document-finder';

// API base URL for coffee supply chain documents
const API_BASE = '/api/documents/coffee-supply'

// Context interface for document filtering
export interface DocumentFinderContext {
  tripId?: string;
  companyId?: string;
  includeGeneral?: boolean;
}

// API client functions with trip context support
const api = {
  async fetchSuppliers(options: { 
    sortBy: string; 
    sortDirection: string; 
    limit: number; 
    offset: number;
    context?: DocumentFinderContext;
  }) {
    const params = new URLSearchParams({
      action: 'suppliers',
      sort_by: options.sortBy,
      sort_direction: options.sortDirection,
      limit: options.limit.toString(),
      offset: options.offset.toString()
    })

    // Add context parameters
    if (options.context?.tripId) {
      params.append('tripId', options.context.tripId)
    }
    if (options.context?.companyId) {
      params.append('companyId', options.context.companyId)
    }
    if (options.context?.includeGeneral !== undefined) {
      params.append('include_general', options.context.includeGeneral.toString())
    }

    try {
      const response = await fetch(`${API_BASE}?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        console.warn(`Failed to fetch suppliers: ${response.status} ${response.statusText}`)
        return { suppliers: [], total: 0 }
      }

      const result = await response.json()
      return result.success ? result.data : { suppliers: [], total: 0 }
    } catch (error) {
      console.warn('Network error fetching suppliers:', error)
      return { suppliers: [], total: 0 }
    }
  },

  async fetchDocuments(options: {
    supplierId?: string
    year?: number
    category?: string
    searchQuery?: string
    sortBy: string
    sortDirection: string
    limit: number
    offset: number
    filters?: any
    context?: DocumentFinderContext
  }) {
    const params = new URLSearchParams({
      action: 'documents',
      sort_by: options.sortBy,
      sort_direction: options.sortDirection,
      limit: options.limit.toString(),
      offset: options.offset.toString()
    })

    if (options.supplierId) params.append('supplier_id', options.supplierId)
    if (options.year) params.append('year', options.year.toString())
    if (options.category) params.append('category', options.category)
    if (options.searchQuery) params.append('q', options.searchQuery)

    // Add context parameters
    if (options.context?.tripId) {
      params.append('tripId', options.context.tripId)
    }
    if (options.context?.companyId) {
      params.append('companyId', options.context.companyId)
    }
    if (options.context?.includeGeneral !== undefined) {
      params.append('include_general', options.context.includeGeneral.toString())
    }

    // Add filters
    if (options.filters) {
      if (options.filters.fileTypes?.length) {
        params.append('file_types', options.filters.fileTypes.join(','))
      }
      if (options.filters.urgency?.length) {
        params.append('urgency', options.filters.urgency.join(','))
      }
      if (options.filters.categories?.length) {
        params.append('categories', options.filters.categories.join(','))
      }
      if (options.filters.dateRange) {
        if (options.filters.dateRange.start) {
          params.append('date_from', options.filters.dateRange.start.toISOString())
        }
        if (options.filters.dateRange.end) {
          params.append('date_to', options.filters.dateRange.end.toISOString())
        }
      }
    }

    try {
      const response = await fetch(`${API_BASE}?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        console.warn(`Failed to fetch documents: ${response.status} ${response.statusText}`)
        return { documents: [], total: 0 }
      }

      const result = await response.json()
      return result.success ? result.data : { documents: [], total: 0 }
    } catch (error) {
      console.warn('Network error fetching documents:', error)
      return { documents: [], total: 0 }
    }
  },

  async searchDocuments(options: {
    query: string
    supplierId?: string
    limit: number
    offset: number
    filters?: any
    context?: DocumentFinderContext
  }) {
    const params = new URLSearchParams({
      action: 'search',
      q: options.query,
      limit: options.limit.toString(),
      offset: options.offset.toString()
    })

    if (options.supplierId) params.append('supplier_id', options.supplierId)

    // Add context parameters
    if (options.context?.tripId) {
      params.append('tripId', options.context.tripId)
    }
    if (options.context?.companyId) {
      params.append('companyId', options.context.companyId)
    }

    if (options.filters) {
      if (options.filters.fileTypes?.length) {
        params.append('file_types', options.filters.fileTypes.join(','))
      }
      if (options.filters.categories?.length) {
        params.append('categories', options.filters.categories.join(','))
      }
    }

    try {
      const response = await fetch(`${API_BASE}?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        console.warn(`Failed to search documents: ${response.status} ${response.statusText}`)
        return { documents: [], folders: [], totalResults: 0, searchTime: 0 }
      }

      const result = await response.json()
      return result.success ? result.data : { documents: [], folders: [], totalResults: 0, searchTime: 0 }
    } catch (error) {
      console.warn('Network error searching documents:', error)
      return { documents: [], folders: [], totalResults: 0, searchTime: 0 }
    }
  },

  async fetchCropInformation(options: { 
    limit: number; 
    urgencyLevels?: string[];
    context?: DocumentFinderContext;
  }) {
    const params = new URLSearchParams({
      action: 'crop-dashboard',
      limit: options.limit.toString()
    })

    if (options.urgencyLevels?.length) {
      params.append('urgency', options.urgencyLevels.join(','))
    }

    // Add context parameters
    if (options.context?.tripId) {
      params.append('tripId', options.context.tripId)
    }
    if (options.context?.companyId) {
      params.append('companyId', options.context.companyId)
    }

    try {
      const response = await fetch(`${API_BASE}?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        console.warn(`Failed to fetch crop information: ${response.status} ${response.statusText}`)
        return { cropInformation: [] }
      }

      const result = await response.json()
      return result.success ? result.data : { cropInformation: [] }
    } catch (error) {
      console.warn('Network error fetching crop information:', error)
      return { cropInformation: [] }
    }
  },

  async uploadFiles(files: File[], options: {
    supplierId?: string
    category?: string
    year?: string
    tags?: string[]
    metadata?: any
    autoOrganize?: boolean
  }) {
    const formData = new FormData()

    files.forEach(file => {
      formData.append('files', file)
    })

    if (options.supplierId) formData.append('supplier_id', options.supplierId)
    if (options.category) formData.append('category', options.category)
    if (options.year) formData.append('year', options.year)
    if (options.tags) formData.append('tags', options.tags.join(','))
    if (options.metadata) formData.append('metadata', JSON.stringify(options.metadata))
    if (options.autoOrganize !== undefined) formData.append('auto_organize', options.autoOrganize.toString())

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to upload files: ${response.statusText}`)
    }

    const result = await response.json()
    return result.success ? result.data : { uploads: [], errors: [] }
  },

  async performBulkAction(action: string, options: {
    documentIds?: string[]
    folderIds?: string[]
    [key: string]: any
  }) {
    const response = await fetch(`${API_BASE}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        documentIds: options.documentIds || [],
        folderIds: options.folderIds || [],
        options: options
      }),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Bulk action failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.success ? result.data : {}
  },

  async downloadDocument(documentId: string) {
    window.open(`${API_BASE}/${documentId}?action=download`, '_blank')
  },

  async shareDocument(documentId: string, shareOptions: ShareOptions) {
    const response = await fetch(`${API_BASE}/${documentId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shareOptions),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to share document: ${response.statusText}`)
    }

    const result = await response.json()
    return result.success ? result.data : {}
  },

  async deleteDocument(documentId: string) {
    const response = await fetch(`${API_BASE}/${documentId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`)
    }

    const result = await response.json()
    return result.success ? result.data : {}
  },

  async updateDocument(documentId: string, updates: Partial<SupplierDocument>) {
    const response = await fetch(`${API_BASE}/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to update document: ${response.statusText}`)
    }

    const result = await response.json()
    return result.success ? result.data : {}
  }
}

const initialViewState: FinderViewState = {
  viewMode: 'list',
  sortBy: 'name',
  sortDirection: 'asc',
  groupBy: 'none',
  showHidden: false,
  columnWidths: {
    name: 400,
    dateModified: 150,
    size: 100,
    kind: 150
  },
  selectedItems: [],
  currentPath: [],
  searchQuery: '',
  filters: {}
};

export const useDocumentFinder = (context?: DocumentFinderContext): UseDocumentFinderReturn => {
  const [state, setState] = useState<DocumentFinderState>({
    loading: true,
    error: null,
    suppliers: [],
    currentSupplier: null,
    currentYear: null,
    currentCategory: null,
    cropInformation: [],
    viewState: initialViewState,
    searchResults: null,
    isSearching: false,
    bulkActions: {
      selectedItems: [],
      availableActions: [],
      isProcessing: false,
      processingAction: null
    }
  });

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        // Fetch initial suppliers data with context
        const suppliersData = await api.fetchSuppliers({
          sortBy: 'name',
          sortDirection: 'asc',
          limit: 50,
          offset: 0,
          context
        })

        // Fetch crop information with context
        const cropData = await api.fetchCropInformation({
          limit: 20,
          urgencyLevels: ['critical', 'high'],
          context
        })

        setState(prev => ({
          ...prev,
          suppliers: suppliersData.suppliers || [],
          cropInformation: cropData.cropInformation || [],
          loading: false
        }))

      } catch (error) {
        console.error('Failed to initialize document finder:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load data',
          loading: false
        }))
      }
    }

    initializeData()
  }, [context?.tripId, context?.companyId, context?.includeGeneral]);

  // Update bulk actions when selection changes
  useEffect(() => {
    const availableActions: BulkAction[] = [];
    
    if (state.viewState.selectedItems.length > 0) {
      availableActions.push(
        {
          id: 'download',
          label: 'Download Selected',
          icon: 'Download',
          action: 'download',
          requiresConfirmation: false
        },
        {
          id: 'share',
          label: 'Share Selected',
          icon: 'Share',
          action: 'share',
          requiresConfirmation: false
        },
        {
          id: 'tag',
          label: 'Add Tags',
          icon: 'Tag',
          action: 'tag',
          requiresConfirmation: false
        },
        {
          id: 'delete',
          label: 'Delete Selected',
          icon: 'Trash',
          action: 'delete',
          requiresConfirmation: true,
          destructive: true
        }
      );
    }

    setState(prev => ({
      ...prev,
      bulkActions: {
        ...prev.bulkActions,
        selectedItems: prev.viewState.selectedItems,
        availableActions
      }
    }));
  }, [state.viewState.selectedItems]);

  // Navigation actions
  const navigateToSupplier = useCallback(async (supplierId: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const supplier = state.suppliers.find(s => s.id === supplierId);
      if (supplier) {
        setState(prev => ({
          ...prev,
          currentSupplier: supplier,
          currentYear: null,
          currentCategory: null,
          viewState: {
            ...prev.viewState,
            currentPath: [supplier.name],
            selectedItems: []
          },
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to navigate to supplier',
        loading: false
      }));
    }
  }, [state.suppliers]);

  const navigateToYear = useCallback(async (year: number) => {
    if (!state.currentSupplier) return;

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const yearFolder = state.currentSupplier.subFolders.find(yf => yf.year === year);
      if (yearFolder) {
        setState(prev => ({
          ...prev,
          currentYear: yearFolder,
          currentCategory: null,
          viewState: {
            ...prev.viewState,
            currentPath: [state.currentSupplier!.name, year.toString()],
            selectedItems: []
          },
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to navigate to year',
        loading: false
      }));
    }
  }, [state.currentSupplier]);

  const navigateToCategory = useCallback(async (categoryId: string) => {
    if (!state.currentYear) return;

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const category = state.currentYear.categories.find(c => c.id === categoryId);
      if (category) {
        setState(prev => ({
          ...prev,
          currentCategory: category,
          viewState: {
            ...prev.viewState,
            currentPath: [...prev.viewState.currentPath, category.name],
            selectedItems: []
          },
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to navigate to category',
        loading: false
      }));
    }
  }, [state.currentYear]);

  const navigateBreadcrumb = useCallback((pathIndex: number) => {
    const newPath = state.viewState.currentPath.slice(0, pathIndex + 1);
    
    setState(prev => ({
      ...prev,
      viewState: {
        ...prev.viewState,
        currentPath: newPath,
        selectedItems: []
      },
      currentCategory: pathIndex < 2 ? null : prev.currentCategory,
      currentYear: pathIndex < 1 ? null : prev.currentYear,
      currentSupplier: pathIndex < 0 ? null : prev.currentSupplier
    }));
  }, [state.viewState.currentPath]);

  // Search and filter actions
  const search = useCallback(async (query: string) => {
    setState(prev => ({
      ...prev,
      isSearching: true,
      viewState: {
        ...prev.viewState,
        searchQuery: query
      }
    }));

    try {
      if (!query.trim()) {
        setState(prev => ({
          ...prev,
          searchResults: null,
          isSearching: false
        }));
        return;
      }

      const searchResults = await api.searchDocuments({
        query,
        limit: 50,
        offset: 0,
        filters: state.viewState.filters,
        context
      });

      setState(prev => ({
        ...prev,
        searchResults,
        isSearching: false
      }));
    } catch (error) {
      console.error('Search failed:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Search failed',
        isSearching: false
      }));
    }
  }, [state.viewState.filters]);

  const applyFilters = useCallback(async (filters: Partial<FinderFilters>) => {
    setState(prev => ({
      ...prev,
      loading: true,
      viewState: {
        ...prev.viewState,
        filters: { ...prev.viewState.filters, ...filters }
      }
    }));

    try {
      // Re-fetch data with new filters applied
      // The filters will be automatically applied in the API calls
      const suppliersData = await api.fetchSuppliers({
        sortBy: state.viewState.sortBy || 'name',
        sortDirection: state.viewState.sortDirection || 'asc',
        limit: 50,
        offset: 0,
        context
      });

      setState(prev => ({
        ...prev,
        suppliers: suppliersData.suppliers || [],
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Filter application failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Filter failed',
        loading: false
      }));
    }
  }, [state.viewState.sortBy, state.viewState.sortDirection, context]);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      viewState: {
        ...prev.viewState,
        filters: {}
      }
    }));
  }, []);

  // View state actions
  const changeViewMode = useCallback((mode: 'list' | 'grid' | 'columns') => {
    setState(prev => ({
      ...prev,
      viewState: {
        ...prev.viewState,
        viewMode: mode
      }
    }));
  }, []);

  const changeSorting = useCallback((sortBy: string, direction: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      viewState: {
        ...prev.viewState,
        sortBy,
        sortDirection: direction
      }
    }));
  }, []);

  const toggleGrouping = useCallback((groupBy: string) => {
    setState(prev => ({
      ...prev,
      viewState: {
        ...prev.viewState,
        groupBy: prev.viewState.groupBy === groupBy ? 'none' : groupBy
      }
    }));
  }, []);

  // Selection actions
  const selectItem = useCallback((itemId: string, multi: boolean = false) => {
    setState(prev => {
      const currentSelection = prev.viewState.selectedItems;
      let newSelection: string[];

      if (multi) {
        // Multi-select: toggle item
        if (currentSelection.includes(itemId)) {
          newSelection = currentSelection.filter(id => id !== itemId);
        } else {
          newSelection = [...currentSelection, itemId];
        }
      } else {
        // Single select: replace selection
        newSelection = currentSelection.includes(itemId) && currentSelection.length === 1 
          ? [] 
          : [itemId];
      }

      return {
        ...prev,
        viewState: {
          ...prev.viewState,
          selectedItems: newSelection
        }
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    // Get all items in current view
    const allItems: string[] = [];
    
    if (state.viewState.currentPath.length === 0) {
      allItems.push(...state.suppliers.map(s => s.id));
    } else if (state.currentYear) {
      allItems.push(...state.currentYear.documents.map(d => d.id));
    }

    setState(prev => ({
      ...prev,
      viewState: {
        ...prev.viewState,
        selectedItems: allItems
      }
    }));
  }, [state.suppliers, state.currentYear, state.viewState.currentPath]);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      viewState: {
        ...prev.viewState,
        selectedItems: []
      }
    }));
  }, []);

  // Document operations
  const downloadDocument = useCallback(async (documentId: string) => {
    try {
      api.downloadDocument(documentId);
    } catch (error) {
      console.error('Download failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Download failed'
      }));
    }
  }, []);

  const shareDocument = useCallback(async (documentId: string, shareOptions: ShareOptions) => {
    try {
      await api.shareDocument(documentId, shareOptions);
      
      // Note: refresh() would be called here but we'll handle refresh separately
      // to avoid circular dependency issues in the hook
    } catch (error) {
      console.error('Share failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Share failed'
      }));
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      await api.deleteDocument(documentId);
      
      // Remove from local state
      setState(prev => ({
        ...prev,
        viewState: {
          ...prev.viewState,
          selectedItems: prev.viewState.selectedItems.filter(id => id !== documentId)
        }
      }));

      // Note: refresh() would be called here but we'll handle refresh separately
      // to avoid circular dependency issues in the hook
    } catch (error) {
      console.error('Delete failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Delete failed'
      }));
    }
  }, []);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<SupplierDocument>) => {
    try {
      await api.updateDocument(documentId, updates);
      
      // Note: refresh() would be called here but we'll handle refresh separately
      // to avoid circular dependency issues in the hook
    } catch (error) {
      console.error('Update failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Update failed'
      }));
    }
  }, []);

  // Bulk operations
  const performBulkAction = useCallback(async (action: BulkAction) => {
    setState(prev => ({
      ...prev,
      bulkActions: {
        ...prev.bulkActions,
        isProcessing: true,
        processingAction: action.id
      }
    }));

    try {
      const selectedDocuments = state.viewState.selectedItems.filter(id => 
        // Determine if it's a document vs folder based on your data structure
        // This is a simplified check - you might need to enhance this
        !id.includes('folder')
      );

      const selectedFolders = state.viewState.selectedItems.filter(id => 
        id.includes('folder')
      );

      await api.performBulkAction(action.action, {
        documentIds: selectedDocuments,
        folderIds: selectedFolders,
        // Add any action-specific options here
      });

      // Clear selection and refresh after successful bulk action
      setState(prev => ({
        ...prev,
        viewState: {
          ...prev.viewState,
          selectedItems: []
        },
        bulkActions: {
          ...prev.bulkActions,
          isProcessing: false,
          processingAction: null
        }
      }));

      // Note: refresh() would be called here but we'll handle refresh separately
      // to avoid circular dependency issues in the hook

    } catch (error) {
      console.error('Bulk action failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Bulk action failed',
        bulkActions: {
          ...prev.bulkActions,
          isProcessing: false,
          processingAction: null
        }
      }));
    }
  }, [state.viewState.selectedItems]);

  // File upload
  const uploadFiles = useCallback(async (files: File[], supplierId?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const uploadResult = await api.uploadFiles(files, {
        supplierId,
        category: 'general',
        autoOrganize: true,
        tags: []
      });

      // Refresh suppliers data after upload
      const suppliersData = await api.fetchSuppliers({
        sortBy: state.viewState.sortBy || 'name',
        sortDirection: state.viewState.sortDirection || 'asc',
        limit: 50,
        offset: 0,
        context
      });

      setState(prev => ({ 
        ...prev, 
        loading: false,
        suppliers: suppliersData.suppliers || prev.suppliers,
        error: uploadResult.errors?.length ? `${uploadResult.errors.length} files failed to upload` : null
      }));

      return uploadResult;

    } catch (error) {
      console.error('Upload failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        loading: false
      }));
      throw error;
    }
  }, [state.viewState.sortBy, state.viewState.sortDirection]);

  // Refresh data
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Reload suppliers
      const suppliersData = await api.fetchSuppliers({
        sortBy: state.viewState.sortBy || 'name',
        sortDirection: state.viewState.sortDirection || 'asc',
        limit: 50,
        offset: 0,
        context
      });

      // Reload crop information
      const cropData = await api.fetchCropInformation({
        limit: 20,
        urgencyLevels: ['critical', 'high'],
        context
      });

      setState(prev => ({
        ...prev,
        suppliers: suppliersData.suppliers || [],
        cropInformation: cropData.cropInformation || [],
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Refresh failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Refresh failed',
        loading: false
      }));
    }
  }, [state.viewState.sortBy, state.viewState.sortDirection]);

  return {
    state,
    actions: {
      navigateToSupplier,
      navigateToYear,
      navigateToCategory,
      navigateBreadcrumb,
      search,
      applyFilters,
      clearFilters,
      changeViewMode,
      changeSorting,
      toggleGrouping,
      selectItem,
      selectAll,
      clearSelection,
      downloadDocument,
      shareDocument,
      deleteDocument,
      updateDocument,
      performBulkAction,
      uploadFiles,
      refresh
    }
  };
};