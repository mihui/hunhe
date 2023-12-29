'use client';
import { studioService } from '@/components/services/studio';
import styles from '@/styles/studio.module.scss';

import { Avatar, Button, Card, CardActions, CardContent, IconButton, Tooltip, Typography } from "@mui/joy";
import { useEffect, useState } from 'react';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import CircularProgress from '@mui/material/CircularProgress';
import { CardHeader } from '@mui/material';
import Layout from '@/components/layout';

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

  return <Layout.Main title={'摸鱼开关'} className={styles['studio']}>
    <div className={styles['main']} style={{
      background: `${status ? 'url(/images/icons/slack.png) no-repeat center center / contain' : 'url(/images/icons/slack-off.png) no-repeat center center / contain'}`,
    }}>
      <Card sx={{ alignItems: 'center', width: '100%', maxWidth: '500px', minWidth: '300px', boxShadow: 'var(--box-shadow-global)', opacity: '0.95' }}>
        <CardHeader
          avatar={
            <Avatar sx={{
              border: '1px solid #ddd',
              padding: '4px',
              width: '3.5rem',
              height: '3.5rem',
              filter: `${status ? 'none' : 'grayscale(1)'}`,
              overflow: 'hidden'
            }} aria-label="摸鱼开关" src='/images/icons/octopus.png'>摸</Avatar>
          }
          title="点亮开始摸鱼 🦑，关闭即停止。"
          subheader={`当前状态 - ${isLoading ? '...' : status ? '开' : '关'}`}>
        </CardHeader>
        <CardContent>
          <div className={styles['functions']}>
            <Tooltip placement='top' title={status ? '停止摸鱼':'开始摸鱼'}><IconButton sx={{
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
            }} /> }</IconButton></Tooltip>
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
  </div></Layout.Main>;
}
