import express from 'express';
import { httpCodes, httpMessages, httpError } from '../http-manager.js';
import jwt from '../jwt.js';

class VerifyPayload {
  success = false;
  data = {};
  error = null;
  constructor() {}
}

class SessionService {

  /**
   * Verify token
   * 
   * @param {string} token 
   * @returns {Promise<VerifyPayload>} Verified data
   */
  async verifyToken (token) {
    let verifyPayload = new VerifyPayload();
    try {
      const result = await jwt.verifyToken(token);
      verifyPayload.success = true;
      verifyPayload.data = result.payload;
    }
    catch (error) {
      verifyPayload.error = error;
    }
    return verifyPayload;
  }

  /**
   * Authenticate the token
   *
   * @returns {express.Handler}
   */
  authenticate () {
    /**
     * Return middleware
     * 
     * @param {express.Request} req Request
     * @param {express.Response} res Response
     * @param {express.NextFunction} next Next handler
     * @returns {any} Anything
     */
     return async (req, res, next) => {
      const { token = '' } = req.headers;
      const result = await this.verifyToken(token);
      if(result.success) {
        req.user = result.data;
        return next();
      }

      return next(httpError(httpCodes.NOT_AUTHERIZED, httpMessages.NOT_AUTHERIZED));
    };
  }
}

const sessionService = new SessionService();

export {
  sessionService
};
