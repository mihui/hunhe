
import { Collection } from "mongodb";
import mongoManager from '../managers/mongo-manager.js';
import { Meeting } from '../models/chat.js';

class BaseDataService {
  name = '';
  constructor(name) {
    this.name = name;
  }

  /**
   * Get collection
   * @returns {Collection} Returns mongodb Collection instance
   */
  getCollection() {
    const collection = mongoManager.getCollection(this.name);
    return collection;
  }

  /**
   * Update document
   * @param {import("mongodb").Filter<import("mongodb").Document>} doc - The filter used to select the document to update
   * @param {import("mongodb").InsertOneOptions} options - Optional settings for the command
   * @returns {Promise<import("mongodb").InsertOneResult<import("mongodb").Document>} Returns update result
   */
  async create(doc, options) {
    /** @type {import("mongodb").InsertOneOptions} */
    const defaultOpts = {};
    const opts = Object.assign({}, defaultOpts, options);
    const data = await this.getCollection().insertOne(doc, opts);
    return data;
  }

  /**
   * Find document
   * @param {import("mongodb").Filter<import("mongodb").Document>} filter - The filter used to select the document to update
   * @returns {Promise<import("mongodb").WithId<import("mongodb").Document>} Returns update result
   */
  async find(filter) {
    const data = await this.getCollection().findOne(filter);
    return data;
  }

  /**
   * Update document
   * @param {import("mongodb").Filter<import("mongodb").Document>} filter - The filter used to select the document to update
   * @param {import("mongodb").UpdateFilter<import("mongodb").Document>} update - The update operations to be applied to the document
   * @param {import("mongodb").FindOneAndUpdateOptions} options - Optional settings for the command
   * @returns {Promise<import("mongodb").ModifyResult<import("mongodb").Document>} Returns update result
   */
  async update(filter, update, options) {
    /** @type {import("mongodb").FindOneAndUpdateOptions} */
    const defaultOpts = { upsert: true, returnDocument: 'after' };
    const opts = Object.assign({}, defaultOpts, options);
    const data = await this.getCollection().findOneAndUpdate(filter, { $set: update }, opts);
    return data;
  }

  /**
   * Delete
   * @param {import("mongodb").Filter<import("mongodb").Document>} filter - The filter used to select the document to update
   * @returns {import("mongodb").DeleteResult} Returns delete result
   */
  async delete(filter) {
    const data = await this.getCollection().deleteOne(filter)
    return data;
  }

}

class MeetingService extends BaseDataService {
  constructor() {
    super('meeting');
  }

  /**
   * Create meeting
   * @param {number} maxUsers Max users
   * @returns {Promise<Meeting>} Returns doc inserted
   */
  async createMeeting(maxUsers) {
    const meeting = new Meeting();
    meeting.limitation = maxUsers;
    /** @type { import('mongodb').InsertOneResult } */
    const data = await this.create(meeting);
    if(data.acknowledged) {
      return meeting;
    }
    return null;
  }

  /**
   * Query meeting by ID
   * @param {string} id 
   * @returns {Promise<Meeting>} Returns meeting data
   */
  async queryMeetingById(id) {
    return await this.find({ id });
  }

  /**
   * Update meeting
   * @param {string} id Meeting ID
   * @param {{ subject: string, locked: boolean, limitation: number }} data Meeting data to be updated
   */
  async updateMeeting(id, { subject, locked, limitation }) {
    const result = await this.update({ id }, { subject, locked, limitation });
    if(result.ok) {
      return result.value;
    }
    return null;
  }
}

export const meetingService = new MeetingService();
