import { io } from 'socket.io-client';
import { CustomCodes } from '../config/vars';
import { ChatAudio } from '../models/meeting';
import { MediaStatus } from './chat';

export class StreamService {
  /** @type {import('socket.io-client').Socket} */
  socket;

  /** @type {import('peerjs').Peer} */
  audioPeer = null;
  /** @type {import('peerjs').Peer} */
  videoPeer = null;
  /** @type {Array<import('peerjs').MediaConnection>} */
  videoConnections = [];
  /** @type {Array<import('peerjs').MediaConnection>} */
  audioConnections = [];

  /** @type {MediaStream} */
  remoteVideoStream = null;
  /** @type {MediaStream} */
  localVideoStream = null;
  /** @type {MediaStream} */
  localAudioStream = null;

  /** @type {Array<ChatAudio>} */
  audios = [];

  /** @type {number} */
  videoStatus = MediaStatus.IDLE;
  /** @type {number} */
  audioStatus = MediaStatus.IDLE;

  /** @type {boolean} */
  isMuted = true;
  /** @type {string} */
  emoji = '';

  constructor() {
    this.socket = io({ autoConnect: false, path: '/api/messaging' });
    this.videoConnections = [];
    this.audioConnections = [];
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

  /**
   * Get local audio
   * @param {string} userId User ID
   * @returns {ChatAudio} Returns audio element
   */
  getUserAudio(userId) {
    return this.audios.find(x => x.id === userId);
  }

  /**
   * Publish audio stream
   * @param {string} userId User ID
   * @param {MediaStream} stream Stream
   */
  publishAudioStream(userId, stream) {
    this.audioStatus = MediaStatus.PUBLISHING;
    this.localAudioStream = stream;
    this.getUserAudio(userId).createStream(this.localAudioStream);
  }

  /**
   * Publish audio stream
   * @param {string} userId User ID
   * @param {MediaStream} stream Stream
   */
  stopAudioStream(userId) {
    this.localAudioStream = null;
    // this.getUserAudio(userId).srcObject = null;
    this.audioStatus = MediaStatus.IDLE;
  }

  enableTracks(isScreenOnly) {
    if (this.audioStatus === MediaStatus.PUBLISHING) {
      const enabled = (this.isMuted === false && isScreenOnly);
      const tracks = this.localAudioStream.getTracks();
      tracks.forEach(track => {
        track.enabled = enabled;
      });
    }
    if (this.videoStatus === MediaStatus.PUBLISHING) {
      // const enabled = this.isMuted === false;
      const tracks = this.localVideoStream.getTracks();
      tracks.forEach(track => {
        track.enabled = true;
      });
    }
  }

  /**
   * Receive video stream
   * @param {MediaStream} stream Stream
   */
  receiveVideoStream(stream) {
    this.videoStatus = MediaStatus.RECEIVING;
    this.remoteVideoStream = stream;
  }

  receiveAudioStream(userId, stream) {
    this.getUserAudio(userId).createStream(stream);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  setEmoji(emoji) {
    this.emoji = emoji;
  }

  /**
   * Video call
   * @param {string} peerId Peer ID
   * @param {} data Metadata
   */
  videoCall(peerId, data = {}) {
    if (this.videoPeer) {
      const newConnection = this.videoPeer.call(peerId, this.localVideoStream, { metadata: data });
      this.videoConnections.push(newConnection);
    }
  }

  /**
   * Audio call
   * @param {string} peerId Peer ID
   * @param {} data Metadata
   */
  audioCall(peerId, data = {}) {
    if (this.audioPeer) {
      const newConnection = this.audioPeer.call(peerId, this.localAudioStream, { metadata: data });
      this.audioConnections.push(newConnection);
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
      if (this.audioPeer === null && this.videoPeer === null) {
        try {
          import('peerjs').then(imported => {
            const Peer = imported.default;
            const peerOptions = {
              host: window.location.host, path: '/live/audio',
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                ]
              }
            };
            this.audioPeer = new Peer(audioPeerId, peerOptions);
            this.videoPeer = new Peer(videoPeerId, peerOptions);
            resolve(CustomCodes.PEERS_READY);
          });
        }
        catch (error) {
          reject(CustomCodes.PEERS_ERROR);
        }
      }
      else {
        reject(CustomCodes.PEERS_INITIALIZED);
      }
    });
  }

  cleanVideoConnections() {
    this.videoConnections.forEach(x => {
      if (x)
        x.close();
    });
    this.videoConnections.length = 0;
    this.videoConnections = [];
  }

  cleanAudioConnections() {
    this.audioConnections.forEach(x => {
      if (x)
        x.close();
    });
    this.audioConnections.length = 0;
    this.audioConnections = [];
  }

  reset() {
    if (this.videoPeer) {
      this.videoPeer.disconnect();
      // this.videoPeer.destroy();
      // this.videoPeer = null;
    }

    if (this.audioPeer) {
      this.audioPeer.disconnect();
      // this.audioPeer.destroy();
      // this.audioPeer = null;
    }
    this.cleanAudioConnections();
    this.cleanVideoConnections();
  }

  /**
   * Maintain audio HTML elements
   * @param {Array<User>} users Users
   */
  maintainAudios(users) {
    users.forEach(x => {
      if (this.audios.findIndex(audio => audio.id === x.id) === -1) {
        const audio = new ChatAudio(x.id);
        this.audios.push(audio);
      }
    });
  }

}
