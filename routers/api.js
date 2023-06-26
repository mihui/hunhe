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
publicRouter.post('/status/report/:id', async (req, res, next) => {
  const { id } = req.params;
  return res.send({ status: httpCodes.OK, id, message: 'This API is only used for serving Status Report Test. We do not store any data you post here.' });
});

export {
  publicPath,
  publicRouter
};
