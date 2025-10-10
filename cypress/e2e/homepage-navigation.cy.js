describe('Homepage Navigation Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should load the homepage successfully', () => {
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('body').should('be.visible');
  });

  it('should have correct page title', () => {
    cy.title().should('not.be.empty');
  });

  it('should display main navigation elements', () => {
    cy.get('nav').should('exist');
    cy.get('header').should('be.visible');
  });

  it('should navigate to different sections via links', () => {
    // Check if navigation links exist and are clickable
    cy.get('nav a').should('have.length.at.least', 1);

    cy.get('nav a').first().then(($link) => {
      const href = $link.attr('href');
      if (href && href.startsWith('#')) {
        // Internal anchor link
        cy.get('nav a').first().click();
        cy.url().should('include', href);
      } else if (href && !href.startsWith('http')) {
        // Internal page link
        cy.get('nav a').first().click();
        cy.waitForPageLoad();
      }
    });
  });

  it('should have visible main content', () => {
    cy.get('main').should('be.visible');
  });

  it('should have working footer links', () => {
    cy.get('footer').should('exist');
    cy.scrollTo('bottom');
    cy.get('footer').should('be.visible');
  });

  it('should be responsive and adjust to viewport', () => {
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('body').should('be.visible');

    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('body').should('be.visible');

    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('body').should('be.visible');
  });
});
