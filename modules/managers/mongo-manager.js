import { VARS } from '../vars.js';
import { Logger } from '../logger.js'; 
import mongodb, { Collection } from 'mongodb';
import path from 'path';
import { Db, MongoClient } from 'mongodb';
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
    return this.#client.db(name);
  }

  /**
   * Get collection
   * @param {string} name Collection name
   * @returns {Collection} Returns mongodb collection
   */
  getCollection(name, database = VARS.MONGO_DB_DATABASE_NAME) {
    return this.getDatabase().collection(name);
  }
}

export default new Mongo();
