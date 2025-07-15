# ⚡ BEFORE YOU CODE - QUICK CHECKLIST

## 🧠 STEP 1: ENGAGE MAXIMUM CAPABILITY
- [ ] Using best available model (Claude 4 Opus)?
- [ ] Extended thinking enabled?
- [ ] Ready to think deeply about implications?

## 🎯 STEP 2: UNDERSTAND THE REQUEST
- [ ] What EXACTLY am I being asked to fix?
- [ ] What am I NOT being asked to change?
- [ ] Is this about the build/deployment issue?

## 🚫 STEP 3: CHANGE BOUNDARIES
- [ ] Will I ONLY fix what was requested?
- [ ] Am I preserving ALL existing functionality?
- [ ] Do I need to remove anything? → **ASK FIRST**
- [ ] Will this break anything that currently works?

## 🚀 STEP 4: DEPLOYMENT IMPACT
- [ ] Will this work after `npm run build`?
- [ ] Will CSS load properly in production?
- [ ] Have I considered the current deployment issue?
- [ ] Will this make deployment worse or better?

## 💭 STEP 5: THINK THROUGH THE FLOW
```
Dev works → Build fails → CSS doesn't load → Users see broken site
     ↑           ↓              ↓                    ↓
 DON'T BREAK   FIX THIS    FIX THIS TOO      ULTIMATE GOAL
```

## ✅ STEP 6: MINIMAL EFFECTIVE CHANGE
- [ ] What's the SMALLEST change that fixes the issue?
- [ ] Can I ADD instead of MODIFY?
- [ ] Can I COMMENT instead of DELETE?
- [ ] Have I avoided unnecessary refactoring?

## 📝 STEP 7: RESPONSE STRUCTURE
```markdown
## Understanding
[What I understand you're asking me to fix]

## Current State Analysis  
[What's working, what's broken]

## Proposed Fix
[Minimal change, exactly targeting the issue]

## What I'm NOT Changing
[List of everything that stays the same]

## Why This Will Work in Production
[How this addresses the deployment issue]

## Anything Need Removal?
[If yes: "I need to remove X because Y. May I proceed?"]
```

## 🚨 EMERGENCY STOP CONDITIONS

### STOP and ASK if:
- You need to remove ANY existing code
- You need to change core functionality  
- You're unsure if something should be modified
- The fix seems too complex or invasive
- You need to refactor working code

## 🎪 FINAL CHECK
- [ ] Dev server still works after changes?
- [ ] Build process improved (or at least not worse)?
- [ ] All existing features preserved?
- [ ] Deployment will work properly?
- [ ] User's specific request addressed?

## 🔴 REMEMBER THE GOLDEN RULE

**"The app works PERFECTLY in development. 
Only fix what's explicitly asked. 
The goal is a working production deployment with proper CSS."**

---

*Check this EVERY TIME before suggesting any code changes.*