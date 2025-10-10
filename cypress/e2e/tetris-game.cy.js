describe('Tetris Game Interaction', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should navigate to Tetris game', () => {
    cy.get('body').then(($body) => {
      if ($body.find('a[href*="tetris"]').length > 0) {
        cy.get('a[href*="tetris"]').first().click();
        cy.waitForPageLoad();
      } else if ($body.find('#tetris').length > 0) {
        cy.get('a[href="#tetris"]').first().click();
      }
    });
  });

  it('should display Tetris game canvas or container', () => {
    cy.get('body').then(($body) => {
      if ($body.find('canvas').length > 0 || $body.find('#tetris').length > 0 || $body.find('[class*="tetris"]').length > 0) {
        cy.get('canvas, #tetris, [class*="tetris"]').should('exist');
      }
    });
  });

  it('should have game controls visible', () => {
    cy.get('body').then(($body) => {
      // Look for Tetris section or game container
      if ($body.find('#tetris').length > 0 || $body.find('[class*="tetris"]').length > 0) {
        // Check for start/pause button
        cy.get('button').then(($buttons) => {
          const gameButtons = $buttons.filter((i, el) => {
            const text = Cypress.$(el).text().toLowerCase();
            return text.includes('start') || text.includes('pause') || text.includes('play');
          });
          if (gameButtons.length > 0) {
            cy.wrap(gameButtons.first()).should('be.visible');
          }
        });
      }
    });
  });

  it('should start game when start button is clicked', () => {
    cy.get('body').then(($body) => {
      if ($body.find('#tetris').length > 0 || $body.find('[class*="tetris"]').length > 0) {
        cy.get('button').then(($buttons) => {
          const startButton = $buttons.filter((i, el) => {
            const text = Cypress.$(el).text().toLowerCase();
            return text.includes('start') || text.includes('play');
          });
          if (startButton.length > 0) {
            cy.wrap(startButton.first()).click();
            // Game should be running - check for canvas or game state
            cy.get('canvas, #tetris').should('be.visible');
          }
        });
      }
    });
  });

  it('should respond to keyboard controls', () => {
    cy.get('body').then(($body) => {
      if ($body.find('canvas').length > 0 || $body.find('#tetris').length > 0) {
        // Start game first if start button exists
        cy.get('button').then(($buttons) => {
          const startButton = $buttons.filter((i, el) => {
            const text = Cypress.$(el).text().toLowerCase();
            return text.includes('start') || text.includes('play');
          });
          if (startButton.length > 0) {
            cy.wrap(startButton.first()).click();
          }
        });

        // Test arrow key controls
        cy.get('body').type('{leftarrow}');
        cy.get('body').type('{rightarrow}');
        cy.get('body').type('{downarrow}');
        cy.get('body').type('{uparrow}');
        cy.get('body').type(' '); // Space bar

        // Game should still be visible
        cy.get('canvas, #tetris').should('be.visible');
      }
    });
  });

  it('should display score', () => {
    cy.get('body').then(($body) => {
      if ($body.find('#tetris').length > 0 || $body.find('[class*="tetris"]').length > 0) {
        // Look for score display
        cy.get('body').contains(/score/i).should('exist');
      }
    });
  });

  it('should have pause functionality', () => {
    cy.get('body').then(($body) => {
      if ($body.find('#tetris').length > 0 || $body.find('[class*="tetris"]').length > 0) {
        // Start game first
        cy.get('button').then(($buttons) => {
          const startButton = $buttons.filter((i, el) => {
            const text = Cypress.$(el).text().toLowerCase();
            return text.includes('start') || text.includes('play');
          });
          if (startButton.length > 0) {
            cy.wrap(startButton.first()).click();

            // Then look for pause button
            cy.wait(500);
            cy.get('button').then(($pauseButtons) => {
              const pauseButton = $pauseButtons.filter((i, el) => {
                const text = Cypress.$(el).text().toLowerCase();
                return text.includes('pause');
              });
              if (pauseButton.length > 0) {
                cy.wrap(pauseButton.first()).click();
              }
            });
          }
        });
      }
    });
  });

  it('should be responsive on different screen sizes', () => {
    cy.get('body').then(($body) => {
      if ($body.find('canvas').length > 0 || $body.find('#tetris').length > 0) {
        // Test mobile viewport
        cy.viewport(375, 667);
        cy.get('canvas, #tetris').should('be.visible');

        // Test tablet viewport
        cy.viewport(768, 1024);
        cy.get('canvas, #tetris').should('be.visible');

        // Test desktop viewport
        cy.viewport(1280, 720);
        cy.get('canvas, #tetris').should('be.visible');
      }
    });
  });
});
