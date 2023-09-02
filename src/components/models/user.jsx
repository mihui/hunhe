import { STATUS } from "../config/vars";
export const ChatModes = {
  Private: 'Private',
  Public: 'Public',
};

export class Device {
  /** @type {boolean} */
  enabled;
  /** @type {boolean} */
  muted;
  /** @type {string} */
  deviceId;
  constructor() {
    this.enabled = false;
    this.muted = true;
    this.deviceId = '';
  }
  toJSON() {
    return {
      enabled: this.enabled,
      muted: this.muted,
      deviceId: this.deviceId,
    }
  }
}

export class Video extends Device {}

export class Audio extends Device {}

export class Devices {
  /** @type {Audio} */
  audio;
  /** @type {Video} */
  video;
  constructor() {
    this.audio = new Audio();
    this.video = new Video();
  }

  toJSON() {
    return {
      audio: this.audio.toJSON(),
      video: this.video.toJSON(),
    }
  }
}

export class User {
  /** @type {string} */
  id;
  /** @type {string} */
  name;
  /** @type {string} */
  avatar;
  /** @type {Devices} */
  devices;
  /** @type {number} */
  windows;
  /** @type {{ browser: number, microphone: number, emoji: string }} */
  __status;

  constructor(id = '', name = '', avatar = '/images/avatars/00.png') {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.devices = new Devices();
    this.windows = 0;
    this.__status = { browser: STATUS.ONLINE, microphone: STATUS.MUTED, emoji: '' };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      devices: this.devices.toJSON(),
      windows: this.windows
    }
  }
}

export class All extends User{
  static __id = '__everyone';
  constructor(translate = (str) => str) {
    super(All.__id, translate('大家'), '/images/avatars/00.png');
  }
}

export class ChatPayload {
  /** @type {string} */
  input = '';
  /** @type {User} */
  to = new All();
  /** @type {string} */
  mode = ChatModes.Public;

  toJSON() {
    return {
      input: '',
      mode: this.mode,
      to: {
        id: this.to.id,
        name: this.to.name,
        avatar: this.to.avatar,
        devices: this.to.devices,
        windows: this.to.windows
      }
    }
  }
}

export class ChatRecord {
  /** @type {string} Client Chat ID */
  id;
  /** @type {string} */
  message;
  /** @type {User} */
  from;
  /** @type {User} */
  to;
  /** @type {number} */
  time;
}

export class ChatMessage {
  /** @type {User} */
  from;
  /** @type {User} */
  to;
  /** @type {string} */
  message;
}

export class ChatVideo {
  /** @type {MediaStream} */
  remoteStream;
  /** @type {MediaStream} */
  localStream;
  /** @type {boolean} */
  isPublishing;
  /** @type {boolean} */
  isReceiving;
  /** @type {Peer} */
  peer;
  constructor() {
    this.isStreaming = false;
    this.localStream = null;
    this.remoteStream = null;
    this.peer = null;
  }
  toJSON() {
    return {
      isStreaming: this.isStreaming,
      localStream: this.localStream,
      remoteStream: this.remoteStream,
      peer: this.peer,
    }
  }
}
