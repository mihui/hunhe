import { Router } from 'express';
import { httpCodes } from '../modules/http-manager.js';
const publicRouter = Router();
const publicPath = '/api';

/**
 * API endpoint
 */
publicRouter.get('/', async (req, res, next) => {
  return res.send({ status: httpCodes.OK });
});

/**
 * Status SDK API
 */
publicRouter.post('/status/report', async (req, res, next) => {
  return res.send({ status: httpCodes.OK });
});

export {
  publicPath,
  publicRouter
};
