const colors = {
  error: '\x1b[31m',
  success: '\x1b[32m',
  info: '\u001b[34m',
  warn: '\x1b[33m',
  debug: '\x1b[36m',
  log: '\x1b[37m',
  end: '\u001b[0m'
};

class Logger {
  name = '';
  constructor(name) {
    this.name = name.toUpperCase();
  }
  #log (args) {
    let messages = '';
    for (let i in args) {
      let message = '';
      if (typeof args[i] === 'object') {
        message = JSON.stringify(args[i]);
      }
      else if (typeof args[i] === 'function') {
        message = `func: ${args[i]}`;
      }
      else {
        message = args[i];
      }
      messages += `${message} `
    }
    return messages.trimEnd();
  }
  log (...args) {
    console.log(`${colors.log}| ${this.name} |${colors.end}`, `${colors.log}${this.#log(args)}${colors.end}`);
  }
  warn (...args) {
    console.warn(`${colors.warn}| ${this.name} |${colors.end}`, `${colors.warn}${this.#log(args)}${colors.end}`);
  }
  error (...args) {
    console.error(`${colors.error}| ${this.name} |${colors.end}`, `${colors.error}${this.#log(args)}${colors.end}`);
  }
  debug (...args) {
    console.debug(`${colors.debug}| ${this.name} |${colors.end}`, `${colors.debug}${this.#log(args)}${colors.end}`);
  }
  info (...args) {
    console.info(`${colors.info}| ${this.name} |${colors.end}`, `${colors.info}${this.#log(args)}${colors.end}`);
  }
};

const logger = (name) => {
  return {
    logger: new Logger(name)
  };
};

export { logger as Logger };
