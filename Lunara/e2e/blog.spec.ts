import { test, expect } from '@playwright/test';

test.describe('Blog Page', () => {
  test('renders the blog page without crashing', async ({ page }) => {
    await page.goto('/blog');

    // The page should load. It will either show posts, a loading state, or "No blog posts" message.
    // Wait for the loading state to resolve (network requests may fail in isolation).
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading blog posts...'),
      { timeout: 10_000 },
    );

    // After loading resolves, the page shows either posts, an error, or the empty state
    const content = await page.textContent('body');
    const hasBlogContent =
      content?.includes('No blog posts available yet') ||
      content?.includes('Failed to load blog posts') ||
      content?.includes('Read More');
    expect(hasBlogContent).toBeTruthy();
  });

  test('shows empty state or error when backend is unavailable', async ({ page }) => {
    await page.goto('/blog');

    // Wait for loading to finish
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading blog posts...'),
      { timeout: 10_000 },
    );

    // Without a running backend, expect either the error or empty state
    const errorMsg = page.getByText('Failed to load blog posts');
    const emptyMsg = page.getByText('No blog posts available yet');

    const hasError = await errorMsg.isVisible().catch(() => false);
    const hasEmpty = await emptyMsg.isVisible().catch(() => false);
    expect(hasError || hasEmpty).toBeTruthy();
  });

  test('blog page is wrapped in the main layout with header', async ({ page }) => {
    await page.goto('/blog');

    // The MainLayout wraps the blog page, so there should be a header/nav
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});

test.describe('Blog Post Detail Page', () => {
  test('navigating to a blog slug renders without crashing', async ({ page }) => {
    await page.goto('/blog/test-post');

    // The page should load without a blank screen.
    // Without a backend it will likely show an error or loading state.
    // The key assertion is that the app does not crash (no white screen).
    await expect(page.locator('body')).not.toBeEmpty();

    // Should still have the main layout header
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});
