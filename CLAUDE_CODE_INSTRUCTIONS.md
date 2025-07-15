# CRITICAL INSTRUCTIONS FOR CLAUDE CODE

## 🧠 ALWAYS USE MAXIMUM CAPABILITY
- **USE THE BEST MODEL AVAILABLE** (Claude 4 Opus or highest available)
- **ENABLE EXTENDED THINKING** for every response
- **THINK DEEPLY** about implications before suggesting any change
- **ANALYZE THOROUGHLY** before making any modifications

## 🚫 STRICT CHANGE POLICY

### NEVER:
- Remove existing code without explicit permission
- Change functionality that already works
- Modify working features while fixing other issues
- Delete files, functions, or components
- Alter business logic or app behavior

### ALWAYS:
- **ONLY FIX** what I explicitly ask you to fix
- **PRESERVE** all existing functionality
- **ADD** new code rather than replacing when possible
- **COMMENT** rather than delete if unsure

### IF REMOVAL SEEMS NECESSARY:
1. **STOP** and ask me first
2. **EXPLAIN** why it needs to be removed
3. **SHOW** what will be affected
4. **WAIT** for my explicit approval
5. **PROVIDE** alternatives if possible

Example:
```
"I notice that removing X would fix the build issue because [detailed reason]. 
This would affect [list of impacts]. 
Should I proceed with removing it, or would you prefer [alternative solution]?"
```

## 🚀 DEPLOYMENT AWARENESS

### CURRENT DEPLOYMENT PROCESS:
```bash
# Standard deployment (currently broken)
npm run build          # <-- THIS FAILS with Rollup error
npm run deploy         # Deploys to Firebase

# Current workaround
npm run build:esbuild  # Custom build script
npm run deploy:hosting # Deploy only hosting
```

### KNOWN DEPLOYMENT ISSUES:
1. **Vite build fails** with Rollup extensibility error
2. **CSS not loading** in production (esbuild workaround)
3. **Glass effects missing** on deployed site
4. **Dark theme not applying** properly

### BEFORE SUGGESTING ANY FIX:
- Consider: "Will this work in production?"
- Consider: "Will CSS load properly after deployment?"
- Consider: "Have I tested the build process?"
- Consider: "Does this maintain all existing features?"

## 📋 CURRENT PROJECT STATE

### WHAT WORKS:
- Development server (http://localhost:5173)
- All app functionality in dev mode
- Firebase integration (auth, firestore, storage)
- Real-time features (chat, notifications)
- UI/UX in development

### WHAT'S BROKEN:
- Production build (`npm run build`)
- CSS loading in production deployment
- Glass morphism effects in production
- Dark theme in production

### STYLING REQUIREMENTS:
- **Buttons**: Yellow (#FCE90D) with black text (#011241)
- **Form fields**: NOT yellow (use default dark theme colors)
- **Glass effects**: Must be preserved
- **Dark theme**: Must work in production

## 🔍 ANALYSIS CHECKLIST

Before making any change, ask yourself:
1. ✓ Am I only fixing what was asked?
2. ✓ Am I preserving all existing functionality?
3. ✓ Will this work in production after deployment?
4. ✓ Have I considered the CSS loading issue?
5. ✓ Should I ask before removing something?
6. ✓ Have I thought about side effects?
7. ✓ Is there a less invasive solution?

## 💭 THINKING PROCESS

For every task:
1. **UNDERSTAND** the specific request
2. **ANALYZE** current implementation
3. **IDENTIFY** minimal changes needed
4. **CONSIDER** deployment implications
5. **VERIFY** no functionality is broken
6. **TEST** mentally through the deployment process
7. **EXPLAIN** your reasoning clearly


## 📝 RESPONSE FORMAT

When suggesting fixes:
```
## Analysis
[Deep analysis of the issue]

## Proposed Solution
[Minimal change that fixes only the requested issue]

## What This Preserves
[List of functionality that remains untouched]

## Deployment Verification
[How this will work in production]

## Potential Concerns
[Any risks or things to watch for]

## Need to Remove Something?
[If yes, detailed explanation and request for permission]
```

## 🚨 REMEMBER

- **YOU ARE WORKING ON A PRODUCTION APP** that works perfectly in development
- **USERS DEPEND ON THIS** - don't break working features
- **DEPLOYMENT MUST WORK** - always consider the full build/deploy cycle
- **ASK WHEN UNSURE** - better to clarify than break something
- **MINIMAL CHANGES** - the less you change, the less can break

## 🎪 FINAL REMINDER

**The app works perfectly in development mode. The ONLY issue is the production build/deployment. Focus on fixing that without breaking anything else.**