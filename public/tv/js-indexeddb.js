// M3U list store
const M3U_STORE = 'm3u-store';
// Favorites
const FAV_STORE = 'fav-store';
// The status cache of the playlist item
const STA_STORE = 'sta-store';

/**
 * 数据库类，封装了IndexedDB的操作
 */
class Database {
  /**
   * 构造函数，初始化数据库版本和名称
   * @param {number} dbVersion - 数据库版本，默认为1
   * @param {string} dbName - 数据库名称，默认为'm3u'
   */
  constructor(dbVersion = 1, dbName = 'm3u') {
    this.dbName = dbName; // 数据库名称
    this.dbVersion = dbVersion; // 数据库版本
    this.db = null; // 数据库实例
  }

  /**
   * 打开数据库方法
   * @returns {Promise} - 返回一个Promise对象，解析为数据库实例
   */
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion); // 创建打开数据库的请求
      request.onblocked = (event) => {
        // 如果其他标签页已经加载了数据库，则需要先关闭它
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result; // 获取数据库实例
        try {
          db.createObjectStore(M3U_STORE, { keyPath: "id" }); // 创建存储对象
        } catch (error) {}

        try {
          db.createObjectStore(FAV_STORE, { keyPath: "id" }); // 创建存储对象
        } catch (error) {}

        try {
          db.createObjectStore(STA_STORE, { keyPath: "id" }); // 创建存储对象
        } catch (error) {}

        db.onversionchange = (event) => {
          db.close(); // 当版本变化时，关闭数据库
        };
      };

      request.onsuccess = (event) => {
        this.db = event.target.result; // 在成功时，保存数据库实例
        resolve(this.db); // 解析Promise为数据库实例
      };

      request.onerror = (event) => {
        reject(event.target.error); // 在错误时，拒绝Promise为错误
      };
    });
  }

  /**
   * 添加数据到数据库
   * @param {Object} data - 要添加的数据对象
   * @param {string} storeName - 存储对象名称，默认为M3U_STORE
   * @returns {Promise} - 返回一个Promise对象，解析为添加操作的结果
   */
  async addData(data, storeName = M3U_STORE) {
    const db = await this.openDB(); // 打开数据库
    const transaction = db.transaction(storeName, "readwrite"); // 创建事务
    const store = transaction.objectStore(storeName); // 获取存储对象
    const request = store.add(data); // 添加数据

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result); // 在成功时，解析Promise为结果
      };

      request.onerror = () => {
        reject(request.error); // 在错误时，拒绝Promise为错误
      };
    });
  }

  /**
   * 读取数据库中的数据
   * @param {number} id - 数据的ID
   * @param {string} storeName - 存储对象名称，默认为M3U_STORE
   * @returns {Promise} - 返回一个Promise对象，解析为读取到的数据对象
   */
  async readData(id, storeName = M3U_STORE) {
    const db = await this.openDB(); // 打开数据库
    const transaction = db.transaction(storeName, "readonly"); // 创建只读事务
    const store = transaction.objectStore(storeName); // 获取存储对象
    const request = store.get(id); // 获取数据

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result); // 在成功时，解析Promise为结果
      };

      request.onerror = () => {
        reject(request.error); // 在错误时，拒绝Promise为错误
      };
    });
  }

  /**
   * 更新数据库中的数据
   * @param {Object} data - 要更新的数据对象
   * @param {string} storeName - 存储对象名称，默认为M3U_STORE
   * @returns {Promise} - 返回一个Promise对象，解析为更新操作的结果
   */
  async updateData(data, storeName = M3U_STORE) {
    const db = await this.openDB(); // 打开数据库
    const transaction = db.transaction(storeName, "readwrite"); // 创建事务
    const store = transaction.objectStore(storeName); // 获取存储对象
    const request = store.put(data); // 更新数据

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result); // 在成功时，解析Promise为结果
      };

      request.onerror = () => {
        reject(request.error); // 在错误时，拒绝Promise为错误
      };
    });
  }

  /**
   * 从数据库中删除数据
   * @param {number} id - 要删除的数据的ID
   * @param {string} storeName - 存储对象名称，默认为M3U_STORE
   * @returns {Promise} - 返回一个Promise对象，解析为删除操作的结果
   */
  async deleteData(id, storeName = M3U_STORE) {
    const db = await this.openDB(); // 打开数据库
    const transaction = db.transaction(storeName, "readwrite"); // 创建事务
    const store = transaction.objectStore(storeName); // 获取存储对象
    const request = store.delete(id); // 删除数据

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result); // 在成功时，解析Promise为结果
      };

      request.onerror = () => {
        reject(request.error); // 在错误时，拒绝Promise为错误
      };
    });
  }

  /**
   * 列出存储对象中的所有数据
   * @param {string} storeName - 存储对象名称，默认为M3U_STORE
   * @returns {Promise} - 返回一个Promise对象，解析为数据列表
   */
  async listData(storeName = M3U_STORE) {
    const db = await this.openDB(); // 打开数据库
    const transaction = db.transaction(storeName, "readonly"); // 创建只读事务
    const store = transaction.objectStore(storeName); // 获取存储对象
    let request = store.openCursor(); // 打开游标
    const list = []; // 保存数据列表

    return new Promise((resolve, reject) => {
      request.onsuccess = (evt) => {
        const cursor = evt.target.result; // 获取游标
        if (cursor) {
          list.push(cursor.value); // 将数据添加到列表中
          cursor.continue(); // 继续遍历
        } else {
          resolve(list); // 在遍历完成后，解析Promise为列表
        }
      };

      request.onerror = () => {
        reject(request.error); // 在错误时，拒绝Promise为错误
      };
    });
  }

  /**
   * 清空存储对象中的所有数据
   * @param {string} storeName - 存储对象名称，默认为FAV_STORE
   * @returns {Promise} - 返回一个Promise对象，解析为清空操作的结果
   */
  async purgeData(storeName = FAV_STORE) {
    const db = await this.openDB(); // 打开数据库
    const transaction = db.transaction(storeName, "readwrite"); // 创建事务
    const store = transaction.objectStore(storeName); // 获取存储对象
    const request = store.clear(); // 清空数据

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result); // 在成功时，解析Promise为结果
      };

      request.onerror = () => {
        reject(request.error); // 在错误时，拒绝Promise为错误
      };
    });
  }

  /**
   * 计算数据库中所有数据的总大小
   * @returns {Promise} - 返回一个Promise对象，解析为包含总大小和各存储对象大小的对象
   */
  async totalSize() {
    let totalSize = 0; // 总大小
    let storeSize = {}; // 各存储对象大小
    const db = await this.openDB(); // 打开数据库
    const transaction = db.transaction(db.objectStoreNames, "readonly"); // 创建只读事务

    for (const objectStoreName of db.objectStoreNames) { // 遍历所有存储对象
      const objectStore = transaction.objectStore(objectStoreName); // 获取存储对象
      storeSize[objectStoreName] = 0; // 初始化存储对象大小

      const getAllRequest = objectStore.getAll(); // 获取所有数据的请求

      getAllRequest.onsuccess = (event) => {
        const items = event.target.result; // 获取所有数据
        for (const item of items) {
          const size = new Blob([JSON.stringify(item)]).size; // 计算数据大小
          totalSize += size; // 累加到总大小
          storeSize[objectStoreName] += size; // 累加到存储对象大小
        }
      };

      getAllRequest.onerror = (event) => {
        // 处理错误
      };
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ totalSize, storeSize }); // 解析Promise为总大小和存储对象大小
      }, 0);
    });
  }

  /**
   * 将字符串编码为Base64格式
   * @param {string} plainText - 明文字符串
   * @returns {string} - Base64编码后的字符串
   */
  encodeString(plainText) {
    const base64Encoded = btoa(unescape(encodeURIComponent(plainText))); // 进行Base64编码
    return base64Encoded; // 返回编码后的字符串
  }

  /**
   * 将Base64编码的字符串解码为原始字符串
   * @param {string} encodedText - Base64编码的字符串
   * @returns {string} - 解码后的原始字符串
   */
  decodeString(encodedText) {
    const decodedText = decodeURIComponent(escape(atob(encodedText))); // 进行Base64解码
    return decodedText; // 返回解码后的字符串
  }
}
