# Sidebar Component

A complete, responsive sidebar navigation component for the project management application.

## Features

- ✅ **Collapsible Design**: Toggle between full (with labels) and mini (icons only) views
- ✅ **Active State Highlighting**: Purple background (#6366f1) for the currently active navigation item
- ✅ **Smooth Transitions**: 300ms transitions for collapse/expand and hover states
- ✅ **Responsive Design**: Adapts to different screen sizes
- ✅ **User Profile Section**: Displays user avatar and name at the bottom
- ✅ **Hover Effects**: Subtle background changes on hover for better UX
- ✅ **TypeScript Support**: Fully typed with TypeScript interfaces

## Components

### Main Components

- **`Sidebar`**: Main component that manages state and switches between full/mini views
- **`SidebarFull`**: Expanded sidebar with icons and labels
- **`SidebarMini`**: Collapsed sidebar with icons only
- **`SidebarItem`**: Individual navigation item component

### Files Structure

```
Sidebar/
├── Sidebar.tsx          # Main component with state management
├── SidebarFull.tsx      # Full width sidebar
├── SidebarMini.tsx      # Collapsed sidebar
├── SidebarItem.tsx      # Navigation item component
├── types.ts             # TypeScript type definitions
├── constants.ts         # Navigation items and user profile data
├── index.ts             # Exports
└── README.md            # This file
```

## Usage

### Basic Usage

```tsx
import Sidebar from './component/layout/Sidebar';

function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1">
        {/* Your content here */}
      </main>
    </div>
  );
}
```

### With Custom Props

```tsx
<Sidebar 
  defaultCollapsed={false}
  currentPath="/app-library"
  onNavigate={(path) => console.log('Navigating to:', path)}
  className="custom-class"
/>
```

## Props

### SidebarProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `defaultCollapsed` | `boolean` | `false` | Initial collapsed state |
| `currentPath` | `string` | `location.pathname` | Current active path |
| `onNavigate` | `(path: string) => void` | Uses `react-router` navigate | Custom navigation handler |

## Navigation Items

The navigation items are defined in `constants.ts`:

- **App Library** - `/app-library`
- **Teams** - `/teams`
- **Knowledge Center** - `/knowledge-center`
- **Notifications** - `/notifications`

### Customizing Navigation Items

Edit `constants.ts` to add, remove, or modify navigation items:

```ts
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'your-item',
    label: 'Your Label',
    icon: YourIcon, // From lucide-react
    path: '/your-path',
  },
  // ... more items
];
```

## Design Tokens

The sidebar uses CSS custom properties defined in `index.css`:

```css
--color-primary: #6366f1          /* Active state background */
--color-primary-hover: #4f46e5    /* Active state hover */
--color-sidebar-bg: #ffffff       /* Sidebar background */
--color-sidebar-text: #1f2937     /* Primary text color */
--color-sidebar-text-secondary: #6b7280  /* Secondary text */
--color-sidebar-hover: #f3f4f6    /* Hover background */
--color-user-avatar: #f97316      /* User avatar background */
```

## Icons

Uses [Lucide React](https://lucide.dev/) for all icons:

- `LayoutGrid` - App Library
- `Users` - Teams
- `BookOpen` - Knowledge Center
- `Bell` - Notifications
- `ChevronLeft` / `ChevronRight` - Collapse/Expand toggle
- `ChevronDown` - User profile dropdown

## User Profile

The user profile is displayed at the bottom of the sidebar. Configure it in `constants.ts`:

```ts
export const USER_PROFILE: UserProfile = {
  name: 'Your Name',
  initials: 'YN',
};
```

## Styling

The sidebar uses Tailwind CSS v4 for styling. Key classes:

- `sidebar-transition` - Custom transition utility for smooth animations
- Color utilities use CSS variables: `bg-(--color-primary)`
- Width transitions: `w-64` (full) ↔ `w-20` (mini)

## Testing

The sidebar has been tested with:

- ✅ Collapse/Expand functionality
- ✅ Navigation item clicks
- ✅ Active state changes
- ✅ Hover states
- ✅ Responsive behavior
- ✅ TypeScript type checking

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Dependencies

- `react` ^19.2.0
- `react-router-dom` ^7.13.0
- `lucide-react` ^0.563.0
- `clsx` ^2.1.1
- `tailwindcss` ^4.1.18
