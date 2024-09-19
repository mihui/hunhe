import { Router } from 'express';
import { VARS } from '../modules/vars.js';
import { httpError, httpCodes, httpMessages } from '../modules/http-manager.js';
import jwt from '../modules/jwt.js';
import { Logger } from '../modules/logger.js';
import mongo from '../modules/managers/mongo-manager.js';
import axios from 'axios';
const { logger } = Logger('token');
const publicRouter = Router();
const publicPath = '/api';

const reports = [];

const httpClient = axios.create({
  headers: {
    "User-Agent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0'
  }
});

/**
 * API endpoint
 */
publicRouter.get('/', async (req, res, next) => {
  return res.send({ status: httpCodes.OK, message: 'API endpoint' });
});

/**
 * Health API
 */
publicRouter.get('/health', async (req, res, next) => {
  if(await mongo.isConnected())
    return res.send({ status: httpCodes.OK, message: 'OK' });
  return next(httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST));
});

/**
 * Request delegate
 */
publicRouter.get('/fetch', async (req, res, next) => {
  const { url, method = 'GET' } = req.query;
  try {
    const response = await httpClient.request({ url, method });
    const origin = url.substring(0, url.lastIndexOf('/'));

    if(response.status === httpCodes.OK) {
      const content = response.data;
      const list = content.split('\n');
      let result = '';
      for(const line of list) {
        if(line.startsWith('#')) {
          result = result.concat(line);
        }
        else if(line) {
          result = result.concat(url.startsWith('http://') ? VARS.APP_ADDRESS.concat('/api/feed?url=').concat(origin) : origin).concat('/').concat(line);
        }
        result = result.concat('\n');
      }
      return res.send(result);
    }
  }
  catch(error) {}
  return res.send('');
});

publicRouter.get('/feed', async (req, res, next) => {
  const { url } = req.query;
  try {
    const response = await httpClient.request({ url, responseType: 'stream' });
    return response.data.pipe(res);
  }
  catch(error) {}
  return res.send();
});

/**
 * Request delegate
 */
publicRouter.post('/fetch', async (req, res, next) => {
  /** @type {{ url: string, method: string }} */
  const { url = '', method = 'GET' } = req.body;
  const urls = url.split('#');

  for(const item of urls) {
    try {
      const response = await httpClient.request({ url: item, method });
      if(response.status === httpCodes.OK) {
        return res.send({ url: item });
      }
    }
    catch(error) {

    }
  }
  return res.send('');
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
  while(reports.length > 0) {
    reports.pop();
  }
  res.send(reports);
});

/**
 * Status SDK API - Receive report data
 */
publicRouter.post('/status/report/:id', async (req, res, next) => {
  const { id } = req.params;
  const { logs = '', status = '', cpu = {}, memory = '' } = req.body;
  const { store = false } = req.headers;
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
