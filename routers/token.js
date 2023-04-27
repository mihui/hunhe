import { Router } from 'express';
import { httpError, httpCodes, httpMessages } from '../modules/http-manager.js';
import jwt from '../modules/jwt.js';
import { Logger } from '../modules/logger.js';
import { VARS } from '../modules/vars.js';
const { logger } = Logger('token');

const publicRouter = Router();
const publicPath = '/api/token';

/**
 * Generate JWT
 */
publicRouter.get('/generate', async (req, res, next) => {
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
publicRouter.post('/generate', async (req, res) => {
  const { sub, exp = VARS.JWT_DURATION } = req.headers;
  logger.debug(sub, exp);
  const expTime = Number(exp);
  const token = await jwt.generateToken(sub, expTime === Number.NaN ? exp : expTime, req.body ?? {});
  res.send({ token });
});

/**
 * Verify JWT
 */
publicRouter.get('/verify', async (req, res, next) => {
  try {
    const { token = '' } = req.headers;
    const result = await jwt.verifyToken(token);
    res.send(result.payload);
  }
  catch (error) {
    next(httpError(httpCodes.BAD_REQUEST, httpMessages.INVALID_TOKEN, error));
  }
});

publicRouter.get('/discovery', async (_req, res) => {
  res.send({ issuer: VARS.JWT_ISSUER, audience: VARS.JWT_AUDIENCE, url: VARS.JWT_ENDPOINT_URL });
});

export {
  publicPath,
  publicRouter
};
