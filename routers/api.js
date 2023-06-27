import { Router } from 'express';
import { VARS } from '../modules/vars.js';
import { httpError, httpCodes, httpMessages } from '../modules/http-manager.js';
import jwt from '../modules/jwt.js';
import { Logger } from '../modules/logger.js';
const { logger } = Logger('token');
const publicRouter = Router();
const publicPath = '/api';

const reports = [];

/**
 * API endpoint
 */
publicRouter.get('/', async (req, res, next) => {
  return res.send({ status: httpCodes.OK, message: 'API endpoint' });
});

/**
 * Status SDK API - Get reports
 */
publicRouter.get('/status/report', (req, res, next) => {
  res.send(reports);
});

/**
 * Status SDK API - Reset report data
 */
publicRouter.get('/status/report/reset', (req, res, next) => {
  for(const report of reports) {
    reports.pop();
  }
  res.send(reports);
});

/**
 * Status SDK API - Receive report data
 */
publicRouter.post('/status/report/:id', async (req, res, next) => {
  const { id } = req.params;
  const { logs = '', status = '', cpu = {}, memory = '', store = false } = req.body;
  if(store)
    reports.push({ status, cpu, memory, logs });
  return res.send({ status: httpCodes.OK, id, message: 'This API is only used for serving Status Report Test. We do not store any data you post here.' });
});

/**
 * Generate JWT
 */
publicRouter.get('/token/generate', async (req, res, next) => {
  try {
    const { sub, exp = VARS.JWT_DURATION } = req.headers;
    logger.debug(sub, exp);
    const expTime = Number(exp);
    const token = await jwt.generateToken(sub, expTime === Number.NaN ? exp : expTime);
    return res.send({ token });
  }
  catch(error) {
    next(httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST, error));
  }
});

/**
 * Generate JWT with extra fields
 */
publicRouter.post('/token/generate', async (req, res) => {
  const { sub, exp = VARS.JWT_DURATION } = req.headers;
  logger.debug(sub, exp);
  const expTime = Number(exp);
  const token = await jwt.generateToken(sub, expTime === Number.NaN ? exp : expTime, req.body ?? {});
  res.send({ token });
});

/**
 * Verify JWT
 */
publicRouter.get('/token/verify', async (req, res, next) => {
  try {
    const { token = '' } = req.headers;
    const result = await jwt.verifyToken(token);
    res.send(result.payload);
  }
  catch (error) {
    next(httpError(httpCodes.BAD_REQUEST, httpMessages.INVALID_TOKEN, error));
  }
});

/**
 * Discover JWT
 */
publicRouter.get('/token/discovery', async (_req, res) => {
  res.send({ issuer: VARS.JWT_ISSUER, audience: VARS.JWT_AUDIENCE, url: VARS.JWT_ENDPOINT_URL });
});

export {
  publicPath,
  publicRouter
};
