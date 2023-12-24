'use client';
import styles from '@/styles/chat.module.scss';

import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';

import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Card from '@mui/joy/Card';

import Image from 'next/image';

/**
 * Chat preview
 * @param {{ open: boolean, data: string, handleClose: () => void, translate: (str: string) => string }} props Props 
 * @returns {() => Modal} Returns modal instance
 */
export const ChatPreviewImageModal = ({ open, data, handleClose, translate }) => {

  return (
    <Modal open={open} onClose={handleClose} sx={{ opacity: 0.87 }} onClick={evt => {
      handleClose();
    }}>
      <ModalDialog
        aria-labelledby="modal-dialog-overflow"
        sx={{ minWidth: 300 }}
        layout='fullscreen'
      >
        <ModalClose />
        <Typography id="modal-dialog-overflow-title" level="h2">
          { translate('预览') }
        </Typography>

        <Stack direction="column" spacing={2} className={styles['chat-preview']}>
          <Card sx={{ width: '100%', height: '100%' }}>
            <Image src={data} loading="lazy" alt={translate('预览图片')} className={styles['image']} width={320} height={120} />
          </Card>
        </Stack>

      </ModalDialog>
    </Modal>
  );
}
