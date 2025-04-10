# SafeIdea Style Guide

This style guide defines the visual and interactive standards for the SafeIdea project. All changes to the SafeIdea web applications should adhere to these guidelines to maintain brand consistency and optimal user experience across devices.

> **IMPORTANT**: Component-specific requirements take precedence over general guidelines in this document.

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Design System](#design-system)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Components](#components)
6. [Layouts & Patterns](#layouts--patterns)
7. [Mobile Optimization](#mobile-optimization)
8. [Accessibility](#accessibility)
9. [Code Style](#code-style)

## Brand Identity

### Logo Usage

- The SafeIdea logo is primarily the yellow and black SVG (`/svg/Black+Yellow.svg`)
- Logo size: 32px × 32px as established in NavigationHeader
- Use with `rounded-full` class to maintain circular appearance
- Position in top-left corner of navigation headers

### Tone & Voice

- Professional yet approachable
- Clear and concise
- Focus on security and trust
- Emphasize innovation and protection of intellectual property

## Design System

The conciliator project uses a shadcn/ui based component system with Tailwind CSS for styling. The design system follows these core principles:

### Core Design Principles

- **Dark Theme First**: The application is designed primarily for dark mode
- **Gradient Backgrounds**: Utilizing deep blue-to-dark gradients (from `#2B5B75` to `#1A1B25`)
- **Glassmorphism**: Semi-transparent, blurred UI elements with subtle borders
- **Rounded Corners**: UI elements use rounded corners (defined by `--radius` in CSS variables)
- **Motion & Animation**: Subtle transitions and hover effects (scale, shadow changes)

### CSS Variables

The design system uses CSS variables defined in `globals.css`:

```css
:root {
  --background: 240 14% 13%; /* #1A1B25 */
  --foreground: 215 26% 76%; /* #B4BCD0 */
  --primary: 198 94% 67%; /* #5CC3FA - bright blue */
  --secondary: 348 100% 78%; /* #FF91A5 - pink accent */
  --accent: 280 38% 78%; /* #CDB4DB - lavender accent */
  --brand: 51 100% 50%; /* gold */
  --radius: 0.75rem;
  --gradient-start: 203 47% 36%; /* #2B5B75 */
  --gradient-end: 240 14% 13%; /* #1A1B25 */
}
```

These variables should be used consistently to maintain a cohesive look and feel.

## Color Palette

### Primary Colors

- **Brand Blue**: `hsl(var(--primary))` → `#5CC3FA`
- **Brand Yellow/Gold**: `hsl(var(--brand))` → `#FFC700`
- **Brand Black**: `hsl(var(--background))` → `#1A1B25`

### Secondary Colors

- **Accent Pink**: `hsl(var(--secondary))` → `#FF91A5`
- **Accent Lavender**: `hsl(var(--accent))` → `#CDB4DB`
- **Deep Blue**: `hsl(var(--gradient-start))` → `#2B5B75`

### Neutral Colors

- **Text Color**: `hsl(var(--foreground))` → `#B4BCD0`
- **Muted Background**: `hsl(var(--muted))` → darker shade of background
- **Border Color**: `hsl(var(--border))` → `rgba(255, 255, 255, 0.1)`

### Semantic Colors

- **Success**: Not explicitly defined, use green accent when needed
- **Warning**: Not explicitly defined, use yellow/gold accent when needed
- **Error/Destructive**: `hsl(var(--destructive))` → reddish hue
- **Info**: Use primary blue

### Color Usage Guidelines

- Use primary blue for interactive elements and calls to action
- Use brand yellow/gold sparingly for branding accents
- Use lavender and pink accents for visual interest and to highlight content
- Use transparent overlays with subtle blur effects for cards and modal backgrounds

## Typography

### Font Family

The application uses the system font stack through Tailwind's defaults:

```
font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
```

### Text Sizes

Follow Tailwind's sizing scale:

- **Headings**:
  - H1: `text-4xl` (2.25rem)
  - H2: `text-3xl` (1.875rem)
  - H3: `text-2xl` (1.5rem)
  - H4: `text-xl` (1.25rem)
  - H5: `text-lg` (1.125rem)
  - H6: `text-base` (1rem)

- **Body**:
  - Default: `text-base` (1rem)
  - Small: `text-sm` (0.875rem)
  - Extra Small: `text-xs` (0.75rem)

### Font Weights

- Regular: `font-normal` (400)
- Medium: `font-medium` (500)
- Bold: `font-bold` (700)

### Line Heights

- Default: `leading-normal` (1.5)
- Tight: `leading-tight` (1.25)
- Loose: `leading-loose` (2)

## Components

The project uses shadcn/ui components with custom styling. These components have specific design requirements that must be maintained:

### Buttons

As defined in `button.tsx`, buttons have these characteristics:

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background shadow-lg hover:shadow-xl hover:scale-105',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
        glass: 'backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 text-white',
      },
      size: {
        default: 'h-11 py-2 px-6',
        sm: 'h-9 px-4 rounded-lg',
        lg: 'h-12 px-8 rounded-xl text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

**Key Button Requirements:**
- **Rounded Corners**: Use `rounded-xl` (extra large radius)
- **Animations**: Include `hover:scale-105` and shadow transitions
- **Glass Effect**: For semi-transparent buttons, use the `glass` variant
- **Primary Action**: Use the `default` variant (blue background)
- **Secondary Actions**: Use `outline`, `ghost`, or `secondary` variants
- **Destructive Actions**: Use `destructive` variant

### Cards

Cards use a consistent style with the following characteristics:

- Rounded corners (`rounded-xl`)
- Glass-like effect when appropriate
- Organized with `CardHeader`, `CardTitle`, `CardDescription`, and `CardContent`
- Clear hierarchy with title and optional description
- Padding follows a consistent pattern

### Navigation

The NavigationHeader component has specific requirements:

- Logo on left (32px × 32px, rounded)
- Horizontally aligned menu items in center
- Transparent background
- Spacer on right side for balance (150px width)
- Use Menubar component from shadcn/ui

### Authentication Components

- **AuthButton**: Use default button variant, customizable text
- **LogoffButton**: Use ghost variant for better integration with nav
- Always include loading states when authentication actions are in progress

### Input Fields

- Use shadcn/ui Input component
- Maintain consistent styling with buttons (rounded corners)
- Include proper labeling and error states
- Use Textarea for multi-line input

## Layouts & Patterns

### Page Structure

- **Header**: Always include NavigationHeader
- **Content**: Centered with appropriate max-width
- **Cards**: Use Card components for content grouping
- **Footer**: Include consistent footer on all pages

### Common Patterns

- **Authentication Flow**: Modal-based login/signup
- **Form Layouts**: Vertical stacking, consistent spacing
- **Error Handling**: Use Alert component for errors
- **Loading States**: Use Loader2 icon from lucide-react

## Mobile Optimization

### Responsive Design Principles

- Design for mobile-first
- Use flexbox and grid for layouts
- Test on multiple screen sizes

### Touch Targets

- Buttons: Minimum 44px height for comfortable tapping
- Navigation items: Well-spaced for touch
- Forms: Full-width inputs on mobile

### Layout Adjustments

- Stack elements vertically on small screens
- Reduce padding by ~30%
- Consider hiding or collapsing secondary elements
- Ensure text remains readable without zooming

## Accessibility

### Color Contrast

- Maintain minimum 4.5:1 contrast ratio for text
- Use Tailwind's foreground colors which are designed for proper contrast

### Keyboard Navigation

- All interactive elements must be focusable
- Use proper focus styles (`focus-visible:ring-2`)
- Test keyboard navigation flows

### Screen Readers

- Use semantic HTML
- Include proper aria attributes
- Add descriptive alt text to images

## Code Style

### CSS/Tailwind

- Use Tailwind utility classes consistently
- Follow component class order:
  1. Layout (display, position)
  2. Box model (width, height, margin, padding)
  3. Typography
  4. Visual (background, border, shadow)
  5. Other
- Use the `cn()` utility for merging class names

```tsx
// Example of proper class ordering
className={cn(
  "flex items-center justify-between", // Layout
  "w-full p-4 mb-4", // Box model
  "text-sm font-medium", // Typography
  "bg-background rounded-lg shadow-md", // Visual
  className // Allow custom overrides
)}
```

### React/TypeScript

- Use function components with explicit TypeScript types
- Props should be properly typed with interfaces
- Use shadcn/ui components
- Follow naming conventions:
  - PascalCase for components and interfaces
  - camelCase for functions and variables

### Best Practices

- Run linters before committing: `pnpm lint:biome`
- Format code: `pnpm format`
- Ensure mobile responsiveness
- Test across different browsers

---

This style guide is a living document based on the current implementation of the SafeIdea conciliator project. Component-specific requirements take precedence over general guidelines. For questions or suggestions, please contact the design team.