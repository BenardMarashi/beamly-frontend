# Safe Coding Patterns for Beamly

## ✅ Pattern 1: Additive Changes (SAFEST)

### Adding New Functions
```typescript
// ✅ GOOD: Add new function that uses existing
export function existingFunction() {
  // Original code unchanged
}

export function enhancedFunction() {
  const result = existingFunction();
  // Add new behavior
  return { ...result, newField: value };
}

// ❌ BAD: Modifying existing function
export function existingFunction() {
  // Changed original behavior - RISKY!
}
```

### Adding New Components
```typescript
// ✅ GOOD: Create variant component
// Original component unchanged
export const Button = (props) => { /* original */ };

// New variant for specific fix
export const ButtonBuildFix = (props) => {
  return <Button {...props} className={`${props.className} build-fix`} />;
};

// ❌ BAD: Modifying original component
export const Button = (props) => {
  // Changed logic - affects all uses!
};
```

## ✅ Pattern 2: Feature Flags

### Build-Specific Flags
```typescript
// ✅ GOOD: Use environment-based flags
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production';
const USE_BUILD_FIX = process.env.VITE_USE_BUILD_FIX === 'true';

export function problematicFunction() {
  if (IS_PRODUCTION_BUILD && USE_BUILD_FIX) {
    // New behavior for production build
    return buildFixVersion();
  }
  
  // Original behavior preserved for dev
  return originalVersion();
}
```

### CSS Feature Flags
```typescript
// ✅ GOOD: Conditional CSS classes
const useFixedStyles = process.env.NODE_ENV === 'production';

<div className={cn(
  "glass-effect",
  useFixedStyles && "glass-effect-production-fix"
)}>
```

## ✅ Pattern 3: CSS Overrides

### Specific Class Overrides
```css
/* ✅ GOOD: Add specific override classes */
/* Original class unchanged */
.glass-effect {
  /* Original styles preserved */
}

/* Specific fix for production */
.glass-effect.production-fix {
  /* Targeted fixes that don't affect dev */
  backdrop-filter: blur(10px) !important;
}

/* ❌ BAD: Modifying original class */
.glass-effect {
  /* Changed styles - affects everything! */
}
```

### Build-Specific Styles
```css
/* ✅ GOOD: Separate build fixes */
/* In src/styles/build-fixes.css */
@media all {
  .build-fix-wrapper .glass-effect {
    /* Fixes that only apply with wrapper */
  }
}

/* Import only in production build */
```

## ✅ Pattern 4: Wrapper Functions

### Service Layer Wrappers
```typescript
// ✅ GOOD: Wrap service calls
import { firebaseService } from '@/services/firebase-services';

// Original unchanged
const originalGetUser = firebaseService.getUser;

// Wrapper for specific fix
firebaseService.getUserWithFix = async (userId: string) => {
  try {
    return await originalGetUser(userId);
  } catch (error) {
    // Handle build-specific error
    if (process.env.NODE_ENV === 'production') {
      console.warn('Production build fix applied');
      // Alternative approach
    }
    throw error;
  }
};
```

### Component Wrappers
```typescript
// ✅ GOOD: HOC wrapper
function withBuildFix<T>(Component: React.ComponentType<T>) {
  return (props: T) => {
    if (process.env.NODE_ENV === 'production') {
      // Add production-specific wrapper
      return (
        <div className="build-fix-wrapper">
          <Component {...props} />
        </div>
      );
    }
    return <Component {...props} />;
  };
}

// Usage
export default withBuildFix(OriginalComponent);
```

## ✅ Pattern 5: Configuration Extensions

### Vite Config Extensions
```typescript
// ✅ GOOD: Extend config conditionally
import baseConfig from './vite.config.base';

export default defineConfig(({ mode }) => {
  const config = baseConfig;
  
  if (mode === 'production') {
    // Add production-specific fixes
    config.build = {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        // Specific fixes for build issue
      }
    };
  }
  
  return config;
});
```

### Build Script Alternatives
```json
// ✅ GOOD: Alternative build commands
{
  "scripts": {
    "build": "vite build",
    "build:fix": "node scripts/build-with-fix.js",
    "build:fallback": "node build-esbuild.js"
  }
}
```

## ❌ Anti-Patterns to AVOID

### 1. Direct Modifications
```typescript
// ❌ NEVER: Modify core functions
function coreAuthFunction() {
  // DON'T change authentication logic
}

// ❌ NEVER: Change data structures
interface User {
  id: string;
  // DON'T add/remove required fields
}
```

### 2. Global Style Changes
```css
/* ❌ NEVER: Change global styles */
* {
  /* DON'T modify global selectors */
}

body {
  /* DON'T change base styles */
}
```

### 3. Breaking Changes
```typescript
// ❌ NEVER: Change function signatures
// Before: function(a: string): void
// After: function(a: string, b: number): void  // BREAKS!

// ❌ NEVER: Remove exports
// export const Something = ... // DON'T remove

// ❌ NEVER: Change hook rules
// Changing useEffect dependencies, order, etc.
```

## 🛡️ Safety Checklist

Before implementing any pattern:
1. ✓ Will this preserve existing behavior in dev?
2. ✓ Can this be toggled off if needed?
3. ✓ Does this add rather than modify?
4. ✓ Is the change isolated to specific use case?
5. ✓ Can we test without affecting users?

## 📝 Example: Fixing Build Issue Safely

```typescript
// ✅ SAFE approach for build fix
// 1. Create new build configuration
export const buildFixConfig = {
  ...originalConfig,
  // Specific overrides
};

// 2. Use environment variable
const config = process.env.USE_BUILD_FIX 
  ? buildFixConfig 
  : originalConfig;

// 3. Test incrementally
if (process.env.TEST_BUILD_FIX) {
  console.log('Build fix active');
}

// 4. Easy rollback
// Just remove env variable to restore original
```

## 🎯 Golden Rules

1. **ADD, don't MODIFY** - New code is safer than changed code
2. **WRAP, don't REPLACE** - Preserve original functionality
3. **FLAG, don't FORCE** - Make changes optional
4. **ISOLATE, don't SPREAD** - Contain changes to specific areas
5. **TEST, don't HOPE** - Verify both paths work

Remember: The dev environment works perfectly. Our goal is to fix production build without breaking dev!