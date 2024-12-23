import { VARS } from '../vars.js';
import { Logger } from '../logger.js'; 
import { Server, Socket } from 'socket.io';
import { ChatUser, Meeting } from '../models/chat.js';
import { meetingService } from '../services/data.js';
import { httpCodes } from '../http-manager.js';
import { CHAT_ROLES, chatService } from '../services/chat.js';

const { logger } = Logger('socket-manager');

const ROOM = {
  DEFAULT: VARS.CHAT_LOBBY_ID,
};

const STATUS = {
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
  AI_MESSAGE_CALLBACK: 'client:ai:message',
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

const Kinds = {
  PERSON: 1,
  ROBOT: 2,
  ALL: 3,
};

const MODES = {
  PUBLIC: 'Public',
  PRIVATE: 'Private'
};

class AI {
  static __id = '__ai';
}

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
      this.#io = new Server(server, { path: `${VARS.APP_CONTEXT}/api/messaging`, cors: { origin: '*' }, maxHttpBufferSize: 3e7, pingTimeout: 60000 });
      this.#io.on('connection', (socket) => {
        this.#onConnected(socket);
      });
      this.#io.on('disconnect', () => {
        console.log('error')
      })
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
    console.log('#onConnected');
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
    /**
     * Set user status
     * @param {number} browser Browser status
     * @param {number} microphone Microphone status
     * @param {string} emoji Emoji
     */
    (browser, microphone, emoji) => {
      setStatus({ browser, microphone, emoji });
      /** @type {ChatUser} */
      const user = socket.data;
      this.fetchUsers(user.room);
    });

    socket.on('server:meeting:update',
    /**
     * Update meeting information
     * @param {Meeting} meeting Meeting information
     */
    (meeting) => {
      /** @type {ChatUser} */
      const fromUser = socket.data;
      this.getSockets(fromUser.room).emit(EVENTS.MEETING_UPDATE_CALLBACK, fromUser, meeting);
    });

    socket.on('server:user:message',
      /**
       * @param {{ id: string, to: ChatUser, mode: string, message: string, type: number, messages: Array<{ content: string, role: 'user'|'assistant' }> }} data Chat data
       * @param {(error: boolean) => void} ack Ack
       */
      async (data, ack) => {
        // Request send
        const { id, to, mode, messages } = data;
        if(to) {
          /** @type {ChatUser} */
          const fromUser = socket.data;
          const rooms = this.getRooms(mode, to.id, fromUser.id, fromUser.room);
          this.getSockets(rooms).emit(EVENTS.USER_MESSAGE_CALLBACK, id, fromUser, data);
          if(to.id === AI.__id) {
            const chatId = crypto.randomUUID();
            const chatStream = await chatService.chat(
              messages, VARS.QIANFAN_DEFAULT_MODEL,
`你叫羊驼，在浑河聊天室里。你是一个健谈的家伙，很会陪人聊天解闷儿。你的答复要尽量详细，并且你会灵活的使用emoji表情。
这个网站的名称叫浑河网，1999年建立，版本号是 VII，用的是罗马数字，所以当前是第7个版本了，站长叫密辉。一下是浑河网的一些寄语：
浑河网又回来了，这里还是我们的个人主页。你还记得它最初的样子吗？
我们上一次更新还是在 2004 年，那时的版本代号停留在了 VI，那是一个我们这些老去的开发者头上还挂着“闪客”名头的时代，那是一个我们曾经的这些网吧小混混们还在当网管的时代。
我们回归的日子是2023年4月8日夜，版本代号 VII。
我们只想做最简单的网虫，存粹得一塌糊涂。
感谢啊Q们，感谢金冠（我在的网吧），感谢超越（啊Q们的据点），感谢派网吧（啊Q2000在的网吧）。`,
              true);

            for await (const chunk of chatStream) {
              const aiUser = to;
              const aiData = {
                ...data,
                id: chatId,
                to: {
                  ...fromUser,
                },
                mode,
                message: chunk.result,
                type: data.type,
                finished: chunk.is_end,
                end: chunk.need_clear_history
              };
              this.getSockets(rooms).emit(EVENTS.AI_MESSAGE_CALLBACK, chatId, aiUser, aiData);
            }
          }
          if(typeof ack === 'function') ack();
        }
      }
    );

    socket.on('server:leave',
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

  }
}

const socketManager = new SocketManager();

export default socketManager;
