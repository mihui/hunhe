import { Socket, io } from 'socket.io-client';
import VARS, { CustomCodes } from '../config/vars';
import { ChatAudio, NOTIFICATION_STYLES } from '../models/meeting';
import { MediaStatus } from './chat';
import { Events, beeper, utility } from '../helpers/utility';

const PATHS = {
  WEBSOCKET: `/api/messaging`,
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
  /** @type {MediaStream} */
  remoteAudioStream = null;

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

  /** @type {((str: string) => string)} */
  translate = (str) => str;

  constructor() {
    this.socket = VARS.IS_DEBUGGING ? io(VARS.APP_URL, { path: PATHS.WEBSOCKET, host: VARS.APP_HOST, autoConnect: false }) :
      io({ path: PATHS.WEBSOCKET, autoConnect: false });
    this.videoConnections = [];
    this.audioConnections = [];
  }

  /**
   * Initialize translation method
   * @param {(str: string) => string} translate Translation function
   */
  initTranslation(translate) {
    this.translate = translate;
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
      chatAudio.removeTracks();
    });
    this.remoteAudioStream?.getTracks().forEach(track => {
      this.remoteAudioStream.removeTrack(track);
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
    if(this.remoteAudioStream === null) this.remoteAudioStream = new MediaStream();
    return this.getUserAudio(userId)?.addAudioStream(remoteStream, existingTrackId => {
      const existingTracks = this.remoteAudioStream.getAudioTracks().filter(track => track.id === existingTrackId);
      if(existingTracks) {
        existingTracks.forEach(existingTrack => {
          this.remoteAudioStream.removeTrack(existingTrack);
        });
      }
    }, newTrack => {
      this.remoteAudioStream.addTrack(newTrack);
    });
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
   * Handles the openning audio connection
   * @param {import('peerjs').MediaConnection} newConnection New connection
   * @returns {() => void} Returns function callback
   */
  onAudioOpen(newConnection) {
    return () => {
      console.log('### ESTABLISHED CONNECTION ###');
      console.info(`    WITH ${this.getUserAudio(newConnection.peer)?.user.name}`);
      beeper.publish(Events.ClientNotification, { message: utility.format(this.translate('与【{0}】成功建立语音连接'), this.getUserAudio(newConnection.peer)?.user.name), style: NOTIFICATION_STYLES.WARNING, hasTranslation: true });
    };
  }

  /**
   * Handles the closed audio connection
   * @param {import('peerjs').MediaConnection} newConnection New connection
   * @returns {() => void} Returns function callback
   */
  onAudioClosed(newConnection) {
    return () => {
      console.log('### PEER CONNECTION CLOSED ###');
      console.info(`    WITH ${this.getUserAudio(newConnection.peer)?.user.name}`);
      beeper.publish(Events.ClientNotification, { message: utility.format(this.translate('与【{0}】断开语音连接'), this.getUserAudio(newConnection.peer)?.user.name), style: NOTIFICATION_STYLES.WARNING, hasTranslation: true });
    };
  }

  /**
   * Handles the error of audio connection
   * @param {import('peerjs').MediaConnection} newConnection New connection
   * @returns {(error: Error) => void} Returns function callback
   */
  onAudioError(newConnection) {
    return error => {
      console.warn('### PEER CONNECTION ERROR ###');
      console.warn(`    WITH ${this.getUserAudio(newConnection.peer)?.user.name}`);
      beeper.publish(Events.ClientNotification, { message: utility.format(this.translate('与【{0}】的语音通信发生错误'), this.getUserAudio(newConnection.peer)?.user.name), style: NOTIFICATION_STYLES.WARNING, hasTranslation: true });
    };
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
      newConnection.on('close', this.onAudioClosed(newConnection));
      newConnection.on('open', this.onAudioOpen(newConnection));
      newConnection.on('error', this.onAudioError(newConnection));
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
              path: PATHS.PEER,
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'turn:aspark.app:3478', username: 'user', credential: 'transform' }
                ]
              },
              host: window.location.host
            };
            if(VARS.IS_DEBUGGING) {
              peerOptions.host = VARS.APP_HOST;
            }
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
   * Add connection
   * @param {import('peerjs').MediaConnection} newConnection New connection
   */
  addAudioConnection(newConnection) {
    newConnection.on('close', this.onAudioClosed(newConnection));
    newConnection.on('open', this.onAudioOpen(newConnection));
    newConnection.on('error', this.onAudioError(newConnection));
    this.audioConnections.push(newConnection);
  }

  /**
   * Clean audio connections
   */
  cleanAudioConnections() {
    this.audioConnections.forEach(x => {
      if (x) {
        x.off('close', this.onAudioClosed(x));
        x.off('open', this.onAudioOpen(x));
        x.off('error', this.onAudioError(x));
        x.close();
      }
    });
    this.audioConnections.length = 0;
    this.audioConnections = [];
  }

  /**
   * Reset Peer connections
   */
  reset() {
    console.log('### RESET ###');
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
