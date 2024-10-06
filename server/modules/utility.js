import crypto from 'crypto';

const colors = {
  error: '\x1b[31m',
  success: '\x1b[32m',
  info: '\u001b[34m',
  warn: '\x1b[33m',
  debug: '\x1b[36m',
  log: '\x1b[37m',
  end: '\u001b[0m'
};

class Utility {
  /**
   * Parse any types of data to boolean
   * 
   * @param {any} val Value to be parsed
   * @returns {Boolean} Returns boolean value
   */
  parseBool(val) {
    //
    let result = false;
    const type = typeof val;
    switch(type) {
      case 'string': {
        const value = val.trim().toLowerCase();
        result = (value === 'true' ? true : false);
        break;
      }
      case 'number':
        result = (val <= 0 ? false : true);
        break;
      case 'boolean':
        result = val;
        break;
      case 'undefined':
        result = false;
        break;
      default:
        result = Boolean(val);
    }
    return result;
  }

  /**
   * Parse any types of data to integer
   * 
   * @param {any} val Value to be parsed
   * @param {number} defaultValue Default value if can't parse the input
   * @return {number} Return number value
   */
  parseInt(val, defaultValue = 0) {
    let result = parseInt(val);
    if(isNaN(result)) {
      result = defaultValue;
    }
    return result;
  }

  /**
   * Hash string
   * 
   * @param {string|Object} value String to hash
   * @param {string} algorithm Algorithm
   * @param {'base64' | 'base64url' | 'hex' | 'binary'} encoding 
   * @returns {string} Returns hashed string
   */
  hash(value, algorithm = 'sha256', encoding = 'hex') {
    let toUpdate = '';
    if(value === null || value === undefined) {
      toUpdate = '';
    }
    else if(typeof value === 'boolean' || typeof value === 'number') {
      toUpdate = value.toString();
    }
    if(Array.isArray(value)) {
      toUpdate = value.join();
    }
    else if(typeof value === 'object') {
      toUpdate = JSON.stringify(value);
    }
    return crypto.createHash(algorithm).update(toUpdate).digest(encoding);
  }

}

export const utility = new Utility();

