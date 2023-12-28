import { Router } from 'express';
import { httpError, httpCodes, httpMessages, httpNormal } from '../modules/http-manager.js';
import { Logger } from '../modules/logger.js';

import { studioService } from '../modules/services/studio.js';

const { logger } = Logger('studio');

export const publicRouter = Router();
export const publicPath = '/api/studio';

/**
 * API endpoint
 */
publicRouter.get('/', async (req, res, next) => {
  return res.send({ status: httpCodes.OK, message: 'Studio API' });
});

/**
 * Open device by ID
 */
publicRouter.get('/device/info/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await studioService.deviceInfo(id);
    if(result) {
      return res.send(httpNormal({ result }));
    }
    return next(httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST));
  }
  catch(error) {}
  return next(httpError(httpCodes.SYSTEM_FAILURE, httpMessages.SYSTEM_FAILURE));
});

/**
 * Turn on/off socket
 */
publicRouter.get('/socket/toggle/:id', async (req, res, next) => {
  const { id } = req.params;
  const { codes = 'switch_1' } = req.query;
  try {
    const result = await studioService.getProperties(id, codes);
    if(result && result.properties && result.properties.length > 0) {
      const property = result.properties[0];
      const newProperty = { [codes]: !property.value };
      const toggleResult = await studioService.setProperties(id, newProperty);
      return res.send(httpNormal({ result: toggleResult }));
    }
    return next(httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST));
  }
  catch(error) {}
  return next(httpError(httpCodes.SYSTEM_FAILURE, httpMessages.SYSTEM_FAILURE));
});

/**
 * Get device properties
 */
publicRouter.get('/device/status/:id', async (req, res, next) => {
  const { id } = req.params;
  const { codes = 'switch_1' } = req.query;
  try {
    const result = await studioService.getProperties(id, codes);
    if(result && result.properties && result.properties.length > 0) {
      return res.send(httpNormal({ result }));
    }
    return next(httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST));
  }
  catch(error) {}
  return next(httpError(httpCodes.SYSTEM_FAILURE, httpMessages.SYSTEM_FAILURE));
});

/**
 * Set device properties
 */
publicRouter.post('/device/status/:id', async (req, res, next) => {
  const { id } = req.params;
  const { properties = {} } = req.body;

  try {
    const result = await studioService.setProperties(id, properties);
    return res.send(httpNormal({ result }));
  }
  catch(error) {}
  return next(httpError(httpCodes.SYSTEM_FAILURE, httpMessages.SYSTEM_FAILURE));
});
