export const APP_ID_STUDIO = 'studio';

export class DeviceTokenPayload {
  /** @type {string} */
  access_token;
  /** @type {string} */
  refresh_token;
  /** @type {string} */
  uid;
  /** @type {number} */
  expire_time;
}

export class DeviceHeaderPayload {
  /** @type {string} */
  t;
  /** @type {string} */
  sign;
  /** @type {string} */
  client_id;
  /** @type {string} */
  sign_method;
  /** @type {string} */
  path;
  /** @type {string?} */
  access_token;
}

export class DeviceInfo {
  /** @type {string} */
  id;
  /** @type {string} */
  name;
  /** @type {string} */
  category;
  /** @type {string} */
  lat;
  /** @type {string} */
  lon;
  /** @type {string} */
  icon;
  /** @type {string} */
  model;
  /** @type {string} */
  product_name;
  /** @type {boolean} */
  is_online;
  /** @type {string} */
  uuid;
  /** @type {number} */
  active_time;
  /** @type {number} */
  create_time;
  /** @type {string} */
  time_zone;
}

export class DeviceProperty {
  /** @type {string} */
  code;
  /** @type {string} */
  custom_name;
  /** @type {number} */
  dp_id;
  /** @type {number} */
  time;
  /** @type {} */
  value;
}

export class DeviceProperties {
  /** @type {Array<DeviceProperty>} */
  properties;
}
