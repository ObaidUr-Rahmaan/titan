#!/usr/bin/env bun

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, basename } from 'path';
import chalk from 'chalk';

// Simple prompts implementation for CLI interaction
async function input(options: { message: string; validate?: (input: string) => boolean | string }): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const ask = () => {
      rl.question(options.message + ' ', (answer) => {
        if (options.validate) {
          const validation = options.validate(answer);
          if (validation !== true) {
            console.log(chalk.red(typeof validation === 'string' ? validation : 'Invalid input'));
            ask();
            return;
          }
        }
        rl.close();
        resolve(answer);
      });
    };
    ask();
  });
}

async function select(options: { message: string; choices: Array<{ name: string; value: string; description?: string }> }): Promise<string> {
  console.log(chalk.blue(options.message));
  options.choices.forEach((choice, index) => {
    console.log(chalk.gray(`${index + 1}. ${choice.name}`));
    if (choice.description) {
      console.log(chalk.gray(`   ${choice.description}`));
    }
  });

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const ask = () => {
      rl.question('Select an option (1-' + options.choices.length + '): ', (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < options.choices.length) {
          rl.close();
          resolve(options.choices[index].value);
        } else {
          console.log(chalk.red('Invalid selection. Please try again.'));
          ask();
        }
      });
    };
    ask();
  });
}

interface RepoInfo {
  url: string;
  name: string;
  sshUrl: string;
  localPath: string;
}

class TitanUpgradeAnalyzer {
  private tempDir = join(process.cwd(), '.titan-analysis');
  private analysisPrompt = `
# 🚀 Titan Upgrade Analysis

You are analyzing an evolved SaaS project to identify improvements for Titan.

## Analysis Target
Repository: {REPO_NAME}
Location: {REPO_PATH}

## Your Mission
1. **Code Architecture**: Identify improved patterns, structure, or organization
2. **Dependencies**: Find beneficial package upgrades or new integrations
3. **Features**: Discover new functionality that could enhance Titan
4. **Performance**: Spot optimizations and best practices
5. **DX Improvements**: Find developer experience enhancements
6. **Security**: Identify security improvements or patterns
7. **UI/UX**: Discover design patterns or component improvements

## Analysis Process
1. Start by exploring the project structure
2. Compare with Titan's current implementation
3. Identify specific, actionable improvements
4. Prioritize findings by impact and implementation difficulty
5. Create concrete upgrade recommendations

## Output Format
For each finding, provide:
- **Category**: (Architecture/Dependencies/Features/Performance/DX/Security/UI)
- **Description**: What you found
- **Current Titan State**: How Titan currently handles this
- **Proposed Improvement**: Specific changes to make
- **Impact**: High/Medium/Low
- **Effort**: High/Medium/Low
- **Implementation Notes**: Step-by-step guidance

Start your analysis now!
`;

  async run() {
    console.log(chalk.blue.bold('🚀 Titan Upgrade Analyzer'));
    console.log(chalk.gray('Automatically analyze evolved SaaS projects for Titan improvements\n'));

    try {
      // Get repository information
      const repoInfo = await this.getRepoInfo();
      
      // Setup analysis environment
      await this.setupAnalysisEnvironment();
      
      // Clone the repository
      await this.cloneRepository(repoInfo);
      
      // Prepare Cursor analysis
      await this.prepareCursorAnalysis(repoInfo);
      
      // Launch Cursor with analysis prompt
      await this.launchCursorAnalysis(repoInfo);
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  }

  private async getRepoInfo(): Promise<RepoInfo> {
    const url = await input({
      message: 'Enter the GitHub SSH URL of the evolved SaaS project:',
      validate: (input) => {
        const sshRegex = /^git@github\.com:[\w\-\.]+\/[\w\-\.]+\.git$/;
        return sshRegex.test(input) || 'Please enter a valid GitHub SSH URL (git@github.com:user/repo.git)';
      }
    });

    // Extract repo name from SSH URL
    const match = url.match(/git@github\.com:(.+)\.git$/);
    if (!match) throw new Error('Invalid GitHub SSH URL format');
    
    const repoPath = match[1];
    const name = basename(repoPath);
    const httpsUrl = `https://github.com/${repoPath}`;
    const localPath = join(this.tempDir, name);

    return { url: httpsUrl, name, sshUrl: url, localPath };
  }

  private async setupAnalysisEnvironment(): Promise<void> {
    console.log(chalk.yellow('📁 Setting up analysis environment...'));
    
    // Clean existing analysis directory
    if (existsSync(this.tempDir)) {
      rmSync(this.tempDir, { recursive: true, force: true });
    }
    
    mkdirSync(this.tempDir, { recursive: true });
    console.log(chalk.green('✅ Analysis environment ready'));
  }

  private async cloneRepository(repoInfo: RepoInfo): Promise<void> {
    console.log(chalk.yellow(`📥 Cloning ${repoInfo.name}...`));
    
    try {
      // Check SSH key setup
      execSync('ssh-add -l', { stdio: 'pipe' });
      
      // Clone repository
      execSync(`git clone ${repoInfo.sshUrl} ${repoInfo.localPath}`, { 
        stdio: 'pipe',
        cwd: this.tempDir 
      });
      
      console.log(chalk.green(`✅ Successfully cloned ${repoInfo.name}`));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('ssh-add')) {
        console.log(chalk.yellow('⚠️  No SSH keys found. Trying HTTPS...'));
        try {
          execSync(`git clone ${repoInfo.url} ${repoInfo.localPath}`, { 
            stdio: 'pipe',
            cwd: this.tempDir 
          });
          console.log(chalk.green(`✅ Successfully cloned ${repoInfo.name} via HTTPS`));
        } catch (httpsError) {
          const httpsErrorMessage = httpsError instanceof Error ? httpsError.message : String(httpsError);
          throw new Error(`Failed to clone repository: ${httpsErrorMessage}`);
        }
      } else {
        throw new Error(`Failed to clone repository: ${errorMessage}`);
      }
    }
  }

  private async prepareCursorAnalysis(repoInfo: RepoInfo): Promise<void> {
    console.log(chalk.yellow('📝 Preparing Cursor analysis...'));
    
    // Create analysis prompt file
    const promptContent = this.analysisPrompt
      .replace('{REPO_NAME}', repoInfo.name)
      .replace('{REPO_PATH}', repoInfo.localPath);
    
    const promptPath = join(repoInfo.localPath, '.cursor-analysis-prompt.md');
    writeFileSync(promptPath, promptContent);
    
    // Create analysis checklist
    const checklistContent = `# Titan Upgrade Analysis Checklist

## Repository: ${repoInfo.name}

### 🔍 Areas to Analyze
- [ ] **Project Structure**: Compare folder organization with Titan
- [ ] **package.json**: Check for new dependencies or version upgrades
- [ ] **Next.js Configuration**: Review next.config.js improvements
- [ ] **Database Schema**: Compare with Titan's schema structure
- [ ] **API Patterns**: Analyze route handlers and server actions
- [ ] **Authentication**: Review auth implementation improvements
- [ ] **UI Components**: Check for new component patterns
- [ ] **Styling**: Review Tailwind usage and custom styles
- [ ] **Type Definitions**: Analyze TypeScript patterns
- [ ] **Testing**: Check testing strategies and tools
- [ ] **Performance**: Look for optimization patterns
- [ ] **Security**: Review security implementations
- [ ] **DevOps**: Check deployment and CI/CD improvements

### 📊 Priority Matrix
Rate each finding as:
- **Impact**: High/Medium/Low
- **Effort**: High/Medium/Low
- **Priority**: Critical/Important/Nice-to-have

### 🎯 Output Goal
Create actionable upgrade recommendations for Titan with specific implementation steps.
`;
    
    const checklistPath = join(repoInfo.localPath, '.cursor-analysis-checklist.md');
    writeFileSync(checklistPath, checklistContent);
    
    console.log(chalk.green('✅ Analysis files prepared'));
  }

  private async launchCursorAnalysis(repoInfo: RepoInfo): Promise<void> {
    console.log(chalk.yellow('🎯 Launching Cursor analysis...'));
    
    const launchMethod = await select({
      message: 'How would you like to proceed with the analysis?',
      choices: [
        {
          name: 'Open in new Cursor window (recommended)',
          value: 'new-window',
          description: 'Opens the cloned project in a new Cursor window'
        },
        {
          name: 'Add as workspace folder',
          value: 'workspace',
          description: 'Adds the cloned project to current Cursor workspace'
        },
        {
          name: 'Manual (show paths only)',
          value: 'manual',
          description: 'Just show the paths for manual opening'
        }
      ]
    });

    switch (launchMethod) {
      case 'new-window':
        await this.openInNewCursorWindow(repoInfo);
        break;
      case 'workspace':
        await this.addToCurrentWorkspace(repoInfo);
        break;
      case 'manual':
        this.showManualInstructions(repoInfo);
        break;
    }
  }

  private async openInNewCursorWindow(repoInfo: RepoInfo): Promise<void> {
    try {
      // Try to open in Cursor
      execSync(`cursor ${repoInfo.localPath}`, { stdio: 'pipe' });
      console.log(chalk.green('✅ Opened in new Cursor window'));
      
      this.showAnalysisInstructions(repoInfo);
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not launch Cursor automatically.'));
      this.showManualInstructions(repoInfo);
    }
  }

  private async addToCurrentWorkspace(repoInfo: RepoInfo): Promise<void> {
    try {
      execSync(`cursor --add ${repoInfo.localPath}`, { stdio: 'pipe' });
      console.log(chalk.green('✅ Added to current workspace'));
      
      this.showAnalysisInstructions(repoInfo);
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not add to workspace automatically.'));
      this.showManualInstructions(repoInfo);
    }
  }

  private showManualInstructions(repoInfo: RepoInfo): void {
    console.log(chalk.blue('\n📍 Manual Instructions:'));
    console.log(chalk.gray('1. Open Cursor'));
    console.log(chalk.gray(`2. Open folder: ${repoInfo.localPath}`));
    console.log(chalk.gray('3. Open the analysis prompt file: .cursor-analysis-prompt.md'));
    console.log(chalk.gray('4. Start your analysis following the checklist\n'));
    
    this.showAnalysisInstructions(repoInfo);
  }

  private showAnalysisInstructions(repoInfo: RepoInfo): void {
    console.log(chalk.blue.bold('\n🎯 Analysis Instructions:'));
    console.log(chalk.white('1. Review the analysis prompt in:'));
    console.log(chalk.cyan(`   ${join(repoInfo.localPath, '.cursor-analysis-prompt.md')}`));
    console.log(chalk.white('2. Follow the checklist in:'));
    console.log(chalk.cyan(`   ${join(repoInfo.localPath, '.cursor-analysis-checklist.md')}`));
    console.log(chalk.white('3. Use Cursor chat to ask:'));
    console.log(chalk.green('   "Analyze this project for Titan upgrades following the prompt"'));
    
    console.log(chalk.blue.bold('\n🧹 Cleanup:'));
    console.log(chalk.gray('When finished, run:'));
    console.log(chalk.cyan(`   rm -rf ${this.tempDir}`));
    
    console.log(chalk.blue.bold('\n🚀 Happy analyzing!'));
  }
}

// Run the analyzer
const analyzer = new TitanUpgradeAnalyzer();
analyzer.run().catch(console.error); 