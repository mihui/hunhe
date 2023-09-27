import { STATUS } from '../config/vars';
import { DEFAULTS } from './meeting';

export const ChatModes = {
  Private: 'Private',
  Public: 'Public',
};

export const Kinds = {
  PERSON: 1,
  ROBOT: 2,
  ALL: 3,
};

export class Device {
  /** @type {boolean} */
  enabled;
  /** @type {boolean} */
  muted;
  /** @type {string} */
  deviceId;
  constructor(deviceId = '') {
    this.enabled = false;
    this.muted = true;
    this.deviceId = deviceId;
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
    this.audio = new Audio(DEFAULTS.MICROPHONE);
    this.video = new Video(DEFAULTS.SCREEN);
  }

  toJSON() {
    return {
      audio: this.audio.toJSON(),
      video: this.video.toJSON(),
    }
  }
}

export class User {
  /** @type {number} */
  kind;
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
    this.kind = Kinds.PERSON;
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.devices = new Devices();
    this.windows = 0;
    this.__status = { browser: STATUS.ONLINE, microphone: STATUS.MUTED, emoji: '' };
  }

  toJSON() {
    return {
      kind: this.kind,
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      devices: this.devices.toJSON(),
      windows: this.windows
    }
  }
}

export class All extends User {
  static __id = '__everyone';
  constructor(translate = (str) => str) {
    super(All.__id, translate('大家'), '/images/avatars/00.png');
    this.kind = Kinds.ROBOT;
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
