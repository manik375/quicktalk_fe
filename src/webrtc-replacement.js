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
      // Create a configuration that prioritizes TURN relay for faster connections
      const configuration = {
        iceServers: this._iceServers,
        iceTransportPolicy: 'all', // Try all connection methods
        iceCandidatePoolSize: 10, // Increase candidate gathering
        bundlePolicy: 'max-bundle', // Bundle media to reduce connection setup time
        rtcpMuxPolicy: 'require', // Multiplex RTCP to reduce ports needed
        sdpSemantics: 'unified-plan' // Use modern SDP format
      };
      
      console.log('Initializing RTCPeerConnection with config:', JSON.stringify(configuration));
      
      this.pc = new RTCPeerConnection(configuration);
      
      // Set bandwidth limits to help on lower bandwidth connections
      this._setMediaBitrates = (sdp) => {
        // Set reasonable bitrates for audio and video
        // These values are a good compromise for most connections
        return this._setBitrate(
          this._setBitrate(sdp, 'video', 1000), // ~1mbps for video
          'audio', 64 // 64kbps for audio
        );
      };
      
      // Add local stream if provided
      if (this.stream) {
        console.log('Adding local stream tracks to peer connection');
        this.stream.getTracks().forEach(track => {
          const sender = this.pc.addTrack(track, this.stream);
          console.log(`Added ${track.kind} track to peer connection`);
        });
      }
      
      // Handle ICE candidates
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Log candidate for debugging
          const candidateString = event.candidate.candidate || '';
          const candidateType = candidateString.split(' ')[7] || 'unknown';
          console.log(`ICE candidate generated: ${candidateType}`);
          
          this._emit('signal', {
            type: 'candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Handle ICE gathering state changes
      this.pc.onicegatheringstatechange = () => {
        console.log(`ICE gathering state: ${this.pc.iceGatheringState}`);
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
        
        if (this.pc.iceConnectionState === 'failed') {
          console.warn('ICE connection failed, attempting recovery...');
          
          // Try to recover by restarting ICE
          if (this.initiator) {
            console.log('Initiator trying to restart ICE...');
            this._createOffer({ iceRestart: true })
              .catch(err => {
                console.error('Failed to restart ICE:', err);
                this._onError('ICE restart failed: ' + err.message);
              });
          }
        }
        
        if (this.pc.iceConnectionState === 'disconnected') {
          console.warn('ICE connection disconnected, waiting for recovery');
          
          // Set up a timeout to declare the connection failed if it doesn't recover
          setTimeout(() => {
            if (this.pc && this.pc.iceConnectionState === 'disconnected') {
              console.error('ICE connection still disconnected after timeout');
              this._onError('Connection timed out');
            }
          }, 10000); // 10 second timeout
        }
        
        if (this.pc.iceConnectionState === 'closed') {
          this._onError('ICE connection closed');
        }
      };
      
      // Also monitor connection state
      this.pc.onconnectionstatechange = () => {
        console.log(`Connection state changed: ${this.pc.connectionState}`);
        
        if (this.pc.connectionState === 'failed') {
          this._onError('Connection failed');
        }
      };
      
      // Monitor signaling state
      this.pc.onsignalingstatechange = () => {
        console.log(`Signaling state changed: ${this.pc.signalingState}`);
      };
    } catch (err) {
      this._onError('Failed to create RTCPeerConnection: ' + err.message);
    }
  }
  
  // Set bitrate for media in SDP
  _setBitrate(sdp, media, bitrate) {
    if (!sdp) return sdp;
    
    const lines = sdp.split('\n');
    let line = -1;
    
    // Find the media section
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('m=' + media)) {
        line = i;
        break;
      }
    }
    
    if (line === -1) return sdp;
    
    // Find the next m= line (to mark the end of this media section)
    let nextMediaLine = -1;
    for (let i = line + 1; i < lines.length; i++) {
      if (lines[i].startsWith('m=')) {
        nextMediaLine = i;
        break;
      }
    }
    
    // If we didn't find another m= line, we're modifying the last media section
    if (nextMediaLine === -1) nextMediaLine = lines.length;
    
    // Modify the current media section
    let mediaSection = lines.slice(line, nextMediaLine);
    
    // Check if there's already a b=AS line
    let found = false;
    for (let i = 0; i < mediaSection.length; i++) {
      if (mediaSection[i].startsWith('b=AS:')) {
        mediaSection[i] = 'b=AS:' + bitrate;
        found = true;
        break;
      }
    }
    
    // If no b=AS line, add one
    if (!found) {
      mediaSection.splice(1, 0, 'b=AS:' + bitrate);
    }
    
    // Rebuild the SDP
    return [...lines.slice(0, line), ...mediaSection, ...lines.slice(nextMediaLine)].join('\n');
  }
  
  // Create and send an offer if we're the initiator
  async _createOffer(options = {}) {
    try {
      const offer = await this.pc.createOffer(options);
      
      // Log media sections in SDP
      console.log('Local offer SDP sections:', this._countMediaSections(offer.sdp));
      
      // Apply bandwidth limits
      const modifiedSdp = this._setMediaBitrates(offer.sdp);
      const modifiedOffer = new RTCSessionDescription({
        type: 'offer',
        sdp: modifiedSdp
      });
      
      await this.pc.setLocalDescription(modifiedOffer);
      console.log('Created and set local offer with bandwidth limits');
      
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
        
        // Apply bandwidth limits
        const modifiedSdp = this._setMediaBitrates(answer.sdp);
        const modifiedAnswer = new RTCSessionDescription({
          type: 'answer',
          sdp: modifiedSdp
        });
        
        await this.pc.setLocalDescription(modifiedAnswer);
        console.log('Local description set successfully with bandwidth limits');
        
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
