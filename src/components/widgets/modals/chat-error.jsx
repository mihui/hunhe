'use client';

import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Typography from '@mui/joy/Typography';
import ModalClose from '@mui/joy/ModalClose';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';

/**
 * Chat error
 * @param {{ open: boolean, translate: (str: string) => string, handleBack: () => void }} param0 Props
 * @returns {() => Modal} Returns Modal
 */
export const ChatErrorModal = ({ open, message, translate, handleBack }) => {
  return (
    <Modal open={open} onClose={handleBack}>
      <ModalDialog>
        <ModalClose />
          <Typography id="variant-modal-title" level="h4" textColor="inherit">
            { translate('出错了 -_-!') }
          </Typography>
          <Typography id="variant-modal-description" textColor="inherit">
            { translate(message) }
          </Typography>
          <Box
            sx={{
              mt: 1,
              display: 'flex',
              gap: 1,
              flexDirection: { xs: 'column', sm: 'row-reverse' },
            }}
          >
            <Button variant="solid" color="neutral" onClick={() => handleBack()}>
              { translate('返回首页') }
            </Button>
          </Box>
      </ModalDialog>
    </Modal>
  );
};
