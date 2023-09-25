import { httpCodes } from './http-manager.js';

const healthChecker = {
  /**
   * Terminate app
   * @param {number} code Exit code
   */
  terminate: (code = 1) => {
    process.exit(code);
  },
  /**
   * Mount health check router
   * @param {import('express').Express} app App
   */
  mountCheck: (app) => {
    app.use('/api/health', (req, res, next) => {
      return res.send({ status: httpCodes.OK });
    });
  }
};

export default healthChecker;