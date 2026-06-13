import { test, expect } from '@playwright/test'

test.describe('Title Screen', () => {
  test('loads with game title and main menu', async ({ page }) => {
    await page.goto('/')

    // Title should be visible
    await expect(page.locator('h1', { hasText: 'THE MANDATE' })).toBeVisible()

    // Tagline should be present
    await expect(page.locator('text=Every compromise has a cost.')).toBeVisible()

    // Main menu buttons
    await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()

    // Continue and Load should be disabled when no saves exist
    const continueBtn = page.getByRole('button', { name: 'Continue' })
    const loadBtn = page.getByRole('button', { name: 'Load Game' })
    await expect(continueBtn).toBeDisabled()
    await expect(loadBtn).toBeDisabled()
  })

  test('settings panel opens and closes', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Settings' }).click()

    // Settings overlay should appear (look for unique panel content)
    await expect(page.getByText('▸ Settings')).toBeVisible()
    await expect(page.getByText('▸ Audio')).toBeVisible()

    // Close via Escape
    await page.keyboard.press('Escape')
    await expect(page.getByText('▸ Audio')).not.toBeVisible()
  })
})
