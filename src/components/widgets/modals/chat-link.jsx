'use client';
import FormControl from '@mui/joy/FormControl';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';

import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Input from '@mui/joy/Input';
import FormLabel from '@mui/joy/FormLabel';
import Tooltip from '@mui/joy/Tooltip';

import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import VARS, { ROOMS } from '../../config/vars';
import { User } from '../../models/user';
import { Meeting } from '../../models/meeting';
import { chatService } from '../../services/chat';
import { useState } from 'react';

/**
 * Chat link modal
 * @param {{ open: boolean, user: User, handleClose: () => void, meeting: Meeting, setMeeting: (meeting: Meeting) => void }} param0 Props
 * @returns {() => Modal} Returns Modal
 */
export const ChatLinkModal = ({ open, user, handleClose, meeting, setMeeting, handleMeeting, translate }) => {

  const STATUS = {
    INITIAL: 1,
    COPIED: 2,
    ERROR: 3
  };

  const [ copyStatus, setCopyStatus ] = useState(STATUS.INITIAL);

  const prefixLink = `${VARS.APP_URL}/chat`;

  const [ meetingLink ] = useState(meeting.id === ROOMS.DEFAULT.ID ? prefixLink : prefixLink.concat(`/${meeting.id}`));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      return true;
    }
    catch(error) {

    }
    return false;
  };

  return (
    <Modal open={open} onClose={() => handleClose()}>
      <ModalDialog
        aria-labelledby="basic-modal-dialog-title"
        sx={{ minWidth: 300 }}
      >
        <ModalClose />
        <Typography id="basic-modal-dialog-title" level="h2">{ translate('会议信息') }</Typography>
        <form onSubmit={(event) => {
          event.preventDefault();
          if(meeting.id === ROOMS.DEFAULT.ID) {
            handleClose();
            return;
          }
          // Fetch save
          chatService.updateMeeting(meeting).then(data => {
            // Data is meeting data
            handleMeeting();
          }).catch(error => {
            // @todo: Handle error
          }).finally(() => {
            handleClose();
          });
        } }
        >
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>{ translate('主题') }</FormLabel>
              <Input autoFocus required readOnly={meeting.id === ROOMS.DEFAULT.ID} value={meeting.id === ROOMS.DEFAULT.ID ? translate(meeting.subject) : meeting.subject} placeholder={ translate('主题') } onChange={evt => {
                setMeeting({ ...meeting, subject: evt.target.value });
              }} />
            </FormControl>
            { meeting.id !== ROOMS.DEFAULT.ID &&
            <FormControl>
              <FormLabel>{ translate('锁定') }</FormLabel>
              <Button variant='soft' onClick={evt => {
                setMeeting({ ...meeting, locked: !meeting.locked });
              }}>
              { meeting.locked ? <LockIcon /> : <LockOpenIcon/> }
              </Button>
            </FormControl> }

            { meeting.id !== ROOMS.DEFAULT.ID &&
            <FormControl>
              <FormLabel>{ translate('人数限制') }</FormLabel>
              <Input type='number' value={meeting.limitation} endDecorator={ translate('人') } slotProps={{ input: { max: 50, min: 2 } }} onChange={evt => {
                console.log(evt.target.value);
                setMeeting({ ...meeting, limitation: evt.target.value });
              }} />
            </FormControl> }

            <FormControl>
              <FormLabel>{ translate('会议链接') }</FormLabel>
              <Stack direction='row' gap={1} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Input autoFocus readOnly value={meetingLink} />
                <Tooltip title={copyStatus === STATUS.INITIAL ? translate('复制链接') : copyStatus === STATUS.COPIED ? translate('复制成功') : translate('复制失败') }>
                  <Button variant={copyStatus === STATUS.INITIAL ? 'soft' : copyStatus === STATUS.ERROR ? 'solid' : 'plain' } onClick={evt => {
                    copyLink().then(() => {
                      setCopyStatus(STATUS.COPIED);
                      setTimeout(() => {
                        setCopyStatus(STATUS.INITIAL);
                      }, 5000);
                    }).catch(error => {
                      console.warn(error);
                      setCopyStatus(STATUS.ERROR);
                    });
                  }}>
                    { copyStatus === STATUS.INITIAL ?
                      <ContentCopyIcon /> : copyStatus === STATUS.COPIED ?
                      <DoneIcon color='success' /> :
                      <ErrorOutlineIcon color='error' /> }
                  </Button>
                </Tooltip>
              </Stack>
            </FormControl>
            <Button type="submit">{ meeting.id === ROOMS.DEFAULT.ID ? translate('关闭') : translate('保存') }</Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
