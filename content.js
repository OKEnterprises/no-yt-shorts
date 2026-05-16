// No YouTube Shorts - Content Script
// Removes Shorts from navigation, channels, subscriptions, and sidebar

(function() {
  'use strict';

  // Selectors for Shorts elements across YouTube
  const SHORTS_SELECTORS = [
    // 1. Shorts tab in main navigation (left sidebar)
    'ytd-guide-entry-renderer a[title="Shorts"]',
    'ytd-mini-guide-entry-renderer a[title="Shorts"]',

    // Shorts section in navigation
    'ytd-guide-section-renderer:has(a[title="Shorts"])',

    // 2. Shorts shelves in subscription/home feed — target shelves directly, NOT parent sections
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-rich-shelf-renderer:has([overlay-style="SHORTS"])',

    // 3. Shorts in recommended sidebar (watch page)
    'ytd-compact-video-renderer:has(a[href*="/shorts/"])',
    'ytd-reel-item-renderer',

    // General Shorts links and sections
    'a[href="/shorts"]',
    'ytd-guide-entry-renderer:has(a[href="/shorts"])',
    'ytd-mini-guide-entry-renderer:has(a[href="/shorts"])'
  ];

  // Function to remove Shorts elements
  function removeShortsElements() {
    SHORTS_SELECTORS.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(element => {
          // Find the appropriate parent to remove
          const parent = findRemovableParent(element, selector);
          if (parent && parent.parentNode) {
            parent.remove();
          }
        });
      } catch (e) {
        // Selector might not be supported, ignore
      }
    });

    // Additional cleanup for Shorts in sidebar
    removeShortsFromSidebar();

    // Remove Shorts tab from channel page tabs
    removeChannelShortsTab();
  }

  // Find the appropriate parent element to remove
  function findRemovableParent(element, selector) {
    // For navigation items, remove the whole entry
    if (selector.includes('guide-entry') || selector.includes('mini-guide')) {
      return element.closest('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer');
    }

    // For shelf renderers, remove the shelf itself — NOT the parent section
    if (selector.includes('shelf')) {
      return element.closest('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer');
    }

    // For compact videos (sidebar), remove the video entry
    if (selector.includes('compact-video')) {
      return element.closest('ytd-compact-video-renderer');
    }

    return element;
  }

  // Remove Shorts videos from the recommended sidebar
  function removeShortsFromSidebar() {
    // Check all compact video renderers for Shorts links
    document.querySelectorAll('ytd-compact-video-renderer').forEach(video => {
      const link = video.querySelector('a#thumbnail');
      if (link && link.href && link.href.includes('/shorts/')) {
        video.remove();
      }
    });

    // Also check for any reel items in sidebar
    document.querySelectorAll('ytd-reel-item-renderer').forEach(el => el.remove());
  }

  // Hide Shorts tab from channel pages (use display:none to preserve tab indices)
  function removeChannelShortsTab() {
    // Method 1: yt-tab-shape elements
    document.querySelectorAll('yt-tab-shape').forEach(tab => {
      const tabTitle = tab.getAttribute('tab-title');
      if (tabTitle === 'Shorts') {
        tab.style.display = 'none';
      }
    });

    // Method 2: tp-yt-paper-tab elements
    document.querySelectorAll('tp-yt-paper-tab').forEach(tab => {
      const text = tab.textContent.trim();
      if (text === 'Shorts') {
        tab.style.display = 'none';
      }
    });
  }

  // Handle Shorts URL redirect on the client side (backup for background script)
  function checkAndRedirectShorts() {
    const url = window.location.href;
    if (url.includes('/shorts/')) {
      const videoId = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (videoId && videoId[1]) {
        const newUrl = `https://www.youtube.com/watch?v=${videoId[1]}`;
        window.location.replace(newUrl);
      }
    }
  }

  // Initial check for Shorts URL
  checkAndRedirectShorts();

  // Run removal on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeShortsElements);
  } else {
    removeShortsElements();
  }

  // Create a MutationObserver to handle dynamically loaded content
  const observer = new MutationObserver((mutations) => {
    let shouldRemove = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldRemove = true;
        break;
      }
    }

    if (shouldRemove) {
      // Debounce the removal to avoid excessive calls
      clearTimeout(window.shortsRemovalTimeout);
      window.shortsRemovalTimeout = setTimeout(removeShortsElements, 100);
    }
  });

  // Start observing once the body exists
  function startObserving() {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      removeShortsElements();
    } else {
      requestAnimationFrame(startObserving);
    }
  }

  startObserving();

  // Also run on popstate for SPA navigation
  window.addEventListener('yt-navigate-finish', () => {
    checkAndRedirectShorts();
    removeShortsElements();
  });

  // Backup listener for URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      checkAndRedirectShorts();
      setTimeout(removeShortsElements, 100);
    }
  }).observe(document, { subtree: true, childList: true });

})();
