# Mock URL Configuration Guide

## Overview
This guide explains how to use the new mock URL configuration for Playwright tests. The mock URL allows you to authenticate with a specific username and tenant ID directly via URL parameters.

## Configuration

### Environment Variables
Added to `test-data/environments/r9int.env`:
```env
MOCK_BASE_URL=http://timekeeping87-b-k8s.int.dev.mykronos.com:80/authn/setupSession
```

## Usage

### Import the URL Helper
```typescript
import { buildMockUrl } from '../../../../utils/url-helper';
```

### Basic Usage - Mock URL with Authentication

#### Example 1: Using Mock URL in beforeEach
```typescript
test.beforeEach(async ({ page }) => {
  const username = 'TManager';
  const tenantId = 'tkmanu02';
  
  await test.step('Navigate to Timekeeping Application', async () => {
    // Builds: http://timekeeping87-b-k8s.int.dev.mykronos.com:80/authn/setupSession?user=TManager&tenantId=tkmanu02
    const fullUrl = await buildMockUrl(username, tenantId);
    await navigateAndWaitForLogin(page, fullUrl);
  });
});
```

#### Example 2: Different Users in Same Spec
```typescript
test.beforeEach(async ({ page }) => {
  // Customize username per test requirement
  const username = 'SeanIvan'; // or 'TManager', 'CharlesPrinceton', etc.
  const tenantId = 'tkmanu03';
  
  const mockUrl = await buildMockUrl(username, tenantId);
  await navigateAndWaitForLogin(page, mockUrl);
});
```

#### Example 3: Using Default Tenant ID from Environment
```typescript
test.beforeEach(async ({ page }) => {
  const username = 'TManager';
  // If tenantId is not provided, it uses TENANT_ID from environment
  const mockUrl = await buildMockUrl(username);
  await navigateAndWaitForLogin(page, mockUrl);
});
```

### Available Helper Functions

#### 1. buildMockUrl()
Builds a mock authentication URL with user and tenant parameters.

```typescript
/**
 * @param username - The username to authenticate with
 * @param tenantId - The tenant ID (optional, defaults to TENANT_ID from env)
 * @returns The full mock URL with authentication parameters
 */
await buildMockUrl('TManager', 'tkmanu02');
// Returns: http://timekeeping87-b-k8s.int.dev.mykronos.com:80/authn/setupSession?user=TManager&tenantId=tkmanu02
```

#### 2. buildStandardUrl()
Builds a standard URL with tenant parameter (for backward compatibility).

```typescript
/**
 * @param tenantId - The tenant ID (optional, defaults to TENANT_ID from env)
 * @returns The full URL with tenant parameter
 */
await buildStandardUrl('tkmanu02');
// Returns: http://timekeeping90-a00-k8s.int.dev.mykronos.com/?tenantId=tkmanu02
```

#### 3. buildUrl() - Advanced Configuration
Builds a complete URL based on configuration object.

```typescript
// Standard URL with tenant
const url1 = await buildUrl({ tenantId: 'tkmanu02' });

// Mock URL with authentication
const url2 = await buildUrl({ 
  useMockUrl: true, 
  username: 'TManager', 
  tenantId: 'tkmanu02' 
});

// With navigation path (standard URL)
const url3 = await buildUrl({ 
  navigationPath: 'timekeeping#/timecard',
  tenantId: 'tkmanu02'
});
```

## Complete Example: Updated Spec File

```typescript
import { test, expect } from '@playwright/test';
import { get } from '@data-manager';
import { navigateAndWaitForLogin, cleanupBrowserContext, navigateToTimecardPage } from '../../../../utils/navigation-helper';
import { buildMockUrl } from '../../../../utils/url-helper';
import { TKManager, TimecardHomePage, /* ... other imports */ } from '@wfm-pages';

test.describe('Test Suite Name', () => {
  test.beforeEach(async ({ page }) => {
    // ✅ NEW: Use mock URL with specific username and tenant
    const username = 'TManager';
    const tenantId = 'tkmanu02';

    // Initialize page objects
    tkManager = new TKManager(page);
    loginPage = tkManager.getTimekeepingLoginPage();
    // ... other page objects

    await test.step('Navigate to Timekeeping Application', async () => {
      // Build mock URL: http://timekeeping87-b-k8s.int.dev.mykronos.com:80/authn/setupSession?user=TManager&tenantId=tkmanu02
      const fullUrl = await buildMockUrl(username, tenantId);
      await navigateAndWaitForLogin(page, fullUrl);
    });
  });

  test.afterEach(async ({ page, context }) => {
    await cleanupBrowserContext(page, context);
  });

  test('test_case_name', async ({ page }) => {
    // For navigation after login, use the standard BASE_URL
    const baseURL = await get('BASE_URL');
    const timecardPageUrl = await get('NAVIGATE_TIMECARD');

    await test.step('Step 1 - Log in and Navigate', async () => {
      const timecardPageNavigation = `${baseURL}${timecardPageUrl}`;
      await loginPage.enterUserNameAndPassword(await get('T_MANAGER') ?? '', await get('PASSWORD') ?? '');
      await loginPage.clickOnLoginButton();
      
      await navigateToTimecardPage(page, timecardPageNavigation);
    });

    // ... rest of your test steps
  });
});
```

## Customization Per Spec File

### Scenario 1: Different Users for Different Tests
```typescript
test.describe('Manager Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockUrl = await buildMockUrl('TManager', 'tkmanu02');
    await navigateAndWaitForLogin(page, mockUrl);
  });
  // ... tests
});

test.describe('Employee Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockUrl = await buildMockUrl('TCEmp01', 'tkmanu02');
    await navigateAndWaitForLogin(page, mockUrl);
  });
  // ... tests
});
```

### Scenario 2: Different Tenants for Different Tests
```typescript
test.describe('Tenant 01 Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockUrl = await buildMockUrl('TManager', 'tkmanu01');
    await navigateAndWaitForLogin(page, mockUrl);
  });
  // ... tests
});

test.describe('Tenant 02 Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockUrl = await buildMockUrl('TManager', 'tkmanu02');
    await navigateAndWaitForLogin(page, mockUrl);
  });
  // ... tests
});
```

### Scenario 3: Dynamic User Selection
```typescript
const testUsers = ['TManager', 'SeanIvan', 'CharlesPrinceton'];

for (const user of testUsers) {
  test.describe(`Tests for ${user}`, () => {
    test.beforeEach(async ({ page }) => {
      const mockUrl = await buildMockUrl(user, 'tkmanu02');
      await navigateAndWaitForLogin(page, mockUrl);
    });
    
    test(`${user} can perform action`, async ({ page }) => {
      // ... test implementation
    });
  });
}
```

## Migration Guide

### Before (Old Approach)
```typescript
test.beforeEach(async ({ page }) => {
  const baseURL = await get('BASE_URL');
  const tenantId = await get('TENANT_ID');
  
  await test.step('Navigate to Timekeeping Application', async () => {
    const fullUrl = `${baseURL}?tenantId=${tenantId}`;
    await navigateAndWaitForLogin(page, fullUrl);
  });
});
```

### After (New Mock URL Approach)
```typescript
import { buildMockUrl } from '../../../../utils/url-helper';

test.beforeEach(async ({ page }) => {
  const username = 'TManager';  // Specify user
  const tenantId = 'tkmanu02';  // Specify tenant
  
  await test.step('Navigate to Timekeeping Application', async () => {
    const fullUrl = await buildMockUrl(username, tenantId);
    await navigateAndWaitForLogin(page, fullUrl);
  });
});
```

## Available Users
Common usernames from the environment:
- `TManager` - Timecard Manager
- `SeanIvan` - Another Manager
- `CharlesPrinceton` - Employee
- `TCEmp01`, `TCEmp02`, etc. - Test Employees

## Available Tenants
From `r9int.env`:
- `tkmanu01` - TENANT_ID_STATIC01
- `tkmanu02` - TENANT_ID_STATIC02
- `tkmanu03` - TENANT_ID_STATIC03
- `tkmanu04` - TENANT_ID_STATIC04
- `tkmanu05` - TENANT_ID_STATIC05
- `tkmanu06` - TENANT_ID_STATIC06
- `manufacturing` - Default TENANT_ID

## Benefits
1. **Per-spec customization**: Each spec file can use different users and tenants
2. **Cleaner code**: Centralized URL building logic
3. **Type safety**: TypeScript interfaces for configuration
4. **Flexibility**: Easy to switch between mock and standard URLs
5. **Maintainability**: Single source of truth for URL construction

## Notes
- Mock URL is used for **initial authentication** (in beforeEach)
- Standard BASE_URL is still used for **navigation after login** (in test steps)
- The mock URL automatically sets up the session with the specified user
- No manual login required after using mock URL (depending on your authentication flow)
