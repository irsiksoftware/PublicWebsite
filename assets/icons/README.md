# SVG Icon System

This folder contains the SVG icon library for the Avengers Archive project.

## Available Icons

- **shield.svg** - S.H.I.E.L.D. shield icon
- **star.svg** - Star/rating icon
- **alert.svg** - Alert/warning icon
- **user.svg** - User/profile icon
- **search.svg** - Search icon (with stroke)
- **menu.svg** - Hamburger menu icon (with stroke)
- **close.svg** - Close/X icon (with stroke)
- **arrow.svg** - Arrow icon (with stroke)
- **lightning.svg** - Lightning/power icon

## Usage

### Inline SVG

For best control and styling, inline the SVG directly in your HTML:

```html
<span class="icon icon-md">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.05-2.76 7.86-6 8.73-3.24-.87-6-4.68-6-8.73V6.43l6-2.25z"/>
  </svg>
</span>
```

### Size Classes

The icon system includes three size classes:

- `.icon-sm` - 16px × 16px (small)
- `.icon-md` - 24px × 24px (medium)
- `.icon-lg` - 48px × 48px (large)

### Color Control

Icons use `fill="currentColor"` or `stroke="currentColor"`, which means they inherit the text color from their parent element:

```html
<div style="color: #ff0000;">
  <span class="icon icon-md">
    <!-- Icon will be red -->
  </span>
</div>
```

You can also use color modifier classes:

- `.icon--primary`
- `.icon--secondary`
- `.icon--success`
- `.icon--danger`
- `.icon--warning`
- `.icon--info`

### Examples

```html
<!-- Small shield icon -->
<span class="icon icon-sm">
  [shield SVG code]
</span>

<!-- Medium search icon with primary color -->
<span class="icon icon-md icon--primary">
  [search SVG code]
</span>

<!-- Large alert icon -->
<span class="icon icon-lg">
  [alert SVG code]
</span>
```

## Technical Details

- All icons use a consistent `24x24` viewBox
- Icons with `fill="currentColor"` are solid icons
- Icons with `stroke="currentColor"` are outline icons
- The CSS file (`css/icons.css`) provides all necessary styling classes
