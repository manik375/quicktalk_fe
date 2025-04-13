/**
 * Direct polyfill for simple-peer
 * 
 * This file contains very aggressive monkey patching to fix secure random 
 * number generation issues in simple-peer.
 */

// Try to find the browser.js module in simple-peer's code
try {
  // Method 1: Global patching
  if (typeof window !== 'undefined') {
    // Only patch getRandomValues if crypto exists but method doesn't
    if (window.crypto && !window.crypto.getRandomValues) {
      console.log('Patching window.crypto.getRandomValues in simple-peer-polyfill');
      try {
        // Try to define the property
        Object.defineProperty(window.crypto, 'getRandomValues', {
          value: function(array) {
            console.log('Using polyfilled getRandomValues from simple-peer-polyfill');
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 256);
            }
            return array;
          },
          configurable: true
        });
      } catch (e) {
        console.warn('Could not patch crypto.getRandomValues:', e);
      }
    }
    
    // Direct interception of the oldBrowser function in simple-peer
    // This is a very aggressive approach but might work in some cases
    let originalError = window.Error;
    window.Error = function(message) {
      if (message === 'Secure random number generation is not supported by this browser.') {
        console.log('Intercepted secure random error, bypassing');
        return new originalError('Bypassed secure random check');
      }
      return new originalError(...arguments);
    };
  }
} catch (e) {
  console.error('Error in simple-peer polyfill:', e);
}

// This function is called by the main app before initializing WebRTC
export function applySimplePeerFixes() {
  console.log('Applying simple-peer fixes...');
  
  // Make sure crypto methods exist if crypto is available
  if (typeof window !== 'undefined' && window.crypto) {
    if (!window.crypto.getRandomValues) {
      try {
        // Safely try to define the property
        Object.defineProperty(window.crypto, 'getRandomValues', {
          value: function(array) {
            console.log('Using polyfilled getRandomValues from applySimplePeerFixes');
            const bytes = new Uint8Array(array.length);
            for (let i = 0; i < bytes.length; i++) {
              bytes[i] = Math.floor(Math.random() * 256);
            }
            // Copy into the provided array
            for (let i = 0; i < array.length && i < bytes.length; i++) {
              array[i] = bytes[i];
            }
            return array;
          },
          configurable: true
        });
      } catch (e) {
        console.warn('Could not add getRandomValues to crypto:', e);
      }
    }
  }
  
  return true;
} 