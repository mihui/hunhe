'use client';
import { studioService } from '@/components/services/studio';
import styles from '@/styles/studio.module.scss';

import { Avatar, Button, Card, CardActions, CardContent, IconButton, Typography } from "@mui/joy";
import { useEffect, useState } from 'react';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import CircularProgress from '@mui/material/CircularProgress';
import { CardHeader } from '@mui/material';

export default function Studio({ translate }) {
  const [ data, setData ] = useState('');
  const [ status, setStatus ] = useState(false);
  const [ isLoading, setIsLoading ] = useState(false);

  const queryStatus = async () => {
    setIsLoading(true);
      const result = await studioService.getDeviceProperties('6c6e0a2cc4d07963ad2nvh', { codes: 'switch_1' });
      if(result && result.properties && result.properties.length > 0) {
        setStatus(result.properties[0].value);
        setData(JSON.stringify(result.properties[0]));
      }
      setIsLoading(false);
  };

  useEffect(() => {
    queryStatus();
  }, []);

  return <div className={styles['studio']}>
    <div className={styles['main']}>
      <Card sx={{ alignItems: 'center', width: '100%', maxWidth: '500px', minWidth: '300px', boxShadow: 'var(--box-shadow-global)' }}>
        <CardHeader
          avatar={
            <Avatar aria-label="绣声坊" src='/images/icons/logo.png'>绣声坊</Avatar>
          }
          title="点亮琴房"
          subheader="扫码支付，成功后即可开门练琴。">
        </CardHeader>
        <CardContent>
          <div className={styles['functions']}>
            <IconButton sx={{
              width: '8rem',
              height: '8rem',
              borderRadius: '50%',
              boxShadow: '3px 7px 5px #bbb'
            }} disabled={isLoading} variant='solid' color={status ? 'danger' : 'success'} onClick={async evt => {
              setIsLoading(true);
              const newStatus = !status;
              const result = await studioService.setDeviceProperties('6c6e0a2cc4d07963ad2nvh', { switch_1: newStatus });
              if(result) {
                setData(JSON.stringify(result));
                setStatus(newStatus);
              }
              setIsLoading(false);
            }} size='lg'>{ isLoading ? <CircularProgress size='lg' sx={{
              width: '5rem',
              height: '5rem',
            }} /> : status ? <FlashOffIcon sx={{
              width: '5rem',
              height: '5rem',
            }} /> : <FlashOnIcon sx={{
              width: '5rem',
              height: '5rem',
            }} /> }</IconButton>
            {/* <Button variant='soft' onClick={async evt => {
              setIsLoading(true);
              const result = await studioService.deviceInfo('6c6e0a2cc4d07963ad2nvh');
              if(result) {
                setData(JSON.stringify(result));
              }
              setIsLoading(false);
            }} size='lg'>
              { isLoading ? '请稍候' : '获取设备信息' }
            </Button> */}
          </div>
        </CardContent>
        <CardActions>
          <Button variant='outlined' disabled={isLoading} onClick={evt => {
            queryStatus();
          }}>刷新状态</Button>
        </CardActions>
      </Card>


    </div>
  </div>;
}
