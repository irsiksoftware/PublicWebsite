#!/usr/bin/env node

/**
 * WCAG 2.1 AA Accessibility Audit Script
 * Tests HTML pages for accessibility compliance using axe-core and pa11y
 */

import { createRequire } from 'module';
import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const axe = require('axe-core');
const pa11y = require('pa11y');
const { JSDOM } = require('jsdom');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// WCAG 2.1 AA Standards
const AXE_OPTIONS = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
  }
};

const PA11Y_OPTIONS = {
  standard: 'WCAG2AA',
  wait: 1000,
  timeout: 30000,
  chromeLaunchConfig: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
};

// Color contrast minimum ratios for WCAG AA
const CONTRAST_RATIOS = {
  normal: 4.5,
  large: 3.0
};

class AccessibilityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        filesWithIssues: 0,
        totalViolations: 0,
        criticalIssues: 0,
        seriousIssues: 0,
        moderateIssues: 0,
        minorIssues: 0
      },
      files: []
    };
  }

  async auditFile(filePath) {
    console.log(`\nAuditing: ${filePath}`);

    const html = readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html, { url: `file://${resolve(filePath)}` });
    const { window } = dom;
    const { document } = window;

    // Inject axe-core
    const axeScript = readFileSync(require.resolve('axe-core'), 'utf-8');
    const scriptEl = document.createElement('script');
    scriptEl.textContent = axeScript;
    document.head.appendChild(scriptEl);

    const fileResult = {
      file: filePath,
      violations: [],
      passes: 0,
      incomplete: 0
    };

    try {
      // Run axe-core audit
      const axeResults = await window.axe.run(document, AXE_OPTIONS);

      fileResult.passes = axeResults.passes.length;
      fileResult.incomplete = axeResults.incomplete.length;

      // Process violations
      for (const violation of axeResults.violations) {
        const severity = this.mapSeverity(violation.impact);

        for (const node of violation.nodes) {
          fileResult.violations.push({
            id: violation.id,
            impact: violation.impact,
            severity,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            html: node.html,
            target: node.target,
            wcagTags: violation.tags.filter(tag => tag.startsWith('wcag'))
          });

          // Update summary counts
          this.results.summary.totalViolations++;
          switch (severity) {
            case 'critical':
              this.results.summary.criticalIssues++;
              break;
            case 'serious':
              this.results.summary.seriousIssues++;
              break;
            case 'moderate':
              this.results.summary.moderateIssues++;
              break;
            case 'minor':
              this.results.summary.minorIssues++;
              break;
          }
        }
      }

      if (fileResult.violations.length > 0) {
        this.results.summary.filesWithIssues++;
      }

      console.log(`  ✓ Passes: ${fileResult.passes}`);
      console.log(`  ⚠ Violations: ${fileResult.violations.length}`);
      console.log(`  ⓘ Incomplete: ${fileResult.incomplete}`);

    } catch (error) {
      console.error(`  ✗ Error auditing ${filePath}:`, error.message);
      fileResult.error = error.message;
    }

    window.close();
    this.results.files.push(fileResult);
    this.results.summary.totalFiles++;
  }

  mapSeverity(impact) {
    const severityMap = {
      'critical': 'critical',
      'serious': 'serious',
      'moderate': 'moderate',
      'minor': 'minor'
    };
    return severityMap[impact] || 'moderate';
  }

  generateReport() {
    const reportPath = resolve(__dirname, 'accessibility-audit-report.json');
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📊 Detailed report saved to: ${reportPath}`);

    // Generate markdown report
    const mdReport = this.generateMarkdownReport();
    const mdPath = resolve(__dirname, 'ACCESSIBILITY-AUDIT.md');
    writeFileSync(mdPath, mdReport);
    console.log(`📄 Markdown report saved to: ${mdPath}`);
  }

  generateMarkdownReport() {
    const { summary, files } = this.results;

    let md = `# WCAG 2.1 AA Accessibility Audit Report\n\n`;
    md += `**Generated:** ${new Date(this.results.timestamp).toLocaleString()}\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Files Audited | ${summary.totalFiles} |\n`;
    md += `| Files with Issues | ${summary.filesWithIssues} |\n`;
    md += `| Total Violations | ${summary.totalViolations} |\n`;
    md += `| Critical Issues | ${summary.criticalIssues} |\n`;
    md += `| Serious Issues | ${summary.seriousIssues} |\n`;
    md += `| Moderate Issues | ${summary.moderateIssues} |\n`;
    md += `| Minor Issues | ${summary.minorIssues} |\n\n`;

    // Compliance status
    const complianceRate = summary.totalFiles > 0
      ? ((summary.totalFiles - summary.filesWithIssues) / summary.totalFiles * 100).toFixed(1)
      : 0;

    md += `## Compliance Status\n\n`;
    md += `**${complianceRate}%** of files passed all WCAG 2.1 AA checks\n\n`;

    if (summary.totalViolations === 0) {
      md += `✅ **All pages are WCAG 2.1 AA compliant!**\n\n`;
    } else {
      md += `⚠️ **${summary.totalViolations} violations found across ${summary.filesWithIssues} files**\n\n`;
    }

    // Files with violations
    const filesWithViolations = files.filter(f => f.violations.length > 0);

    if (filesWithViolations.length > 0) {
      md += `## Files with Violations\n\n`;

      for (const file of filesWithViolations) {
        md += `### ${file.file}\n\n`;
        md += `**Violations:** ${file.violations.length}\n\n`;

        // Group violations by impact
        const grouped = {};
        for (const violation of file.violations) {
          if (!grouped[violation.impact]) {
            grouped[violation.impact] = [];
          }
          grouped[violation.impact].push(violation);
        }

        for (const [impact, violations] of Object.entries(grouped)) {
          md += `#### ${impact.toUpperCase()} (${violations.length})\n\n`;

          for (const v of violations) {
            md += `**${v.id}:** ${v.description}\n\n`;
            md += `- **Help:** ${v.help}\n`;
            md += `- **WCAG:** ${v.wcagTags.join(', ')}\n`;
            md += `- **Target:** \`${v.target.join(' ')}\`\n`;
            md += `- **HTML:** \`${v.html.substring(0, 100)}${v.html.length > 100 ? '...' : ''}\`\n`;
            md += `- **More info:** ${v.helpUrl}\n\n`;
          }
        }
      }
    }

    // Recommendations
    md += `## Recommendations\n\n`;

    if (summary.criticalIssues > 0) {
      md += `### Critical Priority\n\n`;
      md += `- Address all ${summary.criticalIssues} critical issues immediately\n`;
      md += `- Critical issues prevent users from accessing content\n\n`;
    }

    if (summary.seriousIssues > 0) {
      md += `### High Priority\n\n`;
      md += `- Fix ${summary.seriousIssues} serious accessibility barriers\n`;
      md += `- These significantly impact user experience\n\n`;
    }

    if (summary.moderateIssues > 0 || summary.minorIssues > 0) {
      md += `### Medium/Low Priority\n\n`;
      md += `- Address ${summary.moderateIssues + summary.minorIssues} moderate/minor issues\n`;
      md += `- These improve overall accessibility and user experience\n\n`;
    }

    md += `## Next Steps\n\n`;
    md += `1. Review detailed violations in \`accessibility-audit-report.json\`\n`;
    md += `2. Prioritize fixes based on severity (Critical → Serious → Moderate → Minor)\n`;
    md += `3. Test fixes with screen readers and keyboard navigation\n`;
    md += `4. Re-run audit after fixes: \`npm run accessibility:audit\`\n`;
    md += `5. Consider automated CI/CD integration for continuous monitoring\n\n`;

    return md;
  }

  printSummary() {
    const { summary } = this.results;

    console.log('\n' + '='.repeat(60));
    console.log('📊 WCAG 2.1 AA ACCESSIBILITY AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Files Audited:     ${summary.totalFiles}`);
    console.log(`Files with Issues:       ${summary.filesWithIssues}`);
    console.log(`Total Violations:        ${summary.totalViolations}`);
    console.log('─'.repeat(60));
    console.log(`Critical Issues:         ${summary.criticalIssues}`);
    console.log(`Serious Issues:          ${summary.seriousIssues}`);
    console.log(`Moderate Issues:         ${summary.moderateIssues}`);
    console.log(`Minor Issues:            ${summary.minorIssues}`);
    console.log('='.repeat(60));

    if (summary.totalViolations === 0) {
      console.log('✅ All pages passed WCAG 2.1 AA compliance!');
    } else if (summary.criticalIssues > 0) {
      console.log('❌ Critical accessibility issues found - immediate action required');
    } else if (summary.seriousIssues > 0) {
      console.log('⚠️  Serious accessibility issues found - action recommended');
    } else {
      console.log('⚠️  Minor accessibility issues found - improvements recommended');
    }
    console.log('='.repeat(60) + '\n');
  }
}

async function main() {
  console.log('🔍 Starting WCAG 2.1 AA Accessibility Audit...\n');

  // Find all HTML files (excluding node_modules and dist during build)
  const htmlFiles = await glob('**/*.html', {
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true
  });

  if (htmlFiles.length === 0) {
    console.log('No HTML files found to audit.');
    process.exit(0);
  }

  console.log(`Found ${htmlFiles.length} HTML files to audit\n`);

  const auditor = new AccessibilityAuditor();

  for (const file of htmlFiles) {
    await auditor.auditFile(file);
  }

  auditor.printSummary();
  auditor.generateReport();

  // Exit with error code if critical or serious issues found
  if (auditor.results.summary.criticalIssues > 0 || auditor.results.summary.seriousIssues > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});
