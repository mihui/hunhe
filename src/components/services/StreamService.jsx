import { Socket, io } from 'socket.io-client';
import VARS, { CustomCodes } from '../config/vars';
import { ChatAudio } from '../models/meeting';
import { MediaStatus } from './chat';

const PATHS = {
  WEBSOCKET: `${VARS.APP_URL}/api/messaging`,
  PEER: `/live/audio`
};

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
    this.socket = io({ autoConnect: false, path: PATHS.WEBSOCKET });
    this.videoConnections = [];
    this.audioConnections = [];
  }

  /**
   * Get WebSocket instance
   * @returns {Socket} Returns Socket instance
   */
  getWebSocket() {
    return this.socket;
  }

  /**
   * Connect with WebSocket server
   */
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
    const instance = this.audios.find(x => x.user.id === userId);
    return instance;
  }

  /**
   * Publish audio stream
   * @param {string} userId User ID
   * @param {ChatAudio} stream Stream
   */
  publishAudioStream(userId, stream) {
    this.audioStatus = MediaStatus.PUBLISHING;
    this.localAudioStream = stream;
  }

  /**
   * Stop audio stream
   */
  stopAudioStream() {
    this.audioStatus = MediaStatus.IDLE;
    this.audios.forEach(chatAudio => {
      chatAudio.stop();
    });
    this.localAudioStream = null;
  }

  /**
   * Enable media tracks
   * @param {boolean} isScreenOnly Is screen share only
   */
  enableTracks(isScreenOnly) {
    if (this.audioStatus === MediaStatus.PUBLISHING) {
      const enabled = (this.isMuted === false && isScreenOnly);
      const tracks = this.localAudioStream.getTracks();
      tracks.forEach(track => {
        track.enabled = enabled;
      });
    }
    if (this.videoStatus === MediaStatus.PUBLISHING) {
      const enabled = this.isMuted === false;
      const tracks = this.localVideoStream.getTracks();
      tracks.forEach(track => {
        if(track.kind === 'audio') {
          track.enabled = enabled;
        }
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

  /**
   * Receive audio stream
   * @param {string} userId User ID
   * @param {MediaStream} remoteStream Remote stream
   * @returns {ChatAudio} Returns ChatAudio instance
   */
  receiveAudioStream(userId, remoteStream) {
    this.getUserAudio(userId).createAudio(remoteStream);
    return this.getUserAudio(userId);
  }

  /**
   * Mute/unmute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  /**
   * Set emoji
   * @param {string} emoji Emoji string
   */
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
   * @param {{ id: string, nickname: string }} data Metadata
   * @returns {import('peerjs').MediaConnection} Returns MediaConnection instance
   */
  audioCall(peerId, data = {}) {
    if (this.audioPeer) {
      const newConnection = this.audioPeer.call(peerId, this.localAudioStream, { metadata: data });
      this.audioConnections.push(newConnection);
      return newConnection;
    }
    return null;
  }

  /**
   * Setup Peers
   * @param {string} audioPeerId Audio Peer ID
   * @param {string} videoPeerId Video Peer ID
   * @returns {Promise<number>} Returns status code
   */
  setupPeers(audioPeerId, videoPeerId) {
    return new Promise((resolve, reject) => {
      if (this.audioPeer === null && this.videoPeer === null) {
        try {
          import('peerjs').then(imported => {
            const Peer = imported.default;
            const peerOptions = {
              host: VARS.APP_HOST, path: PATHS.PEER,
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

  /**
   * Clean video connections
   */
  cleanVideoConnections() {
    this.videoConnections.forEach(x => {
      if (x)
        x.close();
    });
    this.videoConnections.length = 0;
    this.videoConnections = [];
  }

  /**
   * Clean audio connections
   */
  cleanAudioConnections() {
    this.audioConnections.forEach(x => {
      if (x)
        x.close();
    });
    this.audioConnections.length = 0;
    this.audioConnections = [];
  }

  /**
   * Reset Peer connections
   */
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
        const audio = new ChatAudio(x);
        this.audios.push(audio);
      }
    });
  }

}
