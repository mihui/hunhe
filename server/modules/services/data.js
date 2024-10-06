
import { Collection } from "mongodb";
import mongoManager from '../managers/mongo-manager.js';
import { Comment, Meeting } from '../models/chat.js';
import { APP_ID_STUDIO } from "../models/studio.js";

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
   * Find document
   * @param {import('mongodb').Filter<import("mongodb").Document>} filter - The filter used to select the document to update
   * @param {import('mongodb').FindOptions} opts - Optional settings for the command
   * @returns {Promise<import("mongodb").WithId<import("mongodb").Document>} Returns update result
   */
  async findMany(filter, opts = {}) {
    const data = await this.getCollection().find(filter, opts).toArray();
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

    if(result) {
      return result;
    }
    return null;
  }
}

class DeviceService extends BaseDataService {
  constructor() {
    super('api');
  }

  /**
   * Store app token
   * @param {string} appId Application ID
   * @param {{ access_token: string, refresh_token: string, expire_time: number }} data Meeting data to be updated
   */
  async storeToken(appId = APP_ID_STUDIO, { access_token, refresh_token, expire_time }) {
    const result = await this.update({ app_id: appId }, { access_token, refresh_token, expire_time });

    if(result) {
      return result;
    }
    return null;
  }
}

class CommentService extends BaseDataService {
  constructor() {
    super('comment');
  }

  /**
   * Query Comments
   * @param {Object.<string, any>} query Query
   * @param {import('mongodb').FindOptions} opts Find options
   * @returns {Promise<Comment>} Returns meeting data
   */
  async queryComments(query, opts = {}) {
    const data = await this.findMany(query, opts);
    if(data)
      return data;
    return [];
  }

  /**
   * Create Comment
   * @param {string} clientId Client ID
   * @param {string} targetId Target ID
   * @param {string} content Comment
   * @returns {Promise<Comment>} Returns doc inserted
   */
  async createComment(clientId, targetId, content) {
    const comment = new Comment(clientId, targetId);
    comment.content = content;
    /** @type { import('mongodb').InsertOneResult } */
    const data = await this.update({ client_id: clientId, target_id: targetId }, comment);
    if(data.acknowledged) {
      return comment;
    }
    return null;
  }

}

export const meetingService = new MeetingService();

export const deviceService = new DeviceService();

export const commentService = new CommentService();
