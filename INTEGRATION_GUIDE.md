# Silent Auto-Refresh Integration Guide

## Overview
A new hook `useSilentAutoRefresh` has been created to enable background data refresh every 10 seconds without any visual disruptions.

## Features
✅ No loading spinners  
✅ No UI flickers  
✅ No screen jumps  
✅ No refresh indicators  
✅ Data updates quietly in background  
✅ UI updates only if data actually changed  

## How to Use

### Basic Usage
Add this to any component that uses React Query:

```tsx
import { useSilentAutoRefresh } from "@/hooks/useSilentAutoRefresh";

function MyComponent() {
  const { data: profile } = useProfile(); // or any other query hook
  
  // Enable silent auto-refresh every 10 seconds
  useSilentAutoRefresh(["profile", deviceId], 10000);
  
  return (
    // Your component JSX
  );
}
```

### With Custom Data Comparison
```tsx
useSilentAutoRefresh(["profile", deviceId], 10000, {
  compareData: (oldData, newData) => 
    JSON.stringify(oldData) === JSON.stringify(newData)
});
```

### With Enable/Disable Toggle
```tsx
const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

useSilentAutoRefresh(["profile", deviceId], 10000, {
  enabled: autoRefreshEnabled
});
```

## How It Works
1. Sets up a background interval that refetches data every 10 seconds
2. Uses React Query's refetch mechanism for consistency
3. Silently catches errors - no error toasts or UI notifications
4. Only updates UI if cached data actually changes
5. Can be disabled per component or globally

## Query Keys to Use
- `["profile", deviceId]` - User profile data
- `["admin-stats"]` - Dashboard statistics
- `["quiz-history", deviceId]` - Quiz history
- `["rooms"]` - Quiz rooms list
- etc.

## Files Modified
- `client/hooks/useSilentAutoRefresh.ts` - New hook implementation
- Ready to integrate into: ProfileScreen, DiscoverScreen, AdminDashboardScreen, etc.

## Next Steps
1. Import `useSilentAutoRefresh` in any component that needs auto-refresh
2. Call it with the appropriate query key and interval
3. Data will update silently in the background

No additional setup needed - fully compatible with existing React Query implementation!
