'use client';
import { utility } from '@/components/helpers/utility';
import { All, ChatRecord } from '@/components/models/user';
import styles from '@/styles/chat.module.scss';
import { AspectRatio } from '@mui/joy';
import { Card } from '@mui/joy';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

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
        { utility.isBase64StringValid(payload.screenshot.base64) ? <Card className={styles['screenshot']} sx={{ width: 320 }}><AspectRatio minHeight="120px" maxHeight="200px"><img src={payload.screenshot.base64} /></AspectRatio></Card> : <Markdown remarkPlugins={[ remarkGfm ]} rehypePlugins={[rehypeRaw]} className={styles['message']}>{payload.message}</Markdown> }
      </div>
    </>
  );
}
