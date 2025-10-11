# Contributing Guidelines

## Welcome

Thank you for considering contributing to the AI Agent Swarm Dashboard! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate
- Welcome diverse perspectives
- Give and accept constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling, insulting comments, or personal attacks
- Publishing others' private information
- Any conduct that could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. Fork the repository on GitHub
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/PublicWebsite.git
cd PublicWebsite
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/original/PublicWebsite.git
```

4. Install dependencies:
```bash
npm install
```

5. Create environment file:
```bash
cp .env.example .env
```

6. Start development server:
```bash
npm start
```

### Staying Up to Date

Regularly sync your fork with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:

```
feature/add-user-authentication
fix/correct-chart-rendering
docs/update-api-documentation
refactor/improve-data-loader
test/add-form-validation-tests
chore/update-dependencies
```

### Creating a Branch

```bash
# Create and switch to new branch
git checkout -b feature/your-feature-name

# Push branch to your fork
git push -u origin feature/your-feature-name
```

### Making Changes

1. Make your changes in focused, logical commits
2. Write clear commit messages
3. Test your changes thoroughly
4. Update documentation as needed

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add user login functionality

Implements user authentication with JWT tokens.
Includes form validation and error handling.

Closes #123
```

```
fix(charts): correct data rendering in success rate chart

The chart was displaying incorrect percentages due to
a calculation error in the data transformation function.

Fixes #456
```

## Coding Standards

### JavaScript Style Guide

#### General Rules

1. Use ES6+ features
2. Use meaningful variable names
3. Keep functions small and focused
4. Avoid global variables
5. Use const for immutable values, let for mutable
6. Never use var

#### Example

```javascript
// Good
const calculateTotalPrice = (items) => {
  return items.reduce((total, item) => total + item.price, 0);
};

// Bad
var total = 0;
function calc(x) {
  for (var i = 0; i < x.length; i++) {
    total = total + x[i].price;
  }
  return total;
}
```

#### Formatting

- Indentation: 2 spaces
- Line length: Max 100 characters
- Semicolons: Required
- Quotes: Single quotes for strings
- Trailing commas: Yes

#### File Organization

```javascript
// 1. Imports
import { something } from './module.js';

// 2. Constants
const CONFIG = {
  timeout: 5000
};

// 3. Private functions
function privateHelper() {
  // Implementation
}

// 4. Public functions/classes
export function publicFunction() {
  // Implementation
}

export default class MyClass {
  // Implementation
}
```

### CSS Style Guide

#### Naming Convention

Use BEM (Block Element Modifier) methodology:

```css
/* Block */
.card {}

/* Element */
.card__header {}
.card__body {}
.card__footer {}

/* Modifier */
.card--highlighted {}
.card--dark {}
```

#### Organization

```css
/* 1. Positioning */
position: relative;
top: 0;
left: 0;

/* 2. Box model */
display: block;
width: 100%;
padding: 1rem;
margin: 0;

/* 3. Typography */
font-family: sans-serif;
font-size: 1rem;
line-height: 1.5;

/* 4. Visual */
background: white;
color: black;
border: 1px solid gray;

/* 5. Animation */
transition: all 0.3s ease;
```

#### CSS Variables

Use CSS custom properties for theming:

```css
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --spacing-unit: 8px;
  --font-family-base: 'Inter', sans-serif;
}

.button {
  background: var(--color-primary);
  padding: calc(var(--spacing-unit) * 2);
  font-family: var(--font-family-base);
}
```

### HTML Guidelines

1. Use semantic HTML5 elements
2. Include ARIA attributes for accessibility
3. Use proper heading hierarchy
4. Add alt text for images
5. Use descriptive IDs and classes

```html
<!-- Good -->
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li><a href="#home">Home</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

<!-- Bad -->
<div class="nav">
  <div><a href="#home">Home</a></div>
</div>

<div class="content">
  <div class="title">Title</div>
  <div class="text">Content</div>
</div>
```

## Testing Guidelines

### Unit Tests

Write unit tests for all new functions and components:

```javascript
// Example test
import { calculateTotalPrice } from './utils.js';

describe('calculateTotalPrice', () => {
  it('should calculate total price correctly', () => {
    const items = [
      { price: 10 },
      { price: 20 },
      { price: 30 }
    ];

    const total = calculateTotalPrice(items);

    expect(total).toBe(60);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotalPrice([])).toBe(0);
  });

  it('should handle single item', () => {
    expect(calculateTotalPrice([{ price: 50 }])).toBe(50);
  });
});
```

### Integration Tests

Test component interactions:

```javascript
describe('Agent Selector', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="agent-selector"></div>';
    initAgentSelector();
  });

  it('should load agents on init', async () => {
    await waitFor(() => {
      const agents = document.querySelectorAll('.agent-item');
      expect(agents.length).toBeGreaterThan(0);
    });
  });

  it('should select agent on click', () => {
    const firstAgent = document.querySelector('.agent-item');
    firstAgent.click();

    expect(firstAgent.classList.contains('selected')).toBe(true);
  });
});
```

### End-to-End Tests

Write E2E tests for critical user flows:

```javascript
// cypress/e2e/user-flow.cy.js
describe('User Flow', () => {
  it('should complete agent selection and view metrics', () => {
    cy.visit('/');

    // Select an agent
    cy.get('[data-testid="agent-selector"]').click();
    cy.get('[data-testid="agent-1"]').click();

    // Verify metrics displayed
    cy.get('[data-testid="metrics-table"]').should('be.visible');
    cy.get('[data-testid="success-rate-chart"]').should('be.visible');
  });
});
```

### Test Coverage

Maintain test coverage above 80%:

```bash
npm run test:coverage
```

Coverage requirements:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Documentation

### Code Comments

Write clear comments for complex logic:

```javascript
/**
 * Calculates the success rate percentage for an agent
 * @param {Object} metrics - Agent metrics object
 * @param {number} metrics.successful - Number of successful operations
 * @param {number} metrics.total - Total number of operations
 * @returns {number} Success rate as a percentage (0-100)
 */
function calculateSuccessRate(metrics) {
  if (metrics.total === 0) {
    return 0;
  }

  return (metrics.successful / metrics.total) * 100;
}
```

### API Documentation

Document all public functions:

- Purpose and functionality
- Parameters with types
- Return value with type
- Example usage
- Any side effects

### README Updates

Update README.md when:
- Adding new features
- Changing installation steps
- Modifying configuration
- Adding dependencies

## Pull Request Process

### Before Submitting

1. Ensure all tests pass:
```bash
npm test
npm run e2e:headless
```

2. Run linter:
```bash
npm run lint
```

3. Update documentation

4. Test in different browsers

5. Check accessibility:
```bash
npm run a11y:audit
```

### Creating a Pull Request

1. Push your branch to your fork
2. Go to the original repository
3. Click "New Pull Request"
4. Select your branch
5. Fill out the PR template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #(issue number)

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
Describe testing performed:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No console errors
- [ ] Accessibility tested
- [ ] Works in major browsers
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

### After Merge

1. Delete your branch:
```bash
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

2. Update your local main:
```bash
git checkout main
git pull upstream main
```

## Issue Reporting

### Before Creating an Issue

1. Search existing issues
2. Check documentation
3. Verify in latest version

### Bug Reports

Include:
- Clear title
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser/OS information
- Console errors

**Template:**
```markdown
**Bug Description**
A clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Browser: Chrome 120
- OS: Windows 11
- Version: 1.0.0

**Screenshots**
Add screenshots here

**Console Errors**
```
Error messages here
```
```

### Feature Requests

Include:
- Clear title
- Problem description
- Proposed solution
- Alternatives considered
- Additional context

## Community

### Communication Channels

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: General questions and ideas
- Pull Requests: Code contributions

### Getting Help

1. Check documentation first
2. Search existing issues
3. Ask in GitHub Discussions
4. Create a new issue if needed

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in commit history

## Additional Resources

### Recommended Tools

- **Editor**: VS Code with ESLint and Prettier extensions
- **Browser DevTools**: Chrome DevTools or Firefox Developer Tools
- **Git GUI**: GitKraken, SourceTree, or GitHub Desktop
- **API Testing**: Postman or Insomnia

### Learning Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)
- [Web.dev](https://web.dev/)
- [A11y Project](https://www.a11yproject.com/)

### Project-Specific Documentation

- [API Documentation](./API.md)
- [Component Documentation](./COMPONENTS.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

If you have questions about contributing, please:
1. Check this document first
2. Search existing issues/discussions
3. Create a discussion post
4. Contact maintainers

Thank you for contributing to the AI Agent Swarm Dashboard!
