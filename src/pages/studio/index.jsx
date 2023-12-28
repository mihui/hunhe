'use client';
import { studioService } from '@/components/services/studio';
import styles from '@/styles/studio.module.scss';

import { Button } from "@mui/joy";
import { useEffect, useState } from 'react';

export default function Studio({ translate }) {
  const [ data, setData ] = useState('');
  const [ status, setStatus ] = useState(false);
  const [ isLoading, setIsLoading ] = useState(true);

  useEffect(() => {
    console.log('data->', data);
  }, [data]);

  useEffect(() => {
    (async() => {
      setIsLoading(true);
      const result = await studioService.getDeviceProperties('6c6e0a2cc4d07963ad2nvh', { codes: 'switch_1' });
      if(result && result.properties && result.properties.length > 0) {
        setStatus(result.properties[0].value);
        setData(JSON.stringify(result.properties[0]));
      }
      setIsLoading(false);
    })();
  }, []);

  return <div className={styles['studio']}>
    <div className={styles['main']}>
      <div className={styles['functions']}>
        <Button disabled={isLoading} onClick={async evt => {
          setIsLoading(true);
          const newStatus = !status;
          const result = await studioService.setDeviceProperties('6c6e0a2cc4d07963ad2nvh', { switch_1: newStatus });
          if(result) {
            setData(JSON.stringify(result));
            setStatus(newStatus);
          }
          setIsLoading(false);
        }} size='lg'>{ isLoading ? '请稍候' : status ? '关灯' : '开灯' }</Button>
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
    </div>
  </div>;
}
