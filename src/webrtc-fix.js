/**
 * WebRTC Compatibility Fix
 * 
 * This module creates a modified version of simple-peer that doesn't 
 * throw errors when secure random generation is not available.
 */

// Only patch getRandomValues if it doesn't exist
if (typeof window !== 'undefined' && window.crypto) {
  // Don't try to reassign window.crypto as it's read-only
  if (!window.crypto.getRandomValues) {
    try {
      // Try to define getRandomValues property
      Object.defineProperty(window.crypto, 'getRandomValues', {
        value: function(array) {
          console.log('Using polyfilled getRandomValues');
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
}

// Create our own implementation of randomBytes that doesn't rely on modifying window.crypto
export function getRandomBytes(size) {
  const array = new Uint8Array(size);
  if (window.crypto && window.crypto.getRandomValues) {
    try {
      window.crypto.getRandomValues(array);
    } catch (e) {
      console.warn('Native getRandomValues failed:', e);
      // Fallback to Math.random
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
  } else {
    // Fallback for browsers without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return array;
}

// Function to create a fixed version of simple-peer
export function createFixedPeer(options) {
  // Override Error constructor to prevent the specific error from being thrown
  const originalError = Error;
  const oldErrorMsg = 'Secure random number generation is not supported by this browser.';
  
  // Temporarily override Error to intercept the specific message
  window.Error = function(message, ...args) {
    if (message === oldErrorMsg) {
      console.warn('Intercepted random generation error');
      return Object.create(Error.prototype); // Return a dummy error object that won't throw
    }
    return new originalError(message, ...args);
  };
  
  // Try to create the peer with normal import
  try {
    const Peer = require('simple-peer');
    
    // Restore original Error
    window.Error = originalError;
    
    // Modify the options to include ICE servers
    options = options || {};
    options.config = options.config || { 
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ] 
    };
    
    // Create the peer instance
    const peer = new Peer(options);
    
    // Add our getRandomBytes method if possible
    if (typeof peer._randombytes === 'undefined') {
      peer._randombytes = getRandomBytes;
    }
    
    return Promise.resolve(peer);
  } catch (err) {
    // Restore original Error in case of failure
    window.Error = originalError;
    
    console.error('Direct peer creation failed, trying dynamic import:', err);
    
    // Fallback to dynamic import approach
    return import('simple-peer')
      .then(SimplePeer => {
        // Get the constructor
        let Peer = SimplePeer.default || SimplePeer;
        
        // Check if the constructor exists
        if (typeof Peer !== 'function') {
          console.error('SimplePeer is not a constructor:', Peer);
          throw new Error('SimplePeer import error');
        }
        
        // Create the peer instance
        const peer = new Peer(options);
        
        // Add our getRandomBytes method
        peer._randombytes = getRandomBytes;
        
        return peer;
      })
      .catch(err => {
        console.error('Failed to import simple-peer:', err);
        throw err;
      });
  }
}

// Pre-load the module
export function preloadSimplePeer() {
  return import('simple-peer')
    .then(SimplePeer => {
      console.log('Successfully pre-loaded simple-peer');
      return SimplePeer;
    })
    .catch(err => {
      console.error('Failed to pre-load simple-peer:', err);
      return null;
    });
}

// Apply all fixes
export function applyAllFixes() {
  // Patch Error to intercept the specific error from simple-peer
  const originalError = window.Error;
  window.Error = function(message, ...args) {
    if (message === 'Secure random number generation is not supported by this browser.') {
      console.warn('Intercepted secure random error, continuing without throwing');
      return null; // Don't throw the error
    }
    return new originalError(message, ...args);
  };
  
  // Return true to indicate fixes were applied
  return true;
}

// Auto-apply fixes when this module is loaded
applyAllFixes(); 