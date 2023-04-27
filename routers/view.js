import { Router } from 'express';
import { httpError, httpCodes, httpMessages } from '../modules/http-manager.js';
import jwt from '../modules/jwt.js';
import { Logger } from '../modules/logger.js';
import { VARS } from '../modules/vars.js';
import mongoManager from '../modules/managers/mongo-manager.js';
const { logger } = Logger('view');

const publicRouter = Router();
const publicPath = '/';

/**
 * Home page
 */
publicRouter.get('/', async (req, res, next) => {
  try {
    return res.render('index', { });
  }
  catch(error) {
    return next(httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST, error));
  }
});

/**
 * Home page
 */
publicRouter.get('/chat', async (req, res, next) => {
  try {
    return res.render('chat', {  });
  }
  catch(error) {
    return next(httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST, error));
  }
});

export {
  publicPath,
  publicRouter
};
