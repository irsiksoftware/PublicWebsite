# Performance Dashboard

## Lighthouse CI Performance Monitoring

This project uses Lighthouse CI to continuously monitor and track web performance metrics.

### Key Metrics Tracked

#### Core Web Vitals
- **Largest Contentful Paint (LCP)**: Target < 2.5s
- **Cumulative Layout Shift (CLS)**: Target < 0.1
- **Total Blocking Time (TBT)**: Target < 300ms

#### Additional Metrics
- **First Contentful Paint (FCP)**: Target < 2.0s
- **Speed Index**: Target < 3.0s
- **Time to Interactive (TTI)**: Target < 3.5s

### Performance Budgets

Our performance budgets are enforced automatically via Lighthouse CI:

| Category | Minimum Score |
|----------|---------------|
| Performance | 90 |
| Accessibility | 90 |
| Best Practices | 90 |
| SEO | 90 |

### Viewing Reports

#### GitHub Actions
- Lighthouse CI runs automatically on all pushes to `main` and `develop` branches
- Pull requests receive automated performance reports as comments
- Full HTML reports are uploaded as artifacts and retained for 30 days

#### Local Testing

Run Lighthouse CI locally:

```bash
# Install dependencies
npm install

# Run Lighthouse CI
npx lhci autorun
```

### Performance Alerts

The CI pipeline will:
- **Error**: If category scores fall below 90%
- **Warn**: If specific metrics exceed thresholds (see `lighthouserc.json`)

### Continuous Improvement

1. Monitor performance trends via GitHub Actions artifacts
2. Review pull request performance impacts before merging
3. Address warnings and errors promptly
4. Update budgets as needed in `lighthouserc.json`

### Configuration Files

- `lighthouserc.json` - Lighthouse CI configuration and budgets
- `.github/workflows/lighthouse-ci.yml` - CI/CD workflow

### Resources

- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
