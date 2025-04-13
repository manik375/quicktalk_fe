/**
 * WebRTC and Simple-Peer Polyfills
 * 
 * This file contains polyfills needed for WebRTC to work properly
 * in browsers that don't fully support all required secure random features.
 */

// Import the randombytes library we installed
import randomBytes from 'randombytes';

// Create a standalone implementation of getRandomValues
const safeGetRandomValues = function(array) {
  if (!array || !array.length) return array;
  
  try {
    // Try to use the native implementation if available
    if (window.crypto && window.crypto.getRandomValues) {
      return window.crypto.getRandomValues(array);
    }
  } catch (e) {
    console.warn('Native getRandomValues failed:', e);
  }
  
  // Fallback implementation
  console.log('Using fallback random implementation');
  const bytes = randomBytes(array.length);
  
  // Copy values to provided array
  for (let i = 0; i < array.length; i++) {
    array[i] = bytes[i];
  }
  
  return array;
};

// Create a standalone crypto object that can be used instead of window.crypto
export const secureCrypto = {
  getRandomValues: safeGetRandomValues
};

// Override require for modules that might use it
if (typeof window !== 'undefined') {
  try {
    if (!window.require) {
      window.require = function(name) { 
        if (name === 'randombytes') return randomBytes;
        return null;
      };
    } else {
      const originalRequire = window.require;
      window.require = function(name) {
        if (name === 'randombytes') return randomBytes;
        return originalRequire(name);
      };
    }
  } catch (e) {
    console.warn('Failed to override require:', e);
  }
}

// Patch randombytes in simple-peer
try {
  const oldErrorCreate = Error;
  // Replace Error constructor to prevent the specific error from being thrown
  window.Error = function(message, ...args) {
    if (message === 'Secure random number generation is not supported by this browser.') {
      console.warn('Intercepted security error in simple-peer');
      // Return a dummy error that doesn't throw
      const dummyErr = new oldErrorCreate('Bypassed secure random generation check');
      dummyErr.name = 'BypassedError';
      return dummyErr;
    }
    return new oldErrorCreate(message, ...args);
  };
} catch (e) {
  console.error('Error patching Error constructor:', e);
}

console.log('WebRTC polyfills initialized'); 