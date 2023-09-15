import { io } from 'socket.io-client';
import { CustomCodes, HttpCodes, StorageKeys } from '../config/vars';
import { Meeting } from '../models/meeting';
import { storage } from '../helpers/utility';
import { User } from '../models/user';

class ChatService {
  /**
   * Get meeting information
   * @param {string} meetingId Meeting ID
   * @returns {Promise<Meeting>} meeting Meeting information
   */
  async getMeeting(meetingId) {
    try {
      const response = await fetch(`/api/chat/meeting/${meetingId}`);
      if(response.status === HttpCodes.OK) {
        /** @type {{ meeting: Meeting }} */
        const json = await response.json();
        return json.meeting;
      }
    }
    catch(error) {}
    return null;
  }

  async createMeeting(maxUsers = 10) {
    try {
      const response = await fetch(`/api/chat/meeting`, { method: 'POST', body: JSON.stringify({ max_users: maxUsers }) });
      if(response.ok) {
        /** @type {{ meeting: Meeting }} */
        const json = await response.json();
        return json.meeting;
      }
    }
    catch(error) {}
    return null;
  }

  /**
   * Update meeting information
   * @param {Meeting} meeting Meeting information
   */
  async updateMeeting(meeting) {
    try {
      const response = await fetch(`/api/chat/meeting/${meeting.id}`, { method: 'PUT', body: JSON.stringify(meeting), headers: {
        'Content-Type': 'application/json'
      } });
      if(response.ok) {
        /** @type {{ meeting: Meeting }} */
        const json = await response.json();
        return json.meeting;
      }
    }
    catch(error) {
      console.warn(error.message);
    }
    return null;
  }

  /**
   * Get user information
   * @returns {User} Returns user
   */
  getUser () {
    const storedUser = storage.get(StorageKeys.User, null, 'json');
    return storedUser;
  }
  /**
   * Store user information
   * @param {User} data User data
   */
  storeUser (data) {
    storage.save(StorageKeys.User, data, 'json');
  }
}

export const MediaStatus = {
  IDLE: 0,
  PUBLISHING: 1,
  RECEIVING: 2,
}

class StreamService {
  /** @type {import('socket.io-client').Socket} */
  socket;

  /** @type {import('peerjs').Peer} */
  audioPeer = null;
  /** @type {import('peerjs').Peer} */
  videoPeer = null;
  /** @type {Array<import('peerjs').MediaConnection>} */
  videoConnections = [];

  /** @type {MediaStream} */
  remoteVideoStream = null;
  /** @type {MediaStream} */
  localVideoStream = null;
  /** @type {MediaStream} */
  remoteAudioStream = null;

  /** @type {boolean} */
  videoStatus = MediaStatus.IDLE;
  /** @type {boolean} */
  isMuted = true;
  /** @type {string} */
  emoji = '';

  constructor() {
    this.socket = io({ autoConnect: false, path: '/api/messaging' });
    this.videoConnections = [];
  }

  getWebSocket() {
    return this.socket;
  }

  connectWebSocket() {
    this.socket.connect();
  }

  /**
   * Publish video stream
   * @param {MediaStream} stream Stream
   */
  publishVideoStream(stream) {
    this.videoStatus = MediaStatus.PUBLISHING;
    this.localVideoStream = stream;
  }

  receiveVideoStream(stream) {
    this.videoStatus = MediaStatus.RECEIVING;
    this.remoteVideoStream = stream;
  }

  mute() {
    this.isMuted = true;
  }

  unmute() {
    this.isMuted = false;
  }

  setEmoji(emoji) {
    this.emoji = emoji;
  }

  /**
   * Video call
   * @param {string} peerId Peer ID
   * @param {MediaStream} stream Stream
   * @param {} data Metadata
   */
  videoCall(peerId, stream, data = {}) {
    if(this.videoPeer) {
      const newConnection = this.videoPeer.call(peerId, stream, { metadata: data });
      this.videoConnections.push(newConnection);
    }
  }

  /**
   * Setup Peers
   * @param {string} audioPeerId 
   * @param {string} videoPeerId 
   * @returns {Promise<{}>} Returns Promise with nothing :)
   */
  setupPeers(audioPeerId, videoPeerId) {
    return new Promise((resolve, reject) => {
      if(this.audioPeer === null && this.videoPeer === null) {
        try {
          import('peerjs').then(imported => {
            const Peer = imported.default;
            const peerOptions = {
              host: window.location.host, path: '/live/audio',
              config: { iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
              ] }
            };
            this.audioPeer = new Peer(audioPeerId, peerOptions);
            this.videoPeer = new Peer(videoPeerId, peerOptions);
            resolve(CustomCodes.PEERS_READY);
          });
        }
        catch(error) {
          reject(CustomCodes.PEERS_ERROR);
        }
      }
      else {
        reject(CustomCodes.PEERS_INITIALIZED);
      }
    });
  }

  cleanConnections() {
    this.videoConnections.forEach(x => {
      if(x)
        x.close();
    });
    this.videoConnections.length = 0;
    this.videoConnections = [];
  }

  reset() {
    if(this.videoPeer) {
      this.videoPeer.disconnect();
      // this.videoPeer.destroy();
      // this.videoPeer = null;
    }

    if(this.audioPeer) {
      this.audioPeer.disconnect();
      // this.audioPeer.destroy();
      // this.audioPeer = null;
    }
    this.cleanConnections();
  }

}

export const streamService = new StreamService();

export const chatService = new ChatService();
