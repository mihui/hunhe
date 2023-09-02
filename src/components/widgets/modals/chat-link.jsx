'use client';
import FormControl from '@mui/joy/FormControl';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Input from '@mui/joy/Input';
import VARS from '../../config/vars';
import { User } from '../../models/user';
import { Meeting } from '../../models/meeting';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import FormLabel from '@mui/joy/FormLabel';
import { chatService } from '../../services/chat';

/**
 * Chat link modal
 * @param {{ open: boolean, user: User, handleClose: () => void, meeting: Meeting, setMeeting: (meeting: Meeting) => void }} param0 Props
 * @returns {() => Modal} Returns Modal
 */
export const ChatLinkModal = ({ open, user, handleClose, meeting, setMeeting, translate }) => {

  return (
    <Modal open={open} onClose={() => handleClose()}>
      <ModalDialog
        aria-labelledby="basic-modal-dialog-title"
        aria-describedby="basic-modal-dialog-description"
        sx={{ minWidth: 300 }}
      >
        <Typography id="basic-modal-dialog-title" level="h2">{ translate('会议信息') }</Typography>
        <form onSubmit={(event) => {
            event.preventDefault();
            // Fetch save
            chatService.updateMeeting(meeting).then(data => {
              // Data is meeting data
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
              <Input autoFocus required value={meeting.subject} placeholder={ translate('主题') } onChange={evt => {
                setMeeting({ ...meeting, subject: evt.target.value });
              }} />
            </FormControl>
            <FormControl>
              <FormLabel>{ translate('锁定') }</FormLabel>
              <Button variant='soft' onClick={evt => {
                setMeeting({ ...meeting, locked: !meeting.locked });
              }}>
              { meeting.locked ? <LockIcon /> : <LockOpenIcon/> }
              </Button>
            </FormControl>
            <FormControl>
              <FormLabel>{ translate('人数限制') }</FormLabel>
              <Input type='number' value={meeting.limitation} endDecorator={ translate('人') } slotProps={{ input: { max: 10, min: 2 } }} onChange={evt => {
                console.log(evt.target.value);
                setMeeting({ ...meeting, limitation: evt.target.value })
              }} />
            </FormControl>
            <FormControl>
              <FormLabel>{ translate('会议链接') }</FormLabel>
              <Input autoFocus readOnly value={`${VARS.APP_URL}/chat?meeting=${meeting.id}`} />
            </FormControl>
            <Button type="submit">{ translate('保存') }</Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
