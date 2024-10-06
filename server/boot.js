import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

import express, { static as staticModule, json } from 'express';

import { VARS, HTTP_INTERFACES } from './modules/vars.js';
import { clientIdHandler, httpErrorHandler, httpNotFoundHandler } from './modules/http-manager.js';
import { sessionService } from './modules/services/session.js';
import { Logger } from './modules/logger.js';
import mongoManager from './modules/managers/mongo-manager.js';
import health from './modules/health.js'
import socketManager from './modules/managers/socket-manager.js';
import peerManager from './modules/managers/peer-manager.js'

import { globSync } from 'glob';
import cors from 'cors';

const { logger } = Logger('boot');

class Boot {
  app = express();
  /** @type {http.Server|https.Server} */
  server = null;
  serverOptions = {};

  http() {
    if (VARS.SSL) {
      this.serverOptions = {
        key: fs.readFileSync(`certs/ssl/tls.key`),
        cert: fs.readFileSync(`certs/ssl/tls.crt`)
      };
      return https;
    }
    this.serverOptions = {};
    return http;
  }

  initServer() {
    this.server = VARS.SSL ? this.http().createServer(this.serverOptions, this.app) : this.http().createServer(this.app);
  }

  startServer() {
    this.server.listen(VARS.APP_PORT, () => {
      console.log(`${VARS.APP_NAME} running${VARS.SSL?` with SSL`: ''} enabled on:`);
      HTTP_INTERFACES.forEach(item => {
        console.log(`\u001b[34m* ${item}${VARS.APP_CONTEXT}\u001b[0m`);
      });
    });
  }

  setup() {

    this.app.set('trust proxy', 1);

    this.app.use(staticModule('server/public'));
    this.app.use(json());
    this.app.set('view engine', 'ejs');
    this.app.set('views', 'server/views');
    this.app.set('x-powered-by', false);

    this.app.use(clientIdHandler);

    if(VARS.IS_DEBUGGING)
      this.app.use(cors({ origin: true, credentials: true }));

    health.mountCheck(this.app);

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
          this.app.use(prefixPublic, publicRouter);
        }
        if (privateRouter && privatePath) {
          const prefixPrivate = `${VARS.APP_CONTEXT}${privatePath}`;
          logger.info(`Secured: ${prefixPrivate}`);
          this.app.use(prefixPrivate, sessionService.authenticate(), privateRouter);
        }
      
        if(sequence === list.length) {
          logger.debug('### COMPLETED DYNAMIC IMPORT ###');
          this.app.use(httpErrorHandler);
        }
      }
    }).catch(error => {
      health.terminate();
      logger.error(error.stack);  
    });

    this.initServer();
    this.startServer();

    socketManager.boot(this.server);
    peerManager.boot(this.serverOptions);
  }
}

const BOOT = new Boot();

export default BOOT;
