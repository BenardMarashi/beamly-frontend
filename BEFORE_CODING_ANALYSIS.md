# Pre-Code Analysis Workflow - MANDATORY

## 🔍 Required Analysis Before ANY Change

### Step 1: File Dependency Check
```typescript
// 1.1 Check who imports this file
filesystem.search({ 
  pattern: "import.*CurrentFileName", 
  path: "./src" 
})

// 1.2 Check relative imports
filesystem.search({ 
  pattern: "from ['\"]\\./.*CurrentFileName", 
  path: "./src" 
})

// 1.3 Check what this file imports
const fileContent = filesystem.readFile("path/to/current/file.ts")
// Analyze imports section at the top
```

### Step 2: Component Usage Analysis
```typescript
// 2.1 Find all component instances
filesystem.search({ 
  pattern: "<ComponentName", 
  path: "./src" 
})

// 2.2 Find function calls
filesystem.search({ 
  pattern: "ComponentName\\(", 
  path: "./src" 
})

// 2.3 Check prop usage
typescript.findReferences({ 
  file: "component.tsx", 
  symbol: "propName" 
})
```

### Step 3: CSS Impact Analysis
```typescript
// 3.1 Find direct class usage
filesystem.search({ 
  pattern: "className.*glass-effect", 
  path: "./src" 
})

// 3.2 Check for dynamic classes
filesystem.search({ 
  pattern: "\\${.*classname", 
  path: "./src" 
})

// 3.3 Check CSS file imports
filesystem.search({ 
  pattern: "import.*\\.css", 
  path: "./src" 
})

// 3.4 Find Tailwind utility usage
filesystem.search({ 
  pattern: "className.*bg-\\[#FCE90D\\]", 
  path: "./src" 
})
```

### Step 4: Type Dependency Check
```typescript
// 4.1 Find type/interface usage
typescript.findReferences({ 
  file: "types.ts", 
  symbol: "TypeName" 
})

// 4.2 Check interface implementations
ast.findImplementations({ 
  interface: "InterfaceName" 
})

// 4.3 Find generic type usage
filesystem.search({ 
  pattern: "TypeName<", 
  path: "./src" 
})
```

### Step 5: State Management Impact
```typescript
// 5.1 Context usage
ast.findComponentUsage({ 
  component: "AuthContext" 
})

// 5.2 Hook usage
filesystem.search({ 
  pattern: "useAuth\\(", 
  path: "./src" 
})

// 5.3 Global state dependencies
filesystem.search({ 
  pattern: "useContext\\(", 
  path: "./src" 
})
```

### Step 6: Firebase Service Impact
```typescript
// 6.1 Service method usage
filesystem.search({ 
  pattern: "firebaseService\\.", 
  path: "./src" 
})

// 6.2 Real-time subscription usage
filesystem.search({ 
  pattern: "RealtimeService", 
  path: "./src" 
})

// 6.3 Auth dependencies
filesystem.search({ 
  pattern: "requireAuth", 
  path: "./src" 
})
```

## 📋 Analysis Report Template

Before making ANY changes, complete this report:

```markdown
## File Analysis Report: [filename]

### 1. Import Analysis
**Files that import this module:**
- [ ] src/components/X.tsx (how it's used)
- [ ] src/pages/Y.tsx (how it's used)
- [ ] Total: X files

**Files this module imports:**
- [ ] firebase-services (which methods)
- [ ] contexts (which ones)
- [ ] Total: X dependencies

### 2. Component/Function Usage
**Direct usage locations:**
- [ ] Used as component in X files
- [ ] Called as function in Y files
- [ ] Exported members used in Z files

### 3. CSS Dependencies
**Classes defined/used:**
- [ ] Defines classes: [list]
- [ ] Uses classes: [list]
- [ ] Dynamic classes: [yes/no]

### 4. Type Dependencies
**Types/Interfaces:**
- [ ] Exports types: [list]
- [ ] Uses types: [list]
- [ ] Generic parameters: [list]

### 5. State Management
**Context/Hook usage:**
- [ ] Uses contexts: [list]
- [ ] Provides context: [yes/no]
- [ ] Custom hooks: [list]

### 6. Risk Assessment
**Change Impact Level:** 
- [ ] LOW - Isolated component, few dependencies
- [ ] MEDIUM - Some dependencies, careful testing needed
- [ ] HIGH - Many dependencies, affects multiple features
- [ ] CRITICAL - Core system file, affects entire app

### 7. Potential Side Effects
- [ ] Build process: [impact]
- [ ] Runtime behavior: [impact]
- [ ] UI/UX: [impact]
- [ ] Performance: [impact]

### 8. Required Testing
- [ ] Dev server still starts
- [ ] Build completes (if fixing build)
- [ ] Affected pages load correctly
- [ ] CSS renders properly
- [ ] No console errors
```

## 🚨 STOP Conditions

### MUST STOP and ask user if:
1. Need to delete any code
2. Need to change function signatures
3. Need to modify authentication flow
4. Need to alter global CSS
5. Risk assessment is HIGH or CRITICAL
6. More than 10 files import this module
7. Changes affect build configuration

## ✅ Safe to Proceed Conditions

You may proceed WITHOUT asking if ALL are true:
1. Risk assessment is LOW
2. Only adding new code
3. No existing functionality changes
4. Less than 5 files affected
5. No CSS class modifications
6. No type signature changes
7. User explicitly asked for this change

## 🔄 Iteration Safety Check

After EACH change:
1. Run: `npm run type-check`
2. Check: Dev server still works
3. Verify: No new console errors
4. Test: Affected features work
5. Confirm: CSS still loads properly

## 📝 Example Analysis

```markdown
## File Analysis Report: src/components/Button.tsx

### 1. Import Analysis
**Files that import this module:**
- ✓ src/pages/login.tsx (login button)
- ✓ src/pages/dashboard.tsx (action buttons)
- ✓ src/components/forms/JobForm.tsx (submit button)
- Total: 23 files (HIGH RISK)

**Conclusion:** This is a widely used component. 
Changes will affect many parts of the app.
RECOMMENDATION: Add new variant instead of modifying existing.
```

## 🎯 Remember

This analysis is MANDATORY before ANY code change. It protects the working development environment while fixing specific issues.