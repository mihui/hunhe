import { Router } from 'express';
import { VARS } from '../modules/vars.js';
import { httpError, httpCodes, httpMessages, httpNormal } from '../modules/http-manager.js';
import { Logger } from '../modules/logger.js';
import { meetingService } from '../modules/services/data.js';
import { utility } from '../modules/utility.js';
import { MAX_USERS } from '../modules/models/chat.js';
const { logger } = Logger('chat');

export const publicRouter = Router();
export const publicPath = '/api/chat';

/**
 * API endpoint
 */
publicRouter.get('/', async (req, res, next) => {
  return res.send({ status: httpCodes.OK, message: 'Chat API' });
});

publicRouter.get('/meeting/:id', async (req, res, next) => {
  const { id } = req.params;
  /** @type {{ token: string }} */
  try {
    const meeting = await meetingService.queryMeetingById(id);
    if(meeting) {
      return res.send(httpNormal({ meeting }));
    }
    return next(httpError(httpCodes.NOT_FOUND, httpMessages.NOT_FOUND));
  }
  catch(error) {}
  return next(httpError(httpCodes.NOT_FOUND, httpMessages.NOT_FOUND));
});

publicRouter.post('/meeting', async (req, res, next) => {
  try {
    const { max_users: maxUsers = MAX_USERS } = req.body;
    const meeting = await meetingService.createMeeting(maxUsers);
    if(meeting) {
      return res.send(httpNormal({ meeting }));
    }
    return next(httpError(httpCodes.NOT_FOUND, httpMessages.NOT_FOUND));
  }
  catch(error) {
    return next(error);
  }
});

publicRouter.put('/meeting/:id', async (req, res, next) => {
  const { id } = req.params;
  const { subject, locked: lockedString, limitation: maxUsers = MAX_USERS } = req.body;
  const locked = utility.parseBool(lockedString);
  const limitation = utility.parseInt(maxUsers, MAX_USERS);
  console.log(id, subject, locked, limitation);

  try {
    if(id === VARS.CHAT_LOBBY_ID) {
      throw httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST);
    }
    const meeting = await meetingService.updateMeeting(id, { subject, locked, limitation });

    if(meeting) {
      return res.send(httpNormal({ meeting }));
    }
    throw httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST);
  }
  catch(error) {
    return next(httpError(httpCodes.NOT_FOUND, httpMessages.NOT_FOUND, error));
  }
});
