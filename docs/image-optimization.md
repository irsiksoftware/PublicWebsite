# Image Optimization Pipeline

This document describes the image optimization pipeline implemented for the PublicWebsite project.

## Overview

The image optimization pipeline automatically converts images to modern formats (WebP) and generates responsive sizes for optimal web performance.

## Features

### 1. WebP Conversion
- All PNG/JPG images are converted to WebP format
- WebP provides 25-35% better compression than PNG/JPG
- Fallback to original format for unsupported browsers

### 2. Responsive Image Sizes
Generated sizes:
- **Small**: 480px width (mobile devices)
- **Medium**: 768px width (tablets)
- **Large**: 1024px width (desktop)
- **XLarge**: 1920px width (high-res displays)

### 3. Lazy Loading
- Images load only when entering viewport
- Reduces initial page load time
- Uses native `loading="lazy"` attribute with IntersectionObserver fallback

### 4. Loading Placeholders
- Tiny blurred placeholders (20px width)
- Blur-up effect for smooth image appearance
- Prevents layout shift during load

## Usage

### Build Process

Run image optimization:
```bash
npm run images:optimize
```

This is automatically included in the production build:
```bash
npm run build
```

### JavaScript API

Import the lazy loading module:
```javascript
import { initLazyLoading, createResponsiveImage } from './js/image-lazy-loader.js';
```

Create a responsive image programmatically:
```javascript
const picture = createResponsiveImage({
  baseName: 'hero_banner_4',
  alt: 'Hero banner image',
  className: 'hero-image',
  eager: false // Set to true for above-the-fold images
});
document.body.appendChild(picture);
```

### HTML Usage

Using the `<picture>` element with lazy loading:
```html
<picture>
  <source type="image/webp" media="(min-width: 1024px)" data-srcset="./public/images/hero-large.webp">
  <source type="image/webp" media="(min-width: 768px)" data-srcset="./public/images/hero-medium.webp">
  <source type="image/webp" data-srcset="./public/images/hero-small.webp">
  <img
    src="./public/images/hero-placeholder.webp"
    data-src="./public/images/hero.jpg"
    alt="Hero image"
    class="lazy-image"
    loading="lazy"
  >
</picture>
```

### CSS Classes

Include the image loading styles:
```html
<link rel="stylesheet" href="./css/image-loading.css">
```

Available CSS classes:
- `.lazy-image` - Applied to images with lazy loading
- `.lazy-image.loaded` - Applied when image is loaded
- `.image-container` - Container with aspect ratio preservation
- `.image-placeholder` - Shimmer loading effect

## File Structure

```
build-scripts/
  optimize-images.js      # Image optimization build script

js/
  image-lazy-loader.js    # Lazy loading utility

css/
  image-loading.css       # Loading styles and animations

public/images/            # Output directory for optimized images
  {name}-small.webp       # 480px WebP version
  {name}-medium.webp      # 768px WebP version
  {name}-large.webp       # 1024px WebP version
  {name}-xlarge.webp      # 1920px WebP version
  {name}.jpg/.png         # Fallback original format
  {name}-placeholder.webp # Tiny placeholder (20px)
```

## Performance Benefits

1. **Reduced File Size**: WebP reduces image size by 25-35%
2. **Faster Page Load**: Only load images when needed
3. **Better UX**: Smooth blur-up effect prevents jarring image pops
4. **Responsive**: Serve appropriately sized images per device
5. **No Layout Shift**: Placeholders prevent content jumping

## Browser Support

- **WebP**: Chrome, Firefox, Edge, Safari 14+
- **Lazy Loading**: All modern browsers
- **Fallback**: PNG/JPG for older browsers

## Accessibility

- All images must have meaningful `alt` attributes
- Reduced motion support via CSS media queries
- High contrast mode compatible
