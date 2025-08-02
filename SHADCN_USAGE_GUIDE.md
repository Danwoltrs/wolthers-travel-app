# shadcn/ui Usage Guide for Wolthers Travel App

This guide will help you use the newly installed shadcn/ui components to create beautiful, consistent interfaces for your travel management application.

## What is shadcn/ui?

shadcn/ui is a collection of beautifully designed, accessible, and customizable components built on top of Radix UI primitives. These components are now integrated with your Danish minimalist design system.

## Available Components

The following components have been installed and are ready to use:

### Core Components
- **Button** - Interactive buttons with multiple variants
- **Card** - Container component for grouping content
- **Input** - Text input fields
- **Label** - Labels for form fields
- **Textarea** - Multi-line text input
- **Select** - Dropdown selection component

### Interactive Components
- **Dialog** - Modal dialogs and popups
- **Popover** - Floating content containers
- **Tabs** - Tabbed navigation interface
- **Calendar** - Date picker component

### Display Components
- **Badge** - Status indicators and tags
- **Alert** - Important messages and notifications
- **Progress** - Progress bars and indicators
- **Separator** - Visual dividers

### Form Components
- **Form** - Complete form handling with validation

## How to Use Components

### 1. Import Components

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
```

### 2. Basic Usage Examples

#### Buttons
```tsx
// Primary button (matches your sage green theme)
<Button>Create Trip</Button>

// Secondary button (matches your latte brown theme)
<Button variant="secondary">Cancel</Button>

// Outline button
<Button variant="outline">Edit</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

#### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Trip to Copenhagen</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Business meeting with client</p>
  </CardContent>
</Card>
```

#### Form Elements
```tsx
<div className="space-y-2">
  <Label htmlFor="destination">Destination</Label>
  <Input id="destination" placeholder="Enter destination..." />
</div>
```

#### Status Badges
```tsx
// Trip status indicators
<Badge className="bg-emerald-100 text-emerald-800">Confirmed</Badge>
<Badge className="bg-amber-100 text-amber-800">Pending</Badge>
<Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
```

### 3. Travel-Specific Examples

#### Trip Card with Status
```tsx
<Card className="w-full max-w-md">
  <CardHeader>
    <div className="flex justify-between items-start">
      <CardTitle>Copenhagen Business Trip</CardTitle>
      <Badge className="bg-emerald-100 text-emerald-800">Confirmed</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <p className="text-sm text-gray-600">March 15-18, 2024</p>
      <p className="text-sm">Meeting with Danske Bank</p>
      <div className="flex items-center gap-2 mt-4">
        <Button size="sm">View Details</Button>
        <Button variant="outline" size="sm">Edit</Button>
      </div>
    </div>
  </CardContent>
</Card>
```

#### Quick Form Dialog
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Add New Trip</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Trip</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Trip Name</Label>
        <Input id="name" placeholder="Enter trip name..." />
      </div>
      <div>
        <Label htmlFor="destination">Destination</Label>
        <Input id="destination" placeholder="Where are you going?" />
      </div>
      <div className="flex gap-2">
        <Button>Create Trip</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

## Design Integration

### Color Scheme
The components automatically use your Danish minimalist color palette:
- **Primary**: Sage green (`sage-500`) for main actions
- **Secondary**: Latte brown (`latte-100`) for secondary actions
- **Background**: Pearl white (`pearl-50`) for clean backgrounds
- **Text**: Latte dark (`latte-800`) for readable text

### Styling Tips

1. **Consistent Spacing**: Use Tailwind's spacing classes (`space-y-4`, `gap-2`, etc.)
2. **Responsive Design**: Use responsive classes (`md:grid-cols-2`, `lg:max-w-4xl`)
3. **Color Consistency**: Stick to your palette colors when customizing
4. **Typography**: Use existing text sizes (`text-sm`, `text-lg`) for consistency

### Custom Styling
You can customize any component by adding additional classes:

```tsx
<Button className="bg-sage-600 hover:bg-sage-700">
  Custom Styled Button
</Button>
```

## Component Combinations

### Dashboard Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {trips.map(trip => (
    <Card key={trip.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-lg">{trip.name}</CardTitle>
          <Badge variant="outline">{trip.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{trip.destination}</p>
        <Button size="sm" className="w-full">View Details</Button>
      </CardContent>
    </Card>
  ))}
</div>
```

### Form with Validation
```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField
      control={form.control}
      name="destination"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Destination</FormLabel>
          <FormControl>
            <Input placeholder="Enter destination" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

## Adding More Components

To add additional shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Popular components you might want to add:
- `table` - For data tables
- `dropdown-menu` - For action menus
- `tooltip` - For helpful hints
- `accordion` - For collapsible content
- `sheet` - For side panels
- `toast` - For notifications

## Best Practices

1. **Consistency**: Always use the provided components instead of creating custom ones
2. **Accessibility**: The components are built with accessibility in mind - don't override ARIA attributes
3. **Performance**: Import only the components you need
4. **Testing**: Test your interfaces on different screen sizes
5. **Documentation**: Comment your code when using complex component combinations

## Troubleshooting

### Common Issues:

1. **Import Errors**: Make sure you're importing from `@/components/ui/[component]`
2. **Styling Issues**: Check that Tailwind classes aren't being overridden
3. **Build Errors**: Ensure all Radix UI dependencies are installed

### Getting Help:

- Check the [shadcn/ui documentation](https://ui.shadcn.com)
- Look at the example component in `/src/components/examples/ShadcnExample.tsx`
- Review existing components in your project for patterns

## Example Component Location

A complete example showing all components in action is available at:
`/src/components/examples/ShadcnExample.tsx`

You can reference this file to see how components work together and copy patterns for your own use.

---

**Next Steps**: Start by replacing existing buttons and form elements with shadcn/ui components, then gradually integrate more complex components like dialogs and tabs as needed.