import { ChatCompletion, setEnvVariable } from "@baiducloud/qianfan";
import { VARS } from "../vars.js";

setEnvVariable('QIANFAN_ACCESS_KEY', VARS.QIANFAN_ACCESS_KEY);
setEnvVariable('QIANFAN_SECRET_KEY', VARS.QIANFAN_SECRET_KEY);

/** @type {ChatCompletion} */
const client = new ChatCompletion();

export const CHAT_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant'
};

class ChatService {
  /**
  * 异步聊天函数
  * 
  * 该函数用于与指定的AI模型进行异步聊天，根据传入的角色和消息历史，生成模型的回复
  * 
  * @param {Array<{ role: 'string', content: string }>} messages - 消息历史记录，用于构建聊天上下文
  * @returns {Promise<Array<Promise<ChatStream>>>} - 返回一个Promise对象，解析为模型的回复
  */
  async chat(messages, model, system, stream = false) {
    try {
      const resp = await client.chat({ messages, stream, system }, model);
      return resp;
    }
    catch(error) {
      console.warn('Chat error--->', error);
    }
    return [{ result: '', is_end: true }];
  }
}

class ChatStream {
  /** @type {Object.<string, any>} */
  headers;
  /** @type {string} */
  id;
  /** @type {string} */
  object;
  /** @type {number} */
  created;
  /** @type {number} */
  sentence_id;
  /** @type {boolean} */
  is_end;
  /** @type {boolean} */
  is_truncated;
  /** @type {string} */
  result;
  /** @type {boolean} */
  need_clear_history;
  /** @type {string} */
  finish_reason;
  /** @type {{ prompt_tokens: number, completion_tokens: number, total_tokens: number }} */
  usage;
}

export const chatService = new ChatService();
