import { test, expect } from '@playwright/test';

test.describe('Payment & Transactions', () => {
    test('should navigate to login page as starting point', async ({ page }) => {
        // The app redirects / to /login for unauthenticated users
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /Bienvenido/i })).toBeVisible();
    });

    test('should show forgot password page with form fields', async ({ page }) => {
        await page.goto('/forgot-password');

        // Verify forgot password page heading
        await expect(page.getByRole('heading', { name: /Recuperar/i })).toBeVisible();
        
        // Check for tab buttons
        await expect(page.getByRole('button', { name: /TELÉFONO/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /EMAIL/i })).toBeVisible();
    });
});
