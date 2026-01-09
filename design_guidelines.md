# Design Guidelines: Google AI Studio File Import for React

## Design Approach
**Selected System:** Material Design 3  
**Rationale:** Seamless integration with Google ecosystem, excellent for file management interfaces, strong component patterns for data-heavy applications.

## Typography System
- **Primary Font:** Inter (Google Fonts)
- **Headings:** 
  - H1: 2.5rem (40px), font-weight 700
  - H2: 2rem (32px), font-weight 600
  - H3: 1.5rem (24px), font-weight 600
- **Body:** 1rem (16px), font-weight 400, line-height 1.6
- **Code/Technical:** JetBrains Mono, 0.875rem (14px)
- **Small/Meta:** 0.875rem (14px), font-weight 500

## Layout System
**Spacing Units:** Tailwind scale: 2, 4, 6, 8, 12, 16, 24  
**Container:** max-w-7xl, px-6 md:px-8  
**Sections:** py-12 md:py-16  
**Grid System:** 12-column responsive grid

## Core Components

### Navigation
- **Top Bar:** Fixed header with logo, project name, import status indicator, user menu
- **Breadcrumbs:** Below header showing navigation path
- **Height:** h-16, shadow-sm

### File Import Interface
**Main Layout:** Two-column split (lg:grid-cols-[300px_1fr])

**Left Sidebar:**
- Project selector dropdown
- File type filters (checkboxes)
- Import history list
- Spacing: p-6, gap-4

**Main Content Area:**
- Drag-and-drop zone (h-64, border-2 border-dashed, rounded-lg, p-12)
- File preview table with columns: Name, Type, Size, Status, Actions
- Pagination controls
- Bulk action toolbar

### Data Display
**File Table:**
- Row height: h-12
- Alternating row treatment
- Sortable headers with icons (Heroicons)
- Inline actions (view, delete, download)
- Selection checkboxes

**Status Indicators:**
- Pills/badges for import status (px-3, py-1, rounded-full, text-sm)
- Progress bars for ongoing imports (h-2, rounded-full)

### Forms & Inputs
**Search Bar:** 
- Full-width, h-12, rounded-lg
- Leading search icon, trailing clear button
- Placeholder: "Search files..."

**Dropdowns/Selects:**
- h-12, rounded-lg, px-4
- Chevron indicator

**Buttons:**
- Primary: px-6, py-3, rounded-lg, font-medium
- Secondary: px-6, py-3, rounded-lg, border-2
- Icon buttons: w-10, h-10, rounded-full

### Modals & Overlays
**Import Configuration Modal:**
- max-w-2xl, rounded-xl, p-8
- Header with title and close button
- Form fields in gap-6 stack
- Footer with action buttons (gap-4, justify-end)

**Toast Notifications:**
- Fixed bottom-right positioning
- max-w-sm, rounded-lg, p-4, shadow-lg
- Auto-dismiss after 5s

## Page Sections

### Hero/Header Area
**No large hero image** - utility-focused interface  
- Clean header with app title "Google AI Studio File Importer"
- Subtitle explaining functionality (1-2 lines)
- Primary CTA: "Import New Files" button
- Recent activity summary cards (3-column grid)
- Spacing: py-16, gap-8

### Main Dashboard
- Statistics cards (4-column grid on desktop, 2 on tablet, 1 on mobile)
  - Total imports, Success rate, Storage used, Last sync
  - Each card: p-6, rounded-xl, shadow-sm
- Recent files section with table
- Quick actions panel

### Footer
- Minimal: API status, documentation link, support contact
- h-16, border-t, px-6

## Icons
**Library:** Heroicons (outline for most, solid for active states)  
**Common Icons:** upload-cloud, folder, document-text, check-circle, x-circle, cog, magnifying-glass

## Responsive Behavior
- **Mobile (<768px):** Single column, sidebar becomes drawer menu
- **Tablet (768-1024px):** Adjusted spacing, 2-column grids
- **Desktop (>1024px):** Full multi-column layouts, expanded sidebar

## Animations
- **Minimal use only:** Smooth transitions for dropdowns (150ms), page transitions (200ms)
- **No:** Elaborate scroll animations, decorative effects
- **Yes:** Loading spinners, progress indicators, state changes

## Accessibility
- Focus rings on all interactive elements (ring-2, ring-offset-2)
- Proper ARIA labels for icon buttons
- Keyboard navigation support (tab order, escape to close)
- Screen reader announcements for status changes

**Design Principle:** Clean, efficient, Google-aligned interface prioritizing speed and clarity over visual flair.