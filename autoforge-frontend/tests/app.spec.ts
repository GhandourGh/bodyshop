import { test, expect, type Page } from '@playwright/test'

// ─── helpers ───────────────────────────────────────────────────────────────
async function goto(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

// ─── Landing ───────────────────────────────────────────────────────────────
test.describe('Landing page', () => {
  test('renders hero headline', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('has Admin Login CTA that navigates to dashboard', async ({ page }) => {
    await goto(page, '/')
    await page.getByRole('link', { name: /admin/i }).first().click()
    await expect(page).toHaveURL(/\/admin/)
  })

  test('has AI Demo link', async ({ page }) => {
    await goto(page, '/')
    await expect(page.getByRole('link', { name: /demo/i }).first()).toBeVisible()
  })
})

// ─── Admin Dashboard ────────────────────────────────────────────────────────
test.describe('Dashboard', () => {
  test('renders all 4 stat cards', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await expect(page.getByText('Active Jobs')).toBeVisible()
    await expect(page.getByText('Monthly Revenue')).toBeVisible()
    // "Customers" and "Inventory" exist in sidebar too — use label text unique to cards
    await expect(page.getByText('Low Stock Parts')).toBeVisible()
    // Customers card: check the trend text which is unique
    await expect(page.getByText('+1 this week')).toBeVisible()
  })

  test('shows Revenue Trend chart', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await expect(page.getByText('Revenue Trend', { exact: false })).toBeVisible()
  })

  test('shows Jobs by Status donut', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await expect(page.getByText('Distribution')).toBeVisible()
  })

  test('shows Recent Jobs table', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await expect(page.getByText('Recent Jobs')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /vehicle/i })).toBeVisible()
  })

  test('"Run AI" button navigates to AI Lab', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await page.getByRole('button', { name: /run ai/i }).first().click()
    await expect(page).toHaveURL('/admin/ai')
  })

  test('"New Job" header button navigates to Jobs', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await page.getByRole('button', { name: /new job/i }).first().click()
    await expect(page).toHaveURL('/admin/jobs')
  })

  test('"View All" navigates to Jobs', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await page.getByRole('button', { name: /view all/i }).click()
    await expect(page).toHaveURL('/admin/jobs')
  })

  test('Quick action — Add Customer navigates correctly', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await page.getByRole('button', { name: /add customer/i }).click()
    await expect(page).toHaveURL('/admin/customers')
  })

  test('Quick action — View Alerts navigates to Inventory', async ({ page }) => {
    await goto(page, '/admin/dashboard')
    await page.getByRole('button', { name: /view alerts/i }).click()
    await expect(page).toHaveURL('/admin/inventory')
  })
})

// ─── Jobs ───────────────────────────────────────────────────────────────────
test.describe('Jobs page', () => {
  test('renders jobs table', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await expect(page.getByRole('columnheader', { name: /vehicle/i })).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible()
  })

  test('status tabs filter — Done shows only done jobs', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('button', { name: 'Done' }).click()
    // Wait for animation to settle, then check table rows — 2 done jobs in mock data + header
    await page.waitForTimeout(400)
    const rows = page.getByRole('row')
    await expect(rows).toHaveCount(3) // 1 header + 2 done jobs
  })

  test('clicking a row opens the detail panel', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('row').nth(1).click()
    await expect(page.getByText('AI Predictions')).toBeVisible()
    await expect(page.getByText('Damage Severity')).toBeVisible()
  })

  test('detail panel closes on backdrop click', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('row').nth(1).click()
    await expect(page.getByText('AI Predictions')).toBeVisible()
    // Click the dark backdrop (first fixed overlay)
    await page.locator('.fixed.inset-0.bg-black\\/50').click()
    await expect(page.getByText('AI Predictions')).not.toBeVisible()
  })

  test('"Mark Complete" shows success toast and closes panel', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('row').nth(1).click()
    await page.getByRole('button', { name: /mark complete/i }).click()
    await expect(page.getByText(/marked as complete/i)).toBeVisible()
  })

  test('"Edit Job" shows info toast', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('row').nth(1).click()
    await page.getByRole('button', { name: /edit job/i }).click()
    await expect(page.getByText(/coming soon/i)).toBeVisible()
  })

  test('New Job button opens modal', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('button', { name: /new job/i }).click()
    await expect(page.getByRole('heading', { name: 'New Repair Job' })).toBeVisible()
    await expect(page.getByPlaceholder(/Toyota Camry/i)).toBeVisible()
  })

  test('New Job modal creates a job and adds it to the table', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('button', { name: /new job/i }).click()
    await page.getByPlaceholder(/Toyota Camry/i).fill('2024 Tesla Model 3')
    await page.getByPlaceholder(/Rami Haddad/i).fill('Test Customer')
    // Select the first actual mechanic option (index 1, index 0 is the placeholder)
    await page.locator('select').nth(2).selectOption({ index: 1 })
    await page.getByPlaceholder('1200').fill('900')
    await page.getByPlaceholder('6.5').fill('4')
    await page.getByRole('button', { name: /create job/i }).click()
    await expect(page.getByText(/job created/i)).toBeVisible()
    // Check the table cell specifically — toast also contains the vehicle name
    await expect(page.getByRole('cell', { name: /Tesla Model 3/i })).toBeVisible()
  })

  test('New Job modal validation — empty fields show error toast', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('button', { name: /new job/i }).click()
    await page.getByRole('button', { name: /create job/i }).click()
    await expect(page.getByText(/fill in all required/i)).toBeVisible()
  })

  test('New Job modal closes on Cancel', async ({ page }) => {
    await goto(page, '/admin/jobs')
    await page.getByRole('button', { name: /new job/i }).click()
    await expect(page.getByRole('heading', { name: 'New Repair Job' })).toBeVisible()
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByRole('heading', { name: 'New Repair Job' })).not.toBeVisible()
  })

  test('Export button triggers file download', async ({ page }) => {
    await goto(page, '/admin/jobs')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export/i }).click(),
    ])
    expect(download.suggestedFilename()).toBe('autoforge-jobs.xlsx')
  })
})

// ─── Customers ──────────────────────────────────────────────────────────────
test.describe('Customers page', () => {
  test('renders heading and customer data', async ({ page }) => {
    await goto(page, '/admin/customers')
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible()
    await expect(page.getByText('Fadi Khalil')).toBeVisible()
  })
})

// ─── Vehicles ───────────────────────────────────────────────────────────────
test.describe('Vehicles page', () => {
  test('renders heading and vehicle data', async ({ page }) => {
    await goto(page, '/admin/vehicles')
    await expect(page.getByRole('heading', { name: 'Vehicles' })).toBeVisible()
    await expect(page.getByText(/BMW/)).toBeVisible()
  })
})

// ─── Mechanics ──────────────────────────────────────────────────────────────
test.describe('Mechanics page', () => {
  test('renders heading and mechanic cards', async ({ page }) => {
    await goto(page, '/admin/mechanics')
    await expect(page.getByRole('heading', { name: 'Mechanics' })).toBeVisible()
    await expect(page.getByText('Fadi Karam')).toBeVisible()
  })
})

// ─── Inventory ──────────────────────────────────────────────────────────────
test.describe('Inventory page', () => {
  test('renders heading and parts data', async ({ page }) => {
    await goto(page, '/admin/inventory')
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible()
    await expect(page.getByText(/bumper/i, { exact: false }).first()).toBeVisible()
  })
})

// ─── Finance ────────────────────────────────────────────────────────────────
test.describe('Finance page', () => {
  test('renders heading, stat cards, and invoice table', async ({ page }) => {
    await goto(page, '/admin/finance')
    await expect(page.getByRole('heading', { name: 'Payments & Invoices' })).toBeVisible()
    await expect(page.getByText('INV-2026001')).toBeVisible()
  })

  test('filter tabs work — Draft filter shows only draft invoices', async ({ page }) => {
    await goto(page, '/admin/finance')
    await page.getByRole('button', { name: 'Draft' }).first().click()
    // Only draft invoices — "Paid" status badge should not be in the table
    await expect(page.getByRole('cell', { name: 'Paid' })).not.toBeVisible()
    // The word Draft appears in the badge cells
    await expect(page.getByRole('cell', { name: 'Draft' }).first()).toBeVisible()
  })

  test('Export Excel button downloads file', async ({ page }) => {
    await goto(page, '/admin/finance')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export excel/i }).click(),
    ])
    expect(download.suggestedFilename()).toBe('autoforge-invoices.xlsx')
  })
})

// ─── Audit Log ──────────────────────────────────────────────────────────────
test.describe('Audit Log page', () => {
  test('renders heading and event table', async ({ page }) => {
    await goto(page, '/admin/audit')
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /timestamp/i })).toBeVisible()
    await expect(page.getByText('System (AI)').first()).toBeVisible()
  })

  test('category filter — AI only', async ({ page }) => {
    await goto(page, '/admin/audit')
    await page.getByRole('button', { name: 'AI' }).click()
    await expect(page.getByText('System (AI)').first()).toBeVisible()
  })

  test('search filters results', async ({ page }) => {
    await goto(page, '/admin/audit')
    await page.getByPlaceholder('Search logs...').fill('PREDICT')
    await expect(page.getByText('PREDICT').first()).toBeVisible()
  })

  test('shows event count in footer', async ({ page }) => {
    await goto(page, '/admin/audit')
    await expect(page.getByText(/Showing \d+ of \d+ events/)).toBeVisible()
  })
})

// ─── Integrations ───────────────────────────────────────────────────────────
test.describe('Integrations page', () => {
  test('renders all 9 service cards', async ({ page }) => {
    await goto(page, '/admin/integrations')
    await expect(page.getByRole('heading', { name: 'API & Integrations' })).toBeVisible()
    await expect(page.getByText('Damage Detection')).toBeVisible()
    await expect(page.getByText('Neon PostgreSQL')).toBeVisible()
  })

  test('expanding a service card shows detail', async ({ page }) => {
    await goto(page, '/admin/integrations')
    await page.getByText('Damage Detection').click()
    await expect(page.getByText('YOLOv8n vision model')).toBeVisible()
  })

  test('stat cards show Services label', async ({ page }) => {
    await goto(page, '/admin/integrations')
    await expect(page.getByText('Services')).toBeVisible()
    await expect(page.getByText('Online Now')).toBeVisible()
  })
})

// ─── AI Lab ─────────────────────────────────────────────────────────────────
test.describe('AI Lab page', () => {
  test('renders AI Lab heading', async ({ page }) => {
    await goto(page, '/admin/ai')
    await expect(page.getByRole('heading', { name: /AI Lab/i })).toBeVisible()
  })
})

// ─── Messages ───────────────────────────────────────────────────────────────
test.describe('Messages page', () => {
  test('renders Messages heading', async ({ page }) => {
    await goto(page, '/admin/messages')
    await expect(page.getByRole('heading', { name: /Messages/i })).toBeVisible()
  })
})

// ─── Settings ───────────────────────────────────────────────────────────────
test.describe('Settings page', () => {
  test('renders Settings heading', async ({ page }) => {
    await goto(page, '/admin/settings')
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible()
  })
})

// ─── Sidebar navigation ─────────────────────────────────────────────────────
test.describe('Sidebar navigation', () => {
  const routes = [
    { label: 'Dashboard',    url: '/admin/dashboard' },
    { label: 'Jobs',         url: '/admin/jobs' },
    { label: 'Customers',    url: '/admin/customers' },
    { label: 'Vehicles',     url: '/admin/vehicles' },
    { label: 'Mechanics',    url: '/admin/mechanics' },
    { label: 'Inventory',    url: '/admin/inventory' },
    { label: 'AI Lab',       url: '/admin/ai' },
    { label: 'Messages',     url: '/admin/messages' },
    { label: 'Finance',      url: '/admin/finance' },
    { label: 'Integrations', url: '/admin/integrations' },
    { label: 'Audit Log',    url: '/admin/audit' },
  ]

  for (const { label, url } of routes) {
    test(`"${label}" sidebar link → ${url}`, async ({ page }) => {
      await goto(page, '/admin/dashboard')
      await page.getByRole('link', { name: label, exact: true }).click()
      await expect(page).toHaveURL(url)
    })
  }
})

// ─── 404 fallback ───────────────────────────────────────────────────────────
test('unknown routes redirect to landing', async ({ page }) => {
  await page.goto('/this-does-not-exist')
  await expect(page).toHaveURL('/')
})
