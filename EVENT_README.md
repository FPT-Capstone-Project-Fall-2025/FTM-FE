# Event Management Feature - Training Guide for AI Agent

## Overview
This document serves as a comprehensive training guide for AI agents to understand and work with the Event Management feature in the Family Tree Management (FTM) application.

## Project Structure

```
src/pages/Event/
├── EventPage.tsx              # Main entry point - Complete event management page
├── FamilyEvent.tsx           # Legacy component (being deprecated)
├── EventSidebar.tsx          # Sidebar with filters, statistics, location
├── EventComponents.d.ts      # TypeScript declarations for all components
├── MonthCalendar.tsx         # Monthly calendar view
├── WeekCalendar.tsx          # Weekly calendar view
├── DayCalendar.tsx           # Daily calendar view
├── YearCalendar.tsx          # Yearly calendar view
├── InfiniteYearCalendar.tsx  # Infinite scroll year/list view
├── GPEventInfoModal.tsx      # Event details viewer modal
├── GPEventDetailsModal.tsx   # Event create/edit modal
├── EventStatistics.tsx       # Statistics display component
├── EventTitle.tsx            # Event title rendering
├── EventTypeLabel.tsx        # Event type label with icons

src/types/event.ts            # TypeScript type definitions
src/services/eventService.ts  # API service layer
src/hooks/useEvent.ts         # Custom React hooks
src/utils/eventUtils.ts       # Utility functions
```

## Key Technologies

### Core Stack
- **React 19.1.1** - UI framework with TypeScript
- **TypeScript** - Type safety
- **Ant Design (antd)** - UI component library
- **FullCalendar** - Calendar rendering engine
- **moment.js + dayjs** - Date manipulation
- **react-hook-form + yup** - Form validation
- **lodash** - Utility functions
- **SCSS** - Styling

### Dependencies Installed
```bash
# UI & Calendar
npm install antd @ant-design/icons
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/core

# Date Management
npm install moment dayjs moment-lunar

# Form Management
npm install react-hook-form yup @hookform/resolvers

# Utilities
npm install lodash downshift react-bootstrap
```

## Architecture Patterns

### 1. Component Structure
- **EventPage.tsx** is the main component (use this as the reference)
- Uses functional components with React hooks
- TypeScript for type safety
- Modular design with separated concerns

### 2. State Management
```typescript
// View states
const [viewMode, setViewMode] = useState<ViewMode>('month');
const [currentDate, setCurrentDate] = useState<Date>(new Date());
const [reload, setReload] = useState<boolean>(false);

// UI states
const [search, setSearch] = useState<string>('');
const [openDatePicker, setOpenDatePicker] = useState<boolean>(false);

// Modal states
const [isOpenGPEventInfoModal, setIsOpenGPEventInfoModal] = useState<boolean>(false);
const [isOpenGPEventDetailsModal, setIsOpenGPEventDetailsModal] = useState<boolean>(false);

// Data states
const [eventSelected, setEventSelected] = useState<FamilyEvent | null>(null);
const [eventFilters, setEventFilters] = useState<EventFilters | null>(null);
```

### 3. Type System (event.ts)

#### Event Types
```typescript
export enum EventType {
  WEDDING = 'WEDDING',
  FUNERAL = 'FUNERAL',
  BIRTHDAY = 'BIRTHDAY',
  HOLIDAY = 'HOLIDAY',
  OTHER = 'OTHER',
}

export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export type ViewMode = 'year' | 'month' | 'week' | 'day' | 'list';
```

#### Main Interfaces
```typescript
export interface FamilyEvent {
  id: string;
  name: string;
  eventType: EventType;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay: boolean;
  description?: string;
  location?: string;
  address?: string;
  imageUrl?: string;
  recurrence: RecurrenceType;
  recurrenceEndTime?: string | Date | null;
  isLunar?: boolean;
  gpIds?: string[];
  members?: string[];
  isOwner: boolean;
}

export interface EventFilters {
  eventType?: EventType[];
  eventGp?: string[];
  eventLocation?: any;
  search?: string;
}
```

### 4. Service Layer Pattern

```typescript
// eventService.ts
class EventService {
  async getMonthEvents(year: number, month: number, filters?: EventFilters): Promise<GetEventsResponse> {
    // API call implementation
  }
  
  async createEvent(payload: CreateEventPayload): Promise<FamilyEvent> {
    // Create event
  }
  
  async updateEvent(payload: UpdateEventPayload): Promise<FamilyEvent> {
    // Update event
  }
  
  async deleteEvent(payload: DeleteEventPayload): Promise<void> {
    // Delete event
  }
}

export default new EventService();
```

### 5. Custom Hooks Pattern

```typescript
// useEvent.ts
export const useEvents = (filters: EventFilters) => {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch and manage events
  
  return { events, loading, error, refetch };
};
```

## Common Patterns to Follow

### 1. Date Navigation
```typescript
const handleNext = useCallback(() => {
  switch (viewMode) {
    case 'year':
      setCurrentDate(moment(currentDate).add(1, 'year').toDate());
      break;
    case 'month':
      setCurrentDate(moment(currentDate).add(1, 'month').toDate());
      break;
    case 'week':
      const nextWeek = moment(currentDate).add(1, 'week').toDate();
      setCurrentDate(nextWeek);
      break;
    case 'day':
      setCurrentDate(moment(currentDate).add(1, 'day').toDate());
      break;
  }
}, [viewMode, currentDate]);
```

### 2. Event Filtering
```typescript
const handleFilter = useCallback((data: Partial<EventFilters>) => {
  setEventFilters((prev) => ({
    ...(prev || {}),
    eventType: data.eventType || [],
    eventGp: data.eventGp || [],
    eventLocation: data.eventLocation || null,
  }));
}, []);
```

### 3. Search with Debounce
```typescript
const handleSearch = useMemo(
  () => debounce((value: string) => {
    if (value) {
      setViewMode('list');
    }
  }, 1000),
  []
);

const handleSearchChange = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setEventFilters((prev) => ({
      ...(prev || {}),
      search: value,
    }));
    handleSearch(value);
  },
  [handleSearch]
);
```

### 4. Calendar Event Selection
```typescript
const handleSelect = useCallback(
  (selectInfo: CalendarSelectInfo) => {
    const { start, end } = selectInfo;
    
    const newEvent: Partial<FamilyEvent> = {
      startTime: start,
      endTime: viewMode !== 'day' ? dayjs(end).subtract(1, 'day').toDate() : end,
      isAllDay: viewMode !== 'day',
    };
    
    setEventSelected(newEvent as FamilyEvent);
    setIsOpenGPEventDetailsModal(true);
  },
  [viewMode]
);
```

### 5. Notification Messages
```typescript
import { message } from 'antd';

// Success
message.success("Tạo sự kiện thành công");

// Error
message.error("Có lỗi xảy ra");

// Warning
message.warning("Vui lòng chọn ngày");
```

## Important Notes for AI Agents

### 1. Component Imports
✅ **CORRECT:**
```typescript
import { Button, Input, DatePicker, message } from 'antd';
import eventService from '../../services/eventService';
import type { FamilyEvent, EventFilters } from '@/types/event';
```

❌ **WRONG:**
```typescript
import { Ui } from '../../../utils'; // Doesn't exist
import { CalendarService } from '../../../services'; // Doesn't exist
import { InputText, Editor } from '../../../components'; // Custom components don't exist
```

### 2. File Extensions
- Use `.tsx` for files containing JSX/TSX
- Use `.ts` for pure TypeScript files without JSX
- Use `.d.ts` for type declaration files only

### 3. Service Calls
```typescript
// Correct pattern
await eventService.createEvent(payload);
await eventService.updateEvent({ ...payload, id: eventId });
await eventService.deleteEvent({ id: eventId, isDeleteAll: false });
```

### 4. Missing Services (Stub These)
```typescript
// Services that don't exist yet - create stub implementations
const getCity = async () => {
  // TODO: Implement ProfileService
  setListCity([]);
};

const getMembersSrc = async () => {
  // TODO: Implement GPMemberService  
  setGPMembersSrc([]);
};
```

### 5. Global Objects
```typescript
// Globals object doesn't exist - avoid using it
// Instead use localStorage or context
const [viewWeather, setViewWeather] = useState<boolean>(
  localStorage.getItem('viewWeather') === 'true'
);
```

## UI Components Mapping

### Antd Components Used
| Component | Usage |
|-----------|-------|
| `Input` | Search, text input fields |
| `Input.TextArea` | Multi-line text (descriptions) |
| `Select` | Dropdown selections |
| `DatePicker` | Date/time selection |
| `Radio.Group` | View mode selector |
| `Button` | Actions |
| `Switch` | Toggle controls |
| `Modal` | From react-bootstrap for modals |
| `message` | Toast notifications |

## Error Resolution Guide

### Common Errors and Fixes

1. **Import Resolution Error**
   ```
   Failed to resolve import "../../../services"
   ```
   Fix: Use correct relative path and default import
   ```typescript
   import eventService from '../../services/eventService';
   ```

2. **JSX Syntax Error in .ts Files**
   ```
   Expected '>' but found 'key'
   ```
   Fix: Rename file from `.ts` to `.tsx`

3. **Missing Type Annotations**
   ```
   Parameter 'data' implicitly has an 'any' type
   ```
   Fix: Add explicit types
   ```typescript
   const handleSave = async (data: EventFormData) => {
   ```

4. **Component Props Type Error**
   ```
   Property 'field' does not exist
   ```
   Fix: Use Controller from react-hook-form properly
   ```typescript
   <Controller
     name="eventType"
     control={control}
     render={({ field, fieldState }) => (
       <Select {...field} status={fieldState.error ? 'error' : ''} />
     )}
   />
   ```

## Testing Checklist

When modifying Event components, verify:
- ✅ No TypeScript errors in `EventPage.tsx`
- ✅ All imports resolve correctly
- ✅ Calendar views render (day/week/month/year)
- ✅ Date navigation works (prev/next/today)
- ✅ Search functionality works
- ✅ Event creation modal opens
- ✅ Event details modal displays
- ✅ Filters apply correctly
- ✅ Weather toggle works

## Migration Guide (FamilyEvent.tsx → EventPage.tsx)

### Key Differences

| Aspect | FamilyEvent.tsx (Old) | EventPage.tsx (New) |
|--------|----------------------|---------------------|
| Structure | Mixed logic | Clean, organized |
| Types | Loose typing | Strict TypeScript |
| Imports | Custom components | Antd components |
| Services | CalendarService, Ui | eventService, message |
| Hooks | useModal (custom) | Standard React hooks |
| Globals | Uses Globals object | Local state/localStorage |

### Migration Steps
1. Copy state structure from EventPage.tsx
2. Replace custom imports with antd imports
3. Update service calls to use eventService
4. Remove Globals usage
5. Add proper TypeScript types
6. Test all functionality

## Best Practices

1. **Always use TypeScript types** - Import from `@/types/event`
2. **Use useCallback for handlers** - Prevent unnecessary re-renders
3. **Use useMemo for computed values** - Optimize performance
4. **Debounce search inputs** - Better UX and performance
5. **Handle loading states** - Show loading indicators
6. **Handle error states** - Display user-friendly errors
7. **Use antd message** - Consistent notifications
8. **Follow naming conventions** - camelCase for variables, PascalCase for components
9. **Keep components modular** - Separate concerns
10. **Document complex logic** - Add comments for clarity

## Quick Reference Commands

```bash
# Install all dependencies
npm install

# Run development server
npm run dev

# Type check
npx tsc --noEmit

# Check specific file errors
npx tsc --noEmit src/pages/Event/EventPage.tsx

# Run linter
npm run lint

# Format code
npm run format
```

## Summary

**EventPage.tsx is the reference implementation.** When working with Event feature:
- Always refer to EventPage.tsx for patterns
- Use antd components, not custom ones
- Import eventService for API calls
- Use message API for notifications
- Follow TypeScript strictly
- Test thoroughly after changes

This feature manages family events with calendar views, filters, search, and CRUD operations. The architecture is clean, type-safe, and maintainable.
