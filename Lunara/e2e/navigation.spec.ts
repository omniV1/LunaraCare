import { test, expect } from '@playwright/test';

test.describe('Public Route Navigation', () => {
  test('landing page is accessible at /', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('login page is accessible at /login', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  });

  test('blog page is accessible at /blog', async ({ page }) => {
    const response = await page.goto('/blog');
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('forgot password page is accessible at /forgot-password', async ({ page }) => {
    const response = await page.goto('/forgot-password');
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
  });
});

test.describe('Catch-All / 404 Redirect', () => {
  test('unknown routes redirect to the home page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    // The catch-all route does <Navigate to="/" replace />, so we end up at the landing page
    await expect(page).toHaveURL('/');
  });

  test('another unknown route also redirects home', async ({ page }) => {
    await page.goto('/random/nested/path');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Protected Routes Redirect to Login', () => {
  test('provider dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/provider/dashboard');
    // ProtectedRoute navigates to /login when not authenticated
    await expect(page).toHaveURL('/login');
  });

  test('client dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/client/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('security settings redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/settings/security');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Cross-Page Navigation', () => {
  test('can navigate from landing to login via header', async ({ page }) => {
    await page.goto('/');
    // Click the Login link in the header nav
    await page.locator('header').getByRole('link', { name: 'Login' }).first().click();
    await expect(page).toHaveURL('/login');
  });

  test('can navigate from landing to blog via header', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Blog' }).first().click();
    await expect(page).toHaveURL('/blog');
  });

  test('can navigate from login page back to home via "LEARN MORE"', async ({ page }) => {
    await page.goto('/login');
    const learnMore = page.getByRole('link', { name: 'LEARN MORE' });
    await expect(learnMore).toBeVisible();
    // The link goes to /#offerings
    await learnMore.click();
    await expect(page).toHaveURL(/#offerings/);
  });

  test('can navigate from forgot-password back to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByRole('link', { name: /back to login/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
