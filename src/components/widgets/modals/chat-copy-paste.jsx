'use client';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';

import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Input from '@mui/joy/Input';
import AspectRatio from '@mui/joy/AspectRatio';
import Card from '@mui/joy/Card';

import { ClipboardData } from '@/components/models/meeting';
import { useState } from 'react';

/**
 * Chat clipboard
 * @param {{ open: boolean, clipboard: ClipboardData, handleClose: () => void, handleSubmit: () => void, translate: (str: string) => string }} props Props 
 * @returns {() => Modal} Returns modal instance
 */
export const ChatCopyPasteModal = ({ open, clipboard, isChatting, handleClose, handleSubmit, translate }) => {

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
            handleClose();
          }}
        >
          <Stack spacing={2}>
            <Card sx={{ width: 320 }}>
              <AspectRatio minHeight="120px" maxHeight="200px">
                <img src={clipboard.url} loading="lazy" alt={clipboard.type} />
              </AspectRatio>
            </Card>

            <Button type="submit" disabled={isChatting}>{ translate('发送') }</Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
