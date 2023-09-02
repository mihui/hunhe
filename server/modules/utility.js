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
}

export const utility = new Utility();

