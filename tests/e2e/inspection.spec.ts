import { test, expect } from '@playwright/test';

test.describe('Fiscalización (Inspector Flow)', () => {
    test('should load the inspector page', async ({ page }) => {
        // Navigate to inspector page
        await page.goto('/inspector');
        
        // Wait for DOM content to stabilize instead of networkidle
        // (Firebase connections may keep network active)
        await page.waitForLoadState('domcontentloaded');
        
        // Verify the page rendered (body has content)
        const bodyText = await page.textContent('body');
        expect(bodyText?.length ?? 0).toBeGreaterThan(0);
    });
});
