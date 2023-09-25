import crypto from 'crypto';

export const MAX_USERS = 10;

export class ChatUser {
  /** @type {number} */
  kind;
  /** @type {string} */
  room;
  /** @type {string} */
  id;
  /** @type {string} */
  name;
  /** @type {string} */
  avatar;
  /** @type {string} Socket ID */
  __id;
  /** @type {{ browser: number, microphone: number, emoji: string }} */
  __status;
}

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
    this.id = crypto.randomUUID();
    this.subject = '';
    this.locked = false;
    this.limitation = MAX_USERS;
    this.created_time = new Date();
    this.updated_time = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      locked: this.locked,
      limitation: this.limitation,
      created_time: this.created_time,
      updated_time: this.updated_time,
    }
  }
}
