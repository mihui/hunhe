'use client';
import { All, ChatRecord } from '@/components/models/user';
import styles from '@/styles/chat.module.scss';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';

/**
 * Chat format
 * @param {{ payload: ChatRecord }} props Props
 * @returns {HTMLDivElement} Returns HTML
 */
export const ChatFormat = ({ payload, isMe, isToMe, hasTime, displayTime, selectUser }) => {
  let classes = styles['chat-item'];
  if(isMe) {
    classes = classes.concat(' ').concat(styles['me']);
  }
  if(isToMe) {
    classes = classes.concat(' ').concat(styles['target']);
  }
  return (
    <>
      { hasTime && <div className={styles['chat-time']}>{displayTime}</div> }
      <div className={classes} key={payload.id} id={`${payload.id}`}>
        <a className={styles['avatar']} style={{ '--background-avatar-placeholder': `url(${payload.from.avatar})` }} title={payload.from.name} onClick={evt => {
          selectUser(payload.from);
        }}></a>
        { payload.to.id !== All.__id && <>
          <a className={`${styles['avatar']} ${styles['to']}`} style={{ '--background-avatar-placeholder': `url(${payload.to.avatar})` }} title={payload.to.name} onClick={evt => {
          selectUser(payload.to);
        }}></a>
          </>}
        <ReactMarkdown className={styles['message']}>{payload.message}</ReactMarkdown>
      </div>
    </>
  );
}
