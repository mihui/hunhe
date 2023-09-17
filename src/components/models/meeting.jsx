import { MediaStatus } from "../services/chat";

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
  isUserListDisplayed = true;
  /** @type {boolean} */
  isSettingsDisplayed = false;
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

  toJSON() {
    return {
      isProfileDisplayed: this.isProfileDisplayed,
      isLinkDisplayed: this.isLinkDisplayed,
      isUserListDisplayed: this.isUserListDisplayed,
      isSettingsDisplayed: this.isSettingsDisplayed,
      isScrolling: this.isScrolling,
      isPlayingLocalVideo: this.isPlayingLocalVideo,
      isPlayingRemoteVideo: this.isPlayingRemoteVideo,
      isMuted: this.isMuted,
      //
      videoStatus: this.videoStatus,
      audioStatus: this.audioStatus,
      //
      error: this.error.toJSON(),
      status: this.status.toJSON(),
    }
  }
}

export class ChatAudio {
  /** @type {string} */
  id;
  /** @type {MediaStreamAudioSourceNode} */
  source = null;
  /** @type {AnalyserNode} */
  analyser = null;
  /** @type {GainNode} */
  gain = null;
  /** @type {AudioContext} */
  context = null;

  constructor(id) {
    this.context = new AudioContext();
    this.gain = this.context.createGain();
    this.id = id;
  }

  /**
   * Create stream
   * @param {MediaStream} stream Stream
   */
  createStream(stream) {
    this.source = this.context.createMediaStreamSource(stream);
    this.source.connect(this.gain);
    this.gain.connect(this.context.destination);
  }

  /**
   * Volume
   * @param {number} val Volume value, 1 - on, 0 - off
   */
  volume(val = 1) {
    this.gain.gain.setValueAtTime(val, this.context.currentTime);
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
  ONLINE: 1,
  AWAY: 2,
  OFFLINE: 3,
  AUDIO: 4,
  SPEAKING: 5,
  MUTED: 6,
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

// DEVICE DEFAULTS
export const DEVICE = {
  SCREEN: 'screen',
  MICROPHONE: 'default'
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
