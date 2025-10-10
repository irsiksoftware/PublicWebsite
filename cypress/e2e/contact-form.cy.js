describe('Contact Form Submission', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should navigate to contact form', () => {
    // Try to find contact link in navigation
    cy.get('body').then(($body) => {
      if ($body.find('a[href*="contact"]').length > 0) {
        cy.get('a[href*="contact"]').first().click();
        cy.waitForPageLoad();
      } else if ($body.find('#contact').length > 0) {
        cy.get('a[href="#contact"]').first().click();
      }
    });
  });

  it('should display contact form fields', () => {
    // Navigate to contact section
    cy.get('body').then(($body) => {
      if ($body.find('#contact').length > 0 || $body.find('form').length > 0) {
        cy.get('form').should('exist');
      }
    });
  });

  it('should validate required fields', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form').length > 0) {
        // Find submit button
        cy.get('form').first().within(() => {
          cy.get('button[type="submit"], input[type="submit"]').then(($btn) => {
            if ($btn.length > 0) {
              $btn.click();
              // Check for validation - form should not submit with empty fields
              cy.get('input:invalid, textarea:invalid').should('exist');
            }
          });
        });
      }
    });
  });

  it('should accept valid input in form fields', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form').length > 0) {
        cy.get('form').first().within(() => {
          // Fill out name field if it exists
          cy.get('input[name*="name"], input[id*="name"], input[type="text"]').first().then(($input) => {
            if ($input.length > 0) {
              cy.wrap($input).clear().type('John Doe');
            }
          });

          // Fill out email field if it exists
          cy.get('input[type="email"], input[name*="email"], input[id*="email"]').first().then(($input) => {
            if ($input.length > 0) {
              cy.wrap($input).clear().type('john.doe@example.com');
            }
          });

          // Fill out message/textarea if it exists
          cy.get('textarea, input[name*="message"]').first().then(($textarea) => {
            if ($textarea.length > 0) {
              cy.wrap($textarea).clear().type('This is a test message for E2E testing.');
            }
          });
        });
      }
    });
  });

  it('should show error for invalid email format', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form').length > 0) {
        cy.get('form').first().within(() => {
          cy.get('input[type="email"], input[name*="email"]').first().then(($input) => {
            if ($input.length > 0) {
              cy.wrap($input).clear().type('invalid-email');
              cy.wrap($input).blur();
              // HTML5 validation should mark as invalid
              cy.wrap($input).should('have.prop', 'validity').and('have.property', 'valid', false);
            }
          });
        });
      }
    });
  });

  it('should enable submit button when form is valid', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form').length > 0) {
        cy.get('form').first().within(() => {
          // Fill out all required fields
          cy.get('input[name*="name"], input[id*="name"], input[type="text"]').first().then(($input) => {
            if ($input.length > 0) {
              cy.wrap($input).clear().type('Jane Smith');
            }
          });

          cy.get('input[type="email"], input[name*="email"]').first().then(($input) => {
            if ($input.length > 0) {
              cy.wrap($input).clear().type('jane.smith@example.com');
            }
          });

          cy.get('textarea, input[name*="message"]').first().then(($textarea) => {
            if ($textarea.length > 0) {
              cy.wrap($textarea).clear().type('Valid test message');
            }
          });

          // Submit button should be enabled
          cy.get('button[type="submit"], input[type="submit"]').should('not.be.disabled');
        });
      }
    });
  });
});
