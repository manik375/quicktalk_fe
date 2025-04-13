/**
 * Direct WebRTC Peer Replacement
 * 
 * This is a simplified alternative to simple-peer that doesn't have
 * the secure random number generation requirement.
 */

// Create a safe random bytes implementation
function safeRandomBytes(size) {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

// SimplifiedPeer class - basic WebRTC functionality without the complex dependencies
export class SimplifiedPeer {
  constructor(options = {}) {
    this.options = options;
    this.initiator = options.initiator || false;
    this.stream = options.stream || null;
    this.destroyed = false;
    this.connected = false;
    this._events = {};
    this._iceServers = (options.config && options.config.iceServers) || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];
    
    // Initialize RTCPeerConnection
    this._init();
    
    // If we're the initiator, create and send offer
    if (this.initiator) {
      this._createOffer();
    }
  }
  
  // Initialize the RTCPeerConnection
  _init() {
    try {
      this.pc = new RTCPeerConnection({
        iceServers: this._iceServers
      });
      
      // Add local stream if provided
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          this.pc.addTrack(track, this.stream);
        });
      }
      
      // Handle ICE candidates
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this._emit('signal', {
            type: 'candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Handle remote stream
      this.pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this._emit('stream', event.streams[0]);
        }
      };
      
      // Handle connection state changes
      this.pc.oniceconnectionstatechange = () => {
        if (this.pc.iceConnectionState === 'connected' || 
            this.pc.iceConnectionState === 'completed') {
          if (!this.connected) {
            this.connected = true;
            this._emit('connect');
          }
        }
        
        if (this.pc.iceConnectionState === 'failed' ||
            this.pc.iceConnectionState === 'disconnected' ||
            this.pc.iceConnectionState === 'closed') {
          this._onError('ICE connection failed or closed');
        }
      };
    } catch (err) {
      this._onError('Failed to create RTCPeerConnection: ' + err.message);
    }
  }
  
  // Create and send an offer if we're the initiator
  async _createOffer() {
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this._emit('signal', {
        type: 'offer',
        sdp: this.pc.localDescription
      });
    } catch (err) {
      this._onError('Failed to create offer: ' + err.message);
    }
  }
  
  // Handle incoming signals from the other peer
  async signal(data) {
    if (this.destroyed) return;
    
    try {
      if (data.type === 'offer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this._emit('signal', {
          type: 'answer',
          sdp: this.pc.localDescription
        });
      } else if (data.type === 'answer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data.type === 'candidate') {
        await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (err) {
      this._onError('Error handling signal: ' + err.message);
    }
  }
  
  // Register event handlers
  on(event, callback) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
    return this;
  }
  
  // Emit events to registered handlers
  _emit(event, ...args) {
    const callbacks = this._events[event] || [];
    callbacks.forEach(callback => callback(...args));
  }
  
  // Handle errors by emitting them
  _onError(err) {
    const error = typeof err === 'string' ? new Error(err) : err;
    this._emit('error', error);
  }
  
  // Clean up and destroy the peer connection
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    
    // Close the peer connection
    if (this.pc) {
      try {
        this.pc.close();
      } catch (err) {
        // Ignore
      }
      this.pc = null;
    }
    
    // Emit close event
    this._emit('close');
    
    // Clear all event listeners
    this._events = {};
  }
}

// Factory function to create a SimplifiedPeer
export function createPeer(options) {
  try {
    return new SimplifiedPeer(options);
  } catch (err) {
    console.error('Error creating SimplifiedPeer:', err);
    throw err;
  }
} 