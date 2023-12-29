import { DEFAULTS, Device } from "../models/meeting";
import { MessageTypes } from "../models/user";

class Storage {

  key = 'sessionStorage';
  /**
   * 
   * @param {'sessionStorage'|'localStorage'} key Storage key
   */
  use(key) {
    this.key = key;
  }

  /**
   * Determine if `window` object is safe to use
   * @returns {boolean} Returns boolean value to indicate if the `window` object is safe to use
   */
  isSafe() {
    return typeof (window) !== 'undefined';
  }
  /**
   * Save to local storage
   * @param {string} key Key
   * @param {*} data Data
   * @param {'string'|'json'|'number'|undefined} type Storage type
   */
  save(key, data, type = 'string') {
    if(this.isSafe()) {
      if(type === 'json') {
        try {
          data = JSON.stringify(data);
        }
        catch(error) { /* empty */ }
      }
      else if(type === 'number') {
        type = new String(data);
      }
      try {
        window[this.key].setItem(key, data);
      }
      catch(error) { /* empty */ }
      return true;
    }
    return false;
  }

  /**
   * Get data from local storage
   * @param {string} key Key
   * @param {*} defaultValue Defaut value if it is not stored yet
   * @param {'string'|'json'|'number'|undefined} type Storage type
   * @returns {string|number|object} Returns storage
   */
  get(key, defaultValue = '', type = 'string') {
    try {
      const val = window[this.key].getItem(key);
      if(val !== null) {
        if(type === 'json') {
          return JSON.parse(val);
        }
        else if(type === 'number') {
          return Number(val);
        }
        return val;
      }
    }
    catch(error) { /* empty */ }
    return defaultValue;
  }
};

class Utility {
  validateUUID(val) {
    return /^[a-z,0-9,-]{36,36}$/.test(val);
  }
  /**
   * Replace content with {number}
   * 
   * @param {string} str String
   * @param  {...any} args Arguments
   * @returns {string} Replaced string
   */
  format(str, ...args) {
    const matched = str.match(/{\d}/ig);
    matched.forEach((element, index) => {
      const identifiedIndex = Number(element.replace(/[{}]/g, ''));
      if(args.length > index) {
        str = str.replace(element, args[identifiedIndex] ?? '');
      }
    });
    return str;
  }
  /**
   * Get browser supported devices
   * @returns {Promise<Array<Device>>} Returns devices
   */
  async getDevices () {
    // Add default screen sharing input
    let systemDevices = [];
    try {
      systemDevices = await navigator.mediaDevices.enumerateDevices();
    }
    catch(error) { /* empty */ }
    try {
      systemDevices = systemDevices.concat(await navigator.mediaDevices.selectAudioOutput());
    }
    catch(error) { /* empty */ }
    return systemDevices;
  }

  /**
   * Get display media
   * @returns {MediaStream} Returns media stream
   */
  async getDisplayMedia (screenId = DEFAULTS.SCREEN, audioId = DEFAULTS.MICROPHONE, devices = []) {
    const video = { width: { max: 3840 }, height: { max: 2160 }, deviceId: undefined };
    const isScreenOnly = screenId === DEFAULTS.SCREEN || devices.findIndex(x => x.deviceId === screenId) === -1;
    if(isScreenOnly) {
      delete video.deviceId;
    }
    else {
      video.deviceId = screenId;
    }
    // Audio
    const audio = audioId === DEFAULTS.MICROPHONE ? true : { deviceId: audioId };
    /** @type {DisplayMediaStreamOptions|MediaStreamConstraints} */
    const constraints = { video, audio };
    // constraints.video.aspectRatio = 1;
    // If the device ID equas default screen share or can not find the selected device
    return isScreenOnly ?
      await navigator.mediaDevices.getDisplayMedia(constraints) :
      await navigator.mediaDevices.getUserMedia(constraints);
  }

  /**
   * Get user media
   * @returns {Promise<MediaStream>} Returns media stream
   */
  async captureUserAudio() {
    return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
  }

  /** @type {(stream: MediaStream) => void} */
  stopTracks (stream) {
    if(stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
    }
  }

  /** @type {(nativeElement: HTMLVideoElement|HTMLAudioElement) => void} */
  stopStream (nativeElement) {
    if(nativeElement) {
      this.stopTracks(nativeElement.srcObject);
      nativeElement.srcObject = null;
      nativeElement.pause();
    }
  }

  /**
   * If the user browser is Chromium based
   * @param {string} userAgent User agent string
   * @returns {boolean} Returns boolean value
   */
  isChromium(userAgent) {
    const ua = userAgent.toLowerCase();
    return ua.includes('chrome') || ua.includes('chromium');
  }

  /**
   * Create analyser
   * @param {MediaStream} stream Stream
   * @returns {AnalyserNode} Returns AnalyserNode instance
   */
  createAnalyser(stream, fftSize = 2048) {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      source.connect(analyser);
      return analyser;
    }
    catch(error) {}
    return null;
  }

  /**
   * Get average volume of AnalyserNode instance
   * @param {AnalyserNode} analyser AnalyserNode instance
   * @returns {number} Volume
   */
  getAverageVolume(analyser) {
    if(analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const averageVolume = sum / bufferLength;
      return Math.round((averageVolume / 150) * 100);
    }
    return 0;
  }

  /**
   * Request fullscreen
   * @param {HTMLElement} dom Element to request fullscreen
   * @returns {boolean} If it is OK to request fullscreen
   */
  requestFullScreen(dom) {
    const methods = ['requestFullscreen', 'mozRequestFullScreen', 'webkitRequestFullscreen', 'msRequestFullscreen', 'webkitEnterFullscreen'];
    try {
      for(const method of methods) {
        if(typeof dom[method] === 'function') {
          dom[method]();
          return true;
        }
      }
    }
    catch(error) {}
    return false;
  }

  /**
   * Determine if the Clipboard data is good
   * @param {string} base64 Base64 string
   * @returns {boolean} Returns value to indicate if the base64 string is valid
   */
  isBase64StringValid(base64) {
    return /^data:image\/\w+;base64,.+/i.test(base64);
  }

  /**
   * Is chat content with binary
   * @param {number} type Type of chat content
   * @returns {boolean} Returns true if it is for attachments, false otherwise
   */
  isBinary(type) {
    return type === MessageTypes.Binary;
  }
}

export const Events = {
  SocketConnected: 'SocketConnected',
  ClientError: 'ClientError',
  JoinScreenShare: 'JoinScreenShare',
  JoinScreenShareCallback: 'JoinScreenShareCallback',
  StopScreenShareCallback: 'StopScreenShareCallback',
  StartScreenShareCallback: 'StartScreenShareCallback',
  ClientNotification: 'ClientNotification',
  UserMessage: 'UserMessage',
  UpdateMeeting: 'UpdateMeeting',
  PeerVideoCall: 'PeerVideoCall',
  PeerAudioCall: 'PeerAudioCall'
};

class Beeper {
  /** @type {[ key: string, value: { [ string ]: () => * } ]} */
  topics = {};
  constructor() {}

  /**
   * Subscribe event
   * @param {string} topic Topic name
   * @param {(data: *) => void} listener Listener
   */
  subscribe(topic, listener) {
    if(Object.hasOwn(this.topics, topic) === false)
      this.topics[topic] = {};

    const id = crypto.randomUUID();
    this.topics[topic][id] = listener;
    return () => {
      this.topics[topic][id] = null;
      delete this.topics[topic][id];
    };
  }

  /**
   * Publish event
   * @param {string} eventName Event name
   * @param {*} data Data
   */
  publish(topic, data) {
    if (Object.hasOwn(this.topics, topic) === false) return;

    Object.values(this.topics[topic]).forEach(functionCall => {
      if (functionCall) functionCall(data);
    });
  }

}

export const storage = new Storage();

export const utility = new Utility();

export const beeper = new Beeper();
