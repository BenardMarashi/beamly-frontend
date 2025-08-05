# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beamly is a freelance marketplace platform that connects freelancers with clients. Built with React, TypeScript, Vite, and Firebase, it provides features for job posting, proposal submission, messaging, contract management, and analytics.

## Essential Commands

### Development
```bash
npm run dev          # Start development server (default port 5173)
npm run emulators    # Start Firebase emulators for local development
npm run preview      # Preview production build locally
```

### Building & Testing
```bash
npm run build        # Type-check and build for production
npm run build:debug  # Build without minification for debugging
npm run build:esbuild # ESBuild workaround for Rollup issues
npm run type-check   # Run TypeScript compiler without emitting
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check formatting without fixing
npm run test         # Run Vitest tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate test coverage reports
npm run test -- --watch # Watch mode for development
npm run test path/to/file.test.ts # Run single test file
```

### Deployment
```bash
npm run deploy              # Build and deploy everything to Firebase
npm run deploy:hosting      # Deploy only hosting
npm run deploy:functions    # Deploy only functions
npm run deploy:rules        # Deploy Firestore and Storage rules
```

### Database Setup
```bash
npm run setup:db     # Initialize database with tsx script (runs src/scripts/setup-database.ts)
```

### Other Useful Commands
```bash
npm run analyze      # Analyze bundle size
npm run check:env    # Check if environment variables are set
npm run logs         # View Firebase function logs
npm run clean        # Remove dist and node_modules
npm run clean:cache  # Remove dist and .firebase cache
npm run serve        # Serve built app locally
npm run test:build   # Build and preview to test production build
npm run emulators:export  # Export emulator data
npm run emulators:import  # Start emulators with imported data
npm run postinstall  # Runs automatically after npm install to check env vars
```

## Architecture Overview

### State Management
- **Global State**: React Context API (AuthContext for authentication)
- **Server State**: TanStack Query for caching and synchronization
- **Real-time**: Firebase onSnapshot listeners via RealtimeService class for live updates
- **Local State**: React useState/useEffect for component-level state management

### Key Service Layer Pattern
All Firebase operations are centralized in `src/services/firebase-services.ts`. This includes:
- Authentication (email/password, Google OAuth)
- Firestore CRUD operations for all collections
- Real-time subscriptions
- File uploads to Firebase Storage

The `RealtimeService` class in `src/lib/realtime.ts` handles Firebase onSnapshot subscriptions for live data updates (conversations, messages, notifications).

### User Types & Guards
The platform supports two user types: `freelancer` and `client`. Users can be both.
- Route protection via `ProtectedRoute` component
- Type-specific guards: `FreelancerGuard`, `ClientGuard`
- User type management in `UserData.userType` field
- AuthContext provides computed flags: `isFreelancer`, `isClient`, `canPostJobs`, `canApplyToJobs`

### Collections Structure
- `users`: User profiles with userType field ('freelancer' | 'client' | 'both')
- `jobs`: Job postings by clients
- `proposals`: Freelancer proposals for jobs
- `conversations` & `messages`: Real-time chat system
- `contracts`: Active work agreements
- `notifications`: System notifications
- `reviews`: User feedback system
- `transactions`: Payment records
- `analytics`: Platform analytics data

### Environment Configuration
Environment variables are validated and typed in `src/config/env.ts` with sophisticated error handling:
- **Firebase Config**: All VITE_FIREBASE_* variables with validation
- **Feature Flags**: VITE_ENABLE_ANALYTICS, VITE_ENABLE_ERROR_REPORTING
- **Stripe Integration**: VITE_STRIPE_PUBLISHABLE_KEY
- **Type Safety**: EnvConfig interface ensures all env vars are properly typed
- **Runtime Validation**: Missing required vars throw EnvironmentError with helpful messages
- **Development Aid**: `npm run check:env` command to verify all variables are set

### Testing Approach
- Unit tests with Vitest
- Test files colocated with source files (*.test.ts, *.test.tsx)
- Coverage reports available via `npm run test:coverage`
- Run single test file: `npm run test path/to/file.test.ts`
- Watch mode for development: `npm run test -- --watch`

### Key Patterns to Follow
1. **Service Layer**: Use `firebase-services.ts` for all Firebase operations
2. **Type Safety**: Define interfaces in `src/types/` for all data models
3. **Error Handling**: Use toast notifications for user feedback
4. **Loading States**: Implement proper loading UI with LoadingSpinner component
5. **Real-time Updates**: Use Firebase listeners for live data (chat, notifications)
6. **Route Guards**: Protect routes based on auth state and user type
7. **Internationalization**: Use i18next for all user-facing strings

### Development Workflow
1. Use Firebase emulators for local development to avoid production data
2. Check TypeScript types before committing (`npm run type-check`)
3. Format code with Prettier (`npm run format`)
4. Test builds locally with `npm run build && npm run preview`
5. Use `npm run build:esbuild` as fallback if standard build fails due to Rollup issues

### Firebase Security
- Security rules are defined in `firestore.rules` and `storage.rules`
- Rules enforce user ownership and access control
- Deploy rules separately with `npm run deploy:rules`

### Firebase Functions
- Located in `functions/src/` directory
- Main entry point: `functions/src/index.ts`
- Job-related functions: `functions/src/jobs.ts`
- Deploy with `npm run deploy:functions`
- View logs with `npm run logs`

### Component Organization
- Reusable components in `src/components/`
- Page components in `src/pages/`
- Layout components in `src/layouts/`
- Type-specific components in subdirectories (dashboard/, messaging/, profile/)

### Routing Architecture
The app uses a sophisticated routing structure in `src/App.tsx`:
- **Public Routes**: Home, login, signup, browse freelancers (accessible without auth)
- **Protected Routes**: Dashboard, profile management, messaging (require authentication)
- **Lazy Loading**: Most pages use React.lazy() for code splitting and performance
- **Route Guards**: `ProtectedRoute` component ensures auth state before accessing protected routes
- **Context Integration**: Routes automatically redirect based on auth state (logged users go to dashboard)

### Important Files & Patterns
- **Route Configuration**: Routes defined in `src/App.tsx` with lazy loading for performance
- **Firebase Initialization**: `src/lib/firebase.ts`
- **Real-time Service**: `src/lib/realtime.ts` for subscription management
- **Custom Hooks**: `src/hooks/` for reusable logic
- **Error Monitoring**: Configured in `src/utils/monitoring.ts`
- **Profile Validation**: `src/utils/profile-validation.ts` for user profile checks
- **Type Definitions**: Centralized in `src/types/` directory (user.types.ts, firestore.types.ts)
- **Context Providers**: AuthContext with user authentication and type checking logic

### Technology Stack Details
- **UI Components**: NextUI component library with Tailwind CSS
- **Animations**: Framer Motion for smooth transitions
- **Data Fetching**: TanStack Query for server state management
- **Charts**: Recharts for analytics visualizations
- **Icons**: @heroicons/react and @iconify/react
- **Date Handling**: date-fns for date operations
- **Payments**: Stripe integration for payment processing
- **Build Tool**: Vite with React plugin
- **Testing**: Vitest for unit testing
- **Internationalization**: i18next with browser language detection

### Critical Files (Do Not Modify Without Analysis)
- `src/lib/firebase.ts` - Firebase initialization and configuration
- `src/services/firebase-services.ts` - Central service layer for all Firebase operations
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/App.tsx` - Main routing configuration
- `src/lib/realtime.ts` - Real-time subscription management
- `src/config/env.ts` - Environment variable validation and typing

### Path Aliases
The project uses TypeScript path aliases configured in `tsconfig.json` and `vite.config.ts`:
- `@/*` maps to `src/*` - Use `import { Component } from '@/components/Component'`
- This improves import readability and prevents relative path issues

### Common Code Patterns
```typescript
// Authentication check pattern
const { user, isFreelancer, isClient } = useAuth();

// Service layer usage pattern
import { firebaseService } from '@/services/firebase-services';
const data = await firebaseService.getJobs();

// Real-time subscription pattern
useEffect(() => {
  if (!user) return;
  const unsubscribe = RealtimeService.subscribeToNotifications(user.uid, setNotifications);
  return unsubscribe;
}, [user]);

// Error handling pattern
try {
  await firebaseService.createJob(jobData);
  toast.success('Job created successfully');
} catch (error) {
  toast.error(`Error creating job: ${error.message}`);
}
```

### Build System Notes
The project has multiple build configurations to handle various issues:
- Primary build: `npm run build` (standard Vite build)
- Debug build: `npm run build:debug` (unminified for debugging)
- ESBuild fallback: `npm run build:esbuild` (workaround for Rollup issues)
- Production build: `npm run build:production` (optimized deployment build)

Use the ESBuild fallback if experiencing CSS loading issues or Rollup bundling problems.

### Firestore Collections Reference
Key collections and their purpose:
- **users**: User profiles with `userType` ('freelancer' | 'client' | 'both'), profile data, skills, etc.
- **jobs**: Job postings with status, budget, skills required, proposals count
- **proposals**: Freelancer applications to jobs with status, bid amount, cover letter
- **conversations**: Chat threads between users with participant IDs and last message
- **messages**: Individual messages within conversations
- **contracts**: Active work agreements with milestones, payment status
- **notifications**: System notifications for various events
- **reviews**: Ratings and feedback between clients and freelancers
- **transactions**: Payment records and history
- **analytics**: Platform usage statistics

### Common Development Scenarios
- **Adding a new page**: Create component in `src/pages/`, add lazy-loaded route in `src/App.tsx`
- **Firebase operations**: Always use `firebaseService` from `src/services/firebase-services.ts`
- **Real-time features**: Use `RealtimeService` from `src/lib/realtime.ts` for subscriptions
- **Type definitions**: Add interfaces to appropriate file in `src/types/`
- **Protected features**: Wrap routes with `ProtectedRoute`, `FreelancerGuard`, or `ClientGuard`