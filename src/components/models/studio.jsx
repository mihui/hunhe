
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
