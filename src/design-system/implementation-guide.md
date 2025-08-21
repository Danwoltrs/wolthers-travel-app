# Finder-Style Document Management Implementation Guide

## Overview

This guide provides step-by-step instructions for integrating the macOS Finder-style document management interface into your existing coffee supply chain management application. The implementation maintains perfect compatibility with your current Nordic minimalist design system and Enhanced Quick View Modal architecture.

## Prerequisites

### Required Dependencies
Ensure these packages are installed in your project:

```bash
npm install lucide-react@latest
npm install clsx tailwind-merge
npm install @types/file-type
```

### Tailwind CSS Configuration
Add these utilities to your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      gridTemplateColumns: {
        'finder': '2fr 1fr 1fr 1fr',
        'finder-mobile': '1fr auto',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    }
  }
}
```

### Global CSS Additions
Add to your `globals.css`:

```css
/* Finder-specific utilities */
.finder-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .finder-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

/* Line clamp for mobile */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Selection styles */
.finder-selected {
  @apply bg-golden-200/50 dark:bg-emerald-700/30 border-l-4 border-sage-600 dark:border-emerald-400;
}

/* Drag and drop styles */
.drag-over {
  @apply bg-golden-100/80 dark:bg-emerald-900/80 border-2 border-dashed border-sage-400 dark:border-emerald-400;
}
```

## File Structure

Create the following directory structure:

```
src/
├── components/
│   └── documents/
│       ├── CropDashboard.tsx
│       ├── DocumentFinder.tsx
│       ├── SupplierFolderRow.tsx
│       ├── FileRow.tsx
│       ├── MobileDocumentView.tsx
│       └── index.ts
├── hooks/
│   └── useDocumentFinder.ts
├── types/
│   └── document-finder.ts
└── design-system/
    ├── finder-interface-spec.md
    └── implementation-guide.md
```

## Step-by-Step Implementation

### Step 1: Type Definitions
First, ensure the TypeScript interfaces are properly imported:

```typescript
// src/types/document-finder.ts is already created
// Import in your component files:
import type { 
  SupplierDocument, 
  SupplierFolder, 
  CropInformation,
  FinderViewState 
} from '@/types/document-finder';
```

### Step 2: Component Integration
Create an index file for easy imports:

```typescript
// src/components/documents/index.ts
export { default as CropDashboard } from './CropDashboard';
export { default as DocumentFinder } from './DocumentFinder';
export { default as SupplierFolderRow } from './SupplierFolderRow';
export { default as FileRow } from './FileRow';
export { default as MobileDocumentView } from './MobileDocumentView';
export { useDocumentFinder } from '../../hooks/useDocumentFinder';
```

### Step 3: Enhanced Modal Integration
Add the Finder interface to your existing DocumentsTab:

```typescript
// src/components/dashboard/tabs/DocumentsTab.tsx
import React from 'react';
import { CropDashboard, DocumentFinder } from '@/components/documents';
import { useDocumentFinder } from '@/components/documents';

export const DocumentsTab: React.FC = () => {
  const { state, actions } = useDocumentFinder();

  return (
    <div className="documents-tab h-full flex flex-col">
      {/* Crop Information Dashboard */}
      <CropDashboard 
        className="flex-shrink-0 mb-6"
        cropInformation={state.cropInformation}
        loading={state.loading}
        onDocumentClick={(document) => {
          // Handle document click - open in modal or new tab
          console.log('Open document:', document);
        }}
        onRefresh={actions.refresh}
      />
      
      {/* Main Finder Interface */}
      <DocumentFinder 
        className="flex-1 min-h-0"
        suppliers={state.suppliers}
        viewState={state.viewState}
        onNavigate={actions.navigateBreadcrumb}
        onSelectItem={actions.selectItem}
        onSearch={actions.search}
        onFilter={actions.applyFilters}
        onSort={actions.changeSorting}
        onBulkAction={actions.performBulkAction}
        onUpload={actions.uploadFiles}
        loading={state.loading}
      />
    </div>
  );
};
```

### Step 4: Mobile Responsive Implementation
Add mobile detection and conditional rendering:

```typescript
// src/components/documents/ResponsiveDocumentView.tsx
import React, { useState, useEffect } from 'react';
import { DocumentFinder, MobileDocumentView } from './';
import { useDocumentFinder } from '../hooks/useDocumentFinder';

export const ResponsiveDocumentView: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { state, actions } = useDocumentFinder();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <MobileDocumentView
        suppliers={state.suppliers}
        viewState={state.viewState}
        onNavigate={(path) => actions.navigateBreadcrumb(path.length - 1)}
        onSelectItem={actions.selectItem}
        onSearch={actions.search}
        onBack={() => actions.navigateBreadcrumb(state.viewState.currentPath.length - 2)}
        loading={state.loading}
      />
    );
  }

  return (
    <DocumentFinder
      suppliers={state.suppliers}
      viewState={state.viewState}
      onNavigate={(path) => actions.navigateBreadcrumb(path.length - 1)}
      onSelectItem={actions.selectItem}
      onSearch={actions.search}
      onFilter={actions.applyFilters}
      onSort={actions.changeSorting}
      onBulkAction={actions.performBulkAction}
      onUpload={actions.uploadFiles}
      loading={state.loading}
    />
  );
};
```

### Step 5: API Integration
Replace mock data with actual API calls:

```typescript
// src/services/documents.ts
export class DocumentService {
  static async getSuppliers(): Promise<SupplierFolder[]> {
    const response = await fetch('/api/documents/suppliers', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch suppliers');
    }
    
    return response.json();
  }

  static async getCropInformation(): Promise<CropInformation[]> {
    const response = await fetch('/api/documents/crop-information', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch crop information');
    }
    
    return response.json();
  }

  static async searchDocuments(query: string, filters?: FinderFilters): Promise<SearchResult> {
    const params = new URLSearchParams({ query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, JSON.stringify(value));
        }
      });
    }

    const response = await fetch(`/api/documents/search?${params}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    return response.json();
  }

  static async uploadDocument(file: File, supplierId: string, metadata?: Partial<DocumentMetadata>): Promise<SupplierDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplierId', supplierId);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return response.json();
  }

  static async downloadDocument(documentId: string): Promise<Blob> {
    const response = await fetch(`/api/documents/${documentId}/download`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    return response.blob();
  }

  static async shareDocument(documentId: string, shareOptions: ShareOptions): Promise<void> {
    const response = await fetch(`/api/documents/${documentId}/share`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shareOptions)
    });
    
    if (!response.ok) {
      throw new Error('Share failed');
    }
  }

  static async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Delete failed');
    }
  }
}
```

### Step 6: Update useDocumentFinder Hook
Replace mock implementations with real API calls:

```typescript
// Update src/hooks/useDocumentFinder.ts
import { DocumentService } from '@/services/documents';

// Replace mock data fetching with:
const loadSuppliers = useCallback(async () => {
  setState(prev => ({ ...prev, loading: true }));
  
  try {
    const suppliers = await DocumentService.getSuppliers();
    const cropInformation = await DocumentService.getCropInformation();
    
    setState(prev => ({
      ...prev,
      suppliers,
      cropInformation,
      loading: false,
      error: null
    }));
  } catch (error) {
    setState(prev => ({
      ...prev,
      error: error.message,
      loading: false
    }));
  }
}, []);

// Replace other mock implementations similarly...
```

## Database Schema

### Required Tables
Create these tables in your Supabase database:

```sql
-- Suppliers table enhancement
ALTER TABLE companies ADD COLUMN IF NOT EXISTS supplier_type VARCHAR(50) DEFAULT 'other';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS primary_crops TEXT[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS quality_grade VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS average_annual_volume INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_contact TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS relationship_status VARCHAR(20) DEFAULT 'active';

-- Documents table
CREATE TABLE IF NOT EXISTS supplier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  supplier_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER,
  size BIGINT NOT NULL,
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  kind TEXT NOT NULL,
  extension TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  is_new BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false,
  tags TEXT[],
  access_level TEXT DEFAULT 'team' CHECK (access_level IN ('public', 'private', 'team', 'supplier-only')),
  download_url TEXT,
  preview_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document categories
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  supplier_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crop information table
CREATE TABLE IF NOT EXISTS crop_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  supplier_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES users(id),
  shared_date TIMESTAMPTZ DEFAULT NOW(),
  size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT CHECK (category IN ('forecast', 'harvest-report', 'quality-analysis', 'market-update')),
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT false,
  download_url TEXT NOT NULL,
  thumbnail_url TEXT,
  preview_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier_year ON supplier_documents(supplier_id, year);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_search ON supplier_documents USING gin(to_tsvector('english', name || ' ' || COALESCE(tags::text, '')));
CREATE INDEX IF NOT EXISTS idx_crop_information_supplier ON crop_information(supplier_id);
CREATE INDEX IF NOT EXISTS idx_crop_information_date ON crop_information(shared_date DESC);

-- RLS Policies
ALTER TABLE supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_information ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth system)
CREATE POLICY "Users can view documents for their company" ON supplier_documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own documents" ON supplier_documents
  FOR ALL USING (created_by = auth.uid());
```

### API Endpoints
Create these API routes:

```typescript
// src/app/api/documents/suppliers/route.ts
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  
  const { data: suppliers, error } = await supabase
    .from('companies')
    .select(`
      *,
      supplier_documents!supplier_documents_supplier_id_fkey (
        id,
        name,
        year,
        size,
        last_modified,
        kind
      )
    `)
    .eq('supplier_type', 'cooperative')
    .or('supplier_type.eq.farm,supplier_type.eq.exporter');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform data to match SupplierFolder interface
  const transformedSuppliers = suppliers.map(supplier => ({
    id: supplier.id,
    name: supplier.name,
    path: `/documents/${supplier.name.toLowerCase().replace(/\s+/g, '-')}`,
    supplierId: supplier.id,
    itemCount: supplier.supplier_documents?.length || 0,
    documentCount: supplier.supplier_documents?.length || 0,
    folderCount: 0,
    totalSize: supplier.supplier_documents?.reduce((sum: number, doc: any) => sum + doc.size, 0) || 0,
    lastModified: supplier.updated_at,
    createdDate: supplier.created_at,
    subFolders: [], // Populate year folders
    recentDocuments: supplier.supplier_documents?.slice(0, 5) || [],
    supplierInfo: {
      id: supplier.id,
      name: supplier.name,
      country: supplier.country || 'Unknown',
      region: supplier.region,
      contactPerson: supplier.contact_person || 'Unknown',
      email: supplier.email || '',
      relationshipStatus: supplier.relationship_status || 'active',
      supplierType: supplier.supplier_type || 'other',
      certifications: supplier.certifications || [],
      primaryCrops: supplier.primary_crops || [],
      qualityGrade: supplier.quality_grade,
      lastContact: supplier.last_contact
    }
  }));

  return NextResponse.json(transformedSuppliers);
}
```

## Testing Strategy

### Unit Tests
```typescript
// src/components/documents/__tests__/DocumentFinder.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentFinder } from '../DocumentFinder';
import { mockSuppliers, mockViewState } from './mocks';

describe('DocumentFinder', () => {
  const defaultProps = {
    suppliers: mockSuppliers,
    viewState: mockViewState,
    onNavigate: jest.fn(),
    onSelectItem: jest.fn(),
    onSearch: jest.fn(),
    onFilter: jest.fn(),
    onSort: jest.fn(),
    onBulkAction: jest.fn(),
  };

  it('renders supplier folders correctly', () => {
    render(<DocumentFinder {...defaultProps} />);
    
    expect(screen.getByText('Guatemalan Coffee Co-op')).toBeInTheDocument();
    expect(screen.getByText('45 items')).toBeInTheDocument();
  });

  it('handles search input', async () => {
    render(<DocumentFinder {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'Guatemala' } });
    
    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith('Guatemala');
    }, { timeout: 1000 });
  });

  it('handles folder navigation', () => {
    render(<DocumentFinder {...defaultProps} />);
    
    const folderRow = screen.getByText('Guatemalan Coffee Co-op').closest('[data-testid="folder-row"]');
    fireEvent.click(folderRow!);
    
    expect(defaultProps.onNavigate).toHaveBeenCalledWith(['Guatemalan Coffee Co-op']);
  });
});
```

### Integration Tests
```typescript
// src/components/documents/__tests__/DocumentFinder.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsiveDocumentView } from '../ResponsiveDocumentView';
import { DocumentService } from '@/services/documents';

// Mock the DocumentService
jest.mock('@/services/documents');

describe('DocumentFinder Integration', () => {
  beforeEach(() => {
    (DocumentService.getSuppliers as jest.Mock).mockResolvedValue(mockSuppliers);
    (DocumentService.getCropInformation as jest.Mock).mockResolvedValue(mockCropInfo);
  });

  it('loads and displays data correctly', async () => {
    render(<ResponsiveDocumentView />);
    
    await waitFor(() => {
      expect(screen.getByText('Guatemalan Coffee Co-op')).toBeInTheDocument();
    });
    
    expect(DocumentService.getSuppliers).toHaveBeenCalled();
    expect(DocumentService.getCropInformation).toHaveBeenCalled();
  });
});
```

## Performance Optimization

### Virtual Scrolling for Large Lists
```typescript
// src/components/documents/VirtualizedDocumentList.tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedDocumentList: React.FC<{
  items: (SupplierFolder | SupplierDocument)[];
  itemHeight: number;
}> = ({ items, itemHeight }) => {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      {/* Render folder or file component */}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {Row}
    </List>
  );
};
```

### Debounced Search
```typescript
// Already implemented in useDocumentFinder hook with 300ms debounce
```

### Lazy Loading
```typescript
// src/hooks/useInfiniteDocuments.ts
import { useState, useEffect, useCallback } from 'react';

export const useInfiniteDocuments = (supplierId: string) => {
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const newDocuments = await DocumentService.getDocuments(supplierId, page, 20);
      
      setDocuments(prev => [...prev, ...newDocuments]);
      setHasMore(newDocuments.length === 20);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more documents:', error);
    } finally {
      setLoading(false);
    }
  }, [supplierId, page, loading, hasMore]);

  return { documents, loading, hasMore, loadMore };
};
```

## Security Considerations

### File Upload Validation
```typescript
// src/lib/file-validation.ts
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/json',
    'application/zip'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  if (file.size > 100 * 1024 * 1024) { // 100MB limit
    return { valid: false, error: 'File size exceeds 100MB limit' };
  }

  // Check filename for security
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
    return { valid: false, error: 'Invalid filename characters' };
  }

  return { valid: true };
};
```

### Access Control
```typescript
// src/lib/document-permissions.ts
export const checkDocumentAccess = (
  document: SupplierDocument,
  user: User
): boolean => {
  switch (document.accessLevel) {
    case 'public':
      return true;
    case 'private':
      return document.createdById === user.id;
    case 'team':
      return document.supplier === user.companyId;
    case 'supplier-only':
      return document.supplierId === user.companyId;
    default:
      return false;
  }
};
```

## Deployment Checklist

- [ ] All TypeScript interfaces implemented
- [ ] All React components created and tested
- [ ] API endpoints implemented and secured
- [ ] Database tables created with proper indexes
- [ ] RLS policies configured
- [ ] File upload validation implemented
- [ ] Mobile responsive design tested
- [ ] Performance optimization applied
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Accessibility features tested
- [ ] Integration with existing modal system verified
- [ ] Dark mode compatibility confirmed

## Troubleshooting

### Common Issues

1. **Component not rendering**: Check TypeScript interface imports
2. **API calls failing**: Verify authentication cookies are being sent
3. **Mobile layout breaking**: Ensure responsive breakpoints are configured
4. **File uploads not working**: Check file validation and size limits
5. **Search not debouncing**: Verify useEffect dependencies in useDocumentFinder

### Debug Mode
Add to your component for debugging:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('DocumentFinder state:', state);
  console.log('ViewState:', viewState);
}
```

This completes the comprehensive implementation guide for the macOS Finder-style document management interface. The system is now ready for integration into your existing travel application with full support for coffee supply chain document management.