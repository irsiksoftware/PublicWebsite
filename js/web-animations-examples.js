/**
 * Web Animations API Usage Examples
 *
 * This file demonstrates how to use the Web Animations API functions
 * provided by web-animations.js
 */

// Example 1: Basic fadeIn animation
function exampleFadeIn() {
  const element = document.querySelector('.my-element');
  const animation = window.WebAnimations.fadeIn(element);

  // You can also customize options
  const customAnimation = window.WebAnimations.fadeIn(element, {
    duration: 1000,
    easing: 'ease-in-out'
  });
}

// Example 2: SlideIn animation
function exampleSlideIn() {
  const element = document.querySelector('.my-element');
  const animation = window.WebAnimations.slideIn(element);
}

// Example 3: ScaleUp animation
function exampleScaleUp() {
  const element = document.querySelector('.my-element');
  const animation = window.WebAnimations.scaleUp(element);
}

// Example 4: Using animation presets
function examplePresets() {
  const element = document.querySelector('.my-element');

  // Available presets: fadeIn, slideIn, scaleUp, slideLeft, slideRight, zoomIn, rotateIn
  const animation = window.WebAnimations.animateWithPreset(element, 'rotateIn');
}

// Example 5: Chaining animations
function exampleChaining() {
  const element1 = document.querySelector('.element-1');
  const element2 = document.querySelector('.element-2');
  const element3 = document.querySelector('.element-3');

  window.WebAnimations.chainAnimations([
    { element: element1, preset: 'fadeIn' },
    { element: element2, preset: 'slideIn' },
    { element: element3, preset: 'scaleUp' }
  ]).then(() => {
    console.log('All animations completed!');
  });
}

// Example 6: Playback controls
function examplePlaybackControls() {
  const element = document.querySelector('.my-element');
  const animation = window.WebAnimations.fadeIn(element);

  // Get playback controls
  const controls = window.WebAnimations.getPlaybackControls(animation);

  // Use controls
  controls.play();
  controls.pause();
  controls.reverse();
  controls.cancel();
  controls.finish();
}

// Example 7: Stagger animation for multiple elements
function exampleStagger() {
  const cards = document.querySelectorAll('.card');

  // Animate each card with 100ms delay between them
  window.WebAnimations.staggerAnimation(cards, 'fadeIn', 100);
}

// Example 8: Using animation.finished promise
function examplePromise() {
  const element = document.querySelector('.my-element');
  const animation = window.WebAnimations.fadeIn(element);

  if (animation) {
    animation.finished.then(() => {
      // Do something after animation completes
      console.log('Animation finished!');

      // Chain another animation
      return window.WebAnimations.scaleUp(element);
    }).then(() => {
      console.log('Second animation finished!');
    });
  }
}

// Example 9: Check for Web Animations API support
function exampleSupportCheck() {
  if (window.WebAnimations.hasSupport) {
    console.log('Web Animations API is supported!');
    // Use Web Animations
  } else {
    console.log('Web Animations API not supported, using fallback');
    // Use CSS fallback
  }
}

// Example 10: Custom keyframes and options
function exampleCustomAnimation() {
  const element = document.querySelector('.my-element');

  // You can create custom animations by accessing the presets
  const customKeyframes = [
    { transform: 'translateX(-100%)', opacity: 0 },
    { transform: 'translateX(0)', opacity: 1 }
  ];

  const customOptions = {
    duration: 800,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    fill: 'forwards'
  };

  if (window.WebAnimations.hasSupport) {
    element.animate(customKeyframes, customOptions);
  }
}
