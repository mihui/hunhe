'use client';

import { ROOMS } from '@/components/config/vars';
import ChatRoom from '@/components/widgets/chat/chat-room';

export default function ChatHome({ translate }) {

  return (
    <ChatRoom id={ROOMS.DEFAULT.ID} translate={translate}></ChatRoom>
  );
}
