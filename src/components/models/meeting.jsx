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

export class Media {
  /** @type {string} */
  id;
  /** @type {boolean} */
  streaming;
  /** @type {MediaStream} */
  stream;
  /** @type {import('peerjs').default} */
  peer;
  /** @type {boolean} */
  localMute;
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
    'disconnected': `You've already disconnected this peer from the server and can no longer make any new connections on it.`,
    'invalid-id': `The ID contains illegal characters.`,
    'invalid-key': `The API key contains illegal characters or is not in the system.`,
    'network': `Lost or cannot establish a connection to the signalling server.`,
    'peer-unavailable': `The client you're trying to connect to does not exist.`,
    'ssl-unavailable': `SSL error with the server`,
    'server-error': `Unable to reach the server.`,
    'socket-error': `An error from the underlying socket.`,
    'socket-closed': `The underlying socket closed unexpectedly.`,
    'unavailable-id': `The ID is already taken.`,
    'webrtc': `Native WebRTC errors.`
  }
};
