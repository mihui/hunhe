declare namespace Express {
  export interface Request {

    /**
     * Is the user logged in
     * @returns {Boolean} true | false
     */
    isIn(): boolean;

    /**
     * @type {Payload} User data
     */
    hunheUser: Payload;
  }
}
