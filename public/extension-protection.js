// Protection against Chrome extension interference
(function() {
  'use strict';
  
  // Prevent extensions from interfering with WeakRef operations
  if (typeof WeakRef !== 'undefined') {
    const originalWeakRef = WeakRef;
    window.WeakRef = function(target) {
      try {
        return new originalWeakRef(target);
      } catch (e) {
        // Fallback for when extensions break WeakRef
        return {
          deref: function() {
            try {
              return target;
            } catch (e) {
              return null;
            }
          }
        };
      }
    };
  }
  
  // Protect MutationObserver from extension interference
  if (typeof MutationObserver !== 'undefined') {
    const originalObserver = MutationObserver;
    window.MutationObserver = function(callback) {
      const wrappedCallback = function(mutations, observer) {
        try {
          return callback.call(this, mutations, observer);
        } catch (e) {
          // Silently handle extension errors
          console.warn('Extension interference detected and handled:', e.message);
          return;
        }
      };
      return new originalObserver(wrappedCallback);
    };
  }
  
  // Add error handling for content script interference
  window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('content_script.js')) {
      // Prevent extension errors from bubbling up
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
  }, true);
  
  console.log('Extension protection loaded');
})();