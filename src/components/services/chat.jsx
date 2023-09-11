import { io } from 'socket.io-client';
import { HttpCodes } from '../config/vars';
import { Meeting } from '../models/meeting';

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

  cleanConnections() {
    this.videoConnections.forEach(x => {
      if(x)
        x.close();
    });
    this.videoConnections.length = 0;
    this.videoConnections = [];
  }

}

export const streamService = new StreamService();

export const chatService = new ChatService();
