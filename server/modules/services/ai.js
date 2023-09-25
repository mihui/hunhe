import { Logger } from "../logger.js";
import { VARS } from "../vars.js";
const { logger } = Logger('ai-service');

class AiService {
  /**
   * Ask Llama
   * @param {string} prompt Prompt
   * @returns {Promise<string>} Returns answer
   */
  async askLlama(prompt) {
    logger.debug('prompt->', prompt);
    const response = await fetch(
      VARS.AI_LLAMA_API_URL,
      {
        headers: { Authorization: `Bearer ${VARS.AI_LLAMA_API_KEY}` },
        method: 'POST',
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    const result = await response.json();
    logger.debug('result->', result);
    return JSON.stringify(result);
  }
}

export const aiService = new AiService();
