import { ExpressPeerServer } from 'peer';
import { PEER_INTERFACES, VARS } from '../vars.js';
import express from 'express';
import { Logger } from '../logger.js';
const { logger } = Logger('peer-manager');

class PeerManager {

  constructor() {}

  boot(sslOptions) {
    const app = express();
    let server = null;
    if (VARS.SSL) {
      sslOptions = {
        key: fs.readFileSync(`certs/ssl/tls.key`),
        cert: fs.readFileSync(`certs/ssl/tls.crt`)
      };
      server = https.createServer(sslOptions, app).listen(VARS.PEER_PORT, () => {
        console.log(`${VARS.APP_NAME} running with SSL enabled on:`);
        PEER_INTERFACES.forEach(item => {
          console.log(`\u001b[34m* ${item}${VARS.APP_CONTEXT}\u001b[0m`);
        });
      });
    }
    else {
      server = app.listen(VARS.PEER_PORT, () => {
        console.log(`${VARS.PEER_PORT} running on:`);
        PEER_INTERFACES.forEach(item => {
          console.log(`\u001b[34m* ${item}${VARS.APP_CONTEXT}\u001b[0m`);
        });
      });
    }

    const peerServer = ExpressPeerServer(server, {
      debug: true,
      path: '/audio',
      proxied: true,
      generateClientId: () => {
        return '';//(Math.random().toString(36) + "0000000000000000000").substring(2, 16);
      },
      ssl: sslOptions,
    });

    peerServer.on('connection', (client) => {
      logger.debug('### PEER CONNECTED ###');
      logger.debug(client.getId());
    });
    peerServer.on('disconnect', (client) => {
      logger.debug('### PEER DISCONNECTED ###');
      logger.debug(client.getId());
    });

    app.use(`${VARS.APP_CONTEXT}/live`, peerServer);
  }
}

const peerManager = new PeerManager();

export default peerManager;
