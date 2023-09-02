import { HttpCodes } from '../config/vars';
import { Meeting } from '../models/meeting';

class ChatService {
  /**
   * Get meeting information
   * @param {string} meetingId Meeting ID
   * @returns {Promise<Meeting>} meeting Meeting information
   */
  async getMeeting(meetingId) {
    try {
      const response = await fetch(`/api/chat/meeting/${meetingId}`);
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
      const response = await fetch(`/api/chat/meeting`, { method: 'POST', body: JSON.stringify({ max_users: maxUsers }) });
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
      const response = await fetch(`/api/chat/meeting/${meeting.id}`, { method: 'PUT', body: JSON.stringify(meeting), headers: {
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
}

export const chatService = new ChatService();
