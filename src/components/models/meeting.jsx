import { utility } from "../helpers/utility";
import { MediaStatus } from "../services/chat";
import { User } from "./user";

export class Meeting {
  /** @type {string} */
  id;
  /** @type {string} */
  subject;
  /** @type {boolean} */
  locked;
  /** @type {number} */
  limitation;
  /** @type {Date} */
  created_time;
  /** @type {Date} */
  updated_time;

  constructor() {
    this.id = '';
    this.subject = '';
    this.limitation = 0;
    this.locked = false;
    this.created_time = new Date();
    this.updated_time = new Date();
  }

  setId(id) { this.id = id; return this; }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      locked: this.locked,
      imitation: this.limitation,
      created_time: this.created_time,
      updated_time: this.updated_time,
    }
  }
}
export class Device {
  /** @type {string} */
  kind;
  /** @type {string} */
  label;
  /** @type {string} */
  deviceId;
}
export class Media {
  /** @type {string} */
  id;
  /** @type {MediaStream} */
  stream;
}

export class ClipboardData {
  /** @type {string} */
  url = '';
  /** @type {string} */
  base64 = '';
  /** @type {string} */
  note = '';

  toJSON() {
    return {
      url: this.url,
      base64: this.base64,
      note: this.note
    }
  }
}

export class UIError {
  /** @type {number} */
  code = 0;
  /** @type {string} */
  message = '';
  toJSON() {
    return {
      code: this.code,
      message: this.message
    }
  }
}

export class UIStatus {
  /** @type {boolean} */
  isEmojiDisplayed = false;
  toJSON() {
    return {
      isEmojiDisplayed: this.isEmojiDisplayed,
    }
  }
}

export class UIProperty {
  /** @type {boolean} */
  isProfileDisplayed = false;
  /** @type {boolean} */
  isLinkDisplayed = false;
  /** @type {boolean} */
  isUserListDisplayed = false;
  /** @type {boolean} */
  isSettingsDisplayed = false;
  /** @type {boolean} */
  isCopyPasteDisplayed = false;
  /** @type {boolean} */
  isPreviewDisplayed = false;
  /** @type {boolean} */
  isScrolling = true;
  /** @type {boolean} */
  isPlayingLocalVideo = false;
  /** @type {boolean} */
  isPlayingRemoteVideo = false;
  /** @type {boolean} */
  isMuted = true;
  /** @type {number} */
  videoStatus = MediaStatus.IDLE;
  /** @type {number} */
  audioStatus = MediaStatus.IDLE;
  /** @type {{ code: number, message: string }} */
  error = new UIError();
  /** @type {{ isEmojiDisplayed: boolean }} */
  status = new UIStatus();

  /** @type {string} */
  previewUrl = '';

  toJSON() {
    return {
      isProfileDisplayed: this.isProfileDisplayed,
      isLinkDisplayed: this.isLinkDisplayed,
      isUserListDisplayed: this.isUserListDisplayed,
      isSettingsDisplayed: this.isSettingsDisplayed,
      isCopyPasteDisplayed: this.isCopyPasteDisplayed,
      isPreviewDisplayed: this.isPreviewDisplayed,
      //
      isScrolling: this.isScrolling,
      isPlayingLocalVideo: this.isPlayingLocalVideo,
      isPlayingRemoteVideo: this.isPlayingRemoteVideo,
      isMuted: this.isMuted,
      //
      videoStatus: this.videoStatus,
      audioStatus: this.audioStatus,
      //
      previewUrl: this.previewUrl,
      //
      error: this.error.toJSON(),
      status: this.status.toJSON(),
    }
  }
}

export class UserStream {
  /** @type {User} */
  user = null;
  /** @type {Array<string>} */
  audioTracks = [];
  /** @type {AnalyserNode} */
  analyser = null;

  /**
   * UserStream constructor
   * @param {User} user User
   */
  constructor(user) {
    this.user = user;
  }

  /**
   * Init stream
   * @param {MediaStream} stream User stream
   * @param {(track: MediaStreamTrack) => void} removeRemoteTrack Remove stream track of remote audio
   * @param {(track: MediaStreamTrack) => void} addRemoteTrack Remove stream track of remote audio
   * @returns {UserStream} Returns UserStream instance
   */
  addMediaStream(stream, removeRemoteTrack, addRemoteTrack) {
    // Remove exsiting tracks
    if(this.hasAudioTracks()) {
      this.audioTracks.forEach(trackId => {
        removeRemoteTrack(trackId);
      });
      this.removeTracks();
    }

    stream.getAudioTracks().forEach(track => {
      this.audioTracks.push(track.id);
      addRemoteTrack(track);
    });

    this.analyser = utility.createAnalyser(new MediaStream(stream.getAudioTracks()));

    return this;
  }

  /**
   * Remove audio tracks
   */
  removeTracks() {
    this.audioTracks.length = 0;
    this.audioTracks = [];
  }

  /**
   * Get analyser
   * @returns {AnalyserNode} Returns AnalyserNode instance
   */
  getAnalyser() {
    return this.analyser;
  }

  /**
   * Get audio track size
   * @returns {number} Returns audio track size
   */
  getAudioTrackSize() {
    return this.audioTracks.length;
  }

  /**
   * Determine if there is any audio tracks
   * @returns {boolean} Has audio tracks
   */
  hasAudioTracks() {
    return this.getAudioTrackSize() > 0;
  }
}

export const NOTIFICATION_STYLES = {
  INFO: 'info',
  WARNING: 'warn',
  ERROR: 'error',
};

export const EMOJIS = ['1f601', '1f602', '1f603', '1f604', '1f605', '1f607', '1f609', '1f60a', '1f60b', '1f60c', '1f612', '1f613', '1f61c', '1f61d', '1f620', '1f621', '1f622', '1f623', '1f624', '1f626', '1f628', '1f629', '1f62a', '1f62e', '1f630', '1f631', '1f632', '1f637', '1f641', '1f642', '1f643', '1f920', '1f923', '1f924', '1f925', '1f928', '1f929', '1f92a', '1f92b', '1f92d', '1f910', '1f911', '1f912', '1f913', '1f914', '1f915', '1f917', '1f973', '1f974'];

// USER STATUS
export const STATUS = {
  // Browser
  ONLINE: 1,
  AWAY: 2,
  OFFLINE: 3,
  AUDIO: 4,
  // Microphone
  SPEAKING: 5,
  MUTED: 6,
  // Camera
  HIDING: 7,
  OPENING: 8
};

// CONNECTION STATUS
export const CONNECTION = {
  QUEUED: 0,
  PROCESSING: 1,
  COMPLETED: 2,
};

// AUDIO STATUS
export const AUDIO = {
  READY: 1,
  ONGOING: 2
};

// DEFAULTS
export const DEFAULTS = {
  SCREEN: 'screen',
  MICROPHONE: 'default',
  SPEAKER: 'default'
};

export const PEER_STATUS = {
  READY: 1,
  DISCONNECTED: 2,
  RECONNECTING: 3,
  NONE: 4
};

// PEER CODES
export const PEER = {
  ERRORS: {
    'browser-incompatible': `浏览器不支持语音或视频`,
    'disconnected': `媒体服务器断开`,
    'invalid-id': `用户编号错误`,
    'invalid-key': `The API key contains illegal characters or is not in the system.`,
    'network': `网络连接不稳定`,
    'peer-unavailable': `尝试连接的客户端不存在`,
    'ssl-unavailable': `证书错误`,
    'server-error': `服务错误`,
    'socket-error': `套接字错误`,
    'socket-closed': `服务异常关闭`,
    'unavailable-id': `用户已经被占用`,
    'webrtc': `端到端服务错误`
  }
};
