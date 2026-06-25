# ✅ Figma Props Warning Fix

## Issue Description
React was throwing warnings about unrecognized props (`_fgT`, `_fgS`, `_fgB`, etc.) on DOM elements in the Select component. These are Figma Make's internal inspection/tracking props that were being passed through to native SVG and DOM elements.

## Error Messages
```
Warning: React does not recognize the `_fgT` prop on a DOM element.
Warning: React does not recognize the `_fgS` prop on a DOM element.  
Warning: React does not recognize the `_fgB` prop on a DOM element.
```

## Root Cause
The errors originated from:
- **Component**: `/components/ui/select.tsx`
- **Usage**: NewMatch component (and other components using Select)
- **Issue**: Figma's inspection props were being spread onto Radix UI Select primitives without filtering

## Solution Implemented

### 1. Created Props Filter Function
Added a helper function to filter out Figma-specific props:

```typescript
// Helper function to filter out Figma inspection props
const filterFigmaProps = (props: any) => {
  const filtered: any = {};
  for (const key in props) {
    // Filter out Figma internal props (starting with _fg)
    if (!key.startsWith('_fg')) {
      filtered[key] = props[key];
    }
  }
  return filtered;
};
```

### 2. Applied Filter to All Select Components
Updated all Select sub-components to use the filter:

- ✅ `Select` - Root component
- ✅ `SelectGroup` - Group wrapper
- ✅ `SelectValue` - Value display
- ✅ `SelectTrigger` - Trigger button
- ✅ `SelectContent` - Dropdown content
- ✅ `SelectLabel` - Label component
- ✅ `SelectItem` - Individual items
- ✅ `SelectSeparator` - Separator
- ✅ `SelectScrollUpButton` - Scroll button
- ✅ `SelectScrollDownButton` - Scroll button

### 3. Example Before & After

**Before:**
```typescript
function Select({ ...props }) {
  return <SelectPrimitive.Root {...props} />;
}
```

**After:**
```typescript
function Select({ ...props }) {
  return <SelectPrimitive.Root {...filterFigmaProps(props)} />;
}
```

## Files Modified
- `/components/ui/select.tsx` - Added filterFigmaProps function and applied to all components

## Testing
- ✅ Warnings eliminated from console
- ✅ Select components still function correctly
- ✅ All Select features preserved (dropdowns, selections, etc.)
- ✅ Dark mode compatibility maintained
- ✅ No breaking changes to component API

## Technical Notes

### Why This Happens
Figma Make injects inspection props (prefixed with `_fg`) into React components for:
- Component tracking
- Inspector integration
- Live preview features
- Design-to-code mapping

These props are meant for Figma's internal use and should not reach actual DOM elements.

### Why This Solution Works
By filtering props at the component boundary (where we spread `{...props}`), we:
1. Prevent invalid props from reaching DOM elements
2. Maintain all valid React/Radix UI props
3. Keep Figma's tracking functional at the React level
4. Avoid breaking any component functionality

### Pattern for Other Components
If similar warnings appear in other UI components, apply the same pattern:

```typescript
// 1. Add the filter function at the top of the file
const filterFigmaProps = (props: any) => {
  const filtered: any = {};
  for (const key in props) {
    if (!key.startsWith('_fg')) {
      filtered[key] = props[key];
    }
  }
  return filtered;
};

// 2. Apply it when spreading props
<Component {...filterFigmaProps(props)} />
```

## Impact
- **Performance**: Negligible (simple object iteration)
- **Functionality**: No impact (all valid props preserved)
- **Developer Experience**: Improved (no console warnings)
- **Production**: Safe (no breaking changes)

---

**Fixed Date**: March 12, 2026  
**Status**: ✅ Resolved  
**Severity**: Low (warnings only, no functionality impact)
