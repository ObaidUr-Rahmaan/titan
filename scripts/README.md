# Titan Upgrade Scripts

## 🚀 Upgrade Titan Script

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

### Cleanup

When finished with your analysis, clean up the temporary files:
```bash
rm -rf .titan-analysis
```

### Example Workflow

1. User: "I want to upgrade Titan"
2. Script: Prompts for GitHub SSH URL
3. Script: Clones `git@github.com:example/evolved-saas.git`
4. Script: Opens in Cursor with analysis files
5. User: Asks Cursor to "Analyze this project for Titan upgrades following the prompt"
6. Cursor: Provides detailed upgrade recommendations
7. User: Implements the recommendations in Titan 