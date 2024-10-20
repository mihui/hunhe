
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
import MicOffIcon from '@mui/icons-material/MicOff';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SendIcon from '@mui/icons-material/Send';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

import InfoIcon from '@mui/icons-material/Info';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled';
import AddIcCallIcon from '@mui/icons-material/AddIcCall';
import CallEndIcon from '@mui/icons-material/CallEnd';
import WarningIcon from '@mui/icons-material/Warning';

import Stack from '@mui/joy/Stack';
import Box from '@mui/joy/Box';
import Tooltip from '@mui/joy/Tooltip';
import Divider from '@mui/joy/Divider';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';

import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { User, ChatPayload, ChatRecord, All, Kinds, ChatAttachment, MessageTypes, MessageStatus, AI } from '@/components/models/user';
import { ChatUserModal } from '@/components/widgets/modals/chat-user';
import { Events, beeper, storage, utility } from '@/components/helpers/utility';
import { CustomCodes, ROOMS, StorageKeys } from '@/components/config/vars';
import { ChatLinkModal } from '@/components/widgets/modals/chat-link';
import { ChatFormat } from '@/components/widgets/chat/chat-format';
import { UserStream, DEFAULTS, Device, EMOJIS, Media, Meeting, NOTIFICATION_STYLES, PEER, PEER_STATUS, STATUS, UIProperty, ClipboardData } from '@/components/models/meeting';
import { MediaStatus, chatService, streamService } from '@/components/services/chat';
import { ChatErrorModal } from '../modals/chat-error';
import { ChatSettingsModal } from '../modals/chat-settings';
import { ChatTarget } from './chat-target';
import { ChatCopyPasteModal } from '../modals/chat-copy-paste';
import { ChatPreviewImageModal } from '../modals/chat-preview-image';
import { CHAT_ROLES } from '../../../../server/modules/services/chat';

/**
 * Chatroom
 * @param {{ id: string, translate: (str: string) => string }} param0 Props
 */
export default function ChatRoom({ id, translate }) {
  const router = useRouter();

  /** @type {[ isLoading: boolean, setIsLoading: (isLoading: boolean) => void ]} */
  const [ isLoading, setIsLoading ] = useState(true);

  /** @type {[ isChatting: boolean, setIsChatting: (isChatting: boolean) => void ]} */
  const [ isChatting, setIsChatting ] = useState(false);

  /** @type {[ isReconnect: boolean, setIsReconnect: (isReconnect: boolean) => void ]} */
  const [ isReconnect, setIsReconnect ] = useState(false);

  /** @type {[ isActive: boolean, setIsActive: (isActive: boolean) => void ]} */
  const [ isActive, setIsActive ] = useState(true);

  /** @type {[ arePeersOK: boolean, setArePeersOK: (arePeersOK: boolean) => void ]} */
  const [ arePeersOK, setArePeersOK ] = useState(false);

  /** @type {[ chatHeader: { message: string, style: string, time: Date }, setChatHeader: (chatHeader: { message: string, style: string, time: Date }) => void ]} */
  const [ chatHeader, setChatHeader ] = useState({ message: '', style: NOTIFICATION_STYLES.INFO, time: new Date() });

  /** @type {[ { video: number, audio: number }, setPeerStatus: (peerStatus: { video: number, audio: number }) => void ]} */
  const [ peerStatus, setPeerStatus ] = useState({ video: PEER_STATUS.NONE, audio: PEER_STATUS.NONE });

  const useMeeting = (initialId, initialData) => {
    /** @type {[ meeting: Meeting, setMeeting: (meeting: Meeting) => void ]} */
    const [ meeting, setMeeting ] = useState(initialData);
    /** @type {[ meetingId: string, setMeetingId: (meetingId: string) => void ]} */
    const [ meetingId ] = useState(initialId);
    const [ isMeetingOK, setIsMeetingOK ] = useState(false);

    // Fetch and verify meeting information
    useEffect(() => {
      if(meetingId && utility.validateUUID(meetingId)) {
        chatService.getMeeting(meetingId).then(m => {
          if(m) {
            console.debug('  MEETING.OK->', m.subject);
            setIsMeetingOK(true);
            setMeeting({ id: m.id, subject: m.subject, locked: m.locked, limitation: m.limitation, updated_time: m.updated_time });
          }
        }).catch(error => {
          console.debug('  MEETING.ERROR->', error);
          goBackHome();
        }).finally(() => {
        });
      }
      else {
        setIsMeetingOK(true);
        setMeeting({ id: ROOMS.DEFAULT.ID, subject: translate(ROOMS.DEFAULT.SUBJECT), locked: ROOMS.DEFAULT.LOCKED, limitation: ROOMS.DEFAULT.LIMITATION, updated_time: ROOMS.DEFAULT.TIME });
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
    const [ isSocketReady, setIsSocketReady ] = useState(false);

    // Get user information from session storage
    useEffect(() => {
      // 1. Initialize user
      // 2. Try cache
      const storedUser = chatService.getUser();
      // 2.1 Initialize user from cache
      if(storedUser && utility.validateUUID(storedUser.id) && storedUser.name && storedUser.avatar) {
        setMe(storedUser);
        setIsMeOK(true);
      }
      else {
        goBackHome();
      }
    }, []);

    const unmountWebSocket = () => {
      streamService.getWebSocket().off('connect', socketEvents.onSocketConnect)
        .off('reconnect', socketEvents.onSocketReconnect)
        .off('reconnect_failed', socketEvents.onSocketReconnectFailed)
        .off('error', socketEvents.onSocketError)
        .off('disconnect', socketEvents.onSocketDisconnect)
        .off('reconnect_attempt', socketEvents.onSocketReconnectAttempt)
        .off('client:welcome:public', socketEvents.onClientWelcomePublic)
        .off('client:welcome:private', socketEvents.onClientWelcomePrivate)
        .off('client:leave', socketEvents.onClientLeave)
        .off('client:error', socketEvents.onClientError)
        .off('client:users', socketEvents.onDisplayingUsers)
        .off('client:user:message', socketEvents.onUserMessage)
        .off('client:ai:message', socketEvents.onAIMessage)
        .off('client:meeting:update:callback', socketEvents.onMeetingUpdated)
        // Screen share
        .off('client:screen:join:callback', socketEvents.onClientJoinScreen)
        .off('client:screen:stop:callback', socketEvents.onClientStopScreen)
        .off('client:screen:start:callback', socketEvents.onClientStartScreen);
    };

    useEffect(() => {
      if(meeting.id && me && me.name && me.avatar && me.id) {
        console.debug('### CONNECTING WITH SOCKET ###');
        // unmountWebSocket();
        streamService.connectWebSocket();
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
          .on('client:users', socketEvents.onDisplayingUsers)
          .on('client:user:message', socketEvents.onUserMessage)
          .on('client:ai:message', socketEvents.onAIMessage)
          .on('client:meeting:update:callback', socketEvents.onMeetingUpdated)
          // Screen share
          .on('client:screen:join:callback', socketEvents.onClientJoinScreen)
          .on('client:screen:stop:callback', socketEvents.onClientStopScreen)
          .on('client:screen:start:callback', socketEvents.onClientStartScreen);

        return () => {
          streamService.getWebSocket().emit('server:leave');
          streamService.getWebSocket().disconnect();
          unmountWebSocket();
        }
      }
    }, [me]);

    // Setup Peers
    useEffect(() => {
      if(isMeOK && isMeetingOK && isSocketReady) {
        setupPeers();
        return () => {
          unmountPeerEvents();
          streamService.reset();
        };
      }
    }, [isMeOK, isSocketReady, me.id]);

    return [ { me, isMeOK, isSocketReady }, { setMe, setRoom, setIsSocketReady } ];
  };

  /** @type {[ { meeting: Meeting, isMeetingOK: boolean }, setMeeting: (meeting: Meeting) => void ]} */
  const [ { meeting, isMeetingOK }, setMeeting ] = useMeeting(id, new Meeting().setId(id).toJSON());

  // Notify in the header
  const notifyHeader = useCallback((message, style = NOTIFICATION_STYLES.INFO, hasTranslation = false) => {
    setChatHeader({ message: message ? (hasTranslation ? message : translate(message)) : translate(meeting.subject), style, time: new Date() })
  }, [translate, meeting.subject]);

  const notifyAudio = new Audio(), chatAudio = new Audio();
  chatAudio.autoplay = true;
  chatAudio.onloadedmetadata = evt => {
    try {
      evt.target.play().then(() => {
        console.info('### [ONLOADEDMETADATA] AUDIO STARTED ###');
      }).catch(error => {
        console.warn('### PERMISSION DENIED ###');
      });
    }
    catch(error) {
      console.warn('### AUDIO START ERROR ###');
      console.debug(error);
    }
  };

  notifyAudio.autoplay = false;
  notifyAudio.preload = 'metadata';

  let chatNotifications = [];
  const notifyUser = (sender, message, avatar = null) => {
    (function(callback) {
      if (!('Notification' in window)) {
        callback(false, '浏览器不支持通知');
      } else if (Notification.permission === 'granted') {
        callback(true);
      } else if (Notification.permission !== 'denied') {
        // We need to ask the user for permission
        Notification.requestPermission().then((permission) => {
          // If the user accepts, let's create a notification
          if (permission === 'granted') {
            callback(true);
          }
        }).catch(function(error) {
          callback(false, error.message);
        });
      }
      else {
        callback(false, '浏览器不支持通知');
      }
    })(function(isOK, error) {
      if(document.visibilityState === 'visible') return;
      if(isOK) {
        const text = `${sender}: ${message}`;
        const notification = new Notification('Notification', { body: text, icon: avatar });
        chatNotifications.push(notification);
      }
      else {
        console.warn(error);
        // notifyHeader(error.message, NOTIFICATION_STYLES.WARNING);
      }
    });
    notifyAudio.src = '/audio/notify.mp3';
    notifyAudio.play().then(() => {
      notifyAudio.muted = false;
    }).catch(error => {
      console.warn(error);
      // notifyHeader(error.message, NOTIFICATION_STYLES.WARNING);
    });
    return notifyAudio;
  };

  /** @type {() => User} */
  const goBackHome = useCallback((isIdValid = true) => {
    let route = '/';
    if(id && id !== ROOMS.DEFAULT.ID && isIdValid) {
      route = route.concat(`?meeting=${id}`);
    }
    router.push(route);
  }, [ id, router ]);

  const onSocketChanged = (connected, isSocketReconnect = false) => {
    // Disable/Enable UI
    setIsLoading(connected === false);
    beeper.publish(Events.SocketConnected, { connected, isReconnect: isSocketReconnect });
  },
  /** @type {(audio: UserStream) => void} */
  activateAudio = (audio) => {
    if(chatAudio && audio.hasAudioTracks()) {
      chatAudio.srcObject = streamService.remoteAudioStream;
      if(chatAudio.paused) {
        chatAudio.play().then(x => {
          console.log('    [PAUSED] AUDIO STARTED');
        }).catch(error => {
          console.warn('    [PAUSED] AUDIO PLAY ERROR!');
          console.warn(error);
        });
      }
    }
  },
  reconnectAudioPeer = () => {
    try {
      if(streamService.audioPeer) {
        if(streamService.audioPeer.disconnected) {
          setPeerStatus(current => { return { ...current, audio: PEER_STATUS.RECONNECTING }; });
          notifyHeader('正在重新连接语音服务');
          setIsReconnect(true);
          streamService.audioPeer.reconnect();
        }
        else {
          setPeerStatus(current => { return { ...current, audio: streamService.audioPeer.disconnected ? PEER_STATUS.DISCONNECTED : PEER_STATUS.READY }; });
        }
      }
      else {
        // @todo: Setup Peers, it is most likely we don't have this kind of situation
      }
    }
    catch(error) {
      // Peer may be destroyed, @todo: Setup Peers
      console.warn(error);
    }
  },
  reconnectVideoPeer = () => {
    try {
      if(streamService.videoPeer) {
        if(streamService.videoPeer.disconnected) {
          setPeerStatus(current => { return { ...current, video: PEER_STATUS.RECONNECTING }; });
          notifyHeader('正在重新连接视频服务');
          setIsReconnect(true);
          streamService.videoPeer.reconnect();
        }
        else {
          setPeerStatus(current => { return { ...current, video: streamService.videoPeer.disconnected ? PEER_STATUS.DISCONNECTED : PEER_STATUS.READY }; });
        }
      }
      else {
        // @todo: Setup Peers, it is most likely we don't have this kind of situation
      }
    }
    catch(error) {
      // Peer may be destroyed, @todo: Setup Peers
      console.warn(error);
      // streamService.setupPeers
    }
  }, notifyReconnection = () => {
      setIsReconnect(false);
      notifyHeader(isReconnect ? '重新连接成功' : '');
  },
  /** @type {(id: string, fromUser: User, data: { to: User, type: number, message: string, attachment: ChatAttachment }, status: number, stream: boolean) => void} */
  constructMessage = (id, fromUser, data, status, stream = false) => {
    /** @type {ChatRecord} */
    const chatRecord = {
      id, type: data.type,
      message: data.message,
      attachment: data.attachment,
      from: fromUser, to: data.to,
      time: new Date(),
      status
    };
    if(chatRecord.to.id === me.id && chatRecord.from.id !== me.id) {
      if((stream && chatRecord.finished) || stream === false)
        notifyUser(chatRecord.from.name, chatRecord.message, chatRecord.from.avatar);
    }
    if(utility.isBinary(chatRecord.type)) {
      const blob = new Blob([ chatRecord.attachment.binary ]);
      chatRecord.attachment.url = URL.createObjectURL(blob);
    }
    const isNewMessage = !chatHistoryRef.current.some(message => message.id === id);
    if(isNewMessage) {
      setChatHistory(x => {
        const updatedChatHistory = [...x, chatRecord];
        chatHistoryRef.current = updatedChatHistory;
        return updatedChatHistory;
      });
    }
    else {
      setChatHistory(
        /** @type {(prevChatHistory: Array<ChatRecord>) => void} prevChatHistory */
        prevChatHistory => {
        const newHistory = prevChatHistory.map(x => {
          if(x.id === id) {
            if(stream) {
              const streamMesage = x.message.concat(chatRecord.message);
              return { ...x, message: streamMesage, status: MessageStatus.Sent, time: new Date() };
            }
            return { ...x, status: MessageStatus.Sent, time: new Date() };
          }
          return x;
        });
        chatHistoryRef.current = newHistory;
        return newHistory;
      });
    }
  };

  const socketEvents = {
    /** @type {() => void} */
    onSocketConnect: () => {
      streamService.getWebSocket().emit('server:join', meeting.id, me);
    },
    /** @type {() => void} */
    onSocketReconnect: () => {
      console.log('### RECONNECTED ###');
      onSocketChanged(true, true);
    },
    /** @type {() => void} */
    onSocketReconnectFailed: () => {
      console.warn('### CONNECTION FAILED ###');
      onSocketChanged(false);
      notifyHeader('重新连接失败，请刷新页面重试', NOTIFICATION_STYLES.ERROR);
    },
    /** @type {() => void} */
    onSocketReconnectAttempt: () => {
      notifyHeader('正在重新连接...（第 {0} 次尝试）', NOTIFICATION_STYLES.WARNING);
    },
    /** @type {(error: Error) => void} */
    onSocketError: error => {
      console.warn('### SOCKET ERROR ###');
      onSocketChanged(false);
      notifyHeader('连接错误', NOTIFICATION_STYLES.ERROR);
    },
    /** @type {(reason: string) => void} */
    onSocketDisconnect: reason => {
      console.warn('### DISCONNECTED ###');
      // console.warn(`    ${reason}`);
      onSocketChanged(false);
      notifyHeader('连接已断开，请重试', NOTIFICATION_STYLES.ERROR);
      setChatUsers([]);
      setIsSocketReady(false);
      if(reason === 'io server disconnect' && isMeetingOK && isMeOK) {
        streamService.connectWebSocket();
      }
    },
    /** @type {(user: User) => void} */
    onClientWelcomePublic: user => {
      notifyHeader(utility.format(translate('网友【{0}】兴高采烈地来到了会议室， 大家热烈欢迎 ^_^！'), user.name), NOTIFICATION_STYLES.INFO, true);
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
          streamService.videoCall(getScreenId(callee.id, true));
        }
      }
    },
    /** @type {(caller: User, users: Array<User>, remoteScreenId: string) => void} */
    onClientStartScreen: (caller, users, remoteScreenId) => {
      // For the screen share user only!
      notifyHeader(utility.format(translate('【{0}】开始了屏幕共享'), caller.name), NOTIFICATION_STYLES.INFO, true);
      for(const receiver of users) {
        if(receiver.id === remoteScreenId) {
          continue;
        }
        console.log(`### CALLING ${receiver.name} ###`);
        streamService.videoCall(getScreenId(receiver.id, true), { id: caller.id, nickname: caller.name });
      }
    },
    /** @type {(sharer: User) => void} */
    onClientStopScreen: (sharer) => {
      // beeper.publish(Events.StopScreenShareCallback, { sharer });
      setScreenId('');
      notifyHeader(utility.format(translate('【{0}】停止了屏幕共享'), sharer.name), NOTIFICATION_STYLES.INFO, true);
      if(sharer.id !== me.id) {
        // stopRemoteVideo();
        stopScreen();
      }
    },
    /** @type {(data: { user: User }) => void} */
    onClientLeave: data => {
      console.log('### LEAVE ###');
      // console.info(data);
      notifyHeader(utility.format(translate('【{0}】离开了'), data.user.name), NOTIFICATION_STYLES.INFO, true);
    },
    /** @type {(code: number) => void} */
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
    onDisplayingUsers: (users) => {
      const uniqueUsers = users.reduce(
      /**
       * Callback function, will be called one time for each element in the array
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
      }, []);
      //
      streamService.maintainUserStreams(uniqueUsers);
      // for(let i = 0; i < 100; i++) {
      //   uniqueUsers.push(new User(crypto.randomUUID(), 'Fake user', '/images/avatars/00.png'));
      // }
      setChatUsers([ new All(translate), new AI(translate) ].concat(uniqueUsers));
    },
    /** @type {(id: string, fromUser: User, data: { to: User, type: number, message: string, attachment: ChatAttachment }) => void} */
    onUserMessage: (id, fromUser, data) => {
      constructMessage(id, fromUser, data, MessageStatus.Sent);
    },
    onAIMessage: (id, fromUser, data) => {
      constructMessage(id, fromUser, data, MessageStatus.Sent, true);
    },
    /** @type {(user: User, newMeeting: Meeting) => void} */
    onMeetingUpdated: (user, newMeeting) => {
      beeper.publish(Events.UpdateMeeting, { user, meeting: newMeeting });
    }
  };

  const peerEvents = {
    // Audio
    /** @type {() => void} */
    onAudioPeerOpen: () => {
      console.log('### AUDIO READY ###');
      setPeerStatus(current => { return { ...current, audio: PEER_STATUS.READY }; });
      notifyReconnection();
    },
    /** @type {() => void} */
    onAudioPeerDisconnected: () => {
      console.debug('### AUDIO PEER DISCONNECTED ###');
      if(isActive) {
        reconnectAudioPeer();
      }
      setPeerStatus(current => { return { ...current, audio: PEER_STATUS.DISCONNECTED }; });
    },
    /** @type {(call: import('peerjs').MediaConnection) => void} call Call */
    onAudioPeerCall: newConnection => {
      console.info(`### AUDIO ON CALL: ${newConnection.peer} ###`);
      // Automatically join
      newConnection.answer(streamService.localMediaStream);
      newConnection.on('stream', callerStream => {
        activateAudio(streamService.receiveAudioStream(newConnection.peer, callerStream));
      });
      streamService.addAudioConnection(newConnection);
    },
    /** @type {(error: { type: string }) => void} */
    onAudioPeerError: error => {
      console.warn('### AUDIO PEER ERROR ###');
      const message = Object.hasOwn(PEER.ERRORS, error.type) ? PEER.ERRORS[error.type] : '语音服务错误';
      console.warn(message);
      beeper.publish(Events.ClientNotification, { message, style: NOTIFICATION_STYLES.WARNING });
    },
    /** @type {() => void} */
    onAudioPeerClose: () => {
      console.warn('### AUDIO PEER CLOSED ###');
      setPeerStatus(current => { return { ...current, audio: PEER_STATUS.DISCONNECTED }; });
    },
    // Screen
    /** @type {() => void} */
    onVideoPeerOpen: () => {
      console.log('### VIDEO READY ###');
      setPeerStatus(current => { return { ...current, video: PEER_STATUS.READY }; });
      notifyReconnection();
    },
    /** @type {() => void} */
    onVideoPeerDisconnected: () => {
      console.debug('### VIDEO PEER DISCONNECTED ###');
      if(isActive) {
        reconnectVideoPeer();
      }
      setPeerStatus(current => { return { ...current, video: PEER_STATUS.DISCONNECTED }; });
    },
    /** @type {(call: { peer: string, metadata: { nickname: string }, answer: (stream: ReadableStream?), on: (eventName: string, callback: (stream: ReadableStream) => void) => void }) => void} call Call */
    onVideoPeerCall: call => {
      console.log(`### VIDEO ON CALL: ${call.peer} ###`);
      beeper.publish(Events.PeerVideoCall, { call });
    },
    /** @type {(error: { type: string }) => void} */
    onVideoPeerError: error => {
      console.warn('### SCREEN PEER ERROR ###');
      const message = Object.hasOwn(PEER.ERRORS, error.type) ? PEER.ERRORS[error.type] : 'Video server connection error.';
      console.warn(message);
      beeper.publish(Events.ClientNotification, { message, style: NOTIFICATION_STYLES.WARNING });
    },
    /** @type {() => void} */
    onVideoPeerClose: () => {
      console.warn('### SCREEN PEER CLOSED ###');
      setPeerStatus(current => { return { ...current, video: PEER_STATUS.DISCONNECTED }; });
    }
  };

  /** @type {(code: number) => void} */
  const mountPeerEvents = (code) => {
    if(streamService.audioPeer) {
      streamService.audioPeer.on('open', peerEvents.onAudioPeerOpen)
        .on('disconnected', peerEvents.onAudioPeerDisconnected)
        .on('call', peerEvents.onAudioPeerCall)
        .on('error', peerEvents.onAudioPeerError)
        .on('close', peerEvents.onAudioPeerClose);
    }

    if(streamService.videoPeer) {
      streamService.videoPeer.on('open', peerEvents.onVideoPeerOpen)
        .on('disconnected', peerEvents.onVideoPeerDisconnected)
        .on('call', peerEvents.onVideoPeerCall)
        .on('error', peerEvents.onVideoPeerError)
        .on('close', peerEvents.onVideoPeerClose);
    }
  };

  const setupPeers = () => {
    streamService.setupPeers(me.id, getScreenId(me.id, true)).then(code => {
      // unmountPeerEvents();
      // Audio
      mountPeerEvents(code);
      // Ready
      setArePeersOK(isShareSupported());
    }).catch(code => {
      console.log(`### EXCEPTION CODE: ${code} ###`);
      if(code === CustomCodes.PEERS_INITIALIZED) {
        const isOK = isShareSupported();
        mountPeerEvents(code);
        reconnectAudioPeer();
        reconnectVideoPeer();
        setArePeersOK(isOK);
        setPeerStatus({ video: isOK ? PEER_STATUS.READY : peerStatus.video, audio: isOK ? PEER_STATUS.READY : peerStatus.audio });
      }
    });
  },
  unmountPeerEvents = () => {
    if(streamService.audioPeer) {
      streamService.audioPeer.off('open', peerEvents.onAudioPeerOpen)
      .off('disconnected', peerEvents.onAudioPeerDisconnected)
      .off('call', peerEvents.onAudioPeerCall)
      .off('error', peerEvents.onAudioPeerError)
      .off('close', peerEvents.onAudioPeerClose);
    }

    if(streamService.videoPeer) {
      streamService.videoPeer.off('open', peerEvents.onVideoPeerOpen)
        .off('disconnected', peerEvents.onVideoPeerDisconnected)
        .off('call', peerEvents.onVideoPeerCall)
        .off('error', peerEvents.onVideoPeerError)
        .off('close', peerEvents.onVideoPeerClose);
    }
  };

  // Leave setMe and setRoom for future changes, e.g. rename or switch rooms
  /** @type {[ { me: User, isMeOK: boolean, arePeersOK: boolean }, { setMe: (me: User) => void, setRoom: (room: string) => void } ]} */
  const [ { me, isMeOK, isSocketReady }, { setMe, setRoom, setIsSocketReady } ] = useUser(id, new User().toJSON());

  /** @type {[ chat: ChatPayload, setChat: (chat: ChatPayload) => void ]} */
  const [ chat, setChat ] = useState(new ChatPayload().toJSON());
  /** @type {[ uiProperty: UIProperty, setUiProperty: ( uiProperty: UIProperty ) => void ]} */
  const [ uiProperty, setUiProperty ] = useState(new UIProperty().toJSON());
  /** @type {[ chatHistory: Array<ChatRecord>, setChatHistory: (chatHistory: Array<ChatRecord>) => void ]} */
  const [ chatHistory, setChatHistory ] = useState([]);
  /** @type {{ current: Array<ChatRecord> }} */
  const chatHistoryRef = useRef(chatHistory);

  /** @type {[ chatUsers: Array<User>, setChatUsers: (users: Array<User>) => void ]} */
  const [ chatUsers, setChatUsers ] = useState([]);
  const chatUserAmount = useMemo(() => chatUsers.filter(x => x.kind === Kinds.PERSON).length, [ chatUsers ]);

  /** @type {[ vars: { audio: Media, video: Media, output: Media, status: { emoji: string }, devices: Array<Device> }, setVars: (vars: { audio: Media, video: Media, output: Media, status: { emoji: string }, devices: Array<Device> }) => void ]} */
  const [ vars, setVars ] = useState({
    audio: { id: DEFAULTS.MICROPHONE }, video: { id: DEFAULTS.SCREEN },
    output: { id: DEFAULTS.SPEAKER },
    status: { emoji: '' },
    devices: []
  });

  /** @type {[ screenId: string, setScreenId: (screenId: string) => void ]} */
  const [ screenId, setScreenId ] = useState('');

  /** @type {{ current: HTMLInputElement }} */
  const chatInputRef = useRef(null);
  /** @type {{ current: HTMLDivElement }} */
  const chatScrollerRef = useRef(null);
  /** @type {{ current: HTMLVideoElement }} */
  const remoteVideoRef = useRef(null);
  /** @type {{ current: HTMLVideoElement }} */
  const remoteScreenRef = useRef(null);
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
    if(chatScrollerRef && chatScrollerRef.current)
      chatScrollerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  const focusInput = () => {
    if(chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const onMeetingUpdate = () => {
    streamService.getWebSocket().emit('server:meeting:update', meeting);
  },
  /** @type {(id: string, forPeer: string) => string} */
  getScreenId = (id, forPeer = false) => {
    const prefix = 'share-';
    if(forPeer)
      return `${prefix}${id}`;
    return id.replace(prefix, '');
  },
  generateMessage = async () => {
    /** @type {{ id: string, type: number, message: string, mode: string, to: User, attachment: { note: string, binary: ArrayBuffer }, messages: Array<string> }} */
    const payload = {
      id: crypto.randomUUID(),
      type: chat.type,
      message: chat.input.trim(),
      mode: chat.mode,
      to: chat.to,
      messages: []
    };

    if(utility.isBinary(chat.type)) {
      const response = await fetch(chat.attachment.base64);
      payload.attachment = {
        binary: await response.arrayBuffer(),
        note: chat.attachment.note
      };
    }
    if(payload.to.id === AI.__id) {
      payload.messages = chatHistory.filter(x => (x.to.id === AI.__id || x.from.id === AI.__id) && (x.to.id === me.id || x.from.id === me.id)).map(x => {
        return { content: x.message, role: x.from.id === AI.__id ? CHAT_ROLES.ASSISTANT : CHAT_ROLES.USER };
      });
      payload.messages.push({ content: payload.message, role: CHAT_ROLES.USER });
    }
    return payload;
  },
  analyzeMessage = () => {
    if(chat.input.toLowerCase().includes('/new')) {
      setChatHistory([]);
      setChat({ ...chat, input: '', attachment: { base64: '', note: '' }, type: MessageTypes.Text });
      return false;
    }
    return isChatting === false && isSocketReady;
  },
  sendChatMessage = async () => {
    if((chat.input.length > 0 || utility.isBase64StringValid(chat.attachment.base64)) && analyzeMessage()) {
      setIsChatting(true);
      if(streamService.getWebSocket().disconnected) {
        streamService.getWebSocket().connect();
        return notifyHeader('正在尝试重新连接', NOTIFICATION_STYLES.WARNING);
      }
      const payload = await generateMessage();
      constructMessage(payload.id, me, { to: payload.to, type: payload.type, message: payload.message, attachment: payload.attachment }, MessageStatus.Sending);
      setChat({ ...chat, input: '', attachment: { base64: '', note: '' }, type: MessageTypes.Text });
      streamService.getWebSocket().emit('server:user:message', payload, () => {
        setIsChatting(false); // Ack
      });
    }
    focusInput();
  },
  isShareSupported = () => {
    return typeof (window.navigator.mediaDevices.getDisplayMedia) !== 'undefined';
  },
  stopRemoteVideo = () => {
    utility.stopTracks(streamService.remoteVideoStream);
    utility.stopStream(remoteVideoRef.current);
  },
  stopLocalVideo = () => {
    utility.stopTracks(streamService.localScreenStream);
    utility.stopStream(localVideoRef.current);
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
    setUiProperty(current => {
      return { ...current, videoStatus: streamService.videoStatus };
    });
    if(streamService.emoji === '📽') {
      streamService.setEmoji('');
      setVars({ ...vars, status: { ...vars.status, emoji: streamService.emoji } });
      changeStatus();
    }
    streamService.cleanVideoConnections();
  },
  getDisplayMedia = async () => {
    return utility.getDisplayMedia(vars.video.id, vars.audio.id, vars.devices);
  },
  captureScreen = async () => {
    try {
      const stream = await getDisplayMedia();
      // Stop local stream if it is being shared, remote stream should be cleaned after callback <- @todo
      stopLocalVideo();
      localVideoRef.current.muted = true;
      localVideoRef.current.srcObject = stream;
      //
      streamService.publishVideoStream(stream);
      enableTracks();
      setUiProperty({ ...uiProperty, videoStatus: streamService.videoStatus });
      return true;
    }
    catch(error) {
      console.warn('### ERROR CAPTURING VIDEO ###');
      console.warn(error);
      notifyHeader('媒体访问权限错误', NOTIFICATION_STYLES.ERROR);
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
    const browserStatus = streamService.audioStatus === MediaStatus.PUBLISHING ? STATUS.AUDIO :
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
  },
  enableTracks = () => {
    streamService.enableTracks((uiProperty.videoStatus === MediaStatus.IDLE || vars.video.id === DEFAULTS.SCREEN));
  },
  /** @type {() => Promise<void>} */
  startLocalAudio = async () => {
    try {
      const stream = await utility.captureUserAudio();
      streamService.publishAudioStream(me.id, stream);
      enableTracks();
    }
    catch(error) {
      console.warn('### ERROR CAPTURING AUDIO ###');
      console.warn(error);
    }
  },
  connectUsers = () => {
    chatUsers.filter(x => x.__status.browser === STATUS.AUDIO && x.id !== me.id).forEach(x => {
      console.log('  CALLING->', x.name);
      const call = streamService.audioCall(x.id, { id: me.id, nickname: me.name });
      if(call) {
        call.on('stream', calleeStream => {
          activateAudio(streamService.receiveAudioStream(call.peer, calleeStream));
        });
      }
    });
  },
  stopAudio = () => {
    utility.stopTracks(streamService.localMediaStream);
    streamService.stopAudioStream();
    streamService.isMuted = true;
    setUiProperty({ ...uiProperty, audioStatus: streamService.audioStatus, isMuted: streamService.isMuted });
    streamService.cleanAudioConnections();
  },
  toggleAudio = async () => {
    if(streamService.audioStatus === MediaStatus.PUBLISHING) {
      stopAudio();
    }
    else {
      await startLocalAudio();
      setUiProperty({ ...uiProperty, audioStatus: streamService.audioStatus });
      connectUsers();
    }
    changeStatus();
  },
  selectUser = useCallback(to => {
    // setChat({ ...chat, to });
    setChat(prevChat => {
      return { ...prevChat, to };
    });
    focusInput();
  }, []),
  setAudioOutput = (audioDeviceId, saveStorage = true) => {
    if(typeof (chatAudio.setSinkId) === 'function') {
      Promise.all([ chatAudio.setSinkId(audioDeviceId), notifyAudio.setSinkId(audioDeviceId) ]).catch(error => {
        // console.warn('### SET DEVICE ERROR ###');
        // console.warn(error);
        // console.warn(audioDeviceId);
      }).then(() => {
        if(saveStorage) {
          setVars({ ...vars, output: { ...vars.output, id: audioDeviceId } });
          storage.save(StorageKeys.AudioOutputDeviceId, audioDeviceId);
        }
      });
    }
    // else {
    //   console.warn('### SET DEVICE ERROR ###');
    // }
  };

  // Handle join screen sharing
  useEffect(() => {
    if(screenId && peerStatus.video === PEER_STATUS.READY && streamService.videoStatus !== MediaStatus.RECEIVING) {
      console.log('### PEER READY AND REQUEST TO JOIN ###');
      streamService.getWebSocket().emit('server:screen:join', screenId);
    }
  }, [ screenId, peerStatus.video ]);

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

  let keyboardTimeout = 0;
  const refreshDevices = () => {
    // Find browser supported devices
    utility.getDevices().then(systemDevices => {
      const devices = [{ kind: 'videoinput', label: translate('仅屏幕'), deviceId: DEFAULTS.SCREEN }].concat(systemDevices);
      const audioOutputDeviceId = storage.get(StorageKeys.AudioOutputDeviceId, DEFAULTS.SPEAKER);
      setVars({
        ...vars, devices,
        audio: { ...vars.audio, id: storage.get(StorageKeys.AudioInputDeviceId, DEFAULTS.MICROPHONE) },
        video: { ...vars.video, id: storage.get(StorageKeys.VideoInputDeviceId, DEFAULTS.SCREEN) },
        output: { ...vars.output, id: audioOutputDeviceId },
      });
      setAudioOutput(audioOutputDeviceId, false);
    });
  },
  onVisibilityChanged = evt => {
    if (document.visibilityState === 'visible') {
      for(const notification of chatNotifications) {
        notification.close();
      }
      chatNotifications.length = 0;
      chatNotifications = [];
    }
    changeStatus();
  },
  /** @type {(items: Array<{ kind: string, type: string, getAsFile: () => Blob }>) => Promise<{ ok: boolean, message: string, data: ClipboardData }>} */
  readItems = (items) => {
    return new Promise((resolve, reject) => {
      try {
        for (const item of items) {
          if(item.type.startsWith('image')) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              return resolve({ ok: true, message: translate('粘贴成功'), data: { url: URL.createObjectURL(blob), base64: reader.result, note: '' } });
            };
          }
          else {
            return reject({ ok: false, message: translate('不支持的剪贴板类型') });
          }
        }
      }
      catch(error) {
        console.log(error);
        return reject({ ok: false, message: translate('不支持粘贴') });
      }
    });
  },
  /**
   * Read image
   * @type {() => Promise<{ ok: boolean, message: string, data: ClipboardData }>} Returns pasted image data
   */
  readImage = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const clipboardContents = await navigator.clipboard.read();
        for (const item of clipboardContents) {
          const imageTypes = item.types.filter(x => x.startsWith('image'));
          if (imageTypes.length > 0) {
            for(const imageType of imageTypes) {
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                return resolve({ ok: true, message: translate('粘贴成功'), data: { url: URL.createObjectURL(blob), base64: reader.result, note: '' } });
              };
            }
          } // end of supported clipboard item types
          else {
            return reject({ ok: false, message: translate('不支持的剪贴板类型') });
          }
        } // end loop of clipboard contents
      }
      catch(error) {
        return reject({ ok: false, message: translate('不支持粘贴') });
      }
    });
  },
  /**
   * Paste image
   * @type {() => Promise<{ ok: boolean, message: string, data: ClipboardData }>} Returns pasted image data
   */
  pasteImage = async (items) => {
    try {
      return await readItems(items);
    }
    catch(error) {}
    try {
      const permission = await window.navigator.permissions.query({ name: 'clipboard-read' });
      if(permission.state === 'denied') {
        return { ok: false, message: translate('剪贴板权限错误') };
      }
    }
    catch(error) {
      return { ok: false, message: translate('不允许粘贴') };
    }
    //
    finally {
      try {
        return await readImage();
      }
      catch(error) {
        return { ok: false, message: translate('剪贴板错误') };
      }
    }
  },
  /** @type {(evt: Event) => void} */
  onPasted = async evt => {
    if(new Date().getTime() - keyboardTimeout > 2000) {
      keyboardTimeout = new Date().getTime();
      /** @type {{ kind: string, type: string, getAsFile: () => Blob }} */
      const items = (evt.clipboardData || evt.originalEvent.clipboardData).items;
      pasteImage(items).then(({ ok, message, data }) => {
        if(ok && utility.isBase64StringValid(data.base64)) {
          setChat(
            /**
             * @param {ChatPayload} chat Chat
             * @returns {void}
             */
            chat => {
              return { ...chat, type: MessageTypes.Binary, attachment: data, input: '' };
            }
          );
          setUiProperty(current => {
            return { ...current, isCopyPasteDisplayed: true };
          });
        }
      });
    }
  },
  /** @type {(listen: boolean) => void} */
  bindWindowEvents = (listen = true) => {
    if(listen) {
      document.addEventListener('visibilitychange', onVisibilityChanged);
      window.addEventListener('paste', onPasted);
    }
    else {
      document.removeEventListener('visibilitychange', onVisibilityChanged);
      window.removeEventListener('paste', onPasted);
    }
  };

  // Page load, Handle events and setup peers
  useEffect(() => {
    const disposeSocketConnectedEvent = beeper.subscribe(Events.SocketConnected, ({ connected, isReconnect: isSocketReconnect }) => {
      console.log(`### SOCKET CONNECTED: ${connected} ###`);
      if(connected) {
        setIsChatting(false);
        focusInput();
      }
    });
    const disposeClientErrorEvent = beeper.subscribe(Events.ClientError, error => {
      setUiProperty({ ...uiProperty, error });
    });
    const disposeNotificationEvent = beeper.subscribe(Events.ClientNotification, ({ message, style, hasTranslation = false }) => {
      notifyHeader(message, style, hasTranslation);
    });
    const disposeUpdateMeetingEvent = beeper.subscribe(Events.UpdateMeeting, ({ user, meeting }) => {
      setMeeting(meeting);
      notifyHeader(utility.format(translate('【{0}】更新了会议信息'), user.name), NOTIFICATION_STYLES.INFO, true);
    });
    const disposeVideoCallEvent = beeper.subscribe(Events.PeerVideoCall, ({ call }) => {
      if(remoteVideoRef?.current === null) {
        console.warn('    NULL VIDEO REFERENCE');
        return;
      }
      const peerScreenId = getScreenId(call.peer);
      const selectedUser = chatUsers.find(x => x.id === peerScreenId); // document.getElementById(peerScreenId);
      if(selectedUser) {
        remoteVideoRef.current.poster = selectedUser.avatar;
      }
      // I was sharing, but somebody interrupted
      stopScreen();
      call.answer();
      call.on('stream', remoteStream => {
        console.log(`    VIDEO RECEIVING: ${call.peer} ###`);
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
        notifyHeader(utility.format(translate('【{0}】开始了屏幕共享'), call.metadata.nickname), NOTIFICATION_STYLES.INFO, true);
      }
    });

    refreshDevices();

    bindWindowEvents();

    setIsActive(true);

    streamService.initTranslation(translate);

    return () => {
      disposeSocketConnectedEvent();
      disposeClientErrorEvent();
      disposeNotificationEvent();
      disposeUpdateMeetingEvent();
      disposeVideoCallEvent();

      stopScreen();
      stopAudio();
      setIsReconnect(false);

      bindWindowEvents(false);
      setIsActive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const UserList = useMemo(() => chatUsers.map((user, index) => {
    return <ChatTarget key={index} user={user} selectUser={selectUser} />
  }), [chatUsers, selectUser]);

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
        <span className={styles['chat-subject'].concat(` ${styles[chatHeader.style]}`)}>{ chatHeader.message ?
          <>{chatHeader.message} <i>({getMinuteFormat(chatHeader.time)})</i></> :
          meeting.id === ROOMS.DEFAULT.ID ? translate(ROOMS.DEFAULT.SUBJECT) : meeting.subject }
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
          <IconButton
            size="sm"
            variant="plain"
            sx={{ display: { sm: 'inline-flex' } }}
            onClick={evt => {
              setUiProperty({ ...uiProperty, isLinkDisplayed: true });
          }} className={styles['chat-menu']} disabled={isLoading}>
            <InfoIcon />
          </IconButton>

          {/* OPEN MY PROFILE */}
          <IconButton
            size="sm"
            variant="soft"
            sx={{ display: { sm: 'inline-flex' } }}
            onClick={evt => {
              setUiProperty({ ...uiProperty, isProfileDisplayed: true });
            }} className={styles['chat-menu']} disabled={isLoading}>
            <PersonIcon />
          </IconButton>

          {/* OPEN USER LIST */}
          <Badge badgeContent={chatUserAmount} showZero={false}>
            <IconButton
              size="sm"
              variant="soft"
              sx={{ display: { sm: 'inline-flex' } }}
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
      {/* CHAT SETTINGS */}
      <ChatSettingsModal user={me} open={uiProperty.isSettingsDisplayed} translate={translate} handleClose={() => {
        setUiProperty({ ...uiProperty, isSettingsDisplayed: false });
      }} vars={vars} setVars={setVars} refreshDevices={refreshDevices} handleSpeakerChange={deviceId => {
        setAudioOutput(deviceId);
      }} />
      {/* CHAT LINK */}
      <ChatLinkModal user={me} open={uiProperty.isLinkDisplayed} translate={translate} handleClose={() => {
        setUiProperty({ ...uiProperty, isLinkDisplayed: false });
      } } meeting={meeting} setMeeting={setMeeting} handleMeeting={onMeetingUpdate} />
      {/* CHAT CLIPBOARD */}
      <ChatCopyPasteModal open={uiProperty.isCopyPasteDisplayed} translate={translate} handleClose={() => {
        setUiProperty({ ...uiProperty, isCopyPasteDisplayed: false });
      } } clipboard={chat.attachment} handleSubmit={sendChatMessage} changeNote={note => {
        setChat({ ...chat, attachment: { ...chat.attachment, note } });
      }} isChatting={isLoading} />
      {/* CHAT PREVIEW */}
      <ChatPreviewImageModal open={uiProperty.isPreviewDisplayed} translate={translate} handleClose={() => {
        setUiProperty({ ...uiProperty, isPreviewDisplayed: false });
      } } data={uiProperty.previewUrl} />
      {/* CHAT ERROR */}
      <ChatErrorModal open={uiProperty.error.code > 0} translate={translate} message={uiProperty.error.message} handleBack={goBackHome} />

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
          <div className={styles['chat-main']}>
            { (peerStatus.audio === PEER_STATUS.DISCONNECTED || peerStatus.video === PEER_STATUS.DISCONNECTED) && <Alert
              startDecorator={<WarningIcon />}
              variant="soft"
              color="danger"
              sx={{
                margin: '1rem'
              }}
              endDecorator={
                <>
                { (peerStatus.audio === PEER_STATUS.RECONNECTING || peerStatus.video === PEER_STATUS.RECONNECTING) ? <CircularProgress size='sm' /> : <Button variant="soft" color="danger" sx={{ mr: 1 }} onClick={evt => {
                  reconnectAudioPeer();
                  reconnectVideoPeer();
                }}>
                  { translate('重新连接') }
                </Button> }
                </>
              }
            >
              { translate('视频语音部分服务不可用') }
            </Alert> }

            {/* Chat content */}
            { isSocketReady === false && <div className={styles['chat-loading']}>
              <div className={styles['container']}><CircularProgress size='md'></CircularProgress><Typography sx={{
                fontSize: '0.85rem'
              }}>{ translate('正在连接') }</Typography></div>
            </div> }

            {/* Video/Screen sharing */}
            <div className={`${styles['chat-media']}${uiProperty.videoStatus === MediaStatus.RECEIVING ? ` ${styles['receive']}` : ''}${uiProperty.videoStatus === MediaStatus.PUBLISHING ? ` ${styles['publish']}` : ''}`}>
              <div className={styles['chat-screen']} ref={remoteScreenRef}>
                <div className={styles['videos']}>
                  <div className={styles['remote']}>
                    <video autoPlay={true} playsInline disablePictureInPicture={true} ref={remoteVideoRef} onLoadedMetadata={evt => {
                      playRemoteVideo();
                    }} onClick={evt => {
                      playRemoteVideo();
                    }} onEnded={evt => {
                      console.log('### ENDED ###');
                      // stopScreen();
                      // streamService.videoStatus = MediaStatus.IDLE;
                      // setUiProperty({ ...uiProperty, videoStatus: streamService.videoStatus });
                    }} onPause={evt => {
                      console.log('### REMOTE PAUSE ###');
                      // stopScreen();
                      setUiProperty({ ...uiProperty, isPlayingRemoteVideo: false });
                    }} 
                    />
                  </div>
                  <div className={styles['local']}>
                    <video autoPlay={false} playsInline disablePictureInPicture={true} ref={localVideoRef} onLoadedMetadata={evt => {
                      playLocalVideo();
                    }}
                    onPause={evt => {
                      console.log('### LOCAL PAUSE ###');
                      stopScreen();
                    }}
                    onSuspend={evt => {
                      console.log('### LOCAL SUSPEND ###');
                      if(utility.isChromium(navigator.userAgent))
                        stopScreen();
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
                  { uiProperty.videoStatus === MediaStatus.PUBLISHING && <IconButton size='sm' color='danger' onClick={evt => {
                    stopScreen();
                  }}>
                    <DesktopAccessDisabledIcon />
                  </IconButton> }
                  { uiProperty.videoStatus === MediaStatus.RECEIVING && <Tooltip title={document.fullscreenElement ? translate('退出全屏') : translate('全屏')}><IconButton size='sm' onClick={evt => {
                    try {
                      if(document.fullscreenElement) {
                        document.exitFullscreen();
                      }
                      else {
                        if(utility.requestFullScreen(remoteScreenRef.current) === false) {
                          utility.requestFullScreen(remoteVideoRef.current);
                        }
                      }
                    }
                    catch(error) {}
                  }}>
                    <FullscreenIcon />
                  </IconButton></Tooltip> }

                  { (uiProperty.audioStatus !== MediaStatus.IDLE || uiProperty.videoStatus === MediaStatus.PUBLISHING) && <Tooltip title={uiProperty.isMuted ? translate('打开麦克风') : translate('关闭麦克风')}><IconButton size='sm' disabled={isLoading} onClick={evt => {
                    streamService.toggleMute();
                    setUiProperty({ ...uiProperty, isMuted: streamService.isMuted });
                    enableTracks();
                    changeStatus();
                  }} color={ uiProperty.isMuted ? 'neutral': 'primary' }>
                    { uiProperty.isMuted ? <MicOffIcon /> :  <MicIcon /> }
                  </IconButton></Tooltip> }
                </div>
              </div>
            </div>

            <div className={styles['chat-content']}>
              {/* Chat history */}
              <div className={styles['chat-history']}>
                { chatHistory.map(x => {
                  const hasTime = ((x.time - lastCheckTime.getTime()) > 3 * 60 * 1000);
                  const displayTime = hasTime ? getMinuteFormat(x.time) : false;
                  if(hasTime) {
                    lastCheckTime = x.time;
                  }
                  return <ChatFormat key={x.id} payload={x} isMe={x.from.id === me.id} isToMe={x.to.id === me.id} hasTime={hasTime} displayTime={displayTime} selectUser={selectUser} openPreview={data => {
                    setUiProperty({ ...uiProperty, previewUrl: data.url, isPreviewDisplayed: true });
                  }} />;
                } ) }
                <div className={styles['chat-bottom']} ref={chatScrollerRef}></div>
              </div>
            </div>
          </div>

          {/* USER LIST */}
          { isSocketReady && uiProperty.isUserListDisplayed && <div className={styles['chat-users']}>
            <div className={styles['chat-layer']}>
              <ul>
                { UserList }
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
            }} value={chat.input} readOnly={isSocketReady === false || isChatting} slotProps={{ input: { ref: chatInputRef } }}
            startDecorator={<Button variant='plain' onClick={evt => {
              setUiProperty({ ...uiProperty, isUserListDisplayed: !uiProperty.isUserListDisplayed });
              focusInput();
            }}>{translate('对')}{chat.to.id === All.__id ? translate(chat.to.name) : chat.to.name}</Button>}
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
            <Tooltip title={translate('发送')}><IconButton size='sm' variant="soft" disabled={isSocketReady === false || isChatting} onClick={evt => {
              evt.preventDefault();
              evt.stopPropagation();
              sendChatMessage();
            }}>
                <SendIcon />
            </IconButton></Tooltip>

            { (uiProperty.audioStatus !== MediaStatus.IDLE || uiProperty.videoStatus === MediaStatus.PUBLISHING) && <Tooltip title={uiProperty.isMuted ? translate('打开麦克风') : translate('关闭麦克风')}><IconButton size='sm' disabled={isLoading} onClick={evt => {
              streamService.toggleMute();
              setUiProperty({ ...uiProperty, isMuted: streamService.isMuted });
              enableTracks();
              changeStatus();
            }} color={ uiProperty.isMuted ? 'neutral': 'primary' }>
              { uiProperty.isMuted ? <MicOffIcon /> :  <MicIcon /> }
            </IconButton></Tooltip> }

            { peerStatus.audio === PEER_STATUS.READY && <Tooltip title={uiProperty.audioStatus === MediaStatus.IDLE ? translate('加入音频通话') : translate('挂断')}><IconButton size='sm' disabled={isLoading} onClick={evt => {
              toggleAudio();
            }} color={ uiProperty.audioStatus === MediaStatus.IDLE ? 'neutral': 'danger' }>
              { uiProperty.audioStatus === MediaStatus.IDLE ?
                <AddIcCallIcon />
                :
                <CallEndIcon />
              }
            </IconButton></Tooltip> }

            { peerStatus.video === PEER_STATUS.READY && peerStatus.audio === PEER_STATUS.READY && arePeersOK && <Tooltip title={translate('设置')}><IconButton size='sm' disabled={isLoading} onClick={evt => {
              evt.preventDefault();
              evt.stopPropagation();
              setUiProperty({ ...uiProperty, isSettingsDisplayed: !uiProperty.isSettingsDisplayed });
              utility.captureUserAudio().then(stream => {
                utility.stopTracks(stream);
                refreshDevices();
              });
            }}>
              <TuneIcon />
            </IconButton></Tooltip> }

            { arePeersOK && peerStatus.video === PEER_STATUS.READY && <Tooltip title={uiProperty.videoStatus === MediaStatus.PUBLISHING ? translate('取消屏幕共享') : translate('共享屏幕')}><IconButton size='sm' color={uiProperty.videoStatus === MediaStatus.PUBLISHING ? 'danger' : 'neutral'} disabled={isLoading} onClick={evt => {
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
            </IconButton></Tooltip> }

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
                    { vars.status.emoji !== '' && <Button size='sm' variant='soft' onClick={evt => {
                      streamService.setEmoji('');
                      setVars({ ...vars, status: { emoji: '' } });
                      changeStatus();
                      setUiProperty({ ...uiProperty, status: { ...uiProperty.status, isEmojiDisplayed: false } });
                    }}>{ translate('重置') }</Button> }
                    <span>{vars.status.emoji}</span>
                    <Button size='sm' variant='outline' onClick={evt => {
                      setUiProperty({ ...uiProperty, status: { ...uiProperty.status, isEmojiDisplayed: false } });
                    }}>{ translate('关闭') }</Button>
                  </Stack>
                </Box>
              }
            >
              <IconButton size='sm' disabled={isSocketReady === false} onClick={evt => {
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
