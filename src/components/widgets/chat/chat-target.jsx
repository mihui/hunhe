import styles from '@/styles/chat.module.scss';
import React, { useEffect, useRef } from 'react';
import { User } from '@/components/models/user';
import { STATUS } from '@/components/models/meeting';
import { streamService } from '@/components/services/chat';
import { ChatVolume } from './chat-volume';

/**
 * Chat target
 * @param {{ user: User, selectUser: (user: User) => void }} props Props
 */
export const ChatTarget = ({ user, selectUser }) => {

  const emoji = user.__status.emoji ? ` ${user.__status.emoji}` : '';
  const style =
    user.__status.browser === STATUS.AUDIO && user.__status.microphone === STATUS.SPEAKING ?
    'speaking' :
    user.__status.browser === STATUS.AUDIO && user.__status.microphone === STATUS.MUTED ?
    'muted' :
    user.__status.browser === STATUS.AUDIO ?
    'audio' :
    user.__status.browser === STATUS.AWAY ?
    'away' :
    user.__status.browser === STATUS.OFFLINE ?
    'offline' :
    'online';

  const analyser = streamService.getAudioAnalyser(user.id);

  return <li onClick={evt => {
    evt.preventDefault();
    evt.stopPropagation();
    selectUser(user);
  }} className={styles[style]} id={user.id} data-avatar={user.avatar} data-window={user.windows && user.windows > 1 ? user.windows : ''} style={{'--background-avatar-placeholder': `url(${user.avatar})` }}>
    <a>{user.name}{ emoji && <span className={styles['emoji']} dangerouslySetInnerHTML={{ __html: emoji }}></span> }</a>
    <ChatVolume analyser={analyser} user={user} />
  </li>
};
