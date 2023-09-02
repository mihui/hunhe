const VARS = {
  APP_TITLE: process.env.NEXT_PUBLIC_APP_TITLE || '',
  APP_KEYWORDS: process.env.NEXT_PUBLIC_APP_KEYWORDS || '',
  APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://hunhe.app.com',
};

export default VARS;

export const StorageKeys = {
  User: 'User'
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

export const ROOMS = {
  DEFAULT: {
    ID: '00000000-0000-0000-0000-000000000000',
    SUBJECT: '聊天大厅',
    LIMITATION: 50,
    LOCKED: false,
    TIME: new Date()
  }
};

export const STATUS = {
  ONLINE: 1,
  AWAY: 2,
  OFFLINE: 3,
  AUDIO: 4,
  SPEAKING: 5,
  MUTED: 6,
};