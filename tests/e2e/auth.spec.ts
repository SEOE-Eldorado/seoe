import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Regression', () => {
    test('should navigate to login and show correct placeholders', async ({ page }) => {
        await page.goto('/');

        // Validate the title
        await expect(page).toHaveTitle(/SEOE/i);

        // Check for login element placeholders
        await expect(page.getByPlaceholder('Teléfono o Email')).toBeVisible();
        await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    });

    test('should navigate to register page and show form fields', async ({ page }) => {
        await page.goto('/login');

        // Click register link - navigates to /register
        await page.getByRole('button', { name: /REGÍSTRATE/i }).click();

        // Wait for navigation to register page
        await page.waitForURL('/register');

        // Check register form is visible
        await expect(page.getByRole('heading', { name: /Crear Cuenta/i })).toBeVisible();
        await expect(page.getByPlaceholder('Ej. Juan Pérez')).toBeVisible();
        await expect(page.getByPlaceholder('tu@email.com')).toBeVisible();
        await expect(page.getByPlaceholder('11 1234 5678')).toBeVisible();
        await expect(page.getByRole('button', { name: /REGISTRARSE/i })).toBeVisible();
    });
});
