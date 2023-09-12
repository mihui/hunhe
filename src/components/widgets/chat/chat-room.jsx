
'use client';
import styles from '@/styles/chat.module.scss';

import IconButton from '@mui/joy/IconButton';
import Badge from '@mui/joy/Badge';

import Input from '@mui/joy/Input';

import Layout from '@/components/layout';

import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import TuneIcon from '@mui/icons-material/Tune';
import MicIcon from '@mui/icons-material/Mic';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SendIcon from '@mui/icons-material/Send';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import InfoIcon from '@mui/icons-material/Info';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled';

import Stack from '@mui/joy/Stack';
import Box from '@mui/joy/Box';
import Tooltip from '@mui/joy/Tooltip';
import Divider from '@mui/joy/Divider';

import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { User, ChatPayload, ChatRecord, ChatVideo, All } from '@/components/models/user';
import { ChatUserModal } from '@/components/widgets/modals/chat-user';
import { Events, beeper, storage, utility } from '@/components/helpers/utility';
import { Avatars, CustomCodes, ROOMS, STATUS, StorageKeys } from '@/components/config/vars';
import { ChatLinkModal } from '@/components/widgets/modals/chat-link';
import { ChatFormat } from '@/components/widgets/chat/chat-format';
import { DEVICE, Device, EMOJIS, Media, Meeting, NOTIFICATION_STYLES, PEER, UIProperty } from '@/components/models/meeting';
import { MediaStatus, chatService, streamService } from '@/components/services/chat';
import { ChatErrorModal } from '../modals/chat-error';
import Button from '@mui/joy/Button';

/**
 * Chatroom
 * @param {{ id: string, translate: (string) => string }} param0 Props
 */
export default function ChatRoom({ id, translate }) {
  const router = useRouter();

  /** @type {[ isLoading: boolean, setIsLoading: (isLoading: boolean) => void ]} */
  const [ isLoading, setIsLoading ] = useState(true);

  /** @type {[ { video: boolean, audio: boolean }, setPeerStatus: (peerStatus: { video: boolean, audio: boolean }) => void ]} */
  const [ peerStatus, setPeerStatus ] = useState({ video: false, audio: false });

  /** @type {[ chatNotification: { message: string, style: string, time: Date }, setChatNotification: (chatNotification: { message: string, style: string, time: Date }) => void ]} */
  const [ chatNotification, setChatNotification ] = useState({ message: '', style: NOTIFICATION_STYLES.INFO, time: new Date() });
  //
  const notifyUser = useCallback((message, style = NOTIFICATION_STYLES.INFO, hasTranslation = false) => {
    setChatNotification({ message: hasTranslation ? message : translate(message), style, time: new Date() })
  }, [translate]);

  /** @type {() => User} */
  const getUser = () => {
    const storedUser = storage.get(StorageKeys.User, null, 'json');
    return storedUser;
  }, goBackHome = useCallback((isIdValid = true) => {
    let route = '/';
    if(id && id !== ROOMS.DEFAULT.ID && isIdValid) {
      route = route.concat(`?meeting=${id}`);
    }
    router.push(route);
  }, [ id, router ]);

  const onSocketChanged = (connected, isReconnect = false) => {
    // Disable/Enable UI
    setIsLoading(connected === false);
    beeper.publish(Events.SocketConnected, { connected, isReconnect });
  };

  const socketEvents = {
    onSocketConnect: () => {
      console.log('### CONNECTED ###');
      streamService.getWebSocket().emit('server:join', meeting.id, me);
    },
    onSocketReconnect: () => {
      console.log('### RECONNECTED ###');
      onSocketChanged(true, true);
    },
    onSocketReconnectFailed: () => {
      console.warn('### CONNECTION FAILED ###');
      onSocketChanged(false);
      notifyUser('重新连接失败，请刷新页面重试', NOTIFICATION_STYLES.ERROR);
    },
    onSocketReconnectAttempt: () => {
      notifyUser('正在重新连接...（第 {0} 次尝试）', NOTIFICATION_STYLES.WARNING);
    },
    onSocketError: error => {
      console.warn('### SOCKET ERROR ###');
      onSocketChanged(false);
      notifyUser('连接错误', NOTIFICATION_STYLES.ERROR);
    },
    onSocketDisconnect: reason => {
      console.warn('### DISCONNECTED ###');
      onSocketChanged(false);
      notifyUser('连接已断开，请重试', NOTIFICATION_STYLES.ERROR);
      setChatUsers([]);
      if(reason === "io server disconnect") {
        streamService.connectWebSocket();
      }
    },
    /** @type {(user: User) => void} */
    onClientWelcomePublic: user => {
      notifyUser(utility.format(translate('网友【{0}】兴高采烈地来到了会议室， 大家热烈欢迎 ^_^！'), user.name), NOTIFICATION_STYLES.INFO, true);
    },
    /** @type {(remoteScreenId: string) => void} */
    onClientWelcomePrivate: (remoteScreenId) => {
      // joinScreenSharing(screenId);
      onSocketChanged(true);
      setIsSocketReady(true);
      setScreenId(remoteScreenId);
    },
    /** @type {(callee: User, remoteScreenId: string) => void} */
    onClientJoinScreen: (callee, remoteScreenId) => {
      if(callee && remoteScreenId) {
        if(remoteScreenId === me.id) {
          console.log('### CALLING CALLEE ###');
          streamService.videoCall(getScreenId(callee.id, true), streamService.localVideoStream);
        }
      }
      // beeper.publish(Events.JoinScreenShareCallback, { callee, caller, remoteScreenId });
    },
    /** @type {(caller: User, users: Array<User>, remoteScreenId: string) => void} */
    onClientStartScreen: (caller, users, remoteScreenId) => {
      // beeper.publish(Events.StartScreenShareCallback, { caller, users, remoteScreenId });
      notifyUser(utility.format(translate('【{0}】开始了屏幕共享'), caller.name), NOTIFICATION_STYLES.INFO, true);
      for(const receiver of users) {
        if(receiver.id === remoteScreenId) {
          console.log(receiver.id === me.id, 'receiver.id->', receiver.id, '\n\rme.id->', me.id);
          console.log('### ME ###');
          continue;
        }
        console.log(`### CALLING ${receiver.name} ###`);
        streamService.videoCall(getScreenId(receiver.id, true), streamService.localVideoStream, { nickname: caller.name });
      }
    },
    /** @type {(sharer: User) => void} */
    onClientStopScreen: (sharer) => {
      // beeper.publish(Events.StopScreenShareCallback, { sharer });
      setScreenId('');
      notifyUser(utility.format(translate('【{0}】停止了屏幕共享'), sharer.name), NOTIFICATION_STYLES.INFO, true);
      if(sharer.id !== me.id) {
        // stopRemoteVideo();
        stopScreen();
      }
    },
    onClientLeave: data => {
      console.log('### LEAVE ###');
      // console.info(data);
    },
    onClientError: code => {
      console.warn('client:error');
      let message = '';
      if(code === 409) {
        console.warn('### ROOM IS LOCKED ###');
        message = ('房间已锁定');
      }
      else if(code === 404) {
        console.warn('### ROOM NOT FOUND ###');
        message = ('找不到该房间');
      }
      else if(code === 400) {
        console.warn('### ROOM IS FULL ###');
        message = ('房间已满');
      }
      else {
        message = ('未知错误');
        console.warn('### UNKNOWN ERROR ###');
      }
      beeper.publish(Events.ClientError, { code, message });
    },
    /** @type {(users: Array<User>) => void} */
    onUsers: (users) => {
      users.unshift(new All(translate));
      // for(let i = 0; i < 100; i++) {
      //   users.push(new User(crypto.randomUUID(), 'Fake user', '/images/avatars/00.png'));
      // }
      setChatUsers(users);
    },
    onUserMessage: (id, fromUser, data) => {
      /** @type {ChatRecord} */
      const chatRecord = {
        id,
        message: data.message,
        from: fromUser, to: data.to,
        time: new Date()
      };
      setChatHistory(x => [ ...x, chatRecord ]);
    },
    onMeetingUpdated: (user, meeting) => {
      beeper.publish(Events.UpdateMeeting, { user, meeting });
    }
  };

  const
  /** @type {() => void} */
  onAudioPeerOpen = () => {
    console.log(`Your device ID is: ${streamService.audioPeer.id}`);
    console.log('### AUDIO READY ###');
    setPeerStatus(current => { return { ...current, audio: true }; });
  },
  /** @type {() => void} */
  onAudioPeerDisconnected = () => {
    console.info('### PEER DISCONNECTED ###');
    try {
      if(streamService.audioPeer)
        streamService.audioPeer.reconnect();
    }
    catch(error) {

    }
  },
  /** @type {(call: { peer: string, answer: (stream: ReadableStream?), on: (eventName: string, callback: (stream: ReadableStream) => void) => void }) => void} call Call */
  onAudioPeerCall = call => {
    console.info(`### AUDIO ON CALL: ${call.peer} ###`);
    // Automatically join
    // if(vars.audio.isAlive) {
    //   return methods.startAudio({ isCaller: false, call, isAuto: true });
    // }
    // methods.chatAudioConfirm(async () => {
    //   await methods.startAudio({ isCaller: false, call });
    // }, () => {
    //   methods.rejectAudio(call);
    // });
    // return true;
  },
  /** @type {(error: { type: string }) => void} */
  onAudioPeerError = error => {
    console.warn('### AUDIO PEER ERROR ###');
    const message = Object.hasOwn(PEER.ERRORS, error.type) ? PEER.ERRORS[error.type] : 'Audio server connection error.';
    console.warn(message);
    beeper.publish(Events.ClientNotification, { message, style: NOTIFICATION_STYLES.WARNING });
  },
  onAudioPeerClose = () => {
    console.warn('### AUDIO PEER CLOSED ###');
  };
  // Screen
  const
  /** @type {() => void} */
  onVideoPeerOpen = () => {
    console.log(`Your share ID is: ${streamService.videoPeer.id}`);
    console.log('### SCREEN READY ###');
    setPeerStatus(current => { return { ...current, video: true }; });
  },
  /** @type {() => void} */
  onVideoPeerDisconnected = () => {
    console.warn('### PEER DISCONNECTED ###');
    try {
      if(streamService.videoPeer)
      streamService.videoPeer.reconnect();
    }
    catch(error) {

    }
  },
  /** @type {(call: { peer: string, metadata: { nickname: string }, answer: (stream: ReadableStream?), on: (eventName: string, callback: (stream: ReadableStream) => void) => void }) => void} call Call */
  onVideoPeerCall = call => {
    console.log(`### VIDEO ON CALL: ${call.peer} ###`);
    beeper.publish(Events.PeerVideoCall, { call });
  },
  /** @type {(error: { type: string }) => void} */
  onVideoPeerError = error => {
    console.warn('### SCREEN PEER ERROR ###');
    const message = Object.hasOwn(PEER.ERRORS, error.type) ? PEER.ERRORS[error.type] : 'Video server connection error.';
    console.warn(message);
    beeper.publish(Events.ClientNotification, { message, style: NOTIFICATION_STYLES.WARNING });
  },
  onVideoPeerClose = () => {
    console.warn('### SCREEN PEER CLOSED ###');
  };

  const useMeeting = (initialId, initialData) => {
    /** @type {[ meeting: Meeting, setMeeting: (meeting: Meeting) => void ]} */
    const [ meeting, setMeeting ] = useState(initialData);
    /** @type {[ meetingId: string, setMeetingId: (meetingId: string) => void ]} */
    const [ meetingId ] = useState(initialId);
    const [ isMeetingOK, setIsMeetingOK ] = useState(false);

    // Fetch and verify meeting information
    useEffect(() => {
      console.log('### MEETING ###');
      if(meetingId && utility.validateUUID(meetingId)) {
        chatService.getMeeting(meetingId).then(m => {
          if(m) {
            console.log('  MEETING.OK->', m.subject);
            setIsMeetingOK(true);
            setMeeting({ id: m.id, subject: m.subject, locked: m.locked, limitation: m.limitation, updated_time: m.updated_time });
          }
        }).catch(error => {
          console.log('  MEETING.ERROR->', error);
          goBackHome();
        }).finally(() => {
          
        });
      }
      else {
        console.log('  MEETING.DEFAULT');
        setIsMeetingOK(true);
        setMeeting({ id: ROOMS.DEFAULT.ID, subject: ROOMS.DEFAULT.SUBJECT, locked: ROOMS.DEFAULT.LOCKED, limitation: ROOMS.DEFAULT.LIMITATION, updated_time: ROOMS.DEFAULT.TIME });
      }
    }, [ meetingId ]);

    return [ { meeting, isMeetingOK }, setMeeting ];
  }, useUser = (initialRoom, initialData) => {
    /** @type {[ me: User, setMe: (me: User) => void ]} */
    const [ me, setMe ] = useState(initialData);
    /** @type {[ isMeOK: boolean, setIsMeOK: (isMeOK: boolean) => void ]} */
    const [ isMeOK, setIsMeOK ] = useState(false);
    /** @type {[ room: string, setRoom: (room: string) => void ]} */
    const [ room, setRoom ] = useState(initialRoom);
    const [ arePeersOK, setArePeersOK ] = useState(false);
    const [ isSocketReady, setIsSocketReady ] = useState(false);

    // Get user information from session storage
    useEffect(() => {
      // 1. Initialize user
      // 2. Try cache
      const storedUser = getUser();
      // 2.1 Initialize user from cache
      if(storedUser && utility.validateUUID(storedUser.id) && storedUser.name && storedUser.avatar) {
        setMe(storedUser);
        setIsMeOK(true);
      }
      else {
        goBackHome();
      }
    }, []);

    useEffect(() => {
      if(meeting.id && me && me.name && me.avatar && me.id) {
        console.log('### CONNECTING WITH SOCKET ###');
        streamService.connectWebSocket();
        // setSocket(io({ path: '/api/messaging', query: { room: meeting.id, id: me.id, avatar: me.avatar, name: me.name } }));

        streamService.getWebSocket().on('connect', socketEvents.onSocketConnect)
          .on('reconnect', socketEvents.onSocketReconnect)
          .on('reconnect_failed', socketEvents.onSocketReconnectFailed)
          .on('error', socketEvents.onSocketError)
          .on('disconnect', socketEvents.onSocketDisconnect)
          .on('reconnect_attempt', socketEvents.onSocketReconnectAttempt)
          .on('client:welcome:public', socketEvents.onClientWelcomePublic)
          .on('client:welcome:private', socketEvents.onClientWelcomePrivate)
          .on('client:leave', socketEvents.onClientLeave)
          .on('client:error', socketEvents.onClientError)
          .on('client:users', socketEvents.onUsers)
          .on('client:user:message', socketEvents.onUserMessage)
          .on('client:meeting:update:callback', socketEvents.onMeetingUpdated)
          // Screen share
          .on('client:screen:join:callback', socketEvents.onClientJoinScreen)
          .on('client:screen:stop:callback', socketEvents.onClientStopScreen)
          .on('client:screen:start:callback', socketEvents.onClientStartScreen);
        return () => {
          streamService.getWebSocket().emit('leave');
          streamService.getWebSocket().off('connect', socketEvents.onSocketConnect)
            .off('reconnect', socketEvents.onSocketReconnect)
            .off('reconnect_failed', socketEvents.onSocketReconnectFailed)
            .off('error', socketEvents.onSocketError)
            .off('disconnect', socketEvents.onSocketDisconnect)
            .off('reconnect_attempt', socketEvents.onSocketReconnectAttempt)
            .off('client:welcome:public', socketEvents.onClientWelcomePublic)
            .off('client:welcome:private', socketEvents.onClientWelcomePrivate)
            .off('client:screen:join:callback', socketEvents.onClientJoinScreen)
            .off('client:leave', socketEvents.onClientLeave)
            .off('client:error', socketEvents.onClientError)
            .off('client:users', socketEvents.onUsers)
            .off('client:user:message', socketEvents.onUserMessage)
            .off('client:meeting:update:callback', socketEvents.onMeetingUpdated);
        }
      }
    }, [me]);

    // Setup Peers
    useEffect(() => {
      if(isMeOK && isMeetingOK && isSocketReady) {
        console.log('### START ###');
        streamService.setupPeers(me.id, getScreenId(me.id, true)).then(code => {
          if(streamService.audioPeer) {
            console.log('### OFF AUDIO ###');
            streamService.audioPeer.off('open', onAudioPeerOpen)
            .off('disconnected', onAudioPeerDisconnected)
            .off('call', onAudioPeerCall)
            .off('error', onAudioPeerError);
          }
  
          if(streamService.videoPeer) {
            console.log('### OFF VIDEO ###');
            streamService.videoPeer.off('open', onVideoPeerOpen)
              .off('disconnected', onVideoPeerDisconnected)
              .off('call', onVideoPeerCall)
              .off('error', onVideoPeerError);
          }
          // Audio
          streamService.audioPeer.on('open', onAudioPeerOpen)
            .on('disconnected', onAudioPeerDisconnected)
            .on('call', onAudioPeerCall)
            .on('error', onAudioPeerError)
            .on('close', onAudioPeerClose);
          // Video
          streamService.videoPeer.on('open', onVideoPeerOpen)
            .on('disconnected', onVideoPeerDisconnected)
            .on('call', onVideoPeerCall)
            .on('error', onVideoPeerError)
            .on('close', onVideoPeerClose);
          // Ready
          setArePeersOK(true);
        }).catch(code => {
          console.log(`### REJECT CODE: ${code} ###`);
          if(code === CustomCodes.PEERS_INITIALIZED) {
            setArePeersOK(true);
          }
        });
      }
    }, [isMeOK, isSocketReady, me.id]);

    return [ { me, isMeOK, arePeersOK, isSocketReady }, { setMe, setRoom, setIsSocketReady } ];
  };

  /** @type {[ { meeting: Meeting, isMeetingOK: boolean }, setMeeting: (meeting: Meeting) => void ]} */
  const [ { meeting, isMeetingOK }, setMeeting ] = useMeeting(id, new Meeting().setId(id).toJSON());

  // Leave setMe and setRoom for future changes, e.g. rename or switch rooms
  /** @type {[ { me: User, isMeOK: boolean, arePeersOK: boolean }, { setMe: (me: User) => void, setRoom: (room: string) => void } ]} */
  const [ { me, isMeOK, arePeersOK, isSocketReady }, { setMe, setRoom, setIsSocketReady } ] = useUser(id, new User().toJSON());

  /** @type {[ chat: ChatPayload, setChat: (chat: ChatPayload) => void ]} */
  const [ chat, setChat ] = useState(new ChatPayload().toJSON());
  /** @type {[ uiProperty: UIProperty, setUiProperty: ( uiProperty: UIProperty ) => void ]} */
  const [ uiProperty, setUiProperty ] = useState(new UIProperty().toJSON());
  /** @type {[ chatHistory: Array<ChatRecord>, setChatHistory: (chatHistory: Array<ChatRecord>) => void ]} */
  const [ chatHistory, setChatHistory ] = useState([]);
  /** @type {[ chatVideo: ChatVideo, setChatVideo: (chatVideo: ChatVideo) => void ]} */

  /** @type {[ chatUsers: Array<User>, setChatUsers: (users: Array<User>) => void ]} */
  const [ chatUsers, setChatUsers ] = useState([]);

  /** @type {[ vars: { audio: Media, screen: Media, status: { emoji: string }, devices: Array<Device> }, setVars: (vars: { audio: Media, screen: Media, status: { emoji: string }, devices: Array<Device> }) => void ]} */
  const [ vars, setVars ] = useState({
    audio: { id: DEVICE.MICROPHONE },
    screen: { id: DEVICE.SCREEN },
    status: { emoji: '' },
    devices: []
  });

  /** @type {[ screenId: string, setScreenId: (screenId: string) => void ]} */
  const [ screenId, setScreenId ] = useState('');

  const nonRef = useRef({ meeting: false, user: false, peer: false, load: false });
  /** @type {{ current: HTMLInputElement }} */
  const chatInputRef = useRef(null);
  /** @type {{ current: HTMLDivElement }} */
  const chatHistoryRef = useRef(null);
  /** @type {{ current: HTMLVideoElement }} */
  const remoteVideoRef = useRef(null);
  /** @type {{ current: HTMLVideoElement }} */
  const localVideoRef = useRef(null);

  /** @type {(num: number) => string} */
  const prefixDigit = (num) => {
    if(num <= 9) return new String(`0${num}`);
    return new String(num);
  };
  /** @type {(date: Date) => string} */
  const getMinuteFormat = (date) => {
    return `${prefixDigit(date.getHours())}:${prefixDigit(date.getMinutes())}`;
  },
  /**
   * Scroll to bottom
   */
  scrollToBottom = () => {
    if(chatHistoryRef)
      chatHistoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  const focusInput = () => {
    if(chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const joinScreenSharing = (screenId) => {
    // beeper.publish(Events.JoinScreenShare, screenId);
    // streamService.getWebSocket().emit('server:screen:join', screenId);
  }, onMeetingUpdate = () => {
    streamService.getWebSocket().emit('server:meeting:update', meeting);
  },
  /** @type {(id: string, forPeer: string) => string} */
  getScreenId = (id, forPeer = false) => {
    const prefix = 'share-';
    if(forPeer)
      return `${prefix}${id}`;
    return id.replace(prefix, '');
  },
  generateMessage = () => {
    return {
      id: crypto.randomUUID(),
      message: chat.input.trim(),
      mode: chat.mode,
      to: chat.to
    }
  },
  sendChatMessage = async () => {
    if(chat.input.length > 0) {
      setIsLoading(true);
      if(streamService.getWebSocket().disconnected) {
        return notifyUser('正在尝试重新连接', NOTIFICATION_STYLES.WARNING);
      }
      const payload = generateMessage();
      setChat({ ...chat, input: '' });
      streamService.getWebSocket().emit('server:user:message', payload, () => {
        setIsLoading(false);
      });
    }
    focusInput();
  },
  isShareSupported = () => {
    return typeof (window.navigator.mediaDevices.getDisplayMedia) !== 'undefined';
  },
  stopStream = (nativeElement) => {
    if(nativeElement) {
      stopTracks(nativeElement.srcObject);
      nativeElement.srcObject = null;
      nativeElement.pause();
    }
  },
  /** @type {(stream: MediaStream) => void} */
  stopTracks = (stream) => {
    if(stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
    }
  },
  stopRemoteVideo = () => {
    stopTracks(streamService.remoteVideoStream);
    stopStream(remoteVideoRef.current);
  },
  stopLocalVideo = () => {
    stopTracks(streamService.localVideoStream);
    stopStream(localVideoRef.current);
  },
  stopScreen = () => {
    console.log('### STOP SCREEN ###');
    if(streamService.videoStatus === MediaStatus.RECEIVING) {
      stopRemoteVideo();
      console.log('### STOP REMOTE ###');
    }
    if(streamService.videoStatus === MediaStatus.PUBLISHING) {
      stopLocalVideo();
      console.log('### STOP LOCAL ###');
      streamService.getWebSocket().emit('server:screen:stop');
    }
    streamService.videoStatus = MediaStatus.IDLE;
    setUiProperty({ ...uiProperty, videoStatus: streamService.videoStatus });
    if(streamService.emoji === '📽') {
      streamService.setEmoji('');
      setVars({ ...vars, status: { ...vars.status, emoji: streamService.emoji } });
    }
    streamService.cleanConnections();
  },
  getDisplayMedia = async () => {
    const video = { width: { max: 3840 }, height: { max: 2160 }, deviceId: undefined };
    const isScreenOnly = vars.screen.id === DEVICE.SCREEN || vars.devices.findIndex(x => x.deviceId === vars.screen.id) === -1;
    if(isScreenOnly) {
      delete video.deviceId;
    }
    else {
      video.deviceId = vars.screen.id;
    }
    // Audio
    const audio = vars.audio.id === DEVICE.MICROPHONE ? true : { deviceId: vars.audio.id };
    /** @type {DisplayMediaStreamOptions|MediaStreamConstraints} */
    const constraints = { video, audio };
    // If the device ID equas default screen share or can not find the selected device
    return isScreenOnly ?
      await navigator.mediaDevices.getDisplayMedia(constraints) :
      await navigator.mediaDevices.getUserMedia(constraints);
  },
  captureScreen = async () => {
    try {
      const stream = await getDisplayMedia();
      if(stream) {
        // Stop local stream if it is being shared, remote stream should be cleaned after callback <- @todo
        stopLocalVideo();
        // // Notify server
        // streamService.getWebSocket().emit('server:user:screen', getScreenId(me.id));
        // // Notify user
        // notifyUser('屏幕共享已开启', NOTIFICATION_STYLES.SUCCESS);
        localVideoRef.current.muted = streamService.isMuted;
        localVideoRef.current.srcObject = stream;
        //
        streamService.publishVideoStream(stream);
        setUiProperty({ ...uiProperty, videoStatus: streamService.videoStatus });
        return true;
      }
    }
    catch(error) {
      console.warn('### ERROR CAPTURE ###');
      console.warn(error);
      // What if someone is sharing, but I cam cancelling... @todo
    }
    return false;
  },
  shareScreen = async () => {
    const isOK = await captureScreen();
    if(isOK) {
      streamService.setEmoji('📽');
    }
  },
  changeStatus = () => {
    const browserStatus = streamService.videoStatus === MediaStatus.PUBLISHING ? STATUS.AUDIO :
      document.visibilityState === 'visible' ? STATUS.ONLINE :
      STATUS.AWAY;
    const microphoneStatus = streamService.isMuted ? STATUS.MUTED : STATUS.SPEAKING;
    streamService.getWebSocket().emit('server:status', browserStatus, microphoneStatus, streamService.emoji);
  },
  playRemoteVideo = () => {
    const played = remoteVideoRef.current.play();
    if(played) {
      played.then(() => {
        setUiProperty({ ...uiProperty, isPlayingRemoteVideo: true });
      }).catch(error => {
        setUiProperty({ ...uiProperty, isPlayingRemoteVideo: false });
      });
    }
  },
  playLocalVideo = () => {
    const played = localVideoRef.current.play();
    if(played) {
      played.then(() => {
        setUiProperty({ ...uiProperty, isPlayingLocalVideo: true });
      }).catch(error => {
        setUiProperty({ ...uiProperty, isPlayingLocalVideo: false });
      });
    }
  };

  // Handle join screen sharing
  useEffect(() => {
    if(screenId && peerStatus.video) {
      console.log('### PEER READY AND REQUEST TO JOIN ###');
      streamService.getWebSocket().emit('server:screen:join', screenId);
    }
  }, [ screenId, peerStatus.video ]);

  // useEffect(() => {
  //   console.log('streamService.isReceivingAudio->', streamService.isReceivingAudio);
  //   if(streamService.isReceivingAudio) {
  //     const enabled = (streamService.isMuted === false);
  //     const tracks = streamService.remoteAudioStream.getTracks();
  //     tracks.forEach(track => {
  //       if(track.kind === 'audio') {
  //         track.enabled = enabled;
  //       }
  //     });
  //     remoteVideoRef.current.muted = streamService.isMuted;
  //     remoteVideoRef.current.srcObject = streamService.remoteAudioStream;
  //   }
  // }, []);

  // Scroll chat history automatically
  useEffect(() => {
    if(uiProperty.isScrolling)
      scrollToBottom();
  }, [chatHistory, uiProperty.isScrolling]);

  useEffect(() => {
    if(uiProperty.videoStatus === MediaStatus.PUBLISHING) {
      setVars(current => {
        return {
          ...current,
          status: { emoji: streamService.emoji }
        }
      })
      changeStatus();
      streamService.getWebSocket().emit('server:screen:start', getScreenId(me.id));
    }
  }, [me.id, uiProperty.videoStatus]);

  const logVideoStatus = (status) => {
    switch(status) {
      case MediaStatus.IDLE:
        return ('IDLE');
      case MediaStatus.PUBLISHING:
        return ('PUBLISHING');
      case MediaStatus.RECEIVING:
        return ('RECEIVING');
      default:
        return ('???');
    }
  };
  // useEffect(() => {
  //   console.log('uiProperty.videoStatus->', logVideoStatus(uiProperty.videoStatus), logVideoStatus(streamService.videoStatus));
  // }, [uiProperty.videoStatus]);

  useEffect(() => {
    console.log('arePeersOK->', arePeersOK);
  }, [arePeersOK]);

  // Handle events and setup peers
  useEffect(() => {
    console.log('### LOADED ###');
    const disposeSocketConnectedEvent = beeper.subscribe(Events.SocketConnected, ({ connected, isReconnect }) => {
      console.info(`### SOCKET CONNECTED: ${connected} ###`);
      if(connected) {
        focusInput();
      }
    });
    const disposeClientErrorEvent = beeper.subscribe(Events.ClientError, error => {
      setUiProperty({ ...uiProperty, error });
    });
    const disposeJoinScreenSharingEvent = beeper.subscribe(Events.JoinScreenShare, remoteScreenId => {
      // setScreenId(remoteScreenId);
      console.log('### JOIN SCREEN ->', remoteScreenId);
    });
    // const disposeStartScreenSharingCallbackEvent = beeper.subscribe(Events.StartScreenShareCallback, ({ caller, users, remoteScreenId }) => {
      
    // });
    const disposeStopScreenSharingCallbackEvent = beeper.subscribe(Events.StopScreenShareCallback, ({ sharer }) => {
      
    });
    // const disposeJoinScreenSharingCallbackEvent = beeper.subscribe(Events.JoinScreenShareCallback,
    //   /**
    //    * 
    //    * @param {{ callee: User, caller: User, remoteScreenId: string }} param0 Callback data
    //    */
    //   ({ callee, caller, remoteScreenId }) => {
    //   // console.log('callee->', callee, 'caller->', caller, 'remoteScreenId->', remoteScreenId);
    //   if(caller) {
    //     if(caller.id === me.id) {
    //       streamService.videoPeer.call(getScreenId(callee.id, true), streamService.remoteVideoStream, { metadata: {  } });
    //     }
    //   }
    //   else if(callee) {
    //     if(callee.id === me.id) {
    //       // @todo: What is this logic for
    //     }
    //   }
    // });
    // const disposeStatusChangeEvent = beeper.subscribe(Events.StatusChange, () => {
    //   changeEmoji();
    // });
    const disposeNotificationEvent = beeper.subscribe(Events.ClientNotification, ({ message, style }) => {
      notifyUser(message, style);
    });
    const disposeUpdateMeetingEvent = beeper.subscribe(Events.UpdateMeeting, ({ user, meeting }) => {
      setMeeting(meeting);
      notifyUser(utility.format(translate('【{0}】更新了会议信息'), user.name), NOTIFICATION_STYLES.INFO, true);
    });

    const disposeVideoCallEvent = beeper.subscribe(Events.PeerVideoCall, ({ call }) => {
      const peerScreenId = getScreenId(call.peer);
      const selectedUser = document.getElementById(peerScreenId);
      if(selectedUser && remoteVideoRef) {
        remoteVideoRef.current.poster = selectedUser.dataset['avatar'];
      }
      // I was sharing, but somebody interrupted
      stopScreen();
      call.answer();
      call.on('stream', remoteStream => {
        streamService.receiveVideoStream(remoteStream);
        // Unmute local video
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
        setUiProperty(current => {
          return { ...current, videoStatus: MediaStatus.RECEIVING, isPlayingLocalVideo: false };
        });
        setScreenId(peerScreenId);
      });
      if(call.metadata && call.metadata.nickname) {
        notifyUser(utility.format(translate('【{0}】开始了屏幕共享'), call.metadata.nickname), NOTIFICATION_STYLES.INFO, true);
      }
    });

    // Find browser supported devices
    utility.getDevices().then(systemDevices => {
      const devices = [{ kind: 'videoinput', label: translate('仅屏幕'), deviceId: DEVICE.SCREEN }].concat(systemDevices);
      setVars({ ...vars, devices });
    });

    return () => {
      disposeSocketConnectedEvent();
      disposeClientErrorEvent();
      disposeJoinScreenSharingEvent();
      // disposeJoinScreenSharingCallbackEvent();
      disposeStopScreenSharingCallbackEvent();
      // disposeStartScreenSharingCallbackEvent();
      // disposeStatusChangeEvent();
      disposeNotificationEvent();
      disposeUpdateMeetingEvent();
      disposeVideoCallEvent();
      streamService.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let lastCheckTime = new Date();

  return (
    <Layout.Main className={styles['chat']}>
      {/* CHAT HEADER */}
      <Layout.Header>
        {/* HOME BUTTON */}
        <IconButton size="sm"  onClick={evt => {
          goBackHome(true);
        }}>
          <HomeIcon />
        </IconButton>

        {/* CHAT NOTIFICATION */}
        <span className={styles['chat-subject']}>{ chatNotification.message ? <>
          {chatNotification.message} <i>({getMinuteFormat(chatNotification.time)})</i>
          </> : meeting.id === ROOMS.DEFAULT.ID ? translate(ROOMS.DEFAULT.SUBJECT) : meeting.subject }
        </span>

        {/* MENU - RIGHT */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.5
        }} className={styles['chat-menus']}
        >
          {/* OPEN MEETING INFORMATION */}
          { ROOMS.DEFAULT.ID !== meeting.id && <IconButton
            size="sm"
            variant="plain"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            onClick={evt => {
              setUiProperty({ ...uiProperty, isLinkDisplayed: true });
          }} className={styles['chat-menu']} disabled={isLoading}>
            <InfoIcon />
          </IconButton> }

          {/* OPEN MY PROFILE */}
          <IconButton
            size="sm"
            variant="soft"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            onClick={evt => {
              setUiProperty({ ...uiProperty, isProfileDisplayed: true });
            }} className={styles['chat-menu']} disabled={isLoading}>
            <PersonIcon />
          </IconButton>

          {/* OPEN USER LIST */}
          <Badge badgeContent={chatUsers.length ? chatUsers.length - 1 : ''}>
            <IconButton
              size="sm"
              variant="soft"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              onClick={evt => {
                setUiProperty({ ...uiProperty, isUserListDisplayed: !uiProperty.isUserListDisplayed });
              }} className={styles['chat-menu']} disabled={isLoading}>
              <PeopleIcon />
            </IconButton>
          </Badge>
        </Box>
      </Layout.Header>

      {/* CHAT MODALS */}
      <ChatUserModal user={me} open={uiProperty.isProfileDisplayed} translate={translate} handleClose={() => {
        setUiProperty({ ...uiProperty, isProfileDisplayed: false });
      }} />
      {/* CHAT LINK */}
      <ChatLinkModal user={me} open={uiProperty.isLinkDisplayed} translate={translate} handleClose={() => {
        setUiProperty({ ...uiProperty, isLinkDisplayed: false });
      } } meeting={meeting} setMeeting={setMeeting} handleMeeting={onMeetingUpdate} />
      {/* CHAT ERROR */}
      <ChatErrorModal open={uiProperty.error.code > 0} translate={translate} handleClose={() => {
        setUiProperty({ ...uiProperty, error: { code: 0, message: '' } });
      }} message={uiProperty.error.message} handleBack={goBackHome} />

      {/* CHAT HISTORY + SCREEN SHARE */}
      <Box
        component='main'
        className={styles['main']}
        sx={(theme) => ({
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      })}>
        <Box className={styles['chat-main']}
          sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {/* Video/Screen sharing */}
          <div className={`${styles['chat-media']}${uiProperty.videoStatus === MediaStatus.RECEIVING ? ` ${styles['receive']}` : ''}${uiProperty.videoStatus === MediaStatus.PUBLISHING ? ` ${styles['publish']}` : ''}`}>
            <div className={styles['chat-screen']}>
              <div className={styles['videos']}>
                <div className={styles['remote']}>
                  <video autoPlay={true} playsInline disablePictureInPicture ref={remoteVideoRef} onLoadedMetadata={evt => {
                    playRemoteVideo();
                  }} onClick={evt => {
                    playRemoteVideo();
                  }} onEnded={() => {
                    console.log('### ENDED ###');
                    // stopScreen();
                    // streamService.videoStatus = MediaStatus.IDLE;
                    // setUiProperty({ ...uiProperty, videoStatus: streamService.videoStatus });
                  }} onPause={() => {
                    console.log('### PAUSE ###');
                    // stopScreen();
                    setUiProperty({ ...uiProperty, isPlayingRemoteVideo: false });
                  }} 
                  />
                </div>
                <div className={styles['local']}>
                  <video autoPlay={false} playsInline disablePictureInPicture ref={localVideoRef} onLoadedMetadata={evt => {
                    playLocalVideo();
                  }}
                  />
                </div>
              </div>
              <div className={styles['controls']}>
                { uiProperty.isPlayingRemoteVideo === false && uiProperty.videoStatus === MediaStatus.RECEIVING && <IconButton size='sm' onClick={evt => {
                  // Play
                  playRemoteVideo();
                }}>
                  <SlideshowIcon />
                </IconButton> }
                { uiProperty.videoStatus === MediaStatus.PUBLISHING && <IconButton size='sm'  color='danger' onClick={evt => {
                  stopScreen();
                }}>
                  <DesktopAccessDisabledIcon />
                </IconButton> }
                { uiProperty.videoStatus === MediaStatus.RECEIVING && <IconButton size='sm'  onClick={evt => {
                  try {
                    if(document.fullscreenElement) {
                      document.exitFullscreen();
                    }
                    else {
                      remoteVideoRef.current.requestFullscreen();
                    }
                  }
                  catch(error) {}
                }}>
                  <FullscreenIcon />
                </IconButton> }
              </div>
            </div>
          </div>

          {/* Chat content */}
          <div className={styles['chat-content']}>
            {/* Chat history */}
            <div className={styles['chat-history']}>
              { chatHistory.map(x => {
                const hasTime = ((x.time - lastCheckTime.getTime()) > 3 * 60 * 1000);
                const displayTime = hasTime ? getMinuteFormat(x.time) : false;
                if(hasTime) {
                  lastCheckTime = x.time;
                }
                return <ChatFormat key={x.id} payload={x} isMe={x.from.id === me.id} hasTime={hasTime} displayTime={displayTime} />;
              } ) }
              <div ref={chatHistoryRef}></div>
            </div>
          </div>

          {/* User list */}
          { uiProperty.isUserListDisplayed && <div className={styles['chat-users']}>
            <div className={styles['chat-layer']}>
              <ul>
              { chatUsers.reduce(
                /**
                 * Reduce
                 * @param {Array<User>} accumulator User accumulator
                 * @param {User} calculateUser User being calculated
                 * @returns {Array<User>} Returns User Array
                 */
                (accumulator, calculateUser) => {
                  calculateUser.windows = 1;
                  var indexFound = accumulator.findIndex(indexUser => {
                    return calculateUser.id === indexUser.id;
                  });
                  if(indexFound === -1) {
                    return [ ...accumulator, calculateUser ];
                  }
                  accumulator[indexFound].windows += 1;
                  return [ ...accumulator ];
                }, [ ]).map(x => {
                  const emoji = x.__status.emoji ? ` ${x.__status.emoji}` : '';
                  return <li onClick={evt => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    setUiProperty({ ...uiProperty, users: !uiProperty.isUserListDisplayed });
                    setChat({ ...chat, from: me, to: x });
                    focusInput();
                  }} key={x.id} id={x.id} data-avatar={x.avatar} data-window={x.windows && x.windows > 1 ? x.windows : ''} style={{'--background-avatar-placeholder': `url(${x.avatar})` }}>
                    <a>{x.name}{ emoji && <span className={styles['emoji']} dangerouslySetInnerHTML={{ __html: emoji }}></span> }</a>
                  </li>
                }) }
              </ul>
            </div>
          </div> }
        </Box>
      </Box>

      {/* CHAT FOOTER */}
      <Layout.Footer>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          width: '100%',
        }}
        >
          {/* CHAT FORM */}
          <form className={styles['chat-form']} onSubmit={evt => {
            evt.preventDefault();
            evt.stopPropagation();
            sendChatMessage();
          }}>
            {/* CHAT INPUT */}
            <Input sx={{
              flex: 1
            }} placeholder={translate('说点什么...')} onChange={evt => {
              setChat({ ...chat, input: evt.target.value });
            }} value={chat.input} readOnly={isLoading} slotProps={{ input: { ref: chatInputRef } }}
            startDecorator={`${translate('对')}${chat.to.id === All.__id ? translate(chat.to.name) : chat.to.name}`}
            />
          </form>

          {/* CHAT TOOLBOX */}
          <Stack sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0.5,
          }}
          >
            <IconButton size='sm' variant="soft" disabled={isLoading} onClick={evt => {
              evt.preventDefault();
              evt.stopPropagation();
              sendChatMessage();
            }}>
              <SendIcon />
            </IconButton>

            {/* <IconButton size='sm' disabled={isLoading}>
              <TuneIcon />
            </IconButton>

            <IconButton size='sm' disabled={isLoading}>
              <MicIcon />
            </IconButton> */}

            { arePeersOK && <IconButton size='sm' color={uiProperty.videoStatus === MediaStatus.PUBLISHING ? 'danger' : 'neutral'} disabled={isLoading} onClick={evt => {
              evt.preventDefault();
              evt.stopPropagation();
              if(uiProperty.videoStatus === MediaStatus.PUBLISHING) {
                stopScreen();
              }
              else {
                shareScreen();
              }
            }}>
              { uiProperty.videoStatus === MediaStatus.PUBLISHING ? <CancelPresentationIcon /> : <PresentToAllIcon /> }
            </IconButton> }

            <Divider orientation="vertical"></Divider>

            <Tooltip
              disableHoverListener
              placement="top-end"
              variant="outlined"
              open={uiProperty.status.isEmojiDisplayed}
              arrow
              title={
                <Box sx={{
                  display: 'flex', gap: 0.2, width: '100%',
                  alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  maxWidth: 300
                }}>
                  { EMOJIS.map((code, key) => {
                    const emoji = String.fromCodePoint(parseInt(code, 16));
                    return <IconButton key={key} onClick={evt => {
                      streamService.setEmoji(emoji);
                      setVars({ ...vars, status: { emoji } });
                      changeStatus();
                      setUiProperty({ ...uiProperty, status: { ...uiProperty.status, isEmojiDisplayed: false } });
                      setChat({ ...chat, input: chat.input + emoji });
                      focusInput();
                    }}>
                      <span>{ emoji }</span>
                    </IconButton>
                  }) }

                  <Stack sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 0.5,
                  }}>
                    <Button size='sm' variant='soft' onClick={evt => {
                      streamService.setEmoji('');
                      setVars({ ...vars, status: { emoji: '' } });
                      changeStatus();
                      setUiProperty({ ...uiProperty, status: { ...uiProperty.status, isEmojiDisplayed: false } });
                    }}>Clear</Button>
                    <span>{vars.status.emoji}</span>
                    <Button size='sm' variant='outline' onClick={evt => {
                      setUiProperty({ ...uiProperty, status: { ...uiProperty.status, isEmojiDisplayed: false } });
                    }}>Close</Button>
                  </Stack>
                </Box>
              }
            >
              <IconButton size='sm' disabled={isLoading} onClick={evt => {
                setUiProperty({ ...uiProperty, status: { ...uiProperty.status, isEmojiDisplayed: !uiProperty.status.isEmojiDisplayed } });
              }}>
                <SentimentSatisfiedAltIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Layout.Footer>
    </Layout.Main>
  );
}
