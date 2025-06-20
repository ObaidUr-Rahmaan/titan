// Re-export server actions from dedicated server file
export {
  guardOrganizationRoute,
  guardDashboardRoute,
  guardOrganizationAdminRoute,
  guardOrganizationBillingRoute,
  type RouteGuardResult
} from './route-guards-server';

// ===========================================
// CLIENT UTILITY FUNCTIONS
// ===========================================

/**
 * Utility to extract organization slug from pathname
 */
export function extractOrgSlugFromPath(pathname: string): string | null {
  const pathSegments = pathname.split('/');
  if (pathSegments[1] === 'org' && pathSegments[2]) {
    return pathSegments[2];
  }
  return null;
}

/**
 * Check if a path is an organization route
 */
export function isOrganizationPath(pathname: string): boolean {
  return pathname.startsWith('/org/');
}

/**
 * Get the organization base URL for a given slug
 */
export function getOrganizationBaseUrl(orgSlug: string): string {
  return `/org/${orgSlug}`;
} 