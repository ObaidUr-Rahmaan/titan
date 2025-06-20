#!/usr/bin/env bun

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, basename } from 'path';

interface RepoInfo {
  url: string;
  name: string;
  localPath: string;
}

interface AnalyzeOptions {
  projectUrl: string;
  tempDir?: string;
  verbose?: boolean;
}

class TitanUpgradeAnalyzer {
  private tempDir: string;
  private verbose: boolean;

  constructor(options: { tempDir?: string; verbose?: boolean } = {}) {
    this.tempDir = options.tempDir || join(process.cwd(), '.titan-analysis');
    this.verbose = options.verbose || false;
  }

  private log(message: string) {
    if (this.verbose) {
      console.log(message);
    }
  }

  async analyzeProject(projectUrl: string): Promise<RepoInfo> {
    this.log('🚀 Starting Titan upgrade analysis...');

    try {
      // Parse repository information
      const repoInfo = this.parseRepoUrl(projectUrl);
      
      // Setup analysis environment
      await this.setupAnalysisEnvironment();
      
      // Clone the repository
      await this.cloneRepository(repoInfo);
      
      // Prepare analysis files
      await this.prepareAnalysisFiles(repoInfo);
      
      this.log(`✅ Project cloned and ready for analysis at: ${repoInfo.localPath}`);
      return repoInfo;
      
    } catch (error) {
      throw new Error(`Analysis failed: ${error}`);
    }
  }

  private parseRepoUrl(url: string): RepoInfo {
    // Handle different URL formats
    let githubPath: string;
    
    if (url.startsWith('git@github.com:')) {
      // SSH format: git@github.com:user/repo.git
      const match = url.match(/git@github\.com:(.+)\.git$/);
      if (!match) throw new Error('Invalid GitHub SSH URL format');
      githubPath = match[1];
    } else if (url.includes('github.com')) {
      // HTTPS format: https://github.com/user/repo or github.com/user/repo
      const match = url.match(/github\.com\/(.+?)(?:\.git)?(?:\/)?$/);
      if (!match) throw new Error('Invalid GitHub URL format');
      githubPath = match[1];
    } else {
      throw new Error('Please provide a valid GitHub URL');
    }

    const name = basename(githubPath);
    const httpsUrl = `https://github.com/${githubPath}`;
    const sshUrl = `git@github.com:${githubPath}.git`;
    const localPath = join(this.tempDir, name);

    return { url: httpsUrl, name, localPath };
  }

  private async setupAnalysisEnvironment(): Promise<void> {
    this.log('📁 Setting up analysis environment...');
    
    // Clean existing analysis directory
    if (existsSync(this.tempDir)) {
      rmSync(this.tempDir, { recursive: true, force: true });
    }
    
    mkdirSync(this.tempDir, { recursive: true });
    this.log('✅ Analysis environment ready');
  }

  private async cloneRepository(repoInfo: RepoInfo): Promise<void> {
    this.log(`📥 Cloning ${repoInfo.name}...`);
    
    try {
      // Try HTTPS first (most common and doesn't require SSH setup)
      execSync(`git clone ${repoInfo.url} ${repoInfo.localPath}`, { 
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.tempDir 
      });
      
      this.log(`✅ Successfully cloned ${repoInfo.name}`);
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error}`);
    }
  }

  private async prepareAnalysisFiles(repoInfo: RepoInfo): Promise<void> {
    this.log('📝 Preparing analysis files...');
    
    // Create analysis summary file for the agent
    const summaryContent = `# Titan Upgrade Analysis: ${repoInfo.name}

## Repository Information
- **Name**: ${repoInfo.name}
- **URL**: ${repoInfo.url}
- **Local Path**: ${repoInfo.localPath}
- **Analysis Date**: ${new Date().toISOString()}

## Analysis Status
This project has been cloned and is ready for Cursor agent analysis.

## Next Steps for Agent
1. Use the TaskMaster workflow to create upgrade PRD
2. Analyze the project systematically across all domains
3. Generate actionable upgrade recommendations for Titan

## Quick Analysis Commands
\`\`\`bash
# View project structure
ls -la ${repoInfo.localPath}

# Check package.json for dependencies
cat ${repoInfo.localPath}/package.json

# Look for key files
find ${repoInfo.localPath} -name "*.config.*" -o -name "middleware.*" -o -name "layout.*"
\`\`\`
`;
    
    const summaryPath = join(process.cwd(), '.titan-analysis-summary.md');
    writeFileSync(summaryPath, summaryContent);
    
    this.log('✅ Analysis files prepared');
  }

  cleanup(): void {
    if (existsSync(this.tempDir)) {
      rmSync(this.tempDir, { recursive: true, force: true });
      this.log('🧹 Cleaned up temporary files');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Titan Upgrade Analyzer (Agent-Friendly)

Usage:
  bun scripts/upgrade-titan.ts <project-url> [options]

Arguments:
  project-url    GitHub URL of the project to analyze

Options:
  --temp-dir <path>    Custom temporary directory (default: .titan-analysis)
  --verbose           Enable verbose logging
  --help             Show this help message

Examples:
  # Analyze a GitHub project
  bun scripts/upgrade-titan.ts https://github.com/user/awesome-saas

  # With SSH URL
  bun scripts/upgrade-titan.ts git@github.com:user/awesome-saas.git
`);
    process.exit(0);
  }

  const projectUrl = args[0];
  let tempDir: string | undefined;
  let verbose = false;

  // Parse options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--temp-dir':
        tempDir = args[++i];
        break;
      case '--verbose':
        verbose = true;
        break;
    }
  }

  const analyzer = new TitanUpgradeAnalyzer({ tempDir, verbose });

  try {
    const repoInfo = await analyzer.analyzeProject(projectUrl);
    
    console.log('\n✅ Analysis Setup Complete!');
    console.log(`📁 Project cloned to: ${repoInfo.localPath}`);
    console.log('📋 Analysis summary created: .titan-analysis-summary.md');
    console.log('\n🎯 Next: Use Cursor agent to analyze the project and upgrade Titan');
    
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
}

// Export for programmatic use
export { TitanUpgradeAnalyzer };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
} 