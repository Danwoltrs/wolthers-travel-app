# Development Instructions

This document provides comprehensive guidelines for developing and maintaining the Wolthers Travel App.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git
- VS Code or similar IDE with TypeScript support

### Initial Setup
```bash
# Clone the repository
git clone [repository-url]
cd wolthers-travel-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

## Code Style Guidelines

### TypeScript
- Always use TypeScript for new code
- Define interfaces for all component props
- Use proper type annotations, avoid `any`
- Prefer `type` over `interface` for simple types

### React Components
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop destructuring

Example:
```tsx
interface ComponentProps {
  title: string
  isActive?: boolean
}

export default function Component({ title, isActive = false }: ComponentProps) {
  // Component logic
}
```

### File Organization
- One component per file
- Name files same as the component
- Group related components in folders
- Keep styles close to components

## Design System Implementation

### Using the Color Palette
```tsx
// Primary colors
className="bg-emerald-800" // Header background
className="bg-amber-50"     // Card title background
className="bg-amber-100/50" // Card company section

// Text colors
className="text-pearl-900"  // Primary text
className="text-pearl-700"  // Secondary text
className="text-pearl-500"  // Icon colors
```

### Component Spacing
- Use Tailwind spacing utilities consistently
- Standard padding: `px-6 py-5` for card sections
- Standard margins: `mb-4` between sections
- Icon spacing: `mr-3` for icon-to-text

### Fixed Heights
- TripCard: `h-[420px]`
- Card sections use specific heights for uniformity
- Text sections: `h-12` for consistent alignment

## UI/UX Guidelines

### Glassmorphism Effects
```tsx
// Header glassmorphism
className="bg-emerald-800/90 backdrop-blur-xl"
className="border border-emerald-600/30"
```

### Hover States
- Always include hover states for interactive elements
- Use `transition-all duration-200` for smooth transitions
- Scale effects: `hover:scale-110` for icons
- Color transitions for text and backgrounds

### Responsive Design
- Mobile-first approach
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`
- Hide/show elements appropriately on different screens
- Test on various device sizes

## Component Development

### Creating New Components
1. Define TypeScript interface for props
2. Implement mobile view first
3. Add desktop enhancements
4. Include proper accessibility attributes
5. Document usage with comments

### State Management
- Use local state for component-specific data
- Consider context for shared state
- Keep state as close to usage as possible
- Use proper naming: `isOpen`, `hasError`, etc.

### Performance Considerations
- Memoize expensive calculations
- Use lazy loading for heavy components
- Optimize images and assets
- Minimize re-renders with proper dependencies

## Testing Guidelines

### Component Testing
- Test user interactions
- Verify prop handling
- Check accessibility
- Test responsive behavior

### Integration Testing
- Test data flow between components
- Verify API integrations
- Test error states
- Check loading states

## Deployment Process

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Console free of warnings
- [ ] Responsive design verified
- [ ] Accessibility checked
- [ ] Performance optimized

### Build Process
```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

## Common Patterns

### Date Formatting
```tsx
import { formatDateRange } from '@/lib/utils'

// Usage
formatDateRange(startDate, endDate)
// Output: "Mon 15 Mar - Fri 20 Mar"
```

### Conditional Styling
```tsx
import { cn } from '@/lib/utils'

className={cn(
  'base-classes',
  condition && 'conditional-classes'
)}
```

### Icon Usage
```tsx
import { Calendar } from 'lucide-react'

<Calendar className="w-4 h-4 text-pearl-500" />
```

## Troubleshooting

### Common Issues
1. **Build errors**: Check TypeScript types
2. **Styling issues**: Verify Tailwind classes
3. **State bugs**: Check hook dependencies
4. **Performance**: Profile with React DevTools

### Debug Tools
- React Developer Tools
- Network tab for API calls
- Console for error messages
- Lighthouse for performance

## Contributing

### Git Workflow
1. Create feature branch from `main`
2. Make atomic commits
3. Write descriptive commit messages
4. Submit PR with detailed description
5. Ensure all checks pass

### Code Review
- Check for TypeScript best practices
- Verify component reusability
- Ensure consistent styling
- Test on multiple devices
- Review accessibility

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Patterns](https://reactpatterns.com/)

### Internal Resources
- Design system in Figma
- API documentation
- Database schema
- Deployment guides