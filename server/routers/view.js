import { Router } from 'express';
import { httpError, httpCodes, httpMessages } from '../modules/http-manager.js';
import { Logger } from '../modules/logger.js';
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
