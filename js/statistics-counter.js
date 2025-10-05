/**
 * Statistics Counter Animation
 * Animates numbers counting up when section scrolls into view
 */

(function() {
  'use strict';

  // Easing function: easeOutQuart for natural deceleration
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  // Format numbers with commas for readability
  function formatNumber(num) {
    // For millions, show M suffix
    if (num >= 1000000) {
      const millions = (num / 1000000).toFixed(1);
      return millions.endsWith('.0')
        ? millions.slice(0, -2) + 'M'
        : millions + 'M';
    }
    // For thousands, use comma separator
    return num.toLocaleString();
  }

  // Animate counter from 0 to target value
  function animateCounter(element, target, duration = 2000) {
    const startTime = performance.now();
    let animationFrameId;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.floor(easedProgress * target);

      element.textContent = formatNumber(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        // Ensure final value is exact
        element.textContent = formatNumber(target);
      }
    }

    animationFrameId = requestAnimationFrame(update);

    // Return cleanup function
    return () => cancelAnimationFrame(animationFrameId);
  }

  // Initialize statistics counters with IntersectionObserver
  function initStatisticsCounters() {
    const statisticsSection = document.querySelector('.statistics-counter');

    if (!statisticsSection) {
      return;
    }

    const counters = statisticsSection.querySelectorAll('.statistics-counter__number[data-target]');
    let hasAnimated = false;

    // Create IntersectionObserver to trigger animation when section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;

            // Animate all counters
            counters.forEach(counter => {
              const target = parseInt(counter.getAttribute('data-target'), 10);
              if (!isNaN(target)) {
                animateCounter(counter, target, 2000);
              }
            });

            // Unobserve after animation starts (only animate once)
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of section is visible
        rootMargin: '0px'
      }
    );

    observer.observe(statisticsSection);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStatisticsCounters);
  } else {
    initStatisticsCounters();
  }
})();
