import express, { static as staticModule, json } from 'express';
import https from 'https';
import fs from 'fs';

import { VARS, HTTP_INTERFACES } from './server/modules/vars.js';
import { httpErrorHandler, httpNotFoundHandler } from './server/modules/http-manager.js';
import { sessionService } from './server/modules/services/session.js';
import { Logger } from './server/modules/logger.js';
import mongoManager from './server/modules/managers/mongo-manager.js';
import health from './server/modules/health.js'
import socketManager from './server/modules/managers/socket-manager.js';
import { globSync } from 'glob';
import cors from 'cors';

import path from 'path';

import peerManager from './server/modules/managers/peer-manager.js'

const { logger } = Logger('boot');

const app = express();

app.use(cors({ origin: true, credentials: true }));

app.set('trust proxy', 1);

app.use(staticModule('server/public'));
app.use(json());
app.set('view engine', 'ejs');
app.set('views', 'server/views');
app.set('x-powered-by', false);

health.mountCheck(app);

mongoManager.boot().then(async() => {

  const list = globSync(path.resolve('server/routers/**/*.js'));

  let sequence = 0;
  for(const i in list) {
    sequence++;
    const filePath = list[i];
    logger.log(`[${sequence}/${list.length}] Router: ${filePath}`);
    /**
     * @type {{ publicPath: string, publicRouter: express.Router, privatePath: string?, privateRouter: express.Router? }} router Router
     */
    const { publicPath, publicRouter, privatePath, privateRouter } = await import(filePath);
  
    if(publicRouter && publicPath) {
      const prefixPublic = `${VARS.APP_CONTEXT}${publicPath}`;
      logger.info(`Public: ${prefixPublic}`);
      app.use(prefixPublic, publicRouter);
    }
    if (privateRouter && privatePath) {
      const prefixPrivate = `${VARS.APP_CONTEXT}${privatePath}`;
      logger.info(`Secured: ${prefixPrivate}`);
      app.use(prefixPrivate, sessionService.authenticate(), privateRouter);
    }
  
    if(sequence === list.length) {
      logger.debug('### COMPLETED DYNAMIC IMPORT ###');
      app.use(httpErrorHandler);
    }
  }

}).catch(error => {
  health.terminate();
  logger.error(error.stack);  
});


let server = null, sslOptions = {};
if (VARS.SSL) {
  sslOptions = {
    key: fs.readFileSync(`certs/ssl/tls.key`),
    cert: fs.readFileSync(`certs/ssl/tls.crt`)
  };
  server = https.createServer(sslOptions, app).listen(VARS.APP_PORT, () => {
    console.log(`${VARS.APP_NAME} running with SSL enabled on:`);
    HTTP_INTERFACES.forEach(item => {
      console.log(`\u001b[34m* ${item}${VARS.APP_CONTEXT}\u001b[0m`);
    });
  });
}
else {
  server = app.listen(VARS.APP_PORT, () => {
    console.log(`${VARS.APP_PORT} running on:`);
    HTTP_INTERFACES.forEach(item => {
      console.log(`\u001b[34m* ${item}${VARS.APP_CONTEXT}\u001b[0m`);
    });
  });
}

socketManager.boot(server);
peerManager.boot(sslOptions);

export default app;
