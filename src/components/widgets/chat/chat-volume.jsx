import styles from '@/styles/chat.module.scss';
import React, { useEffect,  useState } from 'react';
import { User } from '@/components/models/user';
import { utility } from '@/components/helpers/utility';

/**
 * Chat volume
 * @param {{ analyser: AnalyserNode, user: User }} props Props
 */
export const ChatVolume = ({ analyser, user }) => {
  /** @type {[ volume: number, setVolume: (volume: number) => void ]} */
  const [ volume, setVolume ] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const updateVolume = () => {
      const v = utility.getAverageVolume(analyser);
      setVolume(v > 100 ? 100 : v);
      animationFrameId = requestAnimationFrame(updateVolume);
    };

    updateVolume();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [ user.__status.microphone ]);
  return <div style={{ width: `${volume}%`}} className={styles['volume']}></div>;
};
