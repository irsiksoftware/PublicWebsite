import re
from datetime import datetime
import subprocess

# Read the table format output
issues_text = """#138 [OPEN] [LOW, feature, testing] Create comprehensive feature test page
#137 [OPEN] [LOW, feature] Implement WebGL particle background effect
#136 [OPEN] [LOW, feature] Add Web Animations API for complex effects
#135 [OPEN] [LOW, feature] Build service worker for offline PWA support
#134 [OPEN] [LOW, feature] Create performance monitoring dashboard
#133 [OPEN] [HIGH, wip, feature] Add comprehensive accessibility improvements
#132 [OPEN] [MEDIUM, wip, feature] Implement theme switcher with localStorage
#131 [OPEN] [MEDIUM, feature] Add drag-and-drop team builder interface
#130 [OPEN] [MEDIUM, feature] Build infinite scroll for mission logs
#129 [OPEN] [HIGH, wip, feature] Create advanced search with multi-filter system
#128 [OPEN] [LOW, feature] Implement Tetris hold piece and preview features
#127 [OPEN] [MEDIUM, feature] Add Tetris UI panels and game over screen
#126 [OPEN] [MEDIUM, feature] Implement Tetris line clearing and scoring
#123 [OPEN] [CRITICAL, wip, feature] Create Tetris game canvas and grid setup
#121 [OPEN] [MEDIUM, feature] Implement form validation with real-time feedback
#120 [OPEN] [MEDIUM, feature] Build tab switching with keyboard navigation
#119 [OPEN] [HIGH, wip, feature] Create dynamic search filtering functionality
#118 [OPEN] [MEDIUM, feature] Add parallax scrolling effect on layers
#116 [OPEN] [MEDIUM, feature] Implement statistics counter animation with easing
#114 [OPEN] [MEDIUM, feature] Create lazy loading with Intersection Observer
#113 [OPEN] [HIGH, wip, feature] Build hamburger menu toggle with animation
#112 [OPEN] [HIGH, wip, feature] Implement smooth scroll with offset for sticky header
#111 [OPEN] [CRITICAL, wip, feature] Add basic JavaScript module setup and utilities
#110 [OPEN] [MEDIUM, feature] Add table of contents with smooth scroll navigation
#109 [OPEN] [MEDIUM, feature] Design alert banner component with slide animation
#108 [OPEN] [LOW, feature] Create CSS-only tooltip system with arrows
#107 [OPEN] [LOW, feature] Add CSS blend modes for creative image effects
#106 [OPEN] [MEDIUM, feature] Build skill progress bars with animated gradients
#105 [OPEN] [MEDIUM, feature] Implement mission log table with sticky header
#103 [OPEN] [MEDIUM, feature] Design modal overlay with backdrop blur
#102 [OPEN] [MEDIUM, feature] Create parallax background layer structure
#101 [OPEN] [HIGH, wip, feature] Add responsive breakpoints with comprehensive media queries
#100 [OPEN] [LOW, feature] Build notification badge system with pulse animation
#99 [OPEN] [MEDIUM, feature] Create search bar with icon and focus glow
#98 [OPEN] [LOW, feature] Add custom scrollbar styling for theme consistency
#97 [OPEN] [MEDIUM, feature] Implement CSS-only tabbed interface for teams
#96 [OPEN] [MEDIUM, feature] Create intel classification badges with glow effects
#95 [OPEN] [LOW, feature] Add CSS classes for scroll-triggered animations
#94 [OPEN] [HIGH, wip, feature] Build team stats dashboard with CSS Grid and gradients
#93 [OPEN] [MEDIUM, feature] Design mission briefing cards with glassmorphism
#92 [OPEN] [LOW, feature] Add CSS filters for dramatic image effects
#91 [OPEN] [MEDIUM, feature] Create footer with multi-column grid and social links
#90 [OPEN] [LOW, feature] Implement S.H.I.E.L.D. loading screen with CSS animation
#89 [OPEN] [MEDIUM, feature] Add profile cards with clip-path masking and blend modes
#85 [OPEN] [MEDIUM, feature] Implement CSS-only accordion for FAQ section
#83 [OPEN] [MEDIUM, feature] Create animated statistics counter section with large numbers
#82 [OPEN] [MEDIUM, wip, feature] Add custom fonts with @font-face and font-display
#79 [OPEN] [HIGH, wip, feature] Create responsive navigation with flexbox and hover effects"""

# Parse issues
issues = []
for line in issues_text.strip().split('\n'):
    match = re.match(r'#(\d+) \[OPEN\] \[([^\]]+)\] (.+)', line)
    if match:
        number = int(match.group(1))
        labels = [l.strip() for l in match.group(2).split(',')]
        title = match.group(3)

        # Skip if wip label present
        if 'wip' in labels:
            continue

        issues.append({
            'number': number,
            'labels': labels,
            'title': title
        })

# Priority mapping
priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def get_priority(issue):
    for label in issue['labels']:
        label_upper = label.upper()
        if label_upper in priority_order:
            return priority_order[label_upper]
    return 5

# Sort by priority, then by issue number (oldest first)
sorted_issues = sorted(issues, key=lambda x: (get_priority(x), x['number']))

# Print first available issue
if sorted_issues:
    first = sorted_issues[0]
    priority_label = next((l for l in first['labels'] if l.upper() in priority_order), 'NO_PRIORITY')
    print(f"TARGET: #{first['number']} [{priority_label.upper()}] {first['title']}")
else:
    print("NO_AVAILABLE_WORK")
