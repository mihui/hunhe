/**
 * Transform Core
 */
import express, { static as staticModule, json } from 'express';
import { Socket, Server } from 'socket.io';
import https from 'https';
import fs from 'fs';
import glob from 'glob';

import { VARS, INTERFACES } from './modules/vars.js';
import { httpErrorHandler, httpNotFoundHandler } from './modules/http-manager.js';
import { sessionService } from './modules/services/session.js';
import { Logger } from './modules/logger.js';
import mongoManager from './modules/managers/mongo-manager.js';
import health from './modules/health.js'
import socketManager from './modules/managers/socket-manager.js';

const { logger } = Logger('boot');

const app = express();
app.set('trust proxy', 1);

app.use(staticModule('public'));
app.use(json());
app.set('view engine', 'ejs');
app.set('x-powered-by', false);

health.mountCheck(app);

mongoManager.boot().then(async() => {

}).catch(error => {
  health.terminate();
  logger.error(error.stack);  
});

glob.sync('./routers/**/*.js').forEach(async (file, index, array) => {
  const seq = index + 1;
  logger.log(`[${seq}/${array.length}] Router: ${file}`);
  /**
   * @type {{ publicPath: string, publicRouter: express.Router, privatePath: string?, privateRouter: express.Router? }} router Router
   */
  const router = await import(file);
  const publicPath = `${VARS.APP_CONTEXT}${router.publicPath}`;
  logger.info(`Public: ${publicPath}`);
  app.use(publicPath, router.publicRouter);

  if (router.privateRouter) {
    const privatePath = `${VARS.APP_CONTEXT}${router.privatePath}`;
    logger.info(`Secured: ${privatePath}`);
    app.use(privatePath, sessionService.authenticate(), router.privateRouter);
  }
  if(seq === array.length) {
    logger.debug('### COMPLETED DYNAMIC IMPORT ###');
    app.use(httpErrorHandler);
  }
});

let server;

if (VARS.SSL) {
  server = https.createServer({
    key: fs.readFileSync('certs/ssl/tls.key'),
    cert: fs.readFileSync('certs/ssl/tls.crt')
  }, app).listen(VARS.APP_PORT, () => {
    console.log(`${VARS.APP_NAME} running with SSL enabled on:`);
    INTERFACES.forEach(item => {
      console.log(`\u001b[34m* ${item}${VARS.APP_CONTEXT}\u001b[0m`);
    });
  });
}
else {
  server = app.listen(VARS.APP_PORT, () => {
    console.log(`${VARS.APP_PORT} running on:`);
    INTERFACES.forEach(item => {
      console.log(`\u001b[34m* ${item}${VARS.APP_CONTEXT}\u001b[0m`);
    });
  });
}

socketManager.boot(server);

export default app;