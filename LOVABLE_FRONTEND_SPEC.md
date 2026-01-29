# Hotel Scraper Dashboard - Lovable Specification

## Project Overview
Build a modern web dashboard to interact with the Booking.com scraper API and visualize hotel search results.

## Tech Stack
- React + TypeScript
- Tailwind CSS
- Shadcn/ui components
- React Query for API calls
- Recharts for data visualization

## Features

### 1. Search Interface
**Location:** Home page
**Components:**
- City input field with autocomplete
- Date range picker (check-in / check-out)
- Adults selector (dropdown 1-10)
- Sort by dropdown (Price, Distance, Rating)
- Sort order toggle (Ascending/Descending)
- Advanced filters collapsible panel:
  - Price range slider (min/max)
  - Rating filter (dropdown)
  - Distance from center (slider)
  - "Only show discounts" checkbox
- Search button (primary CTA)

### 2. Results Display
**Location:** Below search form
**Components:**
- Loading state with skeleton cards
- Results count badge
- Grid of hotel cards (responsive: 1 col mobile, 2 tablet, 3 desktop)
- Each card shows:
  - Hotel image (with fallback)
  - Hotel name (truncated if long)
  - Price (large, bold)
  - Original price (strikethrough if discount)
  - Discount badge (if applicable)
  - Rating with stars visualization
  - Review count
  - Distance from center with icon
  - "View on Booking.com" button

### 3. Filter & Sort Panel
**Location:** Sidebar (desktop) or drawer (mobile)
**Features:**
- Active filters display with remove chips
- Clear all filters button
- Filter statistics (e.g., "Showing 15 of 50 hotels")

### 4. Comparison Feature
**Location:** Floating bottom bar (when hotels selected)
**Features:**
- Checkbox selection on hotel cards
- Compare button (when 2-4 hotels selected)
- Comparison modal with side-by-side view:
  - Images
  - Prices
  - Ratings
  - Distance
  - Pros/cons list

### 5. Save Searches
**Location:** Save button in search bar
**Features:**
- Save current search parameters
- List of saved searches (sidebar)
- Quick reload saved searches
- Delete saved searches
- Local storage persistence

### 6. Settings Page
**Location:** Settings icon in header
**Features:**
- API endpoint configuration
- Currency preference (USD, EUR, GBP)
- Theme toggle (light/dark)
- Results per page
- Default sort preference

## API Integration

### Endpoint Configuration
```typescript
const API_BASE_URL = 'http://localhost:3000';

// Search endpoint
POST /api/scrape/city
{
  city: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  sortBy: 'price' | 'distance' | 'rating';
  order: 'asc' | 'desc';
  filters: {
    minPrice?: number;
    maxPrice?: number;
    maxDistance?: number;
    minRating?: number;
    onlyWithDiscount?: boolean;
  }
}
```

### Response Handling
```typescript
interface Hotel {
  name: string;
  url: string;
  price: string;
  priceNumeric: number;
  originalPrice: string | null;
  hasDiscount: boolean;
  rating: string;
  reviewCount: string;
  distanceFromCenter: string;
  distanceNumeric: number;
  address: string;
  image: string;
}

interface SearchResponse {
  success: boolean;
  query: SearchQuery;
  count: number;
  hotels: Hotel[];
}
```

## Design Requirements

### Color Scheme
- Primary: Blue (#3B82F6)
- Success: Green (#10B981) - for discounts
- Warning: Orange (#F59E0B) - for low availability
- Background: White/Gray (#F9FAFB)
- Text: Dark Gray (#1F2937)

### Typography
- Headings: Inter font, semi-bold
- Body: Inter font, regular
- Prices: Mono font for consistency

### Components to Use (shadcn/ui)
- Button
- Input
- Select
- Slider
- Card
- Badge
- Skeleton
- Dialog
- Drawer
- Checkbox
- DatePicker
- Toast (for notifications)

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## User Flow

1. **Landing Page**
   - User sees search form
   - Optional: Recent searches displayed
   - Optional: Popular destinations suggestions

2. **Search**
   - User enters city and dates
   - User optionally sets filters
   - User clicks "Search Hotels"
   - Loading state shows skeleton cards
   - Results display in grid

3. **Filter/Sort**
   - User adjusts filters in sidebar
   - Results update immediately (local filtering)
   - User can toggle sort order
   - Active filters shown as chips

4. **View Details**
   - User clicks hotel card
   - Modal opens with larger image and details
   - "Book Now" button opens Booking.com in new tab

5. **Compare Hotels**
   - User selects 2-4 hotels via checkboxes
   - Bottom bar appears with "Compare" button
   - Comparison modal shows side-by-side data

6. **Save Search**
   - User clicks save icon
   - Prompt for search name
   - Search saved to local storage
   - Appears in "Saved Searches" list

## Error Handling

### API Errors
- Network error: Show retry button
- Timeout: "Search taking longer than expected"
- Invalid city: "City not found, try another"
- No results: "No hotels found, adjust filters"

### Validation
- City required (show error if empty)
- Check-in before check-out (date validation)
- Adults > 0 (minimum validation)

## Performance Optimization

- Lazy load images
- Debounce search input (300ms)
- Cache API responses (React Query)
- Virtual scrolling for 100+ results
- Optimize images (next/image if Next.js)

## Accessibility

- Keyboard navigation
- ARIA labels on all interactive elements
- Screen reader announcements for results count
- Focus management in modals
- Color contrast WCAG AA compliance

## Nice-to-Have Features

- Price history graph (if you add tracking)
- Map view showing hotel locations
- Email alerts for price drops
- Export results to CSV
- Share search link functionality
- "Similar hotels" recommendations
- Multi-city comparison
- Sorting animation transitions

## File Structure
```
src/
  components/
    SearchForm.tsx
    HotelCard.tsx
    FilterPanel.tsx
    ComparisonModal.tsx
    SavedSearches.tsx
  hooks/
    useHotelSearch.ts
    useSavedSearches.ts
  lib/
    api.ts
    utils.ts
  types/
    hotel.ts
  app/
    page.tsx
    layout.tsx
```

## Testing Considerations
- Mock API responses for development
- Test with various result counts (0, 1, 50, 100+)
- Test filter combinations
- Test mobile responsiveness
- Test loading and error states

---

## Prompt for Lovable

"Create a modern hotel search dashboard that connects to a REST API at localhost:3000. 

Features needed:
1. Search form with city, dates, adults, filters, and sort options
2. Grid of hotel result cards showing price, rating, distance, and discount badges
3. Filter sidebar with price range, rating, distance, and discount toggle
4. Hotel comparison feature (select 2-4 hotels to compare side-by-side)
5. Save searches feature using local storage
6. Dark mode toggle
7. Responsive design (mobile, tablet, desktop)

Use React, TypeScript, Tailwind CSS, and shadcn/ui components. The API returns an array of hotel objects with name, price, rating, distance, discount info, and booking URL.

Make it look modern and professional like Booking.com or Airbnb."
