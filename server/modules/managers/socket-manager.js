import { VARS } from '../vars.js';
import { Logger } from '../logger.js'; 
import { Server, Socket } from 'socket.io';
import { ChatUser } from '../models/chat.js';
import { meetingService } from '../services/data.js';
import { httpCodes } from '../http-manager.js';
import { aiService } from '../services/ai.js';

const { logger } = Logger('socket-manager');

const ROOM = {
  DEFAULT: VARS.CHAT_LOBBY_ID,
};

const STATUS = {
  ONLINE: 1,
  AWAY: 2,
  OFFLINE: 3,
  AUDIO: 4,
  SPEAKING: 5,
  MUTED: 6,
};

export const KINDS = {
  PERSON: 1,
  ROBOT: 2,
  ALL: 3,
};

export const ROBOTS = {
  LLAMA: '__llama'
};


const REASON = {
  JOIN: 1,
  STATUS: 2,
  LEAVE: 3,
  AUDIO: 4,
  SCREEN: 5,
};

const EVENTS = {
  // Welcome
  USER_WELCOME_PUBLIC: 'client:welcome:public',
  USER_WELCOME_PRIVATE: 'client:welcome:private',
  USER_LEAVE: 'client:leave',
  USER_ERROR: 'client:error',
  // Typing
  USER_TYPING_CALLBACK: 'client:typing',
  //
  USER_USERS: 'client:users',
  // Message
  USER_MESSAGE_CALLBACK: 'client:user:message',
  // Audio
  USER_AUDIO_START_CALLBACK: 'client:audio:start:callback',
  USER_AUDIO_HANGUP_CALLBACK: 'client:audio:hangup:callback',
  USER_AUDIO_STOP_CALLBACK: 'client:audio:stop:callback',
  USER_AUDIO_INVITE_CALLBACK: 'client:audio:invite:callback',
  USER_AUDIO_SHARE_CALLBACK: 'client:audio:share:callback',
  USER_AUDIO_REJECT_CALLBACK: 'client:audio:reject:callback',
  // Screen
  USER_SCREEN_START_CALLBACK: 'client:screen:start:callback',
  USER_SCREEN_JOIN_CALLBACK: 'client:screen:join:callback',
  USER_SCREEN_STOP_CALLBACK: 'client:screen:stop:callback',
  // Meeting
  MEETING_UPDATE_CALLBACK: 'client:meeting:update:callback'
};

const MODES = {
  PUBLIC: 'Public',
  PRIVATE: 'Private'
};

class SocketManager {

  /** @type {Server} */
  #io;

  /** @type {Map<string, string>} */
  screenMap = new Map();

  /**
   * Set screen ID
   * @param {string} room Room ID
   * @param {string} id User/Screen ID
   */
  setScreen(room, id) {
    this.screenMap.set(room, id);
  }

  /**
   * Get screen
   * @param {string} room Room ID
   * @returns {string} Returns screen ID of the room
   */
  getScreen(room) {
    return this.screenMap.has(room) ? this.screenMap.get(room) : '';
  }

  /**
   * Delete screen
   * @param {string} room Room ID
   */
  deleteScreen(room) {
    this.screenMap.delete(room);
  }

  constructor() {}

  async boot(server) {
    if(server) {
      this.#io = new Server(server, { path: `${VARS.APP_CONTEXT}/api/messaging` });
      this.#io.on('connection', (socket) => {
        this.#onConnected(socket);
      });
    }
  }

  /**
   * Get users of AI chatroom
   * @param {Array<string>} rooms Rooms
   * @param {Array<string>} exludeRooms Exclude room list
   * @param {boolean} notifyClient Notify client side about the user change
   * @returns {Promise<Array<ChatUser>>} Returns a list of users
   */
  async fetchUsers(rooms = [ ROOM.DEFAULT ], exludeRooms = [], notifyClient = true) {
    try {
      const allSockets = this.getSockets(rooms);
      /** @type {Array<{ data: { id: string } }>} */
      const allUsers = await (exludeRooms.length > 0 ? allSockets.except(exludeRooms) : allSockets).fetchSockets();
      /** @type {Array<{ data: { id: string } }>} */
      const onlineSockets = [];
      allUsers.forEach(everyUser => {
        onlineSockets.push(everyUser.data);
      });
      logger.debug(`### ONLINE: ${onlineSockets.length} ###`);
      if(notifyClient) {
        this.getSockets(rooms).emit(EVENTS.USER_USERS, onlineSockets);
      }
      return onlineSockets;
    }
    catch(error) {
      logger.error('### ERROR FETCHING SOCKETS ###');
      logger.error(error);
      return [];
    }
  }

  /**
   * Get sockets
   * @param {string|array<string>} room Room name
   * @returns {import("socket.io").BroadcastOperator;} Returns instance of BroadcastOperator
   */
  getSockets(rooms = [ ROOM.DEFAULT ]) {
    return this.#io.sockets.in(rooms);
  }

  /**
   * Get rooms
   * @param {string} mode Is private message
   * @param {string} toId To user ID
   * @param {string} fromId From user ID
   * @param {string} userRoom User's room
   * @returns {Array<string>} Returns a list of rooms
   */
  getRooms(mode, toId, fromId, userRoom) {
    const rooms = [];
    // AI questions to share to others
    if(mode === MODES.PRIVATE) {
      rooms.push(fromId);
      rooms.push(toId);
    }
    else {
      rooms.push(userRoom);
    }
    return rooms;
  }

  /**
   * 
   * @param {Socket} socket Socket instance
   */
  async #onConnected(socket) {

    // const { room = ROOM.DEFAULT, id, avatar, name } = socket.handshake.query;

    const setStatus = (value) => {
      socket.data['__status'] = Object.assign({}, socket.data['__status'], value);
    };

    socket.on('server:join',
    /**
     * Join room
     * @param {string} room Room ID
     * @param {ChatUser} newUser New joiner
     */
    async (room, newUser) => {
      /** @type {ChatUser} User data - One time usage */
      const chatUser = { 
        room,
        id: newUser.id, avatar: newUser.avatar, name: newUser.name, kind: newUser.kind,
        __id: socket.id,
        __status: { browser: STATUS.ONLINE, microphone: STATUS.MUTED, emoji: '' }
      };

      logger.debug(`### [${chatUser.room}] SOCKET CONNECTED: ${socket.id} ###`);

      const meeting = await meetingService.queryMeetingById(chatUser.room);
      const validated = { disconnect: false, code: httpCodes.OK };
      if(meeting) {
        const users = await this.fetchUsers([chatUser.room], [], false);
        if(users.length >= meeting.limitation) {
          logger.warn('### ROOM FULL ###');
          validated.disconnect = true;
          // Exceeding limitation
          validated.code = httpCodes.BAD_REQUEST;
        }
        else if(meeting.locked && users.length > 1) {
          logger.warn('### ROOM LOCKED ###');
          validated.disconnect = true;
          // Room locked
          validated.code = httpCodes.CONFLICT;
        }
      }
      else {
        logger.warn('### ROOM NOT FOUND ###');
        // Room not found
        validated.disconnect = true;
        validated.code = httpCodes.NOT_FOUND;
      }
      if(validated.disconnect) {
        logger.warn('### DISCONNECTING ###');
        logger.warn(validated);
        logger.warn(meeting);
        
        socket.emit(EVENTS.USER_ERROR, validated.code);
        socket.disconnect(true);
        return;
      }

      socket.data = chatUser;
      socket.join([ chatUser.room, chatUser.id ]);

      // Welcome event to all users
      this.getSockets(chatUser.room).emit(EVENTS.USER_WELCOME_PUBLIC, chatUser);
      // Welcome event to myself
      socket.emit(EVENTS.USER_WELCOME_PRIVATE, this.getScreen(chatUser.room));
      this.fetchUsers(chatUser.room);
    });

    socket.on('disconnect',
    async () => {
      logger.warn('### SOCKET DISCONNECTED ###');
      /** @type {ChatUser} */
      const chatUser = socket.data;
      if(chatUser.id === this.getScreen(chatUser.room)) {
        logger.warn('### DISCONNECTING VIDEO/AUDIO ###');
        this.deleteScreen(chatUser.room);
        this.getSockets(chatUser.room).emit(EVENTS.USER_SCREEN_STOP_CALLBACK, chatUser);
      }
      // @todo, this may crash the app
      if(chatUser.__status && chatUser.__status.microphone === STATUS.AUDIO) {
        // Need to know if this user is in a call
        this.getSockets(chatUser.room).emit(EVENTS.USER_AUDIO_HANGUP_CALLBACK, chatUser);
      }
      // Use socket.id in case one user have multiple windows
      this.fetchUsers(chatUser.room, [ socket.id ]);
    });

    socket.on('server:screen:join',
      /**
       * Start a call
       * @param {string} screenId Screen ID
       */
      async (screenId) => {
        /** @type {ChatUser} */
        const callee = socket.data;
        const rooms = this.getRooms(MODES.PRIVATE, screenId, callee.id, callee.room);
        this.getSockets(rooms).emit(EVENTS.USER_SCREEN_JOIN_CALLBACK, callee, screenId);
      }
    );

    socket.on('server:screen:stop',
    () => {
      logger.debug('server:screen:stop');
      /** @type {ChatUser} */
      const sharer = socket.data;
      if(sharer.id === this.getScreen(sharer.room)) {
        this.deleteScreen(sharer.room);
        this.getSockets(sharer.room).emit(EVENTS.USER_SCREEN_STOP_CALLBACK, sharer);
      }
    });

    socket.on('server:screen:start',
    /**
     * Start a call for screen stream
     * @param {string} screenId Screen ID
     */
    async (screenId) => {
      /** @type {ChatUser} */
      const caller = socket.data;
      this.setScreen(caller.room, screenId);
      const users = await this.fetchUsers(caller.room, [], false);
      socket.emit(EVENTS.USER_SCREEN_START_CALLBACK, caller, users, screenId);
    });

    socket.on('server:status',
    (browser, microphone, emoji) => {
      setStatus({ browser, microphone, emoji });
      /** @type {ChatUser} */
      const user = socket.data;
      this.fetchUsers(user.room);
    });

    socket.on('server:meeting:update',
    (meeting) => {
      /** @type {ChatUser} */
      const fromUser = socket.data;
      this.getSockets(fromUser.room).emit(EVENTS.MEETING_UPDATE_CALLBACK, fromUser, meeting);
    });

    socket.on('server:user:message',
      /**
       * @param {{ id: string, to: ChatUser, mode: string, message: string }} data Chat data
       * @param {(error: boolean) => void} ack Ack
       */
      async (data, ack) => {
        // Request send
        const { id, to, message, mode } = data;
        /** @type {ChatUser} */
        const fromUser = socket.data;
        const rooms = this.getRooms(mode, to.id, fromUser.id, fromUser.room);
        this.getSockets(rooms).emit(EVENTS.USER_MESSAGE_CALLBACK, id, fromUser, data);
        logger.debug('to->', to);
        if(to.kind === KINDS.ROBOT) {
          data.to = fromUser;
          try {
            if(to.__id === ROBOTS.LLAMA) {
              data.message = await aiService.askLlama(data.message);
              this.getSockets(rooms).emit(EVENTS.USER_MESSAGE_CALLBACK, id, to, data);
            }
          }
          catch(error) {
            data.message = error.message;
            this.getSockets(rooms).emit(EVENTS.USER_MESSAGE_CALLBACK, id, to, data);
          }
        }
        if(typeof ack === 'function') ack();
      }
    );

    socket.on('leave',
      /**
       * Leave
       * @param {{ id: string, name: string, room: string }} user User data
       */
      async () => {
        /** @type {ChatUser} */
        const chatUser = socket.data;
        logger.warn(`### LEAVE ROOM ###`);
        logger.warn(chatUser);

        await socket.leave(chatUser.room);

        const users = await this.fetchUsers(chatUser.room, [ chatUser.room ], false);
        for (const u of users) {
          logger.warn(`[${u.id}]: ${u.name}`);
        }
        socket.disconnect(true);
        return this.getSockets(chatUser.room).emit(EVENTS.USER_LEAVE, { users, user: chatUser });
      }
    );

    // Transfer start (1)
    socket.on('transfer-start',
      /**
       * Start transfer data
       * @param {{ from: { id: string, name: string }, to: { id: string, name: string }, is_private: boolean, file: { id: string, size: number, name: string } }} info File information
       */
      (info) => {
        console.log('### START ###');
        console.log(info);
        socket.in(info.to.id).emit('transfer-chat', { file: info.file, from: info.from, to: info.to, is_private: info.is_private });
      }
    );

    socket.on('transfer-accept',
      /**
       * Accept data transfer
       * @param {{ from: { id: string, name: string }, to: { id: string, name: string }, is_private: boolean, file: { id: string, size: number, name: string } }} info File information
       */
      (info) => {
        // console.log('### ACCEPT ###');
        // console.log(info);
        socket.in(info.from.id).emit('transfer-start', { file: info.file, from: info.from, to: info.to, is_private: info.is_private });
      }
    );

    socket.on('transfer-reject',
      /**
       * Accept data transfer
       * @param {{ from: { id: string, name: string }, to: { id: string, name: string }, is_private: boolean, file: { id: string, size: number, name: string } }} info File information
       */
      (info) => {
        console.log('### REJECT ###');
        console.log(info);
        socket.in(info.from.id).emit('transfer-cancel', { file: info.file, from: info.from, to: info.to, is_private: info.is_private });
      }
    );

    socket.on('transfer-data',
      /**
       * Send trunk data
       * @param {{ from: { id: string, name: string }, to: { id: string, name: string }, is_private: boolean, file: { id: string, size: number, name: string } }} info File information
       * @param {Buffer} trunk Data trunk
       */
      (info, trunk) => {
        // console.log(`### DATA: ${trunk.length} ###`);
        // console.log(info);
        socket.in(info.to.id).emit('transfer-data', { file: info.file, from: info.from, to: info.to, is_private: info.is_private }, trunk);
      }
    );
  }
}

const socketManager = new SocketManager();

export default socketManager;
