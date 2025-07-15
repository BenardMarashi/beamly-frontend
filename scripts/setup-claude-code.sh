#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Claude Code for Beamly Project${NC}"
echo "==========================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create file if it doesn't exist
create_file_if_missing() {
    if [ ! -f "$1" ]; then
        echo -e "${YELLOW}📝 Creating $1...${NC}"
        touch "$1"
        echo -e "${GREEN}✅ Created $1${NC}"
    else
        echo -e "${GREEN}✅ $1 already exists${NC}"
    fi
}

# Step 1: Check Node.js installation
echo -e "${BLUE}📦 Checking prerequisites...${NC}"
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js first: https://nodejs.org"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
fi

# Step 2: Check/Install MCP servers
echo -e "\n${BLUE}📦 Checking MCP servers...${NC}"
MCP_SERVERS=(
    "mcp-server-firebase"
    "mcp-server-filesystem"
    "mcp-server-memory"
    "mcp-server-typescript"
    "mcp-server-ast"
)

MISSING_SERVERS=()

for server in "${MCP_SERVERS[@]}"; do
    if command_exists "$server"; then
        echo -e "${GREEN}✅ $server installed${NC}"
    else
        echo -e "${YELLOW}⚠️  $server not found${NC}"
        MISSING_SERVERS+=("$server")
    fi
done

# Install missing servers
if [ ${#MISSING_SERVERS[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}📥 Installing missing MCP servers...${NC}"
    npm install -g @modelcontextprotocol/server-firebase @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-memory @modelcontextprotocol/server-typescript @modelcontextprotocol/server-ast
    
    # Verify installation
    echo -e "\n${BLUE}🔍 Verifying installation...${NC}"
    for server in "${MCP_SERVERS[@]}"; do
        if command_exists "$server"; then
            echo -e "${GREEN}✅ $server ready${NC}"
        else
            echo -e "${RED}❌ Failed to install $server${NC}"
        fi
    done
fi

# Step 3: Check Firebase credentials
echo -e "\n${BLUE}🔐 Checking Firebase credentials...${NC}"
if [ -f "firebase-service-account.json" ]; then
    echo -e "${GREEN}✅ Firebase service account found${NC}"
    
    # Check if it's in .gitignore
    if grep -q "firebase-service-account.json" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✅ Firebase credentials properly gitignored${NC}"
    else
        echo -e "${YELLOW}⚠️  Adding firebase-service-account.json to .gitignore...${NC}"
        echo "firebase-service-account.json" >> .gitignore
        echo -e "${GREEN}✅ Added to .gitignore${NC}"
    fi
else
    echo -e "${RED}❌ Firebase service account missing!${NC}"
    echo -e "${YELLOW}👉 To fix this:${NC}"
    echo "   1. Go to Firebase Console (https://console.firebase.google.com)"
    echo "   2. Select your Beamly project"
    echo "   3. Go to Project Settings → Service Accounts"
    echo "   4. Click 'Generate New Private Key'"
    echo "   5. Save as 'firebase-service-account.json' in project root"
fi

# Step 4: Check MCP configuration
echo -e "\n${BLUE}⚙️  Checking MCP configuration...${NC}"
if [ -f "mcp-config.json" ]; then
    echo -e "${GREEN}✅ mcp-config.json exists${NC}"
else
    echo -e "${YELLOW}📝 Creating mcp-config.json...${NC}"
    cat > mcp-config.json << 'EOF'
{
  "mcpServers": {
    "firebase": {
      "command": "mcp-server-firebase",
      "args": [],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "./firebase-service-account.json"
      }
    },
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["--allowed-paths", ".", "--enable-search", "--enable-watch"],
      "env": {}
    },
    "memory": {
      "command": "mcp-server-memory",
      "args": [],
      "env": {}
    },
    "typescript": {
      "command": "mcp-server-typescript",
      "args": ["--project", "./tsconfig.json"],
      "env": {}
    },
    "ast": {
      "command": "mcp-server-ast",
      "args": ["--language", "typescript", "--jsx", "react"],
      "env": {}
    }
  }
}
EOF
    echo -e "${GREEN}✅ Created mcp-config.json${NC}"
fi

# Step 5: Check documentation files
echo -e "\n${BLUE}📚 Checking documentation files...${NC}"
REQUIRED_DOCS=(
    "CODEBASE_MAP.md"
    "BEFORE_CODING_ANALYSIS.md"
    "SAFE_CODING_PATTERNS.md"
)

MISSING_DOCS=()

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $doc missing${NC}"
        MISSING_DOCS+=("$doc")
    fi
done

if [ ${#MISSING_DOCS[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}📝 Missing documentation files:${NC}"
    for doc in "${MISSING_DOCS[@]}"; do
        echo "   - $doc"
    done
    echo -e "${YELLOW}👉 Please create these files using the provided templates${NC}"
fi

# Step 6: Check project dependencies
echo -e "\n${BLUE}📦 Checking project dependencies...${NC}"
if [ -f "package.json" ]; then
    # Check if TypeScript is installed
    if grep -q "\"typescript\"" package.json; then
        echo -e "${GREEN}✅ TypeScript dependency found${NC}"
    else
        echo -e "${RED}❌ TypeScript not found in package.json${NC}"
    fi
    
    # Check if required scripts exist
    echo -e "\n${BLUE}📜 Checking npm scripts...${NC}"
    REQUIRED_SCRIPTS=("dev" "build" "type-check")
    
    for script in "${REQUIRED_SCRIPTS[@]}"; do
        if grep -q "\"$script\":" package.json; then
            echo -e "${GREEN}✅ npm run $script exists${NC}"
        else
            echo -e "${YELLOW}⚠️  npm run $script missing${NC}"
        fi
    done
fi

# Step 7: Create analysis scripts
echo -e "\n${BLUE}🔧 Setting up analysis scripts...${NC}"
if ! grep -q "claude:setup" package.json 2>/dev/null; then
    echo -e "${YELLOW}📝 Adding Claude Code helper scripts to package.json...${NC}"
    echo -e "${YELLOW}👉 Please add these scripts to your package.json:${NC}"
    cat << 'EOF'

  "scripts": {
    ...existing scripts...
    "claude:setup": "bash scripts/setup-claude-code.sh",
    "claude:analyze": "npm run analyze:all",
    "analyze:all": "npm run analyze:deps && npm run analyze:css && npm run analyze:types",
    "analyze:deps": "madge --circular src/ || true",
    "analyze:css": "grep -r 'glass-effect' src/ | wc -l",
    "analyze:types": "tsc --noEmit --listFiles | wc -l",
    "analyze:component": "grep -r \"$npm_config_name\" src/ --include=\"*.tsx\"",
    "analyze:imports": "grep -r \"import.*$npm_config_name\" src/"
  }
EOF
fi

# Step 8: Final summary
echo -e "\n${BLUE}📊 Setup Summary${NC}"
echo "=================="

# Check overall status
ALL_GOOD=true

if [ ${#MISSING_SERVERS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All MCP servers installed${NC}"
else
    echo -e "${RED}❌ Some MCP servers missing${NC}"
    ALL_GOOD=false
fi

if [ -f "firebase-service-account.json" ]; then
    echo -e "${GREEN}✅ Firebase credentials configured${NC}"
else
    echo -e "${RED}❌ Firebase credentials missing${NC}"
    ALL_GOOD=false
fi

if [ ${#MISSING_DOCS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All documentation files present${NC}"
else
    echo -e "${YELLOW}⚠️  Some documentation files missing${NC}"
    ALL_GOOD=false
fi

# Final message
echo ""
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✨ Claude Code setup is complete!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Open Claude Code"
    echo "2. Go to Settings → MCP Configuration"
    echo "3. Select your mcp-config.json file"
    echo "4. Restart Claude Code"
    echo ""
    echo -e "${GREEN}🎉 You're ready to start coding with Claude Code!${NC}"
else
    echo -e "${YELLOW}⚠️  Setup incomplete. Please address the issues above.${NC}"
    echo -e "${BLUE}After fixing issues, run this script again to verify.${NC}"
fi

echo ""
echo -e "${BLUE}💡 First message to Claude Code:${NC}"
echo "\"Please read CLAUDE_CODE_INSTRUCTIONS.md and confirm you understand the project rules.\""