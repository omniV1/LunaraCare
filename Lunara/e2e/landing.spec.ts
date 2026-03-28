import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the hero section with brand name and tagline', async ({ page }) => {
    // The hero h1 should display the brand name
    const heroHeading = page.locator('h1', { hasText: 'Lunara' });
    await expect(heroHeading).toBeVisible();

    // Tagline below the hero heading
    await expect(
      page.getByText('Rest-centered, birth & postpartum care for West Valley families'),
    ).toBeVisible();
  });

  test('has a header with navigation links', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Brand link in header
    await expect(header.getByRole('link', { name: 'Lunara' })).toBeVisible();

    // Blog link in desktop nav
    await expect(header.getByRole('link', { name: 'Blog' }).first()).toBeVisible();

    // Login button in desktop nav
    await expect(header.getByRole('link', { name: 'Login' }).first()).toBeVisible();
  });

  test('displays the "Dear parent" section', async ({ page }) => {
    await expect(page.getByText('Dear parent.')).toBeVisible();
    await expect(page.getByText(/you shouldn.t bother people/)).toBeVisible();
  });

  test('Client Login link navigates to the login page', async ({ page }) => {
    const clientLoginLink = page.getByRole('link', { name: 'Client Login' });
    await expect(clientLoginLink).toBeVisible();
    await clientLoginLink.click();
    await expect(page).toHaveURL('/login');
  });

  test('displays the offerings accordion', async ({ page }) => {
    await expect(page.getByText("Lunara's Offerings")).toBeVisible();

    // Verify each offering title is present
    const offerings = [
      'Birth & Recovery',
      'Fourth Trimester Planning & Care',
      'Loss & Bereavement',
      'Photography',
    ];
    for (const title of offerings) {
      await expect(page.getByRole('button', { name: title })).toBeVisible();
    }
  });

  test('accordion expands and collapses on click', async ({ page }) => {
    const firstOffering = page.getByRole('button', { name: 'Birth & Recovery' });
    await firstOffering.click();
    await expect(page.getByText('Support through birth and postpartum recovery.')).toBeVisible();

    // Click again to collapse
    await firstOffering.click();
    await expect(page.getByText('Support through birth and postpartum recovery.')).toBeHidden();
  });

  test('displays the inquiry form with all required fields', async ({ page }) => {
    await expect(page.getByText('Inquiry Form')).toBeVisible();

    // Check form fields by placeholder
    await expect(page.getByPlaceholder('First Name *')).toBeVisible();
    await expect(page.getByPlaceholder('Last Name *')).toBeVisible();
    await expect(page.getByPlaceholder('Phone Number *')).toBeVisible();
    await expect(page.getByPlaceholder('Email *')).toBeVisible();
    await expect(page.locator('select#inquiryType')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('inquiry form shows validation errors on empty submit', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    await submitBtn.click();

    // Validation messages should appear for required fields
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Phone number is required')).toBeVisible();
    await expect(page.getByText('Valid email is required')).toBeVisible();
    await expect(page.getByText('Please select a type')).toBeVisible();
    await expect(page.getByText('Consultation date is required')).toBeVisible();
  });
});
