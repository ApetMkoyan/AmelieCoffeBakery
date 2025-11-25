/**
 * Utility functions for smooth scrolling
 */

/**
 * Smoothly scrolls to an element with custom easing
 * @param {HTMLElement} element - Target element to scroll to
 * @param {number} offset - Additional offset from top (default: 140)
 * @param {number} duration - Animation duration in ms (default: 800)
 */
export function smoothScrollToElement(element, offset = 140, duration = 800) {
  if (!element) return;

  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  const scrollTarget = absoluteElementTop - offset;
  const startPosition = window.pageYOffset;
  const distance = scrollTarget - startPosition;
  let start = null;

  function animate(currentTime) {
    if (start === null) start = currentTime;
    const timeElapsed = currentTime - start;
    const progress = Math.min(timeElapsed / duration, 1);

    // Ease-in-out-cubic
    const ease =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Scrolls to an element by ID
 * @param {string} elementId - ID of the target element
 * @param {number} offset - Additional offset from top
 */
export function scrollToElementById(elementId, offset = 140) {
  const element = document.getElementById(elementId);
  if (element) {
    smoothScrollToElement(element, offset);
  }
}

