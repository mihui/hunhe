import { VARS } from '../vars.js';
import { Logger } from '../logger.js'; 
import { Server, Socket } from 'socket.io';
import ChatUser from '../models/chat-user.js';

const { logger } = Logger('socket-manager');

const EVERYONE = '__EVERYONE';
const CHATROOM = 'HUNHE';

class SocketManager {

  /** @type {Server} */
  #io;

  constructor() {}

  async boot(server) {
    this.#io = new Server(server, { path: `${VARS.APP_CONTEXT}/messaging` });
    this.#io.on('connection', (socket) => {
      this.#onConnected(socket);
    });
  }

  getSockets(room = CHATROOM) {
    return this.#io.sockets.in(room);
  }

  /**
   * 
   * @param {Socket} socket Socket instance
   */
  async #onConnected(socket) {
    logger.debug(`### SOCKET CONNECTED: ${socket.id} ###`);

    socket.on('disconnect', async () => {
      logger.warn('### SOCKET DISCONNECTED ###');
      logger.warn(socket.data);
      const sockets = await this.getSockets(socket.data.room).fetchSockets();
      for (const socket of sockets) {
        logger.warn(`[${socket.id}]: ${socket.data.nickname}`);
        logger.warn(socket.data);
      }
      const users = sockets.map(x => {
        return { nickname: x.data.nickname, id: x.id, sid: x.data.id };
      });
      return this.getSockets(socket.data.room).emit('users', users);
    });

    socket.on('login', async (data) => {
      const { nickname, id, room, is_reconnect } = data;
      logger.debug('### LOGIN ###');

      if(nickname.length === 0) { return socket.emit('rejected', { nickname }); }

      const oldSockets = await this.getSockets(room).fetchSockets();
      const foundUser = oldSockets.find(x => {
        return x.data.nickname.toLowerCase() === nickname.toLowerCase();
      });

      const isAllowed = foundUser ? foundUser.id === id : true;
      const sessionId = id || socket.id;
      const user = { id: socket.id, nickname, room, sid: sessionId };
      const channels = [];
      if(isAllowed) {
        socket.data.nickname = nickname;
        socket.data.id = sessionId;
        const newRoom = room || CHATROOM;
        channels.push(newRoom);
        if(is_reconnect) {
          channels.push(id);
          logger.warn(`### [${nickname}] RECONNECT: ${id}, ${socket.id} ###`);
        }
        console.log(channels);
        await socket.join(channels);
        socket.data.room = newRoom;
        const newSockets = await this.getSockets(room).fetchSockets();
        const users = newSockets.map(x => {
          return { nickname: x.data.nickname, id: x.id, sid: x.data.id };
        });
        return this.getSockets(room).emit('welcome', { users, user, room, is_reconnect });
      }
      return socket.emit('rejected', { nickname });
    });

    socket.on('chat',
      /**
       * Chat
       * @param {{ room: string, from: { id: string, nickname: string }, to: { id: string, nickname: string }, message: string, private: boolean }} data Chat data
       */
      async (data) => {
        const { room, from, to, message, is_private: isPrivate } = data;
        // const sockets = await this.getSockets(room).fetchSockets();
        // const p2p = [];

        if(isPrivate) {
          if(to.id === EVERYONE) {
            return socket.emit('chat', data);
          }
          this.getSockets(from.id).emit('chat', data);
          this.getSockets(to.id).emit('chat', data);
          // for(const x of sockets) {
          //   if([from.id, to.id].includes(x.id)) {
          //     x.emit('chat', data);
          //     p2p.push(x.id);
          //     if(p2p.length === 2) {
          //       logger.debug(p2p);
          //       break;
          //     }
          //   }
          // }
          //
        }
        else {
          return this.getSockets(room).emit('chat', data);
        }
      }
    );

    socket.on('leave',
      /**
       * Leave
       * @param {{ id: string, nickname: string, room: string }} data User data
       */
      async (user) => {
        logger.warn(`### LEAVE ROOM: ${user.room} ###`);
        socket.leave(user.room);
        socket.emit('leave', { user });
        const sockets = await this.getSockets(user.room).fetchSockets();
        for (const socket of sockets) {
          logger.warn(`[${socket.id}]: ${socket.data.nickname}`);
        }
        const users = sockets.map(x => {
          return { nickname: x.data.nickname, id: x.id, rooms: x.rooms };
        });
        return this.getSockets(user.room).emit('leave', { users, user });
      }
    );

    // Transfer start (1)
    socket.on('transfer-start',
      /**
       * Start transfer data
       * @param {{ from: { id: string, nickname: string }, to: { id: string, nickname: string }, is_private: boolean, file: { id: string, size: number, name: string } }} info File information
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
       * @param {{ from: { id: string, nickname: string }, to: { id: string, nickname: string }, is_private: boolean, file: { id: string, size: number, name: string } }} info File information
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
       * @param {{ from: { id: string, nickname: string }, to: { id: string, nickname: string }, is_private: boolean, file: { id: string, size: number, name: string } }} info File information
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
       * @param {{ from: { id: string, nickname: string }, to: { id: string, nickname: string }, is_private: boolean, file: { id: string, size: number, name: string } }} info File information
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

export default new SocketManager();
