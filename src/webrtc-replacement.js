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
    this._pendingCandidates = []; // Store candidates received before remote description
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
        console.log('Track received:', event.track.kind, event.track.readyState);
        if (event.streams && event.streams[0]) {
          // Create a new MediaStream if we don't have one yet
          let remoteStream = new MediaStream();
          
          // Add all tracks from the incoming stream to our remote stream
          event.streams[0].getTracks().forEach(track => {
            console.log(`Adding ${track.kind} track to remote stream`);
            remoteStream.addTrack(track);
          });
          
          this._emit('stream', remoteStream);
        }
      };
      
      // Handle connection state changes
      this.pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state changed: ${this.pc.iceConnectionState}`);
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
      
      // Also monitor connection state
      this.pc.onconnectionstatechange = () => {
        console.log(`Connection state changed: ${this.pc.connectionState}`);
      };
      
      // Monitor signaling state
      this.pc.onsignalingstatechange = () => {
        console.log(`Signaling state changed: ${this.pc.signalingState}`);
      };
    } catch (err) {
      this._onError('Failed to create RTCPeerConnection: ' + err.message);
    }
  }
  
  // Create and send an offer if we're the initiator
  async _createOffer() {
    try {
      const offer = await this.pc.createOffer();
      
      // Log media sections in SDP
      console.log('Local offer SDP sections:', this._countMediaSections(offer.sdp));
      
      await this.pc.setLocalDescription(offer);
      console.log('Created and set local offer');
      
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
        console.log('Received offer, setting remote description');
        
        // Log media sections in received SDP
        if (data.sdp && data.sdp.sdp) {
          console.log('Remote offer SDP sections:', this._countMediaSections(data.sdp.sdp));
        }
        
        await this.pc.setRemoteDescription(new RTCSessionDescription(data));
        console.log('Remote description set successfully');
        
        await this._applyPendingCandidates(); // Apply any stored candidates
        
        console.log('Creating answer');
        const answer = await this.pc.createAnswer();
        
        // Log media sections in answer SDP
        console.log('Local answer SDP sections:', this._countMediaSections(answer.sdp));
        
        await this.pc.setLocalDescription(answer);
        console.log('Local description set successfully');
        
        this._emit('signal', {
          type: 'answer',
          sdp: this.pc.localDescription
        });
      } else if (data.type === 'answer') {
        console.log('Received answer, setting remote description');
        
        // Log media sections in received SDP
        if (data.sdp && data.sdp.sdp) {
          console.log('Remote answer SDP sections:', this._countMediaSections(data.sdp.sdp));
        }
        
        await this.pc.setRemoteDescription(new RTCSessionDescription(data));
        console.log('Remote description set successfully');
        
        await this._applyPendingCandidates(); // Apply any stored candidates
      } else if (data.type === 'candidate') {
        // Only add ICE candidates if remote description is set
        if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
          try {
            console.log('Adding ICE candidate');
            await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn('Failed to add ICE candidate:', err);
          }
        } else {
          // Store ICE candidates if remote description not yet set
          console.log('Received ICE candidate before remote description, queueing...');
          if (!this._pendingCandidates) this._pendingCandidates = [];
          this._pendingCandidates.push(data.candidate);
        }
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
  
  // Add a method to apply pending candidates after remote description is set
  async _applyPendingCandidates() {
    if (this._pendingCandidates && this._pendingCandidates.length > 0) {
      console.log(`Applying ${this._pendingCandidates.length} pending ICE candidates`);
      const candidates = [...this._pendingCandidates];
      this._pendingCandidates = [];
      
      for (const candidate of candidates) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Failed to add stored ICE candidate:', err);
        }
      }
    }
  }
  
  // Helper method to count media sections in SDP
  _countMediaSections(sdp) {
    if (!sdp) return { audio: 0, video: 0 };
    
    const audioSections = (sdp.match(/m=audio/g) || []).length;
    const videoSections = (sdp.match(/m=video/g) || []).length;
    
    return { audio: audioSections, video: videoSections };
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
