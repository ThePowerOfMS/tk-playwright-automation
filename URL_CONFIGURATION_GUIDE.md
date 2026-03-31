# URL Configuration - Default vs Mock URL

## Overview
You can choose between two approaches for each spec file:
1. **Default Flow** - Uses existing BASE_URL (no changes needed)
2. **Mock URL Flow** - Uses new mock URL with username/tenant parameters (opt-in)

---

## Option 1: Default Flow (Existing Approach)

**No changes needed** - Continue using your existing spec files as-is.

### Example: Standard Spec File
```typescript
import { test, expect } from '@playwright/test';
import { get } from '@data-manager';
import { navigateAndWaitForLogin, cleanupBrowserContext, navigateToTimecardPage } from '../../../../utils/navigation-helper';
import { TKManager, TimecardHomePage, /* ... */ } from '@wfm-pages';

test.describe('Test Suite Name', () => {
  test.beforeEach(async ({ page }) => {
    // ✅ DEFAULT FLOW - No changes needed
    const baseURL = await get('BASE_URL');
    const tenantId = await get('TENANT_ID');

    tkManager = new TKManager(page);
    loginPage = tkManager.getTimekeepingLoginPage();
    // ... other page objects

    await test.step('Navigate to Timekeeping Application', async () => {
      const fullUrl = `${baseURL}?tenantId=${tenantId}`;
      await navigateAndWaitForLogin(page, fullUrl);
    });
  });

  test('test_case_name', async ({ page }) => {
    const baseURL = await get('BASE_URL');
    const timecardPageUrl = await get('NAVIGATE_TIMECARD');

    await test.step('Step 1 - Log in and Navigate', async () => {
      const timecardPageNavigation = `${baseURL}${timecardPageUrl}`;
      await loginPage.enterUserNameAndPassword(await get('T_MANAGER') ?? '', await get('PASSWORD') ?? '');
      await loginPage.clickOnLoginButton();
      await navigateToTimecardPage(page, timecardPageNavigation);
    });
    // ... rest of test
  });
});
```

---

## Option 2: Mock URL Flow (New Approach - Opt-in)

**Only use when you need** per-spec user/tenant customization.

**🔑 Key Benefit: Bypasses login steps** - Authentication happens via URL, so you skip username/password entry.

### Example: Spec Using Mock URL
```typescript
import { test, expect } from '@playwright/test';
import { get } from '@data-manager';
import { navigateAndWaitForLogin, cleanupBrowserContext, navigateToTimecardPage } from '../../../../utils/navigation-helper';
import { buildMockUrl } from '../../../../utils/url-helper'; // ← Import helper
import { TKManager, TimecardHomePage, /* ... */ } from '@wfm-pages';

test.describe('Test Suite Name', () => {
  test.beforeEach(async ({ page }) => {
    // ✅ MOCK URL FLOW - Authenticates directly via URL
    const username = 'TManager';  // User is authenticated via URL
    const tenantId = 'tkmanu02';  // Tenant is set via URL

    tkManager = new TKManager(page);
    loginPage = tkManager.getTimekeepingLoginPage();
    // ... other page objects

    await test.step('Navigate to Timekeeping Application', async () => {
      // Builds: http://timekeeping87-b-k8s.int.dev.mykronos.com:80/authn/setupSession?user=TManager&tenantId=tkmanu02
      const fullUrl = await buildMockUrl(username, tenantId);
      await navigateAndWaitForLogin(page, fullUrl);
      // ✅ Already authenticated as TManager - no login needed!
    });
  });

  test('test_case_name', async ({ page }) => {
    const baseURL = await get('BASE_URL');
    const timecardPageUrl = await get('NAVIGATE_TIMECARD');

    await test.step('Step 1 - Navigate to timecard (already authenticated)', async () => {
      const timecardPageNavigation = `${baseURL}${timecardPageUrl}`;
      
      // ✅ NO LOGIN STEPS NEEDED - mock URL already authenticated
      // Just wait for session confirmation and navigate
      await expect(page.locator('//button[contains(@class, \'home-button\')]')).toBeVisible({ timeout: 180000 });
      await navigateToTimecardPage(page, timecardPageNavigation);
    });
    // ... rest of test
  });
});
```

---

## When to Use Each Approach

### Use **Default Flow** when:
- ✅ Test works fine with standard BASE_URL
- ✅ No specific user/tenant customization needed
- ✅ Using environment variables for configuration
- ✅ **Most of your existing tests** (no migration needed)

### Use **Mock URL Flow** when:
- ✅ Need to specify exact user per spec file
- ✅ Need to specify exact tenant per spec file
- ✅ **Want to skip login steps** (authentication via URL)
- ✅ Testing specific user/tenant combinations
- ✅ **Faster test execution** (no username/password entry)
- ✅ **Only when explicitly needed**

---

## Side-by-Side Comparison

| Aspect | Default Flow | Mock URL Flow |
|--------|-------------|---------------|
| **Import needed** | No extra imports | `import { buildMockUrl } from '...url-helper'` |
| **Configuration** | Uses env variables | Specify in code |
| **URL format** | `BASE_URL?tenantId=X` | `MOCK_BASE_URL?user=X&tenantId=Y` |
| **User control** | Login manually in test | User specified in URL - **bypasses login** |
| **Login steps** | Required (username/password) | **Not needed** - authenticated via URL |
| **When to use** | Most tests (default) | Skip login, specific user/tenant |
| **Migration needed** | ❌ No changes | ✅ Opt-in only |

---

## Real Examples

### Example 1: Most Tests Stay Default
```typescript
// File: test_ALM108773_ManagerJobTransfer.spec.ts
// ✅ Keep using default flow - no changes needed

test.beforeEach(async ({ page }) => {
  const baseURL = await get('BASE_URL');
  const tenantId = await get('TENANT_ID');
  
  await test.step('Navigate', async () => {
    const fullUrl = `${baseURL}?tenantId=${tenantId}`;
    await navigateAndWaitForLogin(page, fullUrl);
  });
});
```

### Example 2: Specific Test Needs Mock URL
```typescript
// File: test_ALM96047_VerifyManagerCanUpdate.spec.ts
// ✅ Use mock URL for specific TManager + tkmanu02 combination
// ✅ SKIPS login steps - already authenticated via URL

import { buildMockUrl } from '../../../../utils/url-helper';

test.beforeEach(async ({ page }) => {
  const username = 'TManager';
  const tenantId = 'tkmanu02';
  
  await test.step('Navigate', async () => {
    const fullUrl = await buildMockUrl(username, tenantId);
    await navigateAndWaitForLogin(page, fullUrl);
    // Already authenticated as TManager!
  });
});

test('test case', async ({ page }) => {
  await test.step('Step 1 - Navigate to timecard (no login needed)', async () => {
    // Skip: loginPage.enterUserNameAndPassword()
    // Skip: loginPage.clickOnLoginButton()
    // Just navigate directly!
    await navigateToTimecardPage(page, timecardPageNavigation);
  });
});
```

### Example 3: Multiple Users in Same File
```typescript
// Testing different users with mock URL
import { buildMockUrl } from '../../../../utils/url-helper';

test.describe('Manager Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockUrl = await buildMockUrl('TManager', 'tkmanu02');
    await navigateAndWaitForLogin(page, mockUrl);
  });
  // ... manager tests
});

test.describe('Employee Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockUrl = await buildMockUrl('TCEmp01', 'tkmanu02');
    await navigateAndWaitForLogin(page, mockUrl);
  });
  // ... employee tests
});
```

---

## Migration Strategy

1. **Keep all existing specs as-is** (default flow)
2. **Only migrate specific specs** that need user/tenant customization
3. **Add mock URL only when required** for your test scenario

### Quick Migration Checklist (Only if needed)

- [ ] Add import: `import { buildMockUrl } from '../../../../utils/url-helper';`
- [ ] Replace `const baseURL = await get('BASE_URL')` with username/tenant vars
- [ ] Replace `const tenantId = await get('TENANT_ID')` with specific tenant
- [ ] Replace `const fullUrl = \`${baseURL}?tenantId=${tenantId}\`` with `await buildMockUrl(username, tenantId)`

---

## Summary

- **Default Flow = Default Choice** ✅ No changes needed for existing tests
- **Mock URL = Opt-in Feature** 🎯 Use only when you need specific user/tenant control
- **Both approaches work together** 🤝 Mix and match based on test requirements
- **No breaking changes** ✨ All existing specs continue to work as-is
