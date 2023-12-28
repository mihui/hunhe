import VARS from '../config/vars';

export class BaseService {
  /**
   * 
   * @returns {string} Returns HTTP request URL
   */
  getRequestPath(path) {
    return `${VARS.IS_DEBUGGING ? VARS.APP_URL : ''}${path}`;
  }

  /**
   * Convert parameters to query string
   * @param {Object<string, any>} params Parameters
   * @returns {string} Returns query string
   */
  toQueryString(params = {}) {
    const listParams = [];
    for(const key in params) {
      const encodedKey = encodeURIComponent(key);
      const encodedVal = encodeURIComponent(params[key]);
      listParams.push(`${encodedKey}=${encodedVal}`);
    }
    return listParams.join('&');
  }
}
