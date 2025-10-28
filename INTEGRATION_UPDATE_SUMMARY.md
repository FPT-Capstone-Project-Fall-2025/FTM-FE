# Event System Integration Update Summary

## Overview
Updated the event system to properly integrate with the backend APIs for fetching family trees and their members for event tagging.

## Changes Made

### 1. **familyTreeService.ts** - Added Member Tree API
**File**: `src/services/familyTreeService.ts`

- Added new method `getMemberTree(ftId: string)` to fetch all members in a family tree
- This method calls `/api/ftmember/member-tree?ftId={ftId}` endpoint
- Returns the member tree structure needed for event member tagging

```typescript
/**
 * Get member tree for event tagging
 * This returns all members in a family tree for the event member tagging feature
 */
getMemberTree(ftId: string): Promise<ApiResponse<FamilytreeDataResponse>> {
  return api.get(`/ftmember/member-tree?ftId=${ftId}`);
}
```

### 2. **GPEventDetailsModal.tsx** - Updated Member Fetching
**File**: `src/pages/Event/GPEventDetailsModal.tsx`

- Updated the member fetching logic to use the new `getMemberTree` API
- Changed from using pagination-based API (`/ftmember/list`) to tree-based API (`/ftmember/member-tree`)
- Properly maps the member tree data structure (`datalist`) to member options
- Added detailed logging for debugging

**Before**:
```typescript
const res: any = await familyTreeService.getFamilyTreeMembers({
  pageIndex: 1,
  pageSize: 100,
  filters: `[{"name":"ftId","operation":"EQUAL","value":"${selectedFamilyTreeId}"}]`
});
const memberData = res?.data?.data?.data || res?.data?.data || [];
```

**After**:
```typescript
const res: any = await familyTreeService.getMemberTree(selectedFamilyTreeId);
const datalist = res?.data?.datalist || [];
const memberOptions: MemberOption[] = datalist.map((item: any) => ({
  id: item.value.id,
  fullname: item.value.name,
  ftId: selectedFamilyTreeId,
}));
```

### 3. **EventSidebar.tsx** - Already Using Correct API ✅
**File**: `src/pages/Event/EventSidebar.tsx`

- Already correctly using `familyTreeService.getAllFamilyTrees(1, 100)`
- This calls `/api/familytree/my-family-trees` as required
- No changes needed

### 4. **MonthCalendar.tsx** - Fixed 404 Error
**File**: `src/pages/Event/MonthCalendar.tsx`

- **Fixed**: Removed call to non-existent API endpoint `/api/calendar/month` when no family groups are selected
- Now shows empty calendar when no family groups are selected
- This eliminates the "Resource not found" 404 error

**Before**:
```typescript
} else {
  // No family groups selected - fetch from old API or show empty
  const response: any = await eventService.getMonthEvents(year, month, combinedFilters);
  allEvents = (response?.value?.gpFamilyEvents || []) as FamilyEvent[];
}
```

**After**:
```typescript
} else {
  // No family groups selected - show empty
  console.log('📅 MonthCalendar - No family groups selected, showing empty calendar');
  allEvents = [];
}
```

### 5. **WeekCalendar.tsx** - Fixed 404 Error
**File**: `src/pages/Event/WeekCalendar.tsx`

- Same fix as MonthCalendar
- Removed call to non-existent `/api/calendar/week` endpoint
- Shows empty calendar when no family groups are selected

### 6. **DayCalendar.tsx** - Fixed 404 Error
**File**: `src/pages/Event/DayCalendar.tsx`

- Same fix as MonthCalendar
- Removed call to non-existent `/api/calendar/day` endpoint
- Shows empty calendar when no family groups are selected

## API Endpoints Used

### Family Tree APIs
1. **Get My Family Trees** (EventSidebar)
   - `GET /api/familytree/my-family-trees?pageIndex=1&pageSize=100`
   - Returns list of family trees user has joined

2. **Get Member Tree** (GPEventDetailsModal)
   - `GET /api/ftmember/member-tree?ftId={ftId}`
   - Returns all members in a family tree in tree structure format

### Event APIs
3. **Filter Events** (All Calendar Views)
   - `POST /api/ftfamilyevent/filter`
   - Fetches events for selected family trees within date range

## Expected Behavior

1. **Selecting Family Trees in EventSidebar**:
   - Fetches list of family trees from `/api/familytree/my-family-trees`
   - Displays checkboxes for each family tree
   - When selected, filters events to show only those from selected trees

2. **Creating/Editing Event in GPEventDetailsModal**:
   - When user selects a family tree ("Chọn Gia phả")
   - Automatically fetches all members from that tree via `/api/ftmember/member-tree`
   - Populates the "Tag thành viên" (Tag members) dropdown with all members

3. **Calendar Views (Month/Week/Day)**:
   - When family groups are selected: Fetches events using filter API
   - When NO family groups selected: Shows empty calendar (no 404 errors)

## Testing Checklist

- [x] No linter errors
- [x] EventSidebar shows family trees from API
- [x] GPEventDetailsModal fetches members when family tree is selected
- [x] MonthCalendar shows empty when no groups selected (no 404)
- [x] WeekCalendar shows empty when no groups selected (no 404)
- [x] DayCalendar shows empty when no groups selected (no 404)

## Migration Notes

### Removed/Deprecated APIs
The following API endpoints are NO LONGER used (they were causing 404 errors):
- `/api/calendar/month` ❌
- `/api/calendar/week` ❌
- `/api/calendar/day` ❌

These have been replaced with:
- Empty calendar display when no family groups are selected
- `/api/ftfamilyevent/filter` when family groups ARE selected

### Data Structure Changes

**Member Tree Response**:
```json
{
  "data": {
    "root": "member-id",
    "datalist": [
      {
        "key": "member-id",
        "value": {
          "id": "member-id",
          "name": "Member Name",
          "gender": 1,
          "birthday": "2025-10-24T00:00:00",
          ...
        }
      }
    ]
  }
}
```

Mapping: `datalist[].value.id` → Member ID, `datalist[].value.name` → Member Name

## Files Modified

1. ✅ `src/services/familyTreeService.ts`
2. ✅ `src/pages/Event/GPEventDetailsModal.tsx`
3. ✅ `src/pages/Event/MonthCalendar.tsx`
4. ✅ `src/pages/Event/WeekCalendar.tsx`
5. ✅ `src/pages/Event/DayCalendar.tsx`

## Status: ✅ COMPLETED

All changes have been implemented and tested with no linting errors.

