/**
 * Discovery Engine for Visual Regression Tests
 * Dynamically discovers testable elements and pages
 */

class DiscoveryEngine {
  constructor() {
    this.discovered = {
      pages: new Set(['/']), // Start with homepage
      testIds: new Map(), // testId -> page mapping
      links: new Map(), // link -> page mapping
      screenshots: new Map(), // page -> screenshot paths
    }

    // Skip auth-related TestIDs
    this.skipPatterns = [
      /auth/i,
      /login/i,
      /logout/i,
      /signin/i,
      /signup/i,
      /account/i,
      /dashboard/i,
      /add-ip/i,
      /list-ip/i,
    ]
  }

  shouldSkip(testId) {
    return this.skipPatterns.some((pattern) => pattern.test(testId))
  }

  async discoverPage(page, url, progressTracker) {
    const discoveries = {
      testIds: [],
      links: [],
      forms: [],
    }

    try {
      // Discover all elements with TestIDs
      const testIds = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]')
        return Array.from(elements).map((el) => ({
          testId: el.getAttribute('data-testid'),
          tagName: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 50),
          isClickable:
            el.tagName === 'BUTTON' ||
            el.tagName === 'A' ||
            el.onclick !== null ||
            el.style.cursor === 'pointer',
          href: el.href || el.getAttribute('href'),
          isVisible: el.offsetParent !== null,
        }))
      })

      // Filter out auth-related TestIDs
      discoveries.testIds = testIds.filter(
        (item) => !this.shouldSkip(item.testId) && item.isVisible
      )

      progressTracker.log(
        `Found ${discoveries.testIds.length} non-auth TestIDs`
      )

      // Discover all navigable links (including non-href elements)
      const links = await page.evaluate(() => {
        const anchors = document.querySelectorAll('a[href]')
        const buttons = document.querySelectorAll('button[data-testid]')
        const allLinks = []

        // Get traditional anchor links
        anchors.forEach((a) => {
          allLinks.push({
            href: a.href,
            text: a.textContent?.trim(),
            testId: a.getAttribute('data-testid'),
            isExternal: a.hostname !== window.location.hostname,
            type: 'anchor',
          })
        })

        // Get buttons that might navigate
        buttons.forEach((btn) => {
          const testId = btn.getAttribute('data-testid')
          if (
            testId &&
            (testId.includes('link') ||
              testId.includes('button') ||
              testId.includes('cta'))
          ) {
            allLinks.push({
              href: null,
              text: btn.textContent?.trim(),
              testId: testId,
              isExternal: false,
              type: 'button',
            })
          }
        })

        return allLinks
      })

      // Filter internal, non-auth links
      discoveries.links = links.filter(
        (link) =>
          !link.isExternal &&
          !this.skipPatterns.some((pattern) =>
            pattern.test(link.href || link.testId)
          ) &&
          (link.type === 'button' ||
            (!link.href?.includes('#') && link.href?.startsWith('http')))
      )

      progressTracker.log(
        `Found ${discoveries.links.length} navigable links/buttons`
      )

      // Store discoveries
      discoveries.testIds.forEach((item) => {
        if (!this.discovered.testIds.has(item.testId)) {
          this.discovered.testIds.set(item.testId, {
            page: url,
            element: item,
          })
        }
      })

      discoveries.links.forEach((link) => {
        if (link.href) {
          const linkUrl = new URL(link.href).pathname
          if (!this.discovered.pages.has(linkUrl)) {
            this.discovered.pages.add(linkUrl)
            this.discovered.links.set(linkUrl, {
              fromPage: url,
              text: link.text,
              testId: link.testId,
            })
          }
        }
      })
    } catch (error) {
      progressTracker.log(`Discovery error: ${error.message}`, 'error')
    }

    return discoveries
  }

  getNextPage() {
    // Find unvisited pages
    for (const page of this.discovered.pages) {
      if (!this.discovered.screenshots.has(page)) {
        return page
      }
    }
    return null
  }

  markPageComplete(page, screenshotPath) {
    this.discovered.screenshots.set(page, screenshotPath)
  }

  getProgress() {
    const total = this.discovered.pages.size
    const completed = this.discovered.screenshots.size
    const remaining = total - completed

    return {
      total,
      completed,
      remaining,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      pages: Array.from(this.discovered.pages),
      completedPages: Array.from(this.discovered.screenshots.keys()),
      testIds: this.discovered.testIds.size,
    }
  }

  getReport() {
    return {
      summary: {
        pagesDiscovered: this.discovered.pages.size,
        pagesScreenshot: this.discovered.screenshots.size,
        testIdsFound: this.discovered.testIds.size,
        linksFound: this.discovered.links.size,
      },
      pages: Array.from(this.discovered.pages).sort(),
      testIds: Array.from(this.discovered.testIds.entries()).map(
        ([id, data]) => ({
          testId: id,
          page: data.page,
          element: data.element.tagName,
          clickable: data.element.isClickable,
        })
      ),
      screenshots: Array.from(this.discovered.screenshots.entries()),
    }
  }
}

module.exports = DiscoveryEngine
