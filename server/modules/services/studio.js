import crypto from 'crypto';
import axios from 'axios';
import qs from 'qs';

import { VARS } from "../vars.js";
import { Logger } from '../logger.js';
import { DeviceHeaderPayload, DeviceInfo, DeviceProperties, DeviceTokenPayload } from '../models/studio.js';
const { logger } = Logger('studio');

const API_TOKEN_URL = '/v1.0/token?grant_type=1';

class StudioService {
  /** @type {import("axios").AxiosInstance} */
  #request;
  constructor() {
    this.#request = axios.create({
      baseURL: VARS.IOT_API_ENDPOINT
    });
  }

  #encrypt(str) {
    return crypto
      .createHmac('sha256', VARS.IOT_CLIENT_SECRET)
      .update(str, 'utf8')
      .digest('hex')
      .toUpperCase();
  }

  #hash(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Sign for the request
   * @param {string} time Time when request
   * @param {'GET'|'POST'|'PUT'|'DELETE'} method Method
   * @param {string} url URL
   * @param {object} body Request body
   * @param {string?} accessToken Access token
   * @returns {DeviceHeaderPayload} Returns signed string
   */
  #sign(method = 'GET', url = API_TOKEN_URL, query = {}, body = {}, accessToken = '') {
    const time = Date.now().toString();
    const contentHash = this.#hash(JSON.stringify(body));
    const stringToSign = [method, contentHash, '', url].join('\n');
    const signString = VARS.IOT_CLIENT_ID + accessToken + time + stringToSign;

    const [ uri, pathQuery ] = url.split('?');
    const queryMerged = Object.assign(query, qs.parse(pathQuery));
    const sortedQuery = {};
    Object.keys(queryMerged).sort().forEach((i) => (sortedQuery[i] = query[i]));
    const queryString = decodeURIComponent(qs.stringify(sortedQuery));
    const newUrl = queryString ? `${uri}?${queryString}` : uri;

    /** @type {DeviceHeaderPayload} */
    const headers = {
      t: time, sign: this.#encrypt(signString),
      client_id: VARS.IOT_CLIENT_ID, sign_method: 'HMAC-SHA256',
      path: newUrl
    };
    if(accessToken !== '') {
      headers.access_token = accessToken;
    }
    return headers;
  }

  /**
   * Generate headers for device commands
   * @param {string} url Request URL
   * @param {any} body Request body
   * @param {'GET'|'POST'|'DELETE'|'PUT'} method Method
   * @returns {Promise<{}>} Returns signed headers for device commands
   */
  async executeCommand(url, body = {}, method = 'GET', query = {}) {
    const { result: payload } = await this.fetchToken();
    const headers = this.#sign(method, url, query, body, payload.access_token);
    const { data } = await this.#request({ url: headers.path, method, headers, data: body, params: {} });
    if(data.success) {
      return data.result;
    }
    logger.error(data);
    throw new Error('Failed to execute the command');
  }

  /**
   * Fetch access token
   * @returns {Promise<{ code: number, msg: string, success: boolean, t: number, tid: string, result: DeviceTokenPayload }>} Returns authentication result
   */
  async fetchToken() {
    const method = 'GET';
    const headers = this.#sign(method, API_TOKEN_URL);
    /** @type {{ data: { code: number, msg: string, success: boolean, t: number, tid: string, result: DeviceTokenPayload } }} */
    const { data } = await this.#request({ url: API_TOKEN_URL, method, headers, data: {} });
    if(data.success) {
      return data;
    }
    logger.error(data);
    throw new Error('Failed to get the Access Token');
  }

  /**
   * 
   * @param {string} deviceId Device ID
   * @returns {Promise<DeviceInfo>}
   */
  async deviceInfo(deviceId) {
    const data = await this.executeCommand(`/v2.0/cloud/thing/${deviceId}`, {});
    return data;
  }

  /**
   * Set properties
   * @param {string} deviceId Device ID
   * @param {object} properties Device supported properties
   * @returns {Promise<object>} Returns result
   */
  async setProperties(deviceId, properties = {}) {
    const data = await this.executeCommand(`/v2.0/cloud/thing/${deviceId}/shadow/properties/issue`, { properties }, 'POST');
    return data;
  }

  /**
   * Query device status
   * @param {string} deviceId Device ID
   * @param {string} codes Device supported codes
   * @returns {Promise<DeviceProperties>} Returns result
   */
  async getProperties(deviceId, codes = '') {
    const data = await this.executeCommand(`/v2.0/cloud/thing/${deviceId}/shadow/properties?codes=${codes}`, {}, 'GET');
    return data;
  }
}

export const studioService = new StudioService();
