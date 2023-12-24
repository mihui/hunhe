'use client';
import styles from '@/styles/chat.module.scss';

import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Typography from '@mui/joy/Typography';
import ModalClose from '@mui/joy/ModalClose';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Switch from '@mui/joy/Switch';
import DialogActions from '@mui/joy/DialogActions';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import { Device, Media } from '@/components/models/meeting';
import { useEffect, useRef, useState } from 'react';
import { storage, utility } from '@/components/helpers/utility';
import { StorageKeys } from '@/components/config/vars';
import { User } from '@/components/models/user';

/**
 * Chat settings
 * @param {{
 *  open: boolean, me: User,
 *  vars: { audio: Media, video: Media, output: Media, status: { emoji: string }, devices: Array<Device> },
 *  setVars: (vars: { audio: Media, screen: Media, output: Media, status: { emoji: string }, devices: Array<Device> }) => void,
 *  handleClose: () => void, handleSpeakerChange: (deviceId: string) => void, translate: (str: string) => string,
 *  refreshDevices: () => void
 * }} props Props
 * @returns {HTMLDivElement} Returns HTML
 */
export const ChatSettingsModal = ({ open, vars, setVars, me, refreshDevices, handleSpeakerChange, handleClose, translate }) => {
  /** @type {{ current: HTMLVideoElement }} */
  const previewVideoRef = useRef(null);

  const [ isPreview, setIsPreview ] = useState(false);

  useEffect(() => {
    if(previewVideoRef.current) {
      utility.stopStream(previewVideoRef.current);
      if(isPreview) {
        utility.getDisplayMedia(vars.video.id, vars.audio.id, vars.devices).then(stream => {
          previewVideoRef.current.muted = true;
          previewVideoRef.current.srcObject = stream;
        }).catch(error => {
  
        });
      }
    }
  }, [isPreview, vars.audio.id, vars.devices, vars.video.id]);

  const onClose = () => {
    utility.stopTracks(previewVideoRef.current.srcObject);
    setIsPreview(false);
    handleClose();
  };
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        aria-labelledby="basic-modal-dialog-title"
        size='md'
        sx={{ minWidth: 300 }}
      >
        <Typography id="basic-modal-dialog-title" level="h2">
          { translate('设置') }
        </Typography>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onClose();
          }}
          className={styles['chat-settings']}
        >
          <Stack spacing={2}>

            { vars.devices.filter(x => x.kind === 'audioinput' && x.deviceId !== '').length > 0 && <FormControl>
              <FormLabel>{ translate('音频输入') }</FormLabel>
              <Select defaultValue={vars.audio.id} onChange={(evt, audioDeviceId) => {
                setVars({ ...vars, audio: { ...vars.audio, id: audioDeviceId } });
                storage.save(StorageKeys.AudioInputDeviceId, audioDeviceId);
              }}>
                { vars.devices.filter(x => x.kind === 'audioinput').map((x, index) => {
                  return <Option key={index} value={x.deviceId}>{x.label || utility.format(translate('音频输入 - {0}'), index)}</Option>;
                }) }
              </Select>
            </FormControl> }

            { vars.devices.filter(x => x.kind === 'audiooutput' && x.deviceId !== '').length > 0 && <FormControl>
              <FormLabel>{ translate('音频输出') }</FormLabel>
              <Select defaultValue={vars.output.id} onChange={(evt, audioDeviceId) => {
                handleSpeakerChange(audioDeviceId);
              }}>
                { vars.devices.filter(x => x.kind === 'audiooutput').map((x, index) => {
                  return <Option key={index} value={x.deviceId}>{x.label || utility.format(translate('音频输出 - {0}'), index)}</Option>;
                }) }
              </Select>
            </FormControl> }

            <FormControl>
              <FormLabel>{ translate('视频输入') }</FormLabel>
              <Select defaultValue={vars.video.id} onChange={(evt, screenDeviceId) => {
                setVars({ ...vars, video: { ...vars.video, id: screenDeviceId } });
                storage.save(StorageKeys.VideoInputDeviceId, screenDeviceId);
              }}>
                { vars.devices.filter(x => x.kind === 'videoinput').map((x, index) => {
                  return <Option key={index} value={x.deviceId}>{x.label || utility.format(translate('视频输入 - {0}'), index)}</Option>;
                }) }
              </Select>
            </FormControl>

            <div className={isPreview ? styles['preview'] : styles['hidden']}>
              <video muted autoPlay disablePictureInPicture ref={previewVideoRef}></video>
            </div>

            <FormControl
              orientation="horizontal"
              sx={{ bgcolor: 'background.level2', p: 1, borderRadius: 'sm' }}
            >
              <FormLabel>{ translate('预览') }</FormLabel>
              <Switch
                checked={isPreview}
                onChange={evt => {
                  const isChecked = evt.target.checked;
                  setIsPreview(isChecked);
                }}
              />
            </FormControl>

            <DialogActions>
              <Button type="submit">{ translate('关闭') }</Button>
              <Button type="button" variant='soft' onClick={evt => {
                refreshDevices();
              }}>{ translate('刷新') }</Button>
            </DialogActions>

          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
