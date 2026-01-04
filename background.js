// No YouTube Shorts - Background Script
// Redirects Shorts URLs to regular video player

(function() {
  'use strict';

  // Pattern to match YouTube Shorts URLs
  const SHORTS_PATTERN = /^https?:\/\/(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/;

  // Intercept requests to Shorts URLs and redirect to regular watch page
  browser.webRequest.onBeforeRequest.addListener(
    function(details) {
      const match = details.url.match(SHORTS_PATTERN);

      if (match && match[2]) {
        const videoId = match[2];
        const redirectUrl = `https://www.youtube.com/watch?v=${videoId}`;

        console.log(`[No YT Shorts] Redirecting ${details.url} to ${redirectUrl}`);

        return { redirectUrl: redirectUrl };
      }

      return {};
    },
    {
      urls: [
        "*://*.youtube.com/shorts/*",
        "*://youtube.com/shorts/*"
      ],
      types: ["main_frame"]
    },
    ["blocking"]
  );

  console.log('[No YT Shorts] Background script loaded - Shorts redirect active');
})();
