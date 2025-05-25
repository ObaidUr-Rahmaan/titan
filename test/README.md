# Testing Guide for Titan

This guide covers the testing infrastructure for the Titan SaaS boilerplate.

## Overview

- **Unit Testing**: Vitest for component and utility testing
- **E2E Testing**: Playwright for end-to-end testing
- **CI/CD**: GitHub Actions for automated testing on PRs

## Quick Start

```bash
# Install dependencies
bun install

# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e

# Run tests with coverage
bun run test:coverage

# Run E2E tests with UI
bun run test:e2e:ui
```

## Setting Up Clerk Authentication for E2E Tests

**Important**: Our E2E tests use real Clerk authentication, not mocks.

1. **Create Test Environment File**:
   ```bash
   cp .env.test.example .env.test
   ```

2. **Configure Clerk Test Credentials**:
   - Get your test Clerk keys from the Clerk dashboard
   - Create a test user in Clerk dashboard
   - Update `.env.test` with real values

3. **Enable Authentication**:
   - Set `auth.enabled: true` in `config.ts`

## Running Tests

### Unit Tests
```bash
bun run test          # Run once
bun run test:watch    # Watch mode
bun run test:coverage # With coverage
```

### E2E Tests
```bash
bun run test:e2e      # Run all E2E tests
bun run test:e2e:ui   # UI mode for debugging
bun run test:e2e:debug # Debug mode
```

## GitHub Actions Setup

Add these secrets to your GitHub repository:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `E2E_CLERK_USER_USERNAME`
- `E2E_CLERK_USER_PASSWORD`

## Common Issues

### Clerk Authentication Tests Failing
1. Check auth is enabled in `config.ts`
2. Verify test user exists in Clerk dashboard
3. Ensure `.env.test` has correct values

### E2E Tests Timing Out
1. Increase timeout in `playwright.config.ts`
2. Check if dev server starts correctly
3. Verify localhost:3000 is accessible 