# Coffee Supply Chain Document Management API

## Overview

This comprehensive backend system enhances the existing document management capabilities to support a macOS Finder-style interface specifically designed for coffee supply chain management. The system provides dynamic folder organization, automatic file categorization, and comprehensive metadata tracking for coffee industry professionals.

## Architecture

### Database Schema Enhancements

The system extends the existing `company_documents` table with coffee-specific fields:

- **Supplier Management**: Direct supplier relationships with automatic folder organization
- **Coffee-Specific Metadata**: Crop seasons, harvest years, certifications, quality grades
- **Dynamic Folder Structure**: Automatic `Supplier > Year > Files` organization
- **Enhanced Categorization**: Coffee industry categories (crop_forecast, harvest_report, quality_analysis, etc.)
- **Metadata Storage**: Flexible JSONB fields for crop, quality, and contract metadata

### Key Features

1. **Dynamic Folder Organization**
   - Automatic `Supplier > Year > Files` structure creation
   - Only creates folders when files exist (no empty folders)
   - Smart year detection from filenames and content

2. **Automatic File Categorization**
   - Pattern-based categorization from filenames
   - Coffee industry-specific categories
   - Extensible categorization logic

3. **Enhanced Metadata System**
   - Crop forecasting data
   - Quality assessment metrics
   - Contract information
   - Supply chain certifications

4. **Advanced Search & Filtering**
   - Full-text search across documents
   - Faceted search with category/type filters
   - Date range and urgency level filtering

5. **Comprehensive Document Operations**
   - Upload with automatic organization
   - Download with access logging
   - Sharing with granular permissions
   - Bulk operations for efficiency

## API Endpoints

### Main Document API
`GET /api/documents/coffee-supply`

**Query Parameters:**
- `action`: Operation type (suppliers, documents, search, crop-dashboard, statistics)
- `supplier_id`: Filter by supplier
- `year`: Filter by year
- `category`: Filter by document category
- `q`: Search query
- `sort_by`, `sort_direction`: Sorting options
- `limit`, `offset`: Pagination
- Various filter parameters

**Actions:**
- `suppliers`: Get all suppliers with document statistics
- `documents`: Get documents with filtering and sorting
- `search`: Full-text search across documents
- `crop-dashboard`: Get crop-specific information dashboard
- `statistics`: Get document statistics

### File Upload API
`POST /api/documents/coffee-supply/upload`

**Features:**
- Multi-file upload support
- Automatic categorization based on filename patterns
- Metadata extraction from file content
- Auto-organization into folder structure
- Thumbnail generation for supported files

### Document Operations
`GET/PUT/DELETE /api/documents/coffee-supply/[id]`

**Operations:**
- Download documents with signed URLs
- Update document metadata and properties
- Delete documents with cleanup
- Generate previews and thumbnails

### Document Sharing
`POST/GET/DELETE /api/documents/coffee-supply/[id]/share`

**Sharing Features:**
- Share with specific users or emails
- Company-wide sharing
- Trip participant sharing
- External sharing with time-limited links
- Granular access controls (view, download, edit)

### Bulk Operations
`POST /api/documents/coffee-supply/bulk`

**Supported Actions:**
- `download`: Bulk download with zip creation
- `delete`: Bulk deletion with confirmation
- `move`: Move files between folders/suppliers
- `share`: Share multiple documents
- `tag`: Add/remove tags in bulk
- `categorize`: Auto-categorize or manual categorization
- `export`: Export documents and metadata
- `update_metadata`: Bulk metadata updates

## Coffee Industry Categorization

### Document Categories
- `crop_forecast`: Harvest predictions and yield forecasts
- `harvest_report`: Actual harvest data and reports
- `quality_analysis`: Cupping scores and quality assessments
- `market_update`: Price trends and market analysis
- `cupping_notes`: Tasting notes and sensory evaluations
- `shipping_docs`: Export/import documentation
- `lab_results`: Scientific analysis and testing
- `farm_visit_report`: Field visit documentation
- `contract`: Purchase agreements and contracts
- `certificate`: Organic, fair trade, and other certifications

### Automatic Categorization Rules
The system analyzes filenames for patterns like:
- `*forecast*` → crop_forecast
- `*harvest*`, `*yield*` → harvest_report
- `*quality*`, `*cupping*` → quality_analysis
- `*contract*`, `*agreement*` → contract
- `*certificate*`, `*organic*`, `*fairtrade*` → certificate

### Metadata Extraction
- **Year Detection**: Extracts years from filenames (2020-2030 range)
- **Crop Types**: Identifies arabica, robusta mentions
- **Regions**: Detects coffee-growing regions
- **Certifications**: Finds organic, fairtrade, rainforest alliance references
- **Quality Indicators**: Detects specialty, premium, commercial grades

## Frontend Integration

### React Hook (useDocumentFinder)
The enhanced hook provides:
- Real API integration (no more mocks)
- Comprehensive state management
- Error handling and loading states
- Optimistic updates for better UX

### TypeScript Types
Complete type definitions in `document-finder.ts`:
- `SupplierDocument`: Individual document interface
- `SupplierFolder`: Folder structure with subfolders
- `CropInformation`: Dashboard-specific crop data
- `FinderViewState`: UI state management

### Components
Ready-to-use components with Nordic minimalist design:
- `DocumentFinder`: Main Finder interface
- `SupplierFolderRow`: Folder row component
- `FileRow`: Document row component
- `MobileDocumentView`: Mobile-optimized view

## Security & Access Control

### Row Level Security (RLS)
- **Wolthers Staff**: Full access to all documents
- **Supplier Companies**: Access to shared documents only
- **Trip Participants**: Access to trip-related documents
- **Document Creators**: Full access to their own documents

### File Storage Security
- Signed URLs for secure downloads
- Automatic cleanup of orphaned files
- Thumbnail generation with access controls
- Storage quota management

### Audit Logging
Complete audit trail in `company_access_logs`:
- Document views, downloads, uploads
- Sharing activities
- Bulk operations
- Access attempts and permissions

## Performance Optimizations

### Database Indexing
- Supplier and year-based indexes
- Full-text search indexing
- Metadata JSONB indexes
- Composite indexes for common queries

### Caching Strategies
- Supplier statistics view for fast loading
- Document metadata caching
- Signed URL caching (15 minutes)
- Search result caching

### Query Optimization
- Efficient folder hierarchy queries
- Paginated results with smart limits
- Lazy loading of document content
- Optimized bulk operations

## Usage Examples

### Basic Document Listing
```javascript
// Get all suppliers
const suppliers = await api.fetchSuppliers({
  sortBy: 'name',
  sortDirection: 'asc',
  limit: 50,
  offset: 0
});

// Get documents for a specific supplier and year
const documents = await api.fetchDocuments({
  supplierId: 'supplier-id',
  year: 2025,
  sortBy: 'dateModified',
  sortDirection: 'desc',
  limit: 20,
  offset: 0
});
```

### File Upload with Auto-Organization
```javascript
const uploadResult = await api.uploadFiles(files, {
  supplierId: 'guatemalan-coop-id',
  category: 'crop_forecast',
  year: '2025',
  autoOrganize: true,
  tags: ['harvest', 'premium'],
  metadata: {
    expectedYield: 2500,
    qualityGrade: 'specialty'
  }
});
```

### Advanced Search
```javascript
const searchResults = await api.searchDocuments({
  query: 'harvest forecast guatemala',
  limit: 50,
  filters: {
    categories: ['crop_forecast', 'harvest_report'],
    urgency: ['high', 'critical'],
    dateRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    }
  }
});
```

### Bulk Operations
```javascript
// Bulk categorization
await api.performBulkAction('categorize', {
  documentIds: selectedDocumentIds,
  category: 'quality_analysis',
  autoDetect: true
});

// Bulk sharing
await api.performBulkAction('share', {
  documentIds: selectedDocumentIds,
  emails: ['buyer@coffeeshop.com'],
  accessLevel: 'view',
  message: 'Latest quality reports for your review'
});
```

## Integration with Existing Systems

### Travel App Integration
- Maintains compatibility with existing trip management
- Documents can be linked to specific trips
- Trip participants automatically get document access
- Integration with Enhanced Quick View Modal

### Company Management
- Leverages existing company and user systems
- Respects existing RLS policies
- Uses current authentication flow
- Maintains design system consistency

### Notification System
- Plugs into existing notification infrastructure
- Email notifications for document sharing
- Real-time updates for collaborative features
- Activity feeds and alerts

## Future Enhancements

### AI-Powered Features
- Automatic quality scoring from cupping notes
- Price prediction from market documents
- Smart categorization using ML
- Document content analysis

### Advanced Analytics
- Supplier performance dashboards
- Document usage analytics
- Quality trend analysis
- Supply chain insights

### Mobile Optimization
- Progressive Web App features
- Offline document access
- Mobile-first upload flows
- Touch-optimized interfaces

### Integration Expansions
- ERP system connections
- Supply chain management tools
- Quality management systems
- Financial planning integration

---

This comprehensive document management system transforms the travel app into a powerful tool for coffee supply chain professionals, providing enterprise-grade document organization with the intuitive feel of macOS Finder.