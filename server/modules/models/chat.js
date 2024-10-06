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

export class Comment {
  /** @type {string} */
  client_id;
  /** @type {string} */
  target_id;
  /** @type {string} */
  content;
  /** @type {string} */
  type;
  /** @type {Date} */
  created_time;
  /** @type {Date} */
  updated_time;

  /**
   * 构造函数，用于创建一个新实例
   * 
   * @param {string} clientId - 客户端ID，用于标识调用者
   * @param {string} targetId - 目标ID，用于标识操作对象
   * @param {string} [type='TV'] - 操作类型，默认为'TV'，可以是'TV'或'Movie'
   */
  constructor(clientId, targetId, type = 'TV') {
    this.target_id = targetId;
    this.client_id = clientId;
    this.type = type;
    this.content = '';
    this.created_time = new Date();
    this.updated_time = new Date();
  }

  toJSON() {
    return {
      client_id: this.client_id,
      target_id: this.target_id,
      type: this.type,
      content: this.content,
      created_time: this.created_time,
      updated_time: this.updated_time,
    }
  }
}
