import express from 'express';
import { STATUS_CODES } from 'http';
import { Logger } from './logger.js';
import { VARS } from './vars.js';
const { logger } = Logger('http-manager');

const httpCodes = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_AUTHERIZED: 401,
  ACCESS_FORBIDDEN: 403,
  NOT_FOUND: 404,
  NOT_ACCEPTABLE: 406,
  CONFLICT: 409,
  SYSTEM_FAILURE: 500
};

const httpMessages = {
  OK: 'OK',
  BAD_REQUEST: 'Bad request',
  NOT_AUTHERIZED: 'Not Authorized',
  ACCESS_FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Not found',
  NOT_ACCEPTABLE: 'Not Acceptable',
  CONFLICT: 'Conflict',
  SYSTEM_FAILURE: 'System error',
  INVALID_TOKEN: 'Invalid access token',
  LINK_EXPIRED: 'Link expired',
};

const httpHelper = {
  /**
   * Replace content with {number}
   * 
   * @param {string} str String
   * @param  {...any} args Arguments
   * @returns {string} Replaced string
   */
  format: (str, ...args) => {
    const matched = str.match(/{\d}/ig);
    matched.forEach((element, index) => {
      const identifiedIndex = Number(element.replace(/[{}]/g, ''));
      if(args.length > index) {
        str = str.replace(element, args[identifiedIndex]);
      }
    });
    return str;
  }
};

/**
 * HTTP error handler
 * 
 * @param {Error} err Error
 * @param {express.Request} req Request
 * @param {express.Response} res Response
 * @param {express.NextFunction} next Next function
 */
const httpErrorHandler = (err, req, res, next) => {
  logger.debug('*** httpErrorHandler ***');
  if (res.headersSent) {
    return next(err);
  }
  // Initial code & message
  let data = { status: err.code, message: err.message };
  if (err.origin) {
    if (err.origin.code) {
      data.status = err.origin.code;
    }
  }
  // May use more friendly message instead
  if (err.data) {
    for (const v in err.data) {
      if(v === 'status' || v === 'message') continue;
      data[v] = err.data[v];
    }
  }
  // Validate HTTP status code
  // Fallback to the error code if the code is invalid
  const hasCode = Object.hasOwn(STATUS_CODES, data.status);
  if(hasCode === false) {
    data.status = err.code;
  }
  // else {
  //   data.message = http.STATUS_CODES[data.status];
  // }
  if (VARS.IS_DEBUGGING && err.origin) {
    data['origin'] = err.origin;
  }
  res.status(data.status).json(data);
  logger.error('### ERROR ###');
  console.error(data);
  logger.error('### /ERROR ###');
  next();
};

const httpNotFoundHandler = (req, res, next) => {
  logger.debug('httpNotFoundHandler');
  return res.status(404).send({ message: 'Route'+req.url+' Not found.' });
}

/**
 * Generate error for Express
 * 
 * @param {Number} code 
 * @param {string} message 
 * @param {Error} error 
 * @param {any} data 
 * @returns {Error} Error
 */
const httpError = (code, message, error, data) => {
  const newError = new Error(message);
  newError.code = code ?? httpCodes.BAD_REQUEST;
  if (data) newError.data = data;
  if (error) newError.origin = error;
  return newError;
};

const httpNormal = (payload) => {
  return Object.assign({ status: httpCodes.OK, message: httpMessages.OK }, payload);
};

export {
  httpCodes,
  httpMessages,
  httpHelper,
  httpNormal,
  httpError,
  httpErrorHandler,
  httpNotFoundHandler
};
