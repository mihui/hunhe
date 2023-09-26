import VARS, { HttpCodes, StorageKeys } from '../config/vars';
import { Meeting } from '../models/meeting';
import { storage } from '../helpers/utility';
import { User } from '../models/user';
import { StreamService } from './StreamService';

class ChatService {
  /**
   * 
   * @returns {string} Returns HTTP request URL
   */
  getRequestPath(path) {
    return `${VARS.IS_DEBUGGING ? VARS.APP_URL : ''}${path}`;
  }

  /**
   * Get meeting information
   * @param {string} meetingId Meeting ID
   * @returns {Promise<Meeting>} meeting Meeting information
   */
  async getMeeting(meetingId) {
    try {
      const response = await fetch(this.getRequestPath(`/api/chat/meeting/${meetingId}`));
      if(response.status === HttpCodes.OK) {
        /** @type {{ meeting: Meeting }} */
        const json = await response.json();
        return json.meeting;
      }
    }
    catch(error) {}
    return null;
  }

  async createMeeting(maxUsers = 10) {
    try {
      const response = await fetch(this.getRequestPath(`/api/chat/meeting`), { method: 'POST', body: JSON.stringify({ max_users: maxUsers }) });
      if(response.ok) {
        /** @type {{ meeting: Meeting }} */
        const json = await response.json();
        return json.meeting;
      }
    }
    catch(error) {}
    return null;
  }

  /**
   * Update meeting information
   * @param {Meeting} meeting Meeting information
   */
  async updateMeeting(meeting) {
    try {
      const response = await fetch(this.getRequestPath(`/api/chat/meeting/${meeting.id}`), { method: 'PUT', body: JSON.stringify(meeting), headers: {
        'Content-Type': 'application/json'
      } });
      if(response.ok) {
        /** @type {{ meeting: Meeting }} */
        const json = await response.json();
        return json.meeting;
      }
    }
    catch(error) {
      console.warn(error.message);
    }
    return null;
  }

  /**
   * Get user information
   * @returns {User} Returns user
   */
  getUser () {
    const storedUser = storage.get(StorageKeys.User, null, 'json');
    return storedUser;
  }
  /**
   * Store user information
   * @param {User} data User data
   */
  storeUser (data) {
    storage.save(StorageKeys.User, data, 'json');
  }
}

export const MediaStatus = {
  IDLE: 0,
  PUBLISHING: 1,
  RECEIVING: 2,
}

export const streamService = new StreamService();

export const chatService = new ChatService();
