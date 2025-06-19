#!/usr/bin/env bun

/**
 * Titan Project Upgrade Script
 * 
 * Upgrades an existing Titan-based project with latest Titan improvements.
 * This script should be run from within a Titan-based project directory.
 * 
 * Usage:
 *   bun scripts/upgrade-project.ts [options]
 *   npx @titan/cli upgrade-project [options]
 * 
 * Features:
 * - Validates Titan-based project
 * - Creates safety branches
 * - Clones latest Titan for comparison
 * - Generates upgrade PRD
 * - Integrates with TaskMaster for systematic upgrade
 * - Provides rollback instructions
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

interface UpgradeOptions {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  domains: string[];
  dryRun: boolean;
  skipCleanCheck: boolean;
  tempDir: string;
  branchName: string;
  verbose: boolean;
}

const TITAN_SIGNATURES = [
  'titan',
  '@titan/cli',
  'components/ui',
  'utils/actions',
  'lib/supabase',
  '.cursor/rules'
];

const DEFAULT_OPTIONS: UpgradeOptions = {
  riskTolerance: 'moderate',
  domains: [], // Empty means all domains
  dryRun: false,
  skipCleanCheck: false,
  tempDir: '.titan-upgrade',
  branchName: 'upgrade/titan-latest',
  verbose: false
};

function log(message: string, verbose: boolean = false) {
  if (!verbose || DEFAULT_OPTIONS.verbose) {
    console.log(message);
  }
}

function error(message: string): never {
  console.error(`❌ Error: ${message}`);
  process.exit(1);
}

function success(message: string) {
  console.log(`✅ ${message}`);
}

function warning(message: string) {
  console.log(`⚠️  ${message}`);
}

function execCommand(command: string, silent: boolean = false): string {
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return typeof result === 'string' ? result.trim() : '';
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error}`);
  }
}

function validateTitanProject(): void {
  log('🔍 Validating Titan-based project...');
  
  // Check for package.json
  if (!existsSync('package.json')) {
    error('No package.json found. Are you in a project directory?');
  }

  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  // Check for Titan signatures
  const signatures = [
    packageJson.name?.includes?.('titan'),
    packageJson.dependencies?.['@titan/cli'],
    packageJson.dependencies?.['next'],
    packageJson.dependencies?.['@clerk/nextjs'],
    packageJson.dependencies?.['stripe'],
    existsSync('components/ui'),
    existsSync('utils/actions'),
    existsSync('lib/supabase')
  ];

  const matchCount = signatures.filter(Boolean).length;
  
  if (matchCount < 3) {
    warning('This might not be a Titan-based project.');
    warning('Continuing anyway, but results may vary...');
  } else {
    success('Confirmed Titan-based project');
  }
}

function checkGitStatus(): void {
  log('📋 Checking git status...');
  
  if (!existsSync('.git')) {
    error('No git repository found. Please initialize git first.');
  }

  try {
    const status = execCommand('git status --porcelain', true);
    if (status) {
      error('Working directory is not clean. Please commit or stash changes first.');
    }
    success('Git working directory is clean');
  } catch {
    error('Failed to check git status. Ensure git is available.');
  }
}

function createUpgradeBranch(branchName: string): void {
  log(`🌿 Creating upgrade branch: ${branchName}`);
  
  try {
    // Check if branch already exists
    try {
      execCommand(`git show-ref --verify --quiet refs/heads/${branchName}`, true);
      warning(`Branch ${branchName} already exists. Switching to it...`);
      execCommand(`git checkout ${branchName}`);
    } catch {
      // Branch doesn't exist, create it
      execCommand(`git checkout -b ${branchName}`);
      success(`Created and switched to branch: ${branchName}`);
    }
  } catch (err) {
    error(`Failed to create upgrade branch: ${err}`);
  }
}

function cloneLatestTitan(tempDir: string): void {
  log('⬇️  Cloning latest Titan for comparison...');
  
  // Clean up existing temp directory
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
  
  mkdirSync(tempDir, { recursive: true });
  
  try {
    execCommand(`git clone https://github.com/yourusername/titan.git ${tempDir}/titan`);
    success('Latest Titan cloned successfully');
  } catch (err) {
    error(`Failed to clone Titan: ${err}`);
  }
}

function generateUpgradePRD(options: UpgradeOptions): void {
  log('📝 Generating upgrade PRD...');
  
  // Ensure TaskMaster directories exist
  mkdirSync('.taskmaster/docs', { recursive: true });
  
  // Read package.json for project details
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const projectName = packageJson.name || 'unknown-project';
  
  // Read the PRD template
  const templatePath = existsSync('docs/project-upgrade-prd-template.txt') 
    ? 'docs/project-upgrade-prd-template.txt'
    : join(options.tempDir, 'titan/docs/project-upgrade-prd-template.txt');
    
  if (!existsSync(templatePath)) {
    error('Could not find project upgrade PRD template');
  }
  
  let prdContent = readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  const replacements = {
    '[PROJECT_NAME]': projectName,
    '[RISK_TOLERANCE]': options.riskTolerance.toUpperCase(),
    '[DOMAINS_FOCUS]': options.domains.length > 0 
      ? `Focus on: ${options.domains.join(', ')}`
      : 'All domains',
    '[DRY_RUN]': options.dryRun ? 'YES - Analysis only, no changes' : 'NO - Apply changes',
    '[BRANCH_NAME]': options.branchName,
    '[CURRENT_DATE]': new Date().toISOString().split('T')[0]
  };
  
  Object.entries(replacements).forEach(([placeholder, value]) => {
    prdContent = prdContent.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Write the PRD
  writeFileSync('.taskmaster/docs/prd.txt', prdContent);
  success('Upgrade PRD generated at .taskmaster/docs/prd.txt');
}

function initializeTaskMaster(): void {
  log('🚀 Initializing TaskMaster...');
  
  try {
    // Check if TaskMaster is already initialized
    if (!existsSync('.taskmaster/tasks')) {
      execCommand('npx task-master-ai init --yes');
      success('TaskMaster initialized');
    } else {
      log('TaskMaster already initialized');
    }
  } catch (err) {
    error(`Failed to initialize TaskMaster: ${err}`);
  }
}

function startUpgradeProcess(): void {
  log('🔄 Starting upgrade process...');
  
  try {
    execCommand('npx task-master-ai parse-prd .taskmaster/docs/prd.txt --force');
    success('Upgrade tasks generated! 🎉');
    
    console.log('\n📋 Next steps:');
    console.log('1. Review generated tasks: npx task-master-ai list');
    console.log('2. Start working: npx task-master-ai next');
    console.log('3. Use Cursor with: "Start the project upgrade using TaskMaster"');
    console.log('\n🛡️  Safety:');
    console.log('• All changes are in the upgrade branch');
    console.log('• Rollback anytime: git checkout main && git branch -D upgrade/titan-latest');
    console.log('• Test thoroughly before merging');
    
  } catch (err) {
    error(`Failed to start upgrade process: ${err}`);
  }
}

function cleanup(tempDir: string): void {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
    log('🧹 Cleaned up temporary files');
  }
}

function printUsage(): void {
  console.log(`
Titan Project Upgrade Tool

Usage:
  bun scripts/upgrade-project.ts [options]
  npx @titan/cli upgrade-project [options]

Options:
  --risk-tolerance <level>    Risk tolerance: conservative|moderate|aggressive (default: moderate)
  --domains <list>           Comma-separated domains to focus on
  --dry-run                  Analysis only, no changes applied
  --skip-clean-check         Skip git clean status check (dangerous)
  --branch-name <name>       Custom upgrade branch name (default: upgrade/titan-latest)
  --temp-dir <path>          Temporary directory for Titan clone (default: .titan-upgrade)
  --verbose                  Verbose logging
  --help                     Show this help message

Examples:
  # Standard upgrade
  bun scripts/upgrade-project.ts

  # Conservative upgrade focusing on security and performance
  bun scripts/upgrade-project.ts --risk-tolerance conservative --domains security,performance

  # Dry run to see what would be upgraded
  bun scripts/upgrade-project.ts --dry-run

Risk Tolerance Levels:
  conservative: Only apply proven, low-risk improvements
  moderate:     Apply most improvements with reasonable testing
  aggressive:   Apply all available improvements (requires thorough testing)
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  const options: UpgradeOptions = { ...DEFAULT_OPTIONS };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--risk-tolerance':
        options.riskTolerance = args[++i] as any;
        break;
      case '--domains':
        options.domains = args[++i].split(',').map(d => d.trim());
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-clean-check':
        options.skipCleanCheck = true;
        break;
      case '--branch-name':
        options.branchName = args[++i];
        break;
      case '--temp-dir':
        options.tempDir = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
    }
  }
  
  console.log('🚀 Titan Project Upgrade Tool\n');
  
  try {
    validateTitanProject();
    
    if (!options.skipCleanCheck) {
      checkGitStatus();
    }
    
    createUpgradeBranch(options.branchName);
    cloneLatestTitan(options.tempDir);
    generateUpgradePRD(options);
    initializeTaskMaster();
    startUpgradeProcess();
    
  } catch (error) {
    console.error(`\n❌ Upgrade failed: ${error}`);
    process.exit(1);
  } finally {
    cleanup(options.tempDir);
  }
}

if (require.main === module) {
  main().catch(console.error);
} 