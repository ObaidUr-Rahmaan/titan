#!/usr/bin/env tsx
/**
 * Database Table Listing Script
 * 
 * This script connects to the database using the same environment setup as the project
 * and lists all tables in the public schema.
 * 
 * Usage:
 *   npm run tsx scripts/list-tables.ts
 *   or
 *   bun run scripts/list-tables.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TableInfo {
  table_name: string;
  table_type: string;
  table_schema: string;
}

async function listTables() {
  console.log('🔗 Connecting to database...');
  
  // Use DIRECT_URL for direct database connection (same as project pattern)
  if (!process.env.DIRECT_URL) {
    throw new Error('Missing DIRECT_URL environment variable. Make sure .env.local is configured.');
  }

  // Create postgres client with same configuration as project
  const client = postgres(process.env.DIRECT_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });

  // Create drizzle instance
  const db = drizzle(client, {
    logger: process.env.NODE_ENV === 'development'
  });

  try {
    console.log('📋 Fetching tables from public schema...\n');

    // Query to get all tables in the public schema
    const result = await client<TableInfo[]>`
      SELECT 
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    if (result.length === 0) {
      console.log('❌ No tables found in the public schema.');
      return;
    }

    console.log(`✅ Found ${result.length} table(s) in the public schema:\n`);
    
    // Display table information in a formatted way
    console.log('┌─────────────────────────────────────────┐');
    console.log('│                 TABLES                  │');
    console.log('├─────────────────────────────────────────┤');
    
    result.forEach((table, index) => {
      const isLast = index === result.length - 1;
      console.log(`│ ${(index + 1).toString().padStart(2, ' ')}. ${table.table_name.padEnd(33, ' ')} │`);
      if (!isLast) {
        console.log('├─────────────────────────────────────────┤');
      }
    });
    
    console.log('└─────────────────────────────────────────┘\n');

    // Additional information
    console.log('📊 Table Details:');
    result.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name} (${table.table_type})`);
    });

    console.log('\n🎯 Database Connection Info:');
    console.log(`   • Host: ${new URL(process.env.DIRECT_URL).hostname}`);
    console.log(`   • Database: ${new URL(process.env.DIRECT_URL).pathname.slice(1)}`);
    console.log(`   • Schema: public`);
    console.log(`   • Total Tables: ${result.length}`);

  } catch (error) {
    console.error('❌ Error fetching tables:', error);
    throw error;
  } finally {
    // Clean up connection
    await client.end();
    console.log('\n🔚 Database connection closed.');
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Database Table Listing Script');
    console.log('================================\n');
    
    await listTables();
    
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main();
}

export { listTables };