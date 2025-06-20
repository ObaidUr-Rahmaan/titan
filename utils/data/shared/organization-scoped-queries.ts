/* biome-ignore lint: Complex generic query helpers with Drizzle ORM type challenges */
'server only';

import { createDirectClient } from '@/lib/drizzle';
import { getOrganizationContext, requireOrganization } from '@/utils/auth/organization-helpers';
import { eq, and, sql, type SQL } from 'drizzle-orm';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';

// Type for standardized query results
export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  organizationId?: string;
}

// Type for query options
export interface QueryOptions {
  organizationId?: string; // Override current organization context
  skipOrganizationCheck?: boolean; // For admin operations
  includeDeleted?: boolean; // Include soft-deleted records
}

// Type for organization-scoped table metadata
export interface OrganizationScopedTable {
  table: PgTable;
  organizationIdColumn: PgColumn;
  softDeleteColumn?: PgColumn;
}

/**
 * Get the current organization context for queries
 */
export async function getQueryOrganizationContext(options?: QueryOptions): Promise<{
  organizationId: string | null;
  organizationDbId: number | null;
}> {
  if (options?.skipOrganizationCheck) {
    return { organizationId: null, organizationDbId: null };
  }

  if (options?.organizationId) {
    // TODO: Convert Clerk org ID to DB org ID
    return { organizationId: options.organizationId, organizationDbId: null };
  }

  try {
    const orgContext = await getOrganizationContext();
    if (orgContext?.organization) {
      return {
        organizationId: orgContext.organization.id,
        organizationDbId: parseInt(orgContext.organization.id), // Assuming string to number conversion
      };
    }
  } catch (error) {
    // No organization context available
  }

  return { organizationId: null, organizationDbId: null };
}

/**
 * Core function to create organization-scoped queries
 */
export function createOrganizationScopedQuery<T extends Record<string, any>>(
  table: PgTable,
  organizationIdColumn: PgColumn,
  organizationDbId: number,
  additionalConditions?: SQL[]
): { where: SQL } {
  const conditions: SQL[] = [eq(organizationIdColumn, organizationDbId)];
  
  if (additionalConditions) {
    conditions.push(...additionalConditions);
  }

  return {
    where: conditions.length === 1 ? conditions[0] : and(...conditions)!
  };
}

/**
 * Generic find operation with organization scoping
 */
export async function findInOrganization<T extends Record<string, any>>(
  table: PgTable,
  organizationIdColumn: PgColumn,
  conditions?: SQL[],
  options?: QueryOptions
): Promise<QueryResult<T[]>> {
  try {
    const db = createDirectClient();
    const { organizationDbId } = await getQueryOrganizationContext(options);

    if (!organizationDbId && !options?.skipOrganizationCheck) {
      return { success: false, error: 'Organization context required' };
    }

    const whereConditions: SQL[] = [];
    
    if (organizationDbId) {
      whereConditions.push(eq(organizationIdColumn, organizationDbId));
    }
    
    if (conditions) {
      whereConditions.push(...conditions);
    }

    const results = whereConditions.length > 0 
      ? await db.select().from(table).where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)!)
      : await db.select().from(table);
    
    return {
      success: true,
      data: results as T[],
      organizationId: organizationDbId?.toString()
    };
  } catch (error: any) {
    console.error('Error in findInOrganization:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Find a single record in organization
 */
export async function findOneInOrganization<T extends Record<string, any>>(
  table: PgTable,
  organizationIdColumn: PgColumn,
  conditions?: SQL[],
  options?: QueryOptions
): Promise<QueryResult<T | null>> {
  const result = await findInOrganization<T>(table, organizationIdColumn, conditions, options);
  
  if (!result.success) {
    return { success: false, error: result.error, organizationId: result.organizationId };
  }

  return {
    success: true,
    data: result.data && result.data.length > 0 ? result.data[0] : null,
    organizationId: result.organizationId
  };
}

/**
 * Find record by ID within organization scope
 */
export async function findByIdInOrganization<T extends Record<string, any>>(
  table: PgTable,
  organizationIdColumn: PgColumn,
  idColumn: PgColumn,
  id: string | number,
  options?: QueryOptions
): Promise<QueryResult<T | null>> {
  const conditions = [eq(idColumn, id)];
  return findOneInOrganization<T>(table, organizationIdColumn, conditions, options);
}

/**
 * Create a new record with organization scoping
 */
export async function createInOrganization<T extends Record<string, any>>(
  table: PgTable,
  data: Partial<T>,
  organizationIdColumn: PgColumn,
  options?: QueryOptions
): Promise<QueryResult<T>> {
  try {
    const db = createDirectClient();
    const { organizationDbId } = await getQueryOrganizationContext(options);

    if (!organizationDbId && !options?.skipOrganizationCheck) {
      return { success: false, error: 'Organization context required' };
    }

    // Add organization ID to the data
    const dataWithOrg = {
      ...data,
      [organizationIdColumn.name]: organizationDbId
    };

    const result = await db.insert(table)
      .values(dataWithOrg)
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Failed to create record' };
    }

    return {
      success: true,
      data: result[0] as T,
      organizationId: organizationDbId?.toString()
    };
  } catch (error: any) {
    console.error('Error in createInOrganization:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update records within organization scope
 */
export async function updateInOrganization<T extends Record<string, any>>(
  table: PgTable,
  organizationIdColumn: PgColumn,
  idColumn: PgColumn,
  id: string | number,
  data: Partial<T>,
  options?: QueryOptions
): Promise<QueryResult<T>> {
  try {
    const db = createDirectClient();
    const { organizationDbId } = await getQueryOrganizationContext(options);

    if (!organizationDbId && !options?.skipOrganizationCheck) {
      return { success: false, error: 'Organization context required' };
    }

    const conditions = [eq(idColumn, id)];
    if (organizationDbId) {
      conditions.push(eq(organizationIdColumn, organizationDbId));
    }

    const result = await db.update(table)
      .set(data)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions)!)
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Record not found or access denied' };
    }

    return {
      success: true,
      data: result[0] as T,
      organizationId: organizationDbId?.toString()
    };
  } catch (error: any) {
    console.error('Error in updateInOrganization:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete records within organization scope
 */
export async function deleteInOrganization<T extends Record<string, any>>(
  table: PgTable,
  organizationIdColumn: PgColumn,
  idColumn: PgColumn,
  id: string | number,
  options?: QueryOptions & { softDelete?: boolean }
): Promise<QueryResult<T>> {
  try {
    const db = createDirectClient();
    const { organizationDbId } = await getQueryOrganizationContext(options);

    if (!organizationDbId && !options?.skipOrganizationCheck) {
      return { success: false, error: 'Organization context required' };
    }

    const conditions = [eq(idColumn, id)];
    if (organizationDbId) {
      conditions.push(eq(organizationIdColumn, organizationDbId));
    }

    let result;
    if (options?.softDelete) {
      // Soft delete - update deletedAt timestamp
      result = await db.update(table)
        .set({ deletedAt: new Date() } as any)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions)!)
        .returning();
    } else {
      // Hard delete
      result = await db.delete(table)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions)!)
        .returning();
    }

    if (result.length === 0) {
      return { success: false, error: 'Record not found or access denied' };
    }

    return {
      success: true,
      data: result[0] as T,
      organizationId: organizationDbId?.toString()
    };
  } catch (error: any) {
    console.error('Error in deleteInOrganization:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Count records in organization
 */
export async function countInOrganization(
  table: PgTable,
  organizationIdColumn: PgColumn,
  conditions?: SQL[],
  options?: QueryOptions
): Promise<QueryResult<number>> {
  try {
    const db = createDirectClient();
    const { organizationDbId } = await getQueryOrganizationContext(options);

    if (!organizationDbId && !options?.skipOrganizationCheck) {
      return { success: false, error: 'Organization context required' };
    }

    const whereConditions: SQL[] = [];
    
    if (organizationDbId) {
      whereConditions.push(eq(organizationIdColumn, organizationDbId));
    }
    
    if (conditions) {
      whereConditions.push(...conditions);
    }

    const result = whereConditions.length > 0 
      ? await db.select({ count: sql<number>`count(*)` }).from(table).where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)!)
      : await db.select({ count: sql<number>`count(*)` }).from(table);
    const count = Number((result[0] as any).count);

    return {
      success: true,
      data: count,
      organizationId: organizationDbId?.toString()
    };
  } catch (error: any) {
    console.error('Error in countInOrganization:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a record exists in organization
 */
export async function existsInOrganization(
  table: PgTable,
  organizationIdColumn: PgColumn,
  conditions: SQL[],
  options?: QueryOptions
): Promise<QueryResult<boolean>> {
  const countResult = await countInOrganization(table, organizationIdColumn, conditions, options);
  
  if (!countResult.success) {
    return { success: false, error: countResult.error, organizationId: countResult.organizationId };
  }

  return {
    success: true,
    data: (countResult.data || 0) > 0,
    organizationId: countResult.organizationId
  };
}

/**
 * Batch operations within organization scope
 */
export async function batchCreateInOrganization<T extends Record<string, any>>(
  table: PgTable,
  dataArray: Partial<T>[],
  organizationIdColumn: PgColumn,
  options?: QueryOptions
): Promise<QueryResult<T[]>> {
  try {
    const db = createDirectClient();
    const { organizationDbId } = await getQueryOrganizationContext(options);

    if (!organizationDbId && !options?.skipOrganizationCheck) {
      return { success: false, error: 'Organization context required' };
    }

    // Add organization ID to all records
    const dataWithOrg = dataArray.map(data => ({
      ...data,
      [organizationIdColumn.name]: organizationDbId
    }));

    const result = await db.insert(table)
      .values(dataWithOrg)
      .returning();

    return {
      success: true,
      data: result as T[],
      organizationId: organizationDbId?.toString()
    };
  } catch (error: any) {
    console.error('Error in batchCreateInOrganization:', error);
    return { success: false, error: error.message };
  }
} 