import { HttpCodes } from "../config/vars";
import { DeviceInfo, DeviceProperties } from "../models/studio";
import { BaseService } from "./base";

const DEFAULT_DEVICE_ID = '6c6e0a2cc4d07963ad2nvh';

class StudioService extends BaseService {

  /**
   * Open device
   * @param {string} deviceId Device ID
   * @returns {Promise<DeviceInfo>} Returns result
   */
  async deviceInfo(deviceId = DEFAULT_DEVICE_ID) {
    try {
      const response = await fetch(this.getRequestPath(`/api/studio/device/info/${deviceId}`));
      if(response.status === HttpCodes.OK) {
        /** @type {{ result: DeviceInfo }} */
        const json = await response.json();
        return json.result;
      }
    }
    catch(error) {}
    return null;
  }

  /**
   * Get status of the device
   * @param {string} deviceId Device ID
   * @returns {Promise<DeviceProperties>} Returns result
   */
  async getDeviceProperties(deviceId = DEFAULT_DEVICE_ID, params = {}) {
    try {
      const queryString = this.toQueryString(params);
      const response = await fetch(this.getRequestPath(`/api/studio/device/status/${deviceId}?${queryString}`));
      if(response.status === HttpCodes.OK) {
        /** @type {{ result: DeviceProperties }} */
        const json = await response.json();
        return json.result;
      }
    }
    catch(error) {}
    return null;
  }

  /**
   * Set status of the device
   * @param {string} deviceId Device ID
   * @param {Object<string, any>} params New properties
   * @returns {Promise<DeviceProperties>} Returns result
   */
  async setDeviceProperties(deviceId = DEFAULT_DEVICE_ID, params = {}) {
    try {
      const response = await fetch(this.getRequestPath(`/api/studio/device/status/${deviceId}`), { method: 'POST', body: JSON.stringify({ properties: params }), headers: {
        'Content-Type': 'application/json'
      } });
      if(response.status === HttpCodes.OK) {
        /** @type {{ result: DeviceProperties }} */
        const json = await response.json();
        return json.result;
      }
    }
    catch(error) {}
    return null;
  }

  /**
   * Open/shutdown device
   * @param {string} deviceId Device ID
   * @returns {Promise<{}>} Returns result
   */
  async toggleDevice(deviceId = DEFAULT_DEVICE_ID, params = {}) {
    try {
      const queryString = this.toQueryString(params);
      console.log('queryString->', queryString);
      const url = this.getRequestPath(`/api/studio/socket/toggle/${deviceId}?${queryString}`);
      console.log('url->', url)
      const response = await fetch(url);
      if(response.status === HttpCodes.OK) {
        /** @type {{ result: DeviceInfo }} */
        const json = await response.json();
        return json.result;
      }
    }
    catch(error) {}
    return null;
  }

}

export const studioService = new StudioService();
