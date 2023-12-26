'use client';
import { utility } from '@/components/helpers/utility';
import { ClipboardData } from '@/components/models/meeting';
import { All, ChatRecord, MessageStatus, User } from '@/components/models/user';
import styles from '@/styles/chat.module.scss';
import { AspectRatio, CardContent, Typography, Card } from '@mui/joy';

import Image from 'next/image';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

/**
 * Chat format
 * @param {{ payload: ChatRecord, isMe: boolean, isToMe: boolean, hasTime: boolean, displayTime: number, selectUser: (user: User) => void, openPreview: (data: ClipboardData) => void }} props Props
 * @returns {HTMLDivElement} Returns HTML
 */
export const ChatFormat = ({ payload, isMe, isToMe, hasTime, displayTime, selectUser, openPreview }) => {
  let classes = styles['chat-item'];
  if(isMe) {
    classes = classes.concat(' ').concat(styles['me']);
  }
  if(isToMe) {
    classes = classes.concat(' ').concat(styles['target']);
  }
  if(payload.status === MessageStatus.Sending) {
    classes = classes.concat(' ').concat(styles['sending']);
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
        { utility.isBinary(payload.type) ? <Card className={styles['screenshot']} sx={{ width: 320 }} onClick={evt => {
          evt.preventDefault();
          evt.stopPropagation();
          openPreview(payload.attachment);
        }}><AspectRatio className={styles['ratio']} minHeight="120px" maxHeight="200px" objectFit='contain'>
            <Image src={payload.attachment.url} alt={payload.attachment.note} width={320} height={120} />
          </AspectRatio>
          { payload.attachment.note && <CardContent>
            <div className={styles['note']}>
              <Typography level="body-xs">{payload.attachment.note}</Typography>
            </div>
          </CardContent> }
        </Card>
        :
        <Markdown remarkPlugins={[ remarkGfm ]} rehypePlugins={[rehypeRaw]} className={styles['message']}>{payload.message}</Markdown> }
      </div>
    </>
  );
}
