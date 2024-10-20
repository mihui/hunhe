import { ClipboardData, DEFAULTS, STATUS } from './meeting';

export const ChatModes = {
  Private: 'Private',
  Public: 'Public',
};

export const Kinds = {
  PERSON: 1,
  ROBOT: 2,
  ALL: 3,
};

export const MessageTypes = {
  Text: 0,
  Binary: 1
};

export const MessageStatus = {
  Sending: 0,
  Sent: 1
};

export class Device {
  /** @type {boolean} */
  enabled;
  /** @type {boolean} */
  muted;
  /** @type {string} */
  deviceId;

  /**
   * Construtor
   * @param {string} deviceId Device ID
   */
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

export class AI extends User {
  static __id = '__ai';
  constructor(translate = (str) => str) {
    super(AI.__id, translate('羊驼'), '/images/avatars/llama.png');
    this.kind = Kinds.ROBOT;
  }
}

export class ChatAttachment {
  /** @type {string} */
  url = '';
  /** @type {Buffer} */
  binary = null;
  /** @type {string} */
  note = '';

  toJSON() {
    return {
      url: this.url,
      binary: this.binary,
      note: this.note
    }
  }
}

export class ChatPayload {
  /** @type {string} */
  input = '';
  /** @type {number} */
  type = MessageTypes.Text;
  /** @type {ClipboardData} */
  attachment = new ClipboardData().toJSON();
  /** @type {User} */
  to = new All();
  /** @type {string} */
  mode = ChatModes.Public;

  toJSON() {
    return {
      input: this.input,
      type: this.type,
      attachment: this.attachment,
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
  /** @type {number} */
  type;
  /** @type {string} */
  message;
  /** @type {ChatAttachment} */
  attachment;
  /** @type {User} */
  from;
  /** @type {User} */
  to;
  /** @type {number} */
  time;
  /** @type {number} */
  status;
}

export class ChatMessage {
  /** @type {User} */
  from;
  /** @type {User} */
  to;
  /** @type {string} */
  message;
}
