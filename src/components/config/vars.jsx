const VARS = {
  APP_TITLE: process.env.NEXT_PUBLIC_APP_TITLE || '',
  APP_KEYWORDS: process.env.NEXT_PUBLIC_APP_KEYWORDS || '',
  APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://hunhe.app.com',
  APP_HOST: '',
  IS_DEBUGGING: process.env.NEXT_PUBLIC_IS_DEBUGGING === 'true' || false,
  SWITCH_DEVICE_ID: process.env.NEXT_PUBLIC_SWITCH_DEVICE_ID || '6c84275675c0b09d64bo9n'
};

VARS.APP_HOST = new URL(VARS.APP_URL).host;

export default VARS;

export const StorageKeys = {
  User: 'User',
  AudioInputDeviceId: 'AudioInputDeviceId',
  VideoInputDeviceId: 'VideoInputDeviceId',
  AudioOutputDeviceId: 'AudioOutputDeviceId',
};

/** @type {Array<{ key: string, url: string }>} */
export const Avatars = [];

for(let i = 1; i <= 8; i++ ) {
  const sequence = i <= 9 ? `0${i}` : i;
  Avatars.push({
    key: sequence,
    url: `/images/avatars/${sequence}.png`
  });
}

export const HttpCodes = {
  OK: 200
};

export const CustomCodes = {
  PEERS_READY: 1,
  PEERS_INITIALIZED: 2,
  PEERS_ERROR: 3,
};

export const ROOMS = {
  DEFAULT: {
    ID: '00000000-0000-0000-0000-000000000000',
    SUBJECT: '聊天大厅',
    LIMITATION: 50,
    LOCKED: false,
    TIME: new Date()
  }
};
