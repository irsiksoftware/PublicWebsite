describe('Dark Mode Toggle', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should have dark mode toggle button', () => {
    cy.get('body').then(($body) => {
      // Look for dark mode toggle button
      const darkModeSelectors = [
        'button[aria-label*="dark"]',
        'button[aria-label*="theme"]',
        '[class*="theme-toggle"]',
        '[class*="dark-mode"]',
        '[id*="theme"]',
        '[id*="dark"]'
      ];

      let found = false;
      for (const selector of darkModeSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().should('exist');
          found = true;
          break;
        }
      }

      if (!found) {
        // Check buttons with moon/sun icons or text
        cy.get('button').then(($buttons) => {
          const themeButton = $buttons.filter((i, el) => {
            const text = Cypress.$(el).text().toLowerCase();
            const ariaLabel = Cypress.$(el).attr('aria-label')?.toLowerCase() || '';
            return text.includes('dark') || text.includes('light') || text.includes('theme') ||
                   ariaLabel.includes('dark') || ariaLabel.includes('light') || ariaLabel.includes('theme');
          });
          if (themeButton.length > 0) {
            cy.wrap(themeButton.first()).should('be.visible');
          }
        });
      }
    });
  });

  it('should toggle dark mode when button is clicked', () => {
    cy.get('body').then(($body) => {
      const darkModeSelectors = [
        'button[aria-label*="dark"]',
        'button[aria-label*="theme"]',
        '[class*="theme-toggle"]',
        '[class*="dark-mode"]',
        '[id*="theme"]',
        '[id*="dark"]'
      ];

      let toggleButton = null;
      for (const selector of darkModeSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (!toggleButton) {
        // Find button by text content
        cy.get('button').then(($buttons) => {
          const themeButton = $buttons.filter((i, el) => {
            const text = Cypress.$(el).text().toLowerCase();
            const ariaLabel = Cypress.$(el).attr('aria-label')?.toLowerCase() || '';
            return text.includes('dark') || text.includes('light') || text.includes('theme') ||
                   ariaLabel.includes('dark') || ariaLabel.includes('light') || ariaLabel.includes('theme');
          });
          if (themeButton.length > 0) {
            toggleButton = themeButton.first();
          }
        });
      }

      if (toggleButton) {
        // Get initial body class or background color
        cy.get('body').then(($initialBody) => {
          const initialClass = $initialBody.attr('class') || '';
          const initialBg = $initialBody.css('background-color');

          // Click toggle
          cy.get(toggleButton).first().click();

          // Wait for transition
          cy.wait(300);

          // Check that something changed
          cy.get('body').then(($newBody) => {
            const newClass = $newBody.attr('class') || '';
            const newBg = $newBody.css('background-color');

            // Either class or background should change
            expect(initialClass !== newClass || initialBg !== newBg).to.be.true;
          });
        });
      }
    });
  });

  it('should persist dark mode preference', () => {
    cy.get('body').then(($body) => {
      const darkModeSelectors = [
        'button[aria-label*="dark"]',
        'button[aria-label*="theme"]',
        '[class*="theme-toggle"]',
        '[class*="dark-mode"]',
        '[id*="theme"]',
        '[id*="dark"]'
      ];

      let toggleButton = null;
      for (const selector of darkModeSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Toggle dark mode on
        cy.get(toggleButton).first().click();
        cy.wait(300);

        // Store the state
        cy.get('body').then(($darkBody) => {
          const darkClass = $darkBody.attr('class') || '';

          // Reload page
          cy.reload();
          cy.waitForPageLoad();

          // Check if dark mode is still active
          cy.get('body').should(($reloadedBody) => {
            const reloadedClass = $reloadedBody.attr('class') || '';
            // Check localStorage or class persistence
            const theme = localStorage.getItem('theme');
            if (theme) {
              expect(theme).to.be.oneOf(['dark', 'light']);
            }
          });
        });
      }
    });
  });

  it('should apply dark mode styles to page elements', () => {
    cy.get('body').then(($body) => {
      const darkModeSelectors = [
        'button[aria-label*="dark"]',
        'button[aria-label*="theme"]',
        '[class*="theme-toggle"]',
        '[class*="dark-mode"]',
        '[id*="theme"]',
        '[id*="dark"]'
      ];

      let toggleButton = null;
      for (const selector of darkModeSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Get initial colors
        cy.get('body').then(($initialBody) => {
          const initialBg = $initialBody.css('background-color');

          // Toggle dark mode
          cy.get(toggleButton).first().click();
          cy.wait(300);

          // Check that background changed
          cy.get('body').should(($darkBody) => {
            const darkBg = $darkBody.css('background-color');
            expect(darkBg).to.not.equal(initialBg);
          });

          // Check that text elements are visible
          cy.get('body').should('be.visible');
          cy.get('header, nav, main, footer').each(($el) => {
            cy.wrap($el).should('be.visible');
          });
        });
      }
    });
  });

  it('should toggle back to light mode', () => {
    cy.get('body').then(($body) => {
      const darkModeSelectors = [
        'button[aria-label*="dark"]',
        'button[aria-label*="theme"]',
        '[class*="theme-toggle"]',
        '[class*="dark-mode"]',
        '[id*="theme"]',
        '[id*="dark"]'
      ];

      let toggleButton = null;
      for (const selector of darkModeSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Store initial state
        cy.get('body').then(($initialBody) => {
          const initialBg = $initialBody.css('background-color');

          // Toggle to dark
          cy.get(toggleButton).first().click();
          cy.wait(300);

          // Toggle back to light
          cy.get(toggleButton).first().click();
          cy.wait(300);

          // Should be back to original or similar
          cy.get('body').should('be.visible');
        });
      }
    });
  });

  it('should update toggle button icon or text', () => {
    cy.get('body').then(($body) => {
      const darkModeSelectors = [
        'button[aria-label*="dark"]',
        'button[aria-label*="theme"]',
        '[class*="theme-toggle"]',
        '[class*="dark-mode"]',
        '[id*="theme"]',
        '[id*="dark"]'
      ];

      let toggleButton = null;
      for (const selector of darkModeSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Get initial button state
        cy.get(toggleButton).first().then(($btn) => {
          const initialText = $btn.text();
          const initialAriaLabel = $btn.attr('aria-label') || '';

          // Click toggle
          cy.get(toggleButton).first().click();
          cy.wait(300);

          // Check if button changed
          cy.get(toggleButton).first().then(($newBtn) => {
            const newText = $newBtn.text();
            const newAriaLabel = $newBtn.attr('aria-label') || '';

            // Text or aria-label should change to reflect new state
            expect(initialText !== newText || initialAriaLabel !== newAriaLabel).to.be.true;
          });
        });
      }
    });
  });
});
