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
import { useState } from 'react';
import { User } from '../../models/user';
import Avatar from '@mui/joy/Avatar';

/**
 * Chat user information
 * @param {{ open: boolean, user: User, handleClose: () => void }} props Props
 * @returns {() => Modal} Returns modal instance
 */
export const ChatUserModal = ({ open, user, handleClose, translate }) => {

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        aria-labelledby="basic-modal-dialog-title"
        sx={{ minWidth: 300 }}
      >
        <ModalClose />
        <Typography id="basic-modal-dialog-title" level="h2">
          { translate('简介') }
        </Typography>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleClose();
          }}
        >
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>{ translate('昵称') }</FormLabel>
              <Input autoFocus readOnly value={user.name} />
            </FormControl>
            <FormControl>
              <FormLabel>{ translate('形象') }</FormLabel>
              <Avatar src={user.avatar} />
            </FormControl>
            <FormControl>
              <FormLabel>{ translate('编号') }</FormLabel>
              <Input autoFocus readOnly value={user.id} />
            </FormControl>
            <Button type="submit">{ translate('关闭') }</Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
