# Codebase Dependency Map - Beamly

## 🚨 CRITICAL FILES - DO NOT MODIFY WITHOUT CHECKING DEPENDENCIES

### Core System Files
| File | Used By | Purpose | Risk Level |
|------|---------|---------|------------|
| `src/lib/firebase.ts` | ENTIRE APP | Firebase initialization | CRITICAL |
| `src/services/firebase-services.ts` | All data operations | Service layer | CRITICAL |
| `src/contexts/AuthContext.tsx` | All routes & guards | Authentication | CRITICAL |
| `src/App.tsx` | Entire navigation | Route definitions | CRITICAL |
| `src/lib/realtime.ts` | Chat, notifications | Real-time subscriptions | CRITICAL |

### Build System Files
| File | Status | Issue | Risk Level |
|------|--------|-------|------------|
| `vite.config.ts` | BROKEN | Rollup error | HIGH |
| `build-esbuild.js` | WORKAROUND | CSS not loading | MEDIUM |
| `tailwind.config.js` | WORKING | NextUI integration | HIGH |
| `tsconfig.json` | WORKING | TypeScript config | HIGH |

### CSS System
- Global styles: `src/index.css`
- Critical classes: `glass-effect`, `glass-card`, `glass-morphism`
- Used in 25+ components throughout the app
- Button override: `bg-[#FCE90D] text-[#011241]`
- Form fields: Should NOT be yellow

## 📊 Component Dependency Tree
```
App.tsx
├── AuthContext (GLOBAL - wraps entire app)
│   ├── ProtectedRoute (guards private routes)
│   ├── FreelancerGuard (freelancer-only routes)
│   └── ClientGuard (client-only routes)
├── Navigation
│   └── Navbar (uses AuthContext for user info)
└── Pages (all lazy loaded)
    ├── Dashboard/*
    │   ├── uses firebase-services
    │   ├── uses RealtimeService
    │   └── uses AuthContext
    ├── Chat
    │   ├── uses RealtimeService heavily
    │   └── real-time message subscriptions
    ├── Profile/*
    │   ├── uses firebase-services
    │   └── file uploads to Storage
    └── Browse/Search
        └── uses firebase-services for queries
```

## 🔗 Import Rules & Patterns

### STRICT RULES:
1. **Service Layer Pattern**
   ```typescript
   // ✅ ALWAYS use service layer
   import { firebaseService } from '@/services/firebase-services';
   
   // ❌ NEVER import Firebase directly (except in lib/firebase.ts)
   import { db } from 'firebase/firestore'; // WRONG!
   ```

2. **Authentication Pattern**
   ```typescript
   // ✅ ALWAYS use AuthContext
   import { useAuth } from '@/contexts/AuthContext';
   
   // ❌ NEVER access auth directly
   import { auth } from '@/lib/firebase'; // WRONG!
   ```

3. **Real-time Data Pattern**
   ```typescript
   // ✅ Use RealtimeService for subscriptions
   import { RealtimeService } from '@/lib/realtime';
   
   // ❌ Don't create direct listeners
   onSnapshot(collection(db, 'messages'), ...); // WRONG!
   ```

## 🎨 CSS Dependencies

### Glass Effect System
```css
/* Used by these components: */
- src/components/cards/* (all card components)
- src/pages/dashboard/* (dashboard panels)
- src/components/navigation/Navbar.tsx
- src/pages/profile/* (profile sections)
- src/components/modals/* (all modals)

/* Critical classes that MUST work: */
.glass-effect { /* backdrop blur effect */ }
.glass-card { /* card styling */ }
.glass-morphism { /* advanced glass effect */ }
```

### Color System
```css
/* Button colors (MUST BE): */
background: #FCE90D; /* Yellow */
color: #011241; /* Dark blue text */

/* Form inputs (MUST NOT BE YELLOW): */
/* Should use default dark theme colors */
```

## 📁 File Organization

### Pages Structure
```
src/pages/
├── auth/ (public routes)
├── dashboard/ (protected - both user types)
├── profile/ (protected - user's own profile)
├── browse-freelancers.tsx (public)
├── post-job.tsx (protected - clients only)
├── chat.tsx (protected - real-time heavy)
└── settings.tsx (protected)
```

### Services Structure
```
src/services/
└── firebase-services.ts (ALL Firebase operations)
    ├── Auth functions
    ├── Firestore CRUD
    ├── Storage uploads
    └── Real-time subscriptions
```

### Component Categories
```
src/components/
├── cards/ (use glass effects)
├── forms/ (NO yellow backgrounds)
├── modals/ (use glass effects)
├── navigation/ (global components)
└── dashboard/ (user-specific components)
```

## ⚠️ Known Problem Areas

### Current Build Issue
- **File**: `vite.config.ts`
- **Error**: Rollup can't call rollup() while pending
- **Dependencies**: Affects entire build process
- **Workaround**: `build-esbuild.js` (but CSS doesn't load)

### Pagination Fixes Applied
- **Files**: `browse-freelancers.tsx`, `looking-for-work-page.tsx`
- **Fix**: Changed from useState to useRef to prevent loops
- **Risk**: Changing back will cause infinite loops

### Firebase Listeners
- **Files**: `AuthContext.tsx`, `chat.tsx`
- **Fix**: Proper cleanup functions added
- **Risk**: Removing cleanup causes memory leaks

## 🔐 Security Patterns

### Authentication Flow
```
1. User signs in → Firebase Auth
2. Auth state change → AuthContext updates
3. User data fetched → firebaseService.getUser()
4. Routes update → ProtectedRoute checks
5. Navigation updates → Navbar re-renders
```

### Data Access Pattern
```
1. Component needs data → calls custom hook
2. Hook → calls firebaseService method
3. firebaseService → accesses Firebase directly
4. Data returned → through service layer
5. Never skip the service layer!
```

## 💡 Quick Reference

### Before changing any file, check:
1. Who imports it: `grep -r "import.*filename" src/`
2. What it imports: Check the file's import section
3. CSS classes used: `grep -r "classname" src/`
4. TypeScript types: Check for exported interfaces
5. Hook usage: Look for `use` prefix functions

### High-risk operations:
- Changing AuthContext (breaks all auth)
- Modifying firebase-services (breaks all data)
- Altering CSS classes (breaks UI globally)
- Changing build config (already broken!)
- Modifying routing (breaks navigation)