declare namespace Express {
  export interface Request {

    /**
     * Client browser feature identity
     * @type {string}
     */
    clientId: string;
  }
}
