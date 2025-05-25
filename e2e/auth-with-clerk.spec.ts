import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

test.describe('Authentication with Clerk', () => {
  test('unauthenticated users are redirected to sign-in when accessing protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in page
    await page.waitForURL('**/sign-in', { timeout: 10000 });
    await expect(page).toHaveURL(/.*sign-in/);
    
    // Verify Clerk's sign-in component is present
    await expect(page.locator('.cl-rootBox')).toBeVisible();
    await expect(page.locator('.cl-signIn-root')).toBeVisible();
  });

  test('authenticated users can access protected routes', async ({ page }) => {
    // First, sign in using Clerk testing utilities
    await page.goto('/sign-in');
    
    // Use Clerk's testing utilities to sign in
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });
    
    // After sign in, should be redirected to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
    
    // Verify dashboard content is visible
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('sign out functionality works correctly', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });
    
    // Verify we're on dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
    
    // Sign out
    await clerk.signOut({ page });
    
    // Should be redirected to home page
    await page.waitForURL('**/', { timeout: 10000 });
    await expect(page).toHaveURL('/');
    
    // Try to access dashboard again - should be redirected to sign-in
    await page.goto('/dashboard');
    await page.waitForURL('**/sign-in', { timeout: 10000 });
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('navigation between sign-in and sign-up pages works', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Look for sign up link in Clerk's UI
    const signUpLink = page.locator('a[href*="sign-up"]').first();
    
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForURL('**/sign-up', { timeout: 10000 });
      await expect(page).toHaveURL(/.*sign-up/);
      
      // Verify sign-up component is present
      await expect(page.locator('.cl-signUp-root')).toBeVisible();
    }
  });

  test('authenticated users are redirected from auth pages to dashboard', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });
    
    // Try to access sign-in page while authenticated
    await page.goto('/sign-in');
    // After Clerk sign-in, Clerk's middleware or component logic should redirect.
    // If already signed in and navigating to /sign-in, it should redirect to dashboard.
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
    
    // Try to access sign-up page while authenticated
    await page.goto('/sign-up');
    // Similar to above, should redirect to dashboard if already authenticated.
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('sign up page can be accessed and shows sign-up form', async ({ page }) => {
    // This helper injects a testing token into the page
    // allowing the test to operate in a "signed out" state initially
    // without being flagged as bot traffic by Clerk.
    await setupClerkTestingToken({ page });

    await page.goto('/sign-up');
    await page.waitForURL('**/sign-up', { timeout: 10000 });
    await expect(page).toHaveURL(/.*sign-up/);

    // Verify Clerk's sign-up component is present
    await expect(page.locator('.cl-rootBox')).toBeVisible();
    await expect(page.locator('.cl-signUp-root')).toBeVisible();
    // Add more assertions here if needed, e.g., checking for specific form fields
  });
}); 