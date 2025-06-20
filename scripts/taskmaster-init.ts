#!/usr/bin/env bun

/**
 * TaskMaster Initialization Script
 * 
 * Simple script to initialize TaskMaster if not already set up.
 * Used by the Titan upgrade agent workflow.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

function log(message: string) {
  console.log(message);
}

function execCommand(command: string): void {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error}`);
  }
}

function initializeTaskMaster(): void {
  log('🚀 Initializing TaskMaster...');
  
  // Check if TaskMaster is already initialized
  if (!existsSync('.taskmaster')) {
    log('Setting up TaskMaster for the first time...');
    execCommand('npx task-master-ai init --yes');
    log('✅ TaskMaster initialized');
  } else {
    log('TaskMaster already initialized');
  }
  
  // Ensure required directories exist
  mkdirSync('.taskmaster/docs', { recursive: true });
  mkdirSync('.taskmaster/tasks', { recursive: true });
  
  log('✅ TaskMaster ready for upgrade analysis');
}

if (require.main === module) {
  try {
    initializeTaskMaster();
  } catch (error) {
    console.error(`❌ Failed to initialize TaskMaster: ${error}`);
    process.exit(1);
  }
} 