import dotenv from 'dotenv';
import os from 'os';

dotenv.config();
const networkInterfaces = os.networkInterfaces();
const defaults = {
  appName: 'Hunhe',
  appPort: 8080,
  appContext: '',
  appAddress: 'https://hunhe.app.com',
  //
  jwtIssuer: 'Hunhe Studio', // urn:example:issuer
  jwtAudience: 'Hunhe Studio Users', // urn:example:audience
  jwtDuration: '10h',
  jwtAlgorithm: 'PS256',
  jwtEndpointUrl: 'https://hunhe.app.com/api/token',
  peerPort: 9090
};

const processor = {
  isSSL: () => {
    return process.env.APP_SSL === 'true';
  },
  isDebugging: () => {
    return process.env.IS_DEBUGGING === 'true';
  },
  getAppPort: (isNumber = true) => {
    let port = process.env.APP_PORT ? Number(process.env.APP_PORT) : defaults.appPort;
    if (isNumber) {
      return port;
    }
    return (port === 80 || port === 443) ? '' : `:${port}`;
  },
  getPeerPort: (isNumber = true) => {
    let port = process.env.PEER_PORT ? Number(process.env.PEER_PORT) : defaults.peerPort;
    if (isNumber) {
      return port;
    }
    return (port === 80 || port === 443) ? '' : `:${port}`;
  },
  getInterfaces: (portString = processor.getAppPort(false)) => {
    let listOfInterfaces = [];
    const protocol = processor.isSSL() ? 'https' : 'http';
    listOfInterfaces.push(`${protocol}://localhost${portString}`);

    for (const i in networkInterfaces) {
      const item = networkInterfaces[i];
      item.forEach(inf => {
        const family = inf.family;
        if('IPv4' === family) {
          const url = `${protocol}://${inf.address}${portString}`;
          listOfInterfaces.push(url);
        }
      });
    }
    return listOfInterfaces;
  },
  getHost: () => {
    return process.env.APP_HOST ?? defaults.appHost;
  },
  getProtocol: () => {
    return process.env.APP_PROTOCOL ?? defaults.appProtocol;
  },
  getAddress: () => {
    let addr = process.env.APP_ADDRESS ?? defaults.appAddress;
    while(addr.slice(-1) === '/') {
      addr = addr.substring(0, addr.length - 1);
    }
    return `${addr}${processor.getAppPort(false)}`;
  }, 
  getContextPath: () => {
    return (process.env.APP_CONTEXT || process.env.APP_CONTEXT === '') ? process.env.APP_CONTEXT : defaults.appContext;
  }
};

const VARS = {
  // Application
  APP_ADDRESS: process.env.APP_NAME ?? defaults.appAddress,
  APP_NAME: process.env.APP_NAME ?? defaults.appName,
  APP_PORT: processor.getAppPort(),
  APP_CONTEXT: process.env.APP_CONTEXT ?? defaults.appContext,

  // SSL
  SSL: processor.isSSL(),
  // Debug
  IS_DEBUGGING: processor.isDebugging(),
  // JWT
  JWT_ISSUER: process.env.JWT_ISSUER ?? defaults.jwtIssuer,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE ?? defaults.jwtAudience,
  JWT_DURATION: process.env.JWT_DURATION ?? defaults.jwtDuration,
  JWT_ENDPOINT_URL: process.env.JWT_ENDPOINT_URL ?? defaults.jwtEndpointUrl,
  JWT_ALGORITHM: process.env.JWT_ALGORITHM ?? defaults.jwtAlgorithm,
  MONGO_DB_URL: process.env.MONGO_DB_URL ?? 'mongodb://localhost:27017',
  MONGO_DB_DATABASE_NAME: process.env.MONGO_DB_DATABASE_NAME ?? 'hunhe',
  //
  CHAT_LOBBY_ID: '00000000-0000-0000-0000-000000000000',
  CHAT_PEER_SECRET: process.env.CHAT_PEER_SECRET ?? 'hunhe',
  PEER_PORT: processor.getPeerPort()
};

BigInt.prototype.toJSON = function() {
  return this.toString();
};
console.info('### VARS ###');
console.info(VARS);
const HTTP_INTERFACES = processor.getInterfaces();
const PEER_INTERFACES = processor.getInterfaces(processor.getPeerPort(false));

export {
  VARS,
  HTTP_INTERFACES,
  PEER_INTERFACES
};
