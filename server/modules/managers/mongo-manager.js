import { VARS } from '../vars.js';
import { Logger } from '../logger.js'; 
import { Collection } from 'mongodb';
import { Db, MongoClient } from 'mongodb';
import { httpCodes, httpError, httpMessages } from '../http-manager.js';
const { logger } = Logger('mongo-manager');

class Mongo {

  /** @type {MongoClient} */
  #client;

  constructor() { }

  async boot() {
    if(VARS.MONGO_DB_URL.length === 0) {
      logger.warn('### NO DATABASE ###');
      return;
    }
    try {
      this.#client = await MongoClient.connect(VARS.MONGO_DB_URL);
      logger.log("### DATABASE READY ###");
    }
    catch (err) {
      logger.error('### DATABASE CONNECTION ERROR ###');
      logger.error(err);
    }
  }

  /**
   * Check the database connectivity
   * 
   * @returns {Promise<boolean>} If the database is connected
   */
  async isConnected(name = VARS.MONGO_DB_DATABASE_NAME) {
    try {
      const db = this.getDatabase(name);
      await db.command({ ping: 1 });
      return true;
    }
    catch(error) {}
    return false;
  }

  /**
   * Close mongodb connection
   * 
   * @param {boolean} force force closing the connection
   */
  close(force = false) {
    for (const connection of mongoose.connections) {
      logger.log(`### CLOSING CONNECTION: ${connection.name} ###`);
      connection.close(force);
    }
  }

  /**
   * Get mongodb database
   * 
   * @param {string} name Database name
   * @returns {Db} Database
   */
  getDatabase(name = VARS.MONGO_DB_DATABASE_NAME) {
    if(this.#client)
      return this.#client.db(name);
    throw httpError(httpCodes.SYSTEM_FAILURE, httpMessages.SYSTEM_FAILURE);
  }

  /**
   * Get collection
   * @param {string} name Collection name
   * @returns {Collection} Returns mongodb collection
   */
  getCollection(name, database = VARS.MONGO_DB_DATABASE_NAME) {
    return this.getDatabase(database).collection(name);
  }
}

const mongo = new Mongo();

export default mongo;
