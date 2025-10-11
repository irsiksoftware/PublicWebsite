/**
 * Sticky Header Module
 * Adds visual state to header when page is scrolled
 *
 * @example
 * // Automatically adds 'scrolled' class to <header> when scrolled
 * // CSS can then style .header.scrolled differently
 */
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 0) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});
