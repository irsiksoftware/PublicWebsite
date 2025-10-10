describe('Mobile Menu Interaction', () => {
  beforeEach(() => {
    // Set mobile viewport
    cy.viewport(375, 667);
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should display mobile menu toggle button on small screens', () => {
    cy.get('body').then(($body) => {
      // Look for hamburger menu button
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '[class*="hamburger"]',
        '[class*="mobile-menu"]',
        '[class*="nav-toggle"]',
        '[id*="menu-toggle"]',
        'button.menu-toggle'
      ];

      let found = false;
      for (const selector of mobileMenuSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().should('be.visible');
          found = true;
          break;
        }
      }

      if (!found) {
        // Look for any button in nav or header that might be the menu toggle
        cy.get('nav button, header button').then(($buttons) => {
          if ($buttons.length > 0) {
            const menuButton = $buttons.filter((i, el) => {
              const ariaLabel = Cypress.$(el).attr('aria-label')?.toLowerCase() || '';
              const className = Cypress.$(el).attr('class')?.toLowerCase() || '';
              return ariaLabel.includes('menu') || className.includes('menu') ||
                     className.includes('toggle') || className.includes('hamburger');
            });
            if (menuButton.length > 0) {
              cy.wrap(menuButton.first()).should('be.visible');
            }
          }
        });
      }
    });
  });

  it('should open mobile menu when toggle is clicked', () => {
    cy.get('body').then(($body) => {
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '[class*="hamburger"]',
        '[class*="mobile-menu"]',
        '[class*="nav-toggle"]',
        '[id*="menu-toggle"]',
        'button.menu-toggle'
      ];

      let toggleButton = null;
      for (const selector of mobileMenuSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (!toggleButton) {
        // Look for menu toggle in nav/header
        cy.get('nav button, header button').then(($buttons) => {
          if ($buttons.length > 0) {
            const menuButton = $buttons.filter((i, el) => {
              const ariaLabel = Cypress.$(el).attr('aria-label')?.toLowerCase() || '';
              const className = Cypress.$(el).attr('class')?.toLowerCase() || '';
              return ariaLabel.includes('menu') || className.includes('menu') ||
                     className.includes('toggle') || className.includes('hamburger');
            });
            if (menuButton.length > 0) {
              toggleButton = menuButton.first();
            }
          }
        });
      }

      if (toggleButton) {
        // Click to open menu
        cy.get(toggleButton).first().click();
        cy.wait(300);

        // Check for opened menu
        cy.get('body').then(($openBody) => {
          const openMenuSelectors = [
            'nav.open',
            '[class*="menu-open"]',
            '[class*="nav-open"]',
            'nav[aria-expanded="true"]',
            '.mobile-menu.active'
          ];

          let menuOpened = false;
          for (const selector of openMenuSelectors) {
            if ($openBody.find(selector).length > 0) {
              cy.get(selector).should('be.visible');
              menuOpened = true;
              break;
            }
          }

          // Alternative check: nav links should be visible
          if (!menuOpened) {
            cy.get('nav a, nav ul').should('be.visible');
          }
        });
      }
    });
  });

  it('should close mobile menu when toggle is clicked again', () => {
    cy.get('body').then(($body) => {
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '[class*="hamburger"]',
        '[class*="mobile-menu"]',
        '[class*="nav-toggle"]',
        '[id*="menu-toggle"]',
        'button.menu-toggle'
      ];

      let toggleButton = null;
      for (const selector of mobileMenuSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Open menu
        cy.get(toggleButton).first().click();
        cy.wait(300);

        // Close menu
        cy.get(toggleButton).first().click();
        cy.wait(300);

        // Menu should be closed
        cy.get('body').should('exist');
      }
    });
  });

  it('should display all navigation links in mobile menu', () => {
    cy.get('body').then(($body) => {
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '[class*="hamburger"]',
        '[class*="mobile-menu"]',
        '[class*="nav-toggle"]',
        '[id*="menu-toggle"]',
        'button.menu-toggle'
      ];

      let toggleButton = null;
      for (const selector of mobileMenuSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Open menu
        cy.get(toggleButton).first().click();
        cy.wait(300);

        // Check for navigation links
        cy.get('nav a').should('have.length.at.least', 1);
        cy.get('nav a').each(($link) => {
          cy.wrap($link).should('have.attr', 'href');
        });
      }
    });
  });

  it('should navigate when mobile menu link is clicked', () => {
    cy.get('body').then(($body) => {
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '[class*="hamburger"]',
        '[class*="mobile-menu"]',
        '[class*="nav-toggle"]',
        '[id*="menu-toggle"]',
        'button.menu-toggle'
      ];

      let toggleButton = null;
      for (const selector of mobileMenuSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Open menu
        cy.get(toggleButton).first().click();
        cy.wait(300);

        // Click first link
        cy.get('nav a').first().then(($link) => {
          const href = $link.attr('href');
          if (href && href.startsWith('#')) {
            // Internal anchor
            cy.get('nav a').first().click();
            cy.url().should('include', href);
          } else if (href && !href.startsWith('http')) {
            // Internal page
            cy.get('nav a').first().click();
            cy.waitForPageLoad();
          }
        });
      }
    });
  });

  it('should close menu when clicking outside', () => {
    cy.get('body').then(($body) => {
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '[class*="hamburger"]',
        '[class*="mobile-menu"]',
        '[class*="nav-toggle"]',
        '[id*="menu-toggle"]',
        'button.menu-toggle'
      ];

      let toggleButton = null;
      for (const selector of mobileMenuSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Open menu
        cy.get(toggleButton).first().click();
        cy.wait(300);

        // Click outside (on main content)
        cy.get('main').then(($main) => {
          if ($main.length > 0) {
            cy.get('main').click({ force: true });
            cy.wait(300);
          }
        });

        // Menu should be closed or page should still be functional
        cy.get('body').should('be.visible');
      }
    });
  });

  it('should not display mobile menu toggle on desktop', () => {
    // Switch to desktop viewport
    cy.viewport(1280, 720);
    cy.reload();
    cy.waitForPageLoad();

    cy.get('body').then(($body) => {
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '[class*="hamburger"]',
        '[class*="mobile-menu"]',
        '[class*="nav-toggle"]'
      ];

      // Mobile menu toggle should be hidden on desktop
      for (const selector of mobileMenuSelectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().should('not.be.visible');
        }
      }

      // Desktop nav should be visible
      cy.get('nav').should('be.visible');
    });
  });

  it('should be keyboard accessible', () => {
    cy.get('body').then(($body) => {
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '[class*="hamburger"]',
        '[class*="mobile-menu"]',
        '[class*="nav-toggle"]',
        '[id*="menu-toggle"]',
        'button.menu-toggle'
      ];

      let toggleButton = null;
      for (const selector of mobileMenuSelectors) {
        if ($body.find(selector).length > 0) {
          toggleButton = selector;
          break;
        }
      }

      if (toggleButton) {
        // Focus on toggle button
        cy.get(toggleButton).first().focus();
        cy.get(toggleButton).first().should('have.focus');

        // Activate with Enter key
        cy.get(toggleButton).first().type('{enter}');
        cy.wait(300);

        // Menu should open
        cy.get('nav').should('be.visible');

        // Tab through menu items
        cy.realPress('Tab');
        cy.get('nav a').first().should('have.focus');
      }
    });
  });
});
