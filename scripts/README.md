# Titan Upgrade Scripts

Titan provides two intelligent upgrade scripts for bi-directional improvement workflows.

## 🔄 Two-Way Upgrade System

### 1. **upgrade-titan.ts** - Upstream Improvements
Extract battle-tested improvements from evolved projects back to Titan boilerplate.

### 2. **upgrade-project.ts** - Downstream Upgrades
Apply latest Titan improvements to existing projects safely.

---

## 🚀 Upgrade Titan Script (Upstream)

Automatically analyze evolved SaaS projects to identify improvements for Titan.

### Quick Start

1. **Via Cursor Chat**: Simply type "I want to upgrade Titan" and the script will guide you through the process.

2. **Via CLI**: Run the script directly:
   ```bash
   bun run upgrade-titan
   ```

### What it does

1. **Prompts for GitHub SSH URL**: Enter the SSH URL of an evolved SaaS project you want to analyze
2. **Clones Repository**: Automatically clones the project (tries SSH first, falls back to HTTPS)
3. **Sets up Analysis Environment**: Creates analysis prompts and checklists
4. **Launches Cursor**: Opens the cloned project in Cursor with pre-configured analysis instructions

### Analysis Process

The script creates two files in the cloned repository:

- **`.cursor-analysis-prompt.md`**: Detailed instructions for the AI analysis
- **`.cursor-analysis-checklist.md`**: Comprehensive checklist of areas to analyze

### Analysis Categories

- 🏗️ **Code Architecture**: Improved patterns and structure
- 📦 **Dependencies**: Package upgrades and new integrations  
- ✨ **Features**: New functionality to enhance Titan
- ⚡ **Performance**: Optimizations and best practices
- 🛠️ **DX Improvements**: Developer experience enhancements
- 🔒 **Security**: Security improvements and patterns
- 🎨 **UI/UX**: Design patterns and component improvements

### Output Format

Each finding includes:
- **Category**: What type of improvement it is
- **Description**: What was found
- **Current Titan State**: How Titan currently handles this
- **Proposed Improvement**: Specific changes to make
- **Impact/Effort**: Priority matrix (High/Medium/Low)
- **Implementation Notes**: Step-by-step guidance

---

## 🔄 Upgrade Project Script (Downstream)

Upgrade existing Titan-based projects with latest Titan improvements safely.

### Quick Start

```bash
# From your Titan-based project directory
bun scripts/upgrade-project.ts

# Or with specific options
bun scripts/upgrade-project.ts --risk-tolerance conservative --domains security,performance
```

### What it does

1. **Validates Project**: Confirms it's a Titan-based project
2. **Safety Checks**: Ensures clean git status for safe upgrades
3. **Creates Branch**: Sets up dedicated upgrade branch
4. **Clones Latest Titan**: Downloads latest version for comparison
5. **Generates PRD**: Creates project-specific upgrade document
6. **TaskMaster Integration**: Sets up systematic upgrade tasks

### Features

- ✅ **Smart Detection**: Automatically validates Titan-based projects
- ✅ **Safety First**: Branch-based upgrades with easy rollback
- ✅ **Selective Upgrades**: Choose which domains to focus on
- ✅ **Risk Management**: Conservative, moderate, or aggressive upgrade modes
- ✅ **TaskMaster Integration**: Systematic task-based upgrade process

### Options

```bash
--risk-tolerance <level>    # conservative|moderate|aggressive (default: moderate)
--domains <list>           # Comma-separated domains to focus on
--dry-run                  # Analysis only, no changes applied
--skip-clean-check         # Skip git clean status check (dangerous)
--branch-name <name>       # Custom upgrade branch name
--verbose                  # Detailed logging
--help                     # Show help message
```

### Risk Tolerance Levels

- **Conservative**: Only apply proven, low-risk improvements
- **Moderate**: Apply most improvements with reasonable testing
- **Aggressive**: Apply all available improvements (requires thorough testing)

### Example Workflows

```bash
# Standard upgrade
bun scripts/upgrade-project.ts

# Conservative upgrade focusing on security
bun scripts/upgrade-project.ts --risk-tolerance conservative --domains security,performance

# Dry run to preview changes
bun scripts/upgrade-project.ts --dry-run
```

### Safety Features

- 🛡️ **Branch Protection**: All changes in dedicated upgrade branches
- 🔄 **Easy Rollback**: `git checkout main && git branch -D upgrade/titan-latest`
- 📊 **Compatibility Assessment**: Intelligent analysis of what's safe to apply
- 🧪 **Incremental Testing**: Test each domain before proceeding
- ⚠️ **Custom Code Protection**: Never overwrites project-specific business logic

---

## 🔧 Integration Features

### TaskMaster Integration

Both scripts integrate with TaskMaster AI for systematic upgrade management:

1. **PRD Generation**: Automatically creates tailored upgrade documents
2. **Task Breakdown**: AI-powered breakdown into manageable tasks
3. **Dependency Management**: Tracks relationships between upgrade tasks
4. **Progress Tracking**: Monitor upgrade progress with detailed status
5. **Cursor Integration**: Use with "Start the upgrade using TaskMaster"

### Cursor Rules Integration

Works with `.cursor/rules/` for guided AI assistance:

**Upstream (Titan improvement)**:
- `titan-upgrade-workflow.mcd`: Orchestrates improvement extraction
- `analysis-domains.mcd`: 20 systematic analysis domains
- `migration-patterns.mcd`: Safe migration guidelines

**Downstream (Project upgrade)**:
- `project-upgrade-workflow.mcd`: Orchestrates project upgrades
- `upgrade-compatibility.mcd`: Traffic light compatibility system
- `upgrade-safety-patterns.mcd`: Safety patterns and rollback procedures

---

## 📋 Next Steps

After running either script:

1. **Review Tasks**: `npx task-master-ai list`
2. **Start Working**: `npx task-master-ai next`
3. **Use Cursor**: "Start the [upgrade type] using TaskMaster"

### Cleanup (Upstream only)

When finished with analysis:
```bash
rm -rf .titan-analysis
```

---

## 🚀 Future CLI Integration

Both scripts will be available via the Titan CLI package:

```bash
# Future availability
npx @titan/cli upgrade-titan --project-path ./my-evolved-app
npx @titan/cli upgrade-project --risk-tolerance conservative
```

## 💡 Pro Tips

- **Start Conservative**: Use `--risk-tolerance conservative` for your first upgrade
- **Focus Domains**: Use `--domains` to target specific improvement areas
- **Test Incrementally**: Commit and test after each major domain upgrade
- **Use Dry Run**: Always preview with `--dry-run` for complex projects
- **Backup First**: Ensure your project is committed before upgrading 