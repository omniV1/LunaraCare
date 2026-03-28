import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders the login page with heading and form', async ({ page }) => {
    // Page heading
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await expect(page.getByText('Private Access')).toBeVisible();

    // Email and password inputs
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible();
  });

  test('email and password fields are required (HTML validation)', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');

    // Both fields should have the required attribute
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('email field has correct input type', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('password field has correct input type', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('forgot password link is visible and navigates correctly', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot your password/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('displays Google OAuth option', async ({ page }) => {
    await expect(page.getByText('Continue with Google')).toBeVisible();
  });

  test('"Not a client yet?" section links back to landing page offerings', async ({ page }) => {
    await expect(page.getByText('Not a client yet?')).toBeVisible();
    const learnMoreLink = page.getByRole('link', { name: 'LEARN MORE' });
    await expect(learnMoreLink).toBeVisible();
    await expect(learnMoreLink).toHaveAttribute('href', '/#offerings');
  });

  test('user can type into email and password fields', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('secretpassword');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('secretpassword');
  });
});

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('renders the forgot password page with heading and form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();

    // Email input for password reset
    const emailInput = page.getByPlaceholder('Email');
    await expect(emailInput).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('has a link back to the login page', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /back to login/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/login');
  });
});
