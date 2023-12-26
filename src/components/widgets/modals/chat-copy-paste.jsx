'use client';

import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';

import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import AspectRatio from '@mui/joy/AspectRatio';
import Card from '@mui/joy/Card';

import Image from 'next/image';

import { ClipboardData } from '@/components/models/meeting';
import { CardContent, FormControl, FormLabel, Input } from '@mui/joy';
import { useEffect, useState } from 'react';

/**
 * Chat clipboard
 * @param {{ open: boolean, clipboard: ClipboardData, isChatting: boolean, changeNote: (str: string) => void, handleClose: () => void, handleSubmit: () => void, translate: (str: string) => string }} props Props 
 * @returns {() => Modal} Returns modal instance
 */
export const ChatCopyPasteModal = ({ open, clipboard, changeNote, isChatting, handleClose, handleSubmit, translate }) => {

  const [ note, setNote ] = useState('');
  useEffect(() => {
    changeNote(note);
  }, [ note ]);

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        aria-labelledby="basic-modal-dialog-title"
        sx={{ minWidth: 300 }}
      >
        <ModalClose />
        <Typography id="basic-modal-dialog-title" level="h2">
          { translate('预览') }
        </Typography>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if(isChatting) return;
            handleSubmit();
            setNote('');
            handleClose();
          }}
        >
          <Stack spacing={2}>
            <Card sx={{ width: 320 }}>
              <AspectRatio minHeight="120px" maxHeight="200px" objectFit='contain'>
                <Image src={clipboard.url} loading="lazy" alt={translate('预览图片')} width={320} height={120} />
              </AspectRatio>
              { note && <CardContent orientation="horizontal">
                <div>
                  <Typography level="body-xs">{note}</Typography>
                </div>
              </CardContent> }
            </Card>
            <FormControl>
              <FormLabel>{ translate('说明') }</FormLabel>
              <Input autoComplete='none' autoFocus value={note} onChange={evt => setNote(evt.target.value)} />
            </FormControl>
            <Button type="submit" disabled={isChatting}>{ translate('发送') }</Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
