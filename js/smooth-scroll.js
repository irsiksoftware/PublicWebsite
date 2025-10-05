/**
 * Smooth Scroll with Offset for Sticky Header
 * Handles smooth scrolling for navigation links with header offset compensation
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    headerSelector: '.header',
    linkSelector: '.header__link',
    scrollBehavior: 'smooth',
    scrollOffset: 20, // Additional offset beyond header height
    debounceDelay: 100, // Milliseconds
    activeClass: 'header__link--active'
  };

  // State
  let headerHeight = 0;
  let sections = [];
  let links = [];

  /**
   * Debounce function to limit scroll event frequency
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Calculate header height dynamically
   */
  function updateHeaderHeight() {
    const header = document.querySelector(CONFIG.headerSelector);
    headerHeight = header ? header.offsetHeight : 0;
  }

  /**
   * Get target element from hash
   */
  function getTargetElement(hash) {
    if (!hash || hash === '#') return null;

    try {
      return document.querySelector(hash);
    } catch (e) {
      console.warn('Invalid selector:', hash);
      return null;
    }
  }

  /**
   * Smooth scroll to target with offset
   */
  function scrollToTarget(targetElement) {
    if (!targetElement) return;

    updateHeaderHeight();
    const targetPosition = targetElement.offsetTop - headerHeight - CONFIG.scrollOffset;

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: CONFIG.scrollBehavior
    });
  }

  /**
   * Update URL hash without jumping
   */
  function updateHash(hash) {
    if (history.pushState) {
      history.pushState(null, null, hash);
    } else {
      window.location.hash = hash;
    }
  }

  /**
   * Handle navigation link click
   */
  function handleLinkClick(event) {
    const link = event.currentTarget;
    const hash = link.getAttribute('href');

    // Only handle anchor links
    if (!hash || !hash.startsWith('#')) return;

    const targetElement = getTargetElement(hash);
    if (!targetElement) return;

    // Prevent default jump
    event.preventDefault();

    // Scroll to target
    scrollToTarget(targetElement);

    // Update URL hash without jumping
    updateHash(hash);

    // Update active state
    setActiveLink(link);
  }

  /**
   * Set active link
   */
  function setActiveLink(activeLink) {
    links.forEach(link => {
      link.classList.remove(CONFIG.activeClass);
    });

    if (activeLink) {
      activeLink.classList.add(CONFIG.activeClass);
    }
  }

  /**
   * Find which section is currently in view
   */
  function getCurrentSection() {
    const scrollPosition = window.scrollY + headerHeight + CONFIG.scrollOffset + 50;

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section.offsetTop <= scrollPosition) {
        return section;
      }
    }

    return null;
  }

  /**
   * Update active link based on scroll position
   */
  function updateActiveLinkOnScroll() {
    const currentSection = getCurrentSection();

    if (!currentSection || !currentSection.id) return;

    const activeLink = document.querySelector(
      `${CONFIG.linkSelector}[href="#${currentSection.id}"]`
    );

    if (activeLink) {
      setActiveLink(activeLink);
    }
  }

  /**
   * Gather all sections that have IDs and corresponding nav links
   */
  function gatherSections() {
    sections = [];
    links.forEach(link => {
      const hash = link.getAttribute('href');
      if (hash && hash.startsWith('#')) {
        const section = getTargetElement(hash);
        if (section && !sections.includes(section)) {
          sections.push(section);
        }
      }
    });
  }

  /**
   * Initialize smooth scroll
   */
  function init() {
    // Get all navigation links
    links = Array.from(document.querySelectorAll(CONFIG.linkSelector));

    if (links.length === 0) {
      console.warn('No navigation links found');
      return;
    }

    // Update header height
    updateHeaderHeight();

    // Gather sections
    gatherSections();

    // Add click event listeners to links
    links.forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });

    // Add debounced scroll event listener for active link highlighting
    const debouncedScrollHandler = debounce(updateActiveLinkOnScroll, CONFIG.debounceDelay);
    window.addEventListener('scroll', debouncedScrollHandler);

    // Update header height on resize
    window.addEventListener('resize', debounce(updateHeaderHeight, CONFIG.debounceDelay));

    // Handle initial hash on page load
    if (window.location.hash) {
      const targetElement = getTargetElement(window.location.hash);
      if (targetElement) {
        // Wait for page to load before scrolling
        setTimeout(() => {
          scrollToTarget(targetElement);
        }, 100);
      }
    }

    // Set initial active link
    updateActiveLinkOnScroll();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
