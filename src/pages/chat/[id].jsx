'use client';

import ChatRoom from '@/components/widgets/chat/chat-room';

export default function ChatWithId({ id, translate }) {
  
  return (
    <ChatRoom id={id} translate={translate}></ChatRoom>
  );
}

/**
 * Get initial props
 * @param {import('next/app').AppContext} appContext 
 * @returns 
 */
ChatWithId.getInitialProps = (appContext) => {
  const { id } = appContext.query;
  return {
    id
  };
};