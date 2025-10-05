import subprocess
import re

# All issues from the list
issues_data = [
    (138, "Create comprehensive feature test page", ["LOW"]),
    (137, "Implement WebGL particle background effect", ["LOW"]),
    (136, "Add Web Animations API for complex effects", ["LOW"]),
    (135, "Build service worker for offline PWA support", ["LOW"]),
    (134, "Create performance monitoring dashboard", ["LOW"]),
    (133, "Add comprehensive accessibility improvements", ["HIGH"]),
    (132, "Implement theme switcher with localStorage", ["MEDIUM"]),
    (131, "Add drag-and-drop team builder interface", ["MEDIUM"]),
    (130, "Build infinite scroll for mission logs", ["MEDIUM"]),
    (129, "Create advanced search with multi-filter system", ["HIGH"]),
    (128, "Implement Tetris hold piece and preview features", ["LOW"]),
    (127, "Add Tetris UI panels and game over screen", ["MEDIUM"]),
    (126, "Implement Tetris line clearing and scoring", ["MEDIUM"]),
    (125, "Add Tetris game loop with gravity and level system", ["HIGH"]),
    (124, "Implement Tetris piece movement and collision", ["HIGH"]),
    (123, "Create Tetris game canvas and grid setup", ["CRITICAL", "wip"]),
    (122, "Add modal open/close with focus trap", ["HIGH"]),
    (121, "Implement form validation with real-time feedback", ["MEDIUM"]),
    (120, "Build tab switching with keyboard navigation", ["MEDIUM"]),
    (119, "Create dynamic search filtering functionality", ["HIGH"]),
    (118, "Add parallax scrolling effect on layers", ["MEDIUM"]),
    (117, "Build image lightbox with keyboard navigation", ["HIGH"]),
    (116, "Implement statistics counter animation with easing", ["MEDIUM"]),
    (115, "Add scroll-triggered animation controller", ["HIGH"]),
    (114, "Create lazy loading with Intersection Observer", ["MEDIUM"]),
    (113, "Build hamburger menu toggle with animation", ["HIGH"]),
    (112, "Implement smooth scroll with offset for sticky header", ["HIGH"]),
    (111, "Add basic JavaScript module setup and utilities", ["CRITICAL", "wip"]),
    (110, "Add table of contents with smooth scroll navigation", ["MEDIUM"]),
    (109, "Design alert banner component with slide animation", ["MEDIUM"]),
    (108, "Create CSS-only tooltip system with arrows", ["LOW"]),
    (107, "Add CSS blend modes for creative image effects", ["LOW"]),
    (106, "Build skill progress bars with animated gradients", ["MEDIUM"]),
    (105, "Implement mission log table with sticky header", ["MEDIUM"]),
    (104, "Add SVG icon integration and sizing system", ["HIGH"]),
    (103, "Design modal overlay with backdrop blur", ["MEDIUM"]),
    (102, "Create parallax background layer structure", ["MEDIUM"]),
    (101, "Add responsive breakpoints with comprehensive media queries", ["HIGH"]),
    (100, "Build notification badge system with pulse animation", ["LOW"]),
    (99, "Create search bar with icon and focus glow", ["MEDIUM"]),
    (98, "Add custom scrollbar styling for theme consistency", ["LOW"]),
    (97, "Implement CSS-only tabbed interface for teams", ["MEDIUM"]),
    (96, "Create intel classification badges with glow effects", ["MEDIUM"]),
    (95, "Add CSS classes for scroll-triggered animations", ["LOW"]),
    (94, "Build team stats dashboard with CSS Grid and gradients", ["HIGH"]),
    (93, "Design mission briefing cards with glassmorphism", ["MEDIUM"]),
    (92, "Add CSS filters for dramatic image effects", ["LOW"]),
    (91, "Create footer with multi-column grid and social links", ["MEDIUM"]),
    (90, "Implement S.H.I.E.L.D. loading screen with CSS animation", ["LOW"]),
    (89, "Add profile cards with clip-path masking and blend modes", ["MEDIUM"]),
    (88, "Design threat level indicator with clip-path shapes", ["HIGH"]),
    (87, "Create timeline with CSS pseudo-elements and connecting lines", ["MEDIUM"]),
    (86, "Add hero image gallery with object-fit and overlays", ["HIGH"]),
    (85, "Implement CSS-only accordion for FAQ section", ["MEDIUM"]),
    (84, "Build mission cards with complex hover effects", ["MEDIUM"]),
    (83, "Create animated statistics counter section with large numbers", ["MEDIUM"]),
    (82, "Add custom fonts with @font-face and font-display", ["MEDIUM"]),
    (81, "Design Avengers roster grid with modern CSS Grid", ["HIGH"]),
    (80, "Implement sticky header with glassmorphism effect", ["HIGH"]),
    (79, "Create responsive navigation with flexbox and hover effects", ["HIGH"]),
    (78, "Add animated glowing S.H.I.E.L.D. logo with keyframes", ["URGENT"]),
    (77, "Design hero section with CSS Grid and diagonal gradient", ["URGENT"]),
    (76, "Add CSS reset and Avengers theme variables", ["CRITICAL"]),
    (75, "Create base HTML with semantic structure and meta tags", ["CRITICAL"]),
    (74, "Create Avengers Archive folder structure", ["CRITICAL", "wip"]),
]

# Priority labels
PRIORITY_LABELS = {'CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'}

# Analysis results
broken_deps = []
missing_priority = []
multiple_priority = []
missing_type = []

print(f"Analyzing {len(issues_data)} issues...")
print()

for num, title, labels in issues_data:
    print(f"Issue #{num}: {title}")
    print(f"  Labels: {', '.join(labels)}")

    # Check for dependency labels (d1, d2, d3, etc.)
    dep_labels = [l for l in labels if re.match(r'^d\d+$', l)]

    if dep_labels:
        for dep_label in dep_labels:
            dep_num = dep_label[1:]  # Remove 'd' prefix
            print(f"  Checking dependency: #{dep_num}")
            # Check if dependency exists
            check = subprocess.run([
                'C:\\Program Files\\GitHub CLI\\gh.bat',
                'issue', 'view', dep_num,
                '--json', 'number,state'
            ], capture_output=True, text=True, timeout=10)

            if 'Could not resolve' in check.stderr or check.returncode != 0:
                broken_deps.append((num, dep_num, dep_label))
                print(f"    BROKEN: Issue #{num} depends on non-existent #{dep_num}")

    # Check priority labels
    priority_count = [l for l in labels if l in PRIORITY_LABELS]
    if len(priority_count) == 0:
        missing_priority.append(num)
        print(f"  MISSING PRIORITY")
    elif len(priority_count) > 1:
        multiple_priority.append((num, priority_count))
        print(f"  MULTIPLE PRIORITY: {priority_count}")

    # Check for type labels based on title
    title_lower = title.lower()

    # Check if already has a type label
    type_labels = ['testing', 'bug', 'feature', 'enhancement', 'documentation']
    has_type = any(l in labels for l in type_labels)

    # Check title keywords
    needs_testing = any(word in title_lower for word in ['test', 'testing'])
    needs_bug = any(word in title_lower for word in ['bug', 'fix', 'error'])
    needs_feature = any(word in title_lower for word in ['feature', 'add', 'create', 'implement', 'build', 'design'])

    if needs_testing and 'testing' not in labels:
        missing_type.append((num, 'testing'))
        print(f"  MISSING TYPE: testing")

    if needs_bug and 'bug' not in labels:
        missing_type.append((num, 'bug'))
        print(f"  MISSING TYPE: bug")

    if needs_feature and 'feature' not in labels and not needs_testing and not needs_bug:
        missing_type.append((num, 'feature'))
        print(f"  MISSING TYPE: feature")

    print()

# Summary
print("="*60)
print("AUDIT SUMMARY")
print("="*60)
print(f"Total issues analyzed: {len(issues_data)}")
print(f"Broken dependencies: {len(broken_deps)}")
print(f"Missing priority labels: {len(missing_priority)}")
print(f"Multiple priority labels: {len(multiple_priority)}")
print(f"Missing type labels: {len(missing_type)}")
print()

if broken_deps:
    print("BROKEN DEPENDENCIES:")
    for issue_num, dep_num, dep_label in broken_deps:
        print(f"  Issue #{issue_num} -> dependency #{dep_num} (label: {dep_label})")
    print()

if missing_priority:
    print("MISSING PRIORITY LABELS:")
    for num in missing_priority:
        print(f"  Issue #{num}")
    print()

if multiple_priority:
    print("MULTIPLE PRIORITY LABELS:")
    for num, priorities in multiple_priority:
        print(f"  Issue #{num}: {priorities}")
    print()

if missing_type:
    print("MISSING TYPE LABELS:")
    for num, type_label in missing_type:
        print(f"  Issue #{num} needs '{type_label}'")
    print()

# Save results as JSON
import json
results = {
    'broken_deps': broken_deps,
    'missing_priority': missing_priority,
    'multiple_priority': multiple_priority,
    'missing_type': missing_type
}

with open('audit_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Results saved to audit_results.json")
