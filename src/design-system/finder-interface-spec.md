# macOS Finder-Style Document Management Interface
## Design Specification Document

### Overview
This document provides comprehensive design specifications for implementing a macOS Finder-style document management interface within the coffee supply chain management application. The interface maintains the existing Nordic minimalist design system while introducing professional document organization capabilities.

## Design System Integration

### Color Palette Compliance
**Primary Colors** (from existing system):
- Forest Green: `#2D5347` (`sage-700`)
- Primary Gold: `#f59e0b` (`golden-500`) 
- Light Gold Accent: `#fef3c7` (`golden-100`)
- Background Pearl: `#fcfcfc` (`pearl-50`)
- Text Latte: `#544232` (`latte-800`)

**Finder-Specific Color Enhancements**:
- Selected Row: `bg-golden-100/50 dark:bg-emerald-800/30`
- Hover State: `bg-golden-50 dark:bg-emerald-900/20`
- Active Column Header: `bg-sage-600 dark:bg-emerald-600`
- Folder Icon Primary: `#6b9c6b` (`sage-500`)
- File Type Icons: Contextual colors using existing palette

### Typography System
**Font Family**: Inter (existing system)
**Finder-Specific Text Hierarchy**:
- Column Headers: `text-sm font-semibold text-sage-700 dark:text-emerald-300`
- File/Folder Names: `text-sm font-medium text-latte-800 dark:text-gray-200`
- Metadata Text: `text-xs text-latte-600 dark:text-gray-400`
- Breadcrumb Navigation: `text-sm text-sage-600 dark:text-emerald-400`

## Component Architecture

### 1. CropDashboard Component
**Purpose**: Prominent section for crop forecasts and supplier information files

**Visual Structure**:
```tsx
<div className="crop-dashboard bg-gradient-to-r from-golden-50 to-golden-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-golden-200 dark:border-emerald-700/50 rounded-xl shadow-sm">
  {/* Header */}
  <div className="bg-sage-600 dark:bg-emerald-700 text-white px-6 py-4 rounded-t-xl">
    <h2 className="text-lg font-semibold flex items-center gap-2">
      <FileText className="w-5 h-5" />
      Recent Crop & Supply Information
    </h2>
  </div>
  
  {/* Content Grid */}
  <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {/* Document Cards */}
  </div>
</div>
```

**Document Card Structure**:
```tsx
<div className="document-card group bg-white dark:bg-sage-800/50 border border-golden-200 dark:border-emerald-600/30 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
  <div className="flex items-start gap-3">
    {/* File Type Icon */}
    <div className="flex-shrink-0 w-10 h-10 bg-golden-200 dark:bg-emerald-700 rounded-lg flex items-center justify-center">
      <FileIcon className="w-6 h-6 text-sage-600 dark:text-emerald-300" />
    </div>
    
    {/* File Information */}
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-sm text-latte-800 dark:text-gray-200 truncate">
        Guatemala_Harvest_Forecast_2025.xlsx
      </h3>
      <div className="mt-1 text-xs text-latte-600 dark:text-gray-400 space-y-1">
        <p>Shared by: <span className="font-medium">Daniel Wolthers</span></p>
        <p>Date: Aug 15, 2025 • 2.4 MB</p>
      </div>
    </div>
    
    {/* Actions */}
    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="text-sage-600 dark:text-emerald-400 hover:text-sage-800 dark:hover:text-emerald-200">
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  </div>
</div>
```

### 2. DocumentFinder Component
**Purpose**: Main Finder-style interface with column-based navigation

**Container Structure**:
```tsx
<div className="document-finder bg-white dark:bg-sage-900/50 border border-golden-200 dark:border-emerald-600/30 rounded-xl shadow-lg overflow-hidden">
  {/* Header with Search and Controls */}
  <div className="finder-header bg-gradient-to-r from-sage-600 to-sage-700 dark:from-emerald-700 dark:to-emerald-800 text-white px-6 py-4">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Supplier Documents</h2>
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
          <input
            type="text"
            placeholder="Search documents..."
            className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/70 focus:bg-white/20 focus:border-white/40 transition-all"
          />
        </div>
        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-md transition-colors">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-md transition-colors">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* Breadcrumb Navigation */}
  <div className="breadcrumb-nav bg-golden-50 dark:bg-emerald-900/20 px-6 py-3 border-b border-golden-200 dark:border-emerald-600/30">
    <nav className="flex items-center gap-2 text-sm">
      <button className="text-sage-600 dark:text-emerald-400 hover:text-sage-800 dark:hover:text-emerald-200">
        Documents
      </button>
      <ChevronRight className="w-4 h-4 text-latte-600 dark:text-gray-400" />
      <span className="text-latte-800 dark:text-gray-200 font-medium">Colombian Premium Exports</span>
    </nav>
  </div>

  {/* Main Finder Table */}
  <div className="finder-table">
    {/* Column Headers */}
    <div className="table-header bg-latte-100 dark:bg-sage-800 border-b border-golden-200 dark:border-emerald-600/30">
      <div className="grid grid-cols-finder px-6 py-3 text-sm font-semibold text-sage-700 dark:text-emerald-300">
        <div className="flex items-center gap-2 cursor-pointer hover:text-sage-900 dark:hover:text-emerald-200">
          Name
          <ArrowUpDown className="w-3 h-3" />
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-sage-900 dark:hover:text-emerald-200">
          Date Modified
          <ArrowUpDown className="w-3 h-3" />
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-sage-900 dark:hover:text-emerald-200">
          Size
          <ArrowUpDown className="w-3 h-3" />
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-sage-900 dark:hover:text-emerald-200">
          Kind
          <ArrowUpDown className="w-3 h-3" />
        </div>
      </div>
    </div>

    {/* Table Body */}
    <div className="table-body max-h-96 overflow-y-auto">
      {/* Folder/File Rows */}
    </div>
  </div>
</div>
```

### 3. SupplierFolder Component
**Purpose**: Expandable folder component with visual hierarchy

```tsx
<div className="supplier-folder group">
  <div 
    className="folder-row flex items-center gap-3 px-6 py-3 hover:bg-golden-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors grid grid-cols-finder"
    onClick={toggleExpanded}
  >
    {/* Name Column with Folder Icon */}
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
        )}
        <Folder className="w-5 h-5 text-sage-500 dark:text-emerald-500" />
      </div>
      <span className="font-medium text-latte-800 dark:text-gray-200">
        {folderName}
      </span>
      <span className="text-xs text-latte-500 dark:text-gray-500 bg-latte-200 dark:bg-sage-700 px-2 py-1 rounded-full">
        {itemCount} items
      </span>
    </div>

    {/* Date Column */}
    <div className="text-sm text-latte-600 dark:text-gray-400">
      {lastModified}
    </div>

    {/* Size Column */}
    <div className="text-sm text-latte-600 dark:text-gray-400">
      --
    </div>

    {/* Kind Column */}
    <div className="text-sm text-latte-600 dark:text-gray-400">
      Folder
    </div>
  </div>

  {/* Expanded Content */}
  {isExpanded && (
    <div className="folder-contents bg-golden-25 dark:bg-emerald-950/20">
      {subFolders.map(folder => (
        <SubFolderRow key={folder.id} folder={folder} />
      ))}
      {files.map(file => (
        <FileRow key={file.id} file={file} />
      ))}
    </div>
  )}
</div>
```

### 4. FileRow Component
**Purpose**: Individual file display with metadata and interactions

```tsx
<div className="file-row group flex items-center gap-3 px-6 py-3 hover:bg-golden-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors grid grid-cols-finder">
  {/* Name Column with File Icon */}
  <div className="flex items-center gap-3">
    <div className="w-8" /> {/* Indent for hierarchy */}
    <FileTypeIcon type={file.extension} className="w-5 h-5" />
    <div className="flex-1 min-w-0">
      <span className="text-sm text-latte-800 dark:text-gray-200 truncate block">
        {file.name}
      </span>
      {file.isNew && (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          New
        </span>
      )}
    </div>
  </div>

  {/* Date Column */}
  <div className="text-sm text-latte-600 dark:text-gray-400">
    {formatDate(file.lastModified)}
  </div>

  {/* Size Column */}
  <div className="text-sm text-latte-600 dark:text-gray-400">
    {formatFileSize(file.size)}
  </div>

  {/* Kind Column */}
  <div className="text-sm text-latte-600 dark:text-gray-400">
    {file.kind}
  </div>

  {/* Actions (shown on hover) */}
  <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
    <button className="p-1 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors">
      <Download className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
    </button>
    <button className="p-1 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors">
      <Share className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
    </button>
    <button className="p-1 hover:bg-sage-200 dark:hover:bg-emerald-700 rounded transition-colors">
      <MoreVertical className="w-4 h-4 text-sage-600 dark:text-emerald-400" />
    </button>
  </div>
</div>
```

## Interaction Patterns

### 1. Selection States
**Single Selection**:
- Background: `bg-golden-200 dark:bg-emerald-700/50`
- Border: `border-l-4 border-sage-600 dark:border-emerald-400`
- Text: Enhanced contrast for readability

**Multiple Selection**:
- Checkbox appears on hover/selection
- Selected items maintain golden highlight
- Bulk actions toolbar appears at top

### 2. Hover Effects
**Row Hover**:
```css
.file-row:hover,
.folder-row:hover {
  @apply bg-golden-50 dark:bg-emerald-900/20 shadow-sm;
}
```

**Icon Hover**:
```css
.folder-icon:hover {
  @apply text-sage-600 dark:text-emerald-300 scale-105;
  transition: all 0.2s ease;
}
```

### 3. Loading States
**Folder Expansion Loading**:
```tsx
<div className="flex items-center gap-2 px-6 py-3">
  <RefreshCw className="w-4 h-4 animate-spin text-sage-600 dark:text-emerald-400" />
  <span className="text-sm text-latte-600 dark:text-gray-400">Loading...</span>
</div>
```

**Empty States**:
```tsx
<div className="empty-state text-center py-12">
  <Folder className="w-16 h-16 text-latte-400 dark:text-gray-600 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-latte-700 dark:text-gray-300 mb-2">
    No documents found
  </h3>
  <p className="text-latte-600 dark:text-gray-400">
    This supplier folder is empty. Upload documents to get started.
  </p>
</div>
```

## Responsive Design

### Desktop (1024px+)
- Full column layout with resizable columns
- Hover actions visible
- Breadcrumb navigation expanded
- Search bar in header

### Tablet (768px - 1023px)
- Compressed column layout
- Actions moved to context menu
- Simplified breadcrumb
- Touch-friendly row height (48px minimum)

### Mobile (< 768px)
- Stack layout replacing columns
- Card-based file representation
- Bottom sheet for folder contents
- Pull-to-refresh functionality

```tsx
{/* Mobile File Card */}
<div className="mobile-file-card bg-white dark:bg-sage-800/50 border border-golden-200 dark:border-emerald-600/30 rounded-lg p-4 mb-3">
  <div className="flex items-start gap-3">
    <FileTypeIcon className="w-8 h-8 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-latte-800 dark:text-gray-200 truncate">
        {file.name}
      </h3>
      <div className="text-sm text-latte-600 dark:text-gray-400 mt-1">
        {file.size} • {formatDate(file.lastModified)}
      </div>
    </div>
    <button className="p-2 text-sage-600 dark:text-emerald-400">
      <MoreVertical className="w-5 h-5" />
    </button>
  </div>
</div>
```

## Accessibility Features

### Keyboard Navigation
- Tab navigation through all interactive elements
- Arrow keys for list navigation
- Space bar for selection
- Enter for opening folders/files
- Escape for canceling operations

### Screen Reader Support
```tsx
{/* ARIA Labels and Descriptions */}
<div 
  role="gridcell" 
  aria-describedby={`file-${file.id}-desc`}
  aria-selected={isSelected}
>
  <span id={`file-${file.id}-desc`} className="sr-only">
    {file.name}, {file.kind}, {file.size}, modified {formatDate(file.lastModified)}
  </span>
</div>
```

### Focus Management
```css
.focus-visible {
  @apply outline-2 outline-sage-600 dark:outline-emerald-400 outline-offset-2;
}
```

## File Type Icons

### Icon Mapping
```tsx
const getFileTypeIcon = (extension: string) => {
  const iconMap = {
    'pdf': { icon: FileText, color: 'text-red-500' },
    'xlsx': { icon: FileSpreadsheet, color: 'text-green-600' },
    'docx': { icon: FileText, color: 'text-blue-600' },
    'json': { icon: Braces, color: 'text-yellow-600' },
    'csv': { icon: FileBarChart, color: 'text-purple-600' },
    'zip': { icon: Archive, color: 'text-gray-600' },
    'default': { icon: File, color: 'text-latte-600 dark:text-gray-400' }
  };
  
  return iconMap[extension] || iconMap.default;
};
```

## Implementation Guidelines

### CSS Grid Configuration
```css
.grid-cols-finder {
  grid-template-columns: 1fr auto auto auto;
}

@media (min-width: 768px) {
  .grid-cols-finder {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
}
```

### Tailwind Custom Classes
```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      gridTemplateColumns: {
        'finder': '2fr 1fr 1fr 1fr',
        'finder-mobile': '1fr auto',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    }
  }
}
```

### Performance Considerations
- Virtual scrolling for large document lists
- Lazy loading of folder contents
- Debounced search (300ms)
- Optimistic UI updates for interactions
- Efficient re-rendering with React.memo

## Integration with Existing System

### Modal Integration
The Finder interface integrates with the existing Enhanced Quick View Modal system:

```tsx
{/* DocumentsTab.tsx enhancement */}
<div className="documents-tab h-full flex flex-col">
  <CropDashboard className="flex-shrink-0 mb-6" />
  <DocumentFinder className="flex-1 min-h-0" />
</div>
```

### Data Structure
```typescript
interface SupplierDocument {
  id: string;
  name: string;
  path: string;
  supplier: string;
  year: number;
  size: number;
  lastModified: Date;
  createdBy: string;
  kind: string;
  extension: string;
  isNew?: boolean;
  tags?: string[];
}

interface SupplierFolder {
  id: string;
  name: string;
  path: string;
  itemCount: number;
  lastModified: Date;
  subFolders: SupplierFolder[];
  documents: SupplierDocument[];
}
```

This design specification provides a comprehensive foundation for implementing the macOS Finder-style document management interface while maintaining perfect harmony with your existing Nordic minimalist design system.