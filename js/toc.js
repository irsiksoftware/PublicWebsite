// Table of Contents with Progress Indicator and Active Section Highlighting
(function() {
  const progressBar = document.getElementById('readProgress');
  const tocNav = document.getElementById('tocNav');

  if (!progressBar || !tocNav) return;

  // Get all TOC links and their corresponding sections
  const tocLinks = Array.from(tocNav.querySelectorAll('.toc__link'));
  const sections = tocLinks.map(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      return document.querySelector(href);
    }
    return null;
  }).filter(section => section !== null);

  // Update vertical progress indicator
  function updateProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.pageYOffset;
    const progress = (scrolled / documentHeight) * 100;

    progressBar.style.height = progress + '%';
  }

  // Throttle scroll events for performance
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial call
  updateProgress();

  // IntersectionObserver for active section highlighting
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px', // Trigger when section is in the top 30% of viewport
    threshold: 0
  };

  let activeSection = null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Find the corresponding TOC link
        const id = entry.target.getAttribute('id');
        const activeLink = tocNav.querySelector(`.toc__link[href="#${id}"]`);

        if (activeLink && entry.target !== activeSection) {
          // Remove active class from all links
          tocLinks.forEach(link => link.classList.remove('toc__link--active'));

          // Add active class to current link
          activeLink.classList.add('toc__link--active');
          activeSection = entry.target;
        }
      }
    });
  }, observerOptions);

  // Observe all sections
  sections.forEach(section => {
    observer.observe(section);
  });
})();
