
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

import Stack from '@mui/joy/Stack';
import Box from '@mui/joy/Box';
import Tooltip from '@mui/joy/Tooltip';

import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { User, ChatPayload, ChatRecord, ChatVideo, All } from '@/components/models/user';
import { ChatUserModal } from '@/components/widgets/modals/chat-user';
import { Events, beeper, storage, utility } from '@/components/helpers/utility';
import { Avatars, ROOMS, STATUS, StorageKeys } from '@/components/config/vars';
import { ChatLinkModal } from '@/components/widgets/modals/chat-link';
import { ChatFormat } from '@/components/widgets/chat/chat-format';
import { DEVICE, EMOJIS, Media, Meeting, NOTIFICATION_STYLES, PEER } from '@/components/models/meeting';
import { chatService } from '@/components/services/chat';
import { ChatErrorModal } from '../modals/chat-error';
import io, { Socket } from 'socket.io-client';

/** @type {{ Audio: import('peerjs').Peer, Video: import('peerjs').Peer }} */
const Peers = {
  Audio: null, Video: null
};

/**
 * Chatroom
 * @param {{ id: string, translate: (string) => string }} param0 Props
 */
export default function ChatRoom({ id, translate }) {
  const router = useRouter();

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
    /** @type {[ socket: Socket, setSocket: (socket: Socket) => void ]} */
    const [ socket, setSocket ] = useState(null);
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
        setSocket(io({ path: '/api/messaging', query: { room: meeting.id, id: me.id, avatar: me.avatar, name: me.name } }));
      }
    }, [me]);

    return [ { socket, me, isMeOK }, { setMe, setRoom } ];
  };

  /** @type {[ { meeting: Meeting, isMeetingOK: boolean }, setMeeting: (meeting: Meeting) => void ]} */
  const [ { meeting, isMeetingOK }, setMeeting ] = useMeeting(id, new Meeting().setId(id).toJSON());

  /** @type {[ { socket: Socket, me: User, isMeOK: boolean }, { setMe: (me: User) => void, setRoom: (room: string) => void } ]} */
  const [ { me, socket, isMeOK }, { setMe, setRoom } ] = useUser(id, new User().toJSON());

  /** @type {[ chat: ChatPayload, setChat: (chat: ChatPayload) => void ]} */
  const [ chat, setChat ] = useState(new ChatPayload().toJSON());
  /** @type {[ uiProperties: { profile: boolean, link: boolean, users: boolean, error: { code: number, message: string }, emoji: boolean, scroll: boolean }, setUiProperties: ( uiProperties: { profile: boolean, link: boolean, users: boolean, error: { code: number, message: string }, emoji: boolean, scroll: boolean } ) => void ]} */
  const [ uiProperties, setUiProperties ] = useState({ profile: false, link: false, users: false, error: { code: 0, message: '' }, emoji: false, scroll: true });
  /** @type {[ chatHistory: Array<ChatRecord>, setChatHistory: (chatHistory: Array<ChatRecord>) => void ]} */
  const [ chatHistory, setChatHistory ] = useState([]);
  /** @type {[ chatVideo: ChatVideo, setChatVideo: (chatVideo: ChatVideo) => void ]} */
  const [ chatVideo, setChatVideo ] = useState(new ChatVideo().toJSON());
  /** @type {[ isLoading: boolean, setIsLoading: (isLoading: boolean) => void ]} */
  const [ isLoading, setIsLoading ] = useState(true);

  /** @type {[ chatUsers: Array<User>, setChatUsers: (users: Array<User>) => void ]} */
  const [ chatUsers, setChatUsers ] = useState([]);

  /** @type {[ chatNotification: { message: string, style: string, time: Date }, setChatNotification: (chatNotification: { message: string, style: string, time: Date }) => void ]} */
  const [ chatNotification, setChatNotification ] = useState({ message: '', style: NOTIFICATION_STYLES.INFO, time: new Date() });

  /** @type {[ vars: { audio: Media, screen: Media, status: { emoji: string } }, setVars: (vars: { audio: Media, screen: Media, status: { emoji: string } }) => void ]} */
  const [ vars, setVars ] = useState({
    audio: { id: DEVICE.MICROPHONE, streaming: false, stream: null, localMute: true },
    screen: { id: DEVICE.SCREEN, streaming: false, stream: null },
    status: { emoji: '' }
  });

  /** @type {[ audioPeer: import('peerjs').Peer, setAudioPeer: (audioPeer: import('peerjs').Peer) => void ]} */
  const [ audioPeer, setAudioPeer ] = useState(Peers.Audio);
  /** @type {[ videoPeer: import('peerjs').Peer, setVideoPeer: (videoPeer: import('peerjs').Peer) => void ]} */
  const [ videoPeer, setVideoPeer ] = useState(Peers.Video);
  /** @type {[ screenId: string, setScreenId: (screenId: string) => void ]} */
  const [ screenId, setScreenId ] = useState('');

  const nonRef = useRef({ meeting: false, user: false, socket: false, peer: false, load: false });
  /** @type {{ current: HTMLInputElement }} */
  const chatInputRef = useRef(null);
  const chatHistoryRef = useRef(null);

  /** @type {(num: number) => string} */
  const prefixDigit = (num) => {
    if(num <= 9) return new String(`0${num}`);
    return new String(num);
  },
  /** @type {(date: Date) => string} */
  getMinuteFormat = 
  /**
   * @param {Date} date Date
   */
  (date) => {
    return `${prefixDigit(date.getHours())}:${prefixDigit(date.getMinutes())}`;
  },
  /**
   * Scroll to bottom
   */
  scrollToBottom = () => {
    if(chatHistoryRef)
      chatHistoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  const getFakeMessage = () => {
    const str = 'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    return str.substring(Math.random() * str.length/2, Math.random() * str.length/2);
  }, focusInput = () => {
    if(chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, notifyUser = useCallback((message, style = NOTIFICATION_STYLES.INFO, hasTranslation = false) => {
    setChatNotification({ message: hasTranslation ? message : translate(message), style, time: new Date() })
  }, [translate]);

  const onSocketChanged = (connected, isReconnect = false) => {
    // Disable/Enable UI
    setIsLoading(connected === false);
    beeper.publish(Events.SocketConnected, { connected, isReconnect });
  }, joinScreenSharing = (screenId) => {
    beeper.publish(Events.JoinScreenShare, screenId);
  }, onStatusChange = (emoji) => {
    if(socket) {
      const browserStatus = vars.audio.streaming ? STATUS.AUDIO : document.visibilityState === 'visible' ? STATUS.ONLINE : STATUS.AWAY;
      socket.emit('server:status', browserStatus, vars.audio.localMute ? STATUS.MUTED : STATUS.SPEAKING, emoji);
    }
  }, onMeetingUpdate = () => {
    if(socket) {
      socket.emit('server:meeting:update', meeting);
    }
  }, onMeetingUpdated = (user, meeting) => {
    beeper.publish(Events.UpdateMeeting, { user, meeting });
  },
  /**
   * Get screen ID
   * @param {string} id ID string
   * @param {Boolean} forPeer If it is for peer connection string
   * @returns {string} Returns screen ID
   */
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
      if(socket.disconnected) {
        return notifyUser('正在尝试重新连接', NOTIFICATION_STYLES.WARNING);
      }
      const payload = generateMessage();
      setChat({ ...chat, input: '' });
      socket.emit('server:user:message', payload, () => {
        setIsLoading(false);
      });
    }
    focusInput();
  };

  // Setup Peers
  useEffect(() => {
    if(isMeOK && isMeetingOK) {
      console.log('### START ###');
      if(Peers.Audio === null && Peers.Video === null) {
        import('peerjs').then(imported => {
          const Peer = imported.default;
          const peerOptions = {
            host: window.location.host, path: '/live/audio',
            config: { iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
            ] }
          };
          setAudioPeer(new Peer(me.id, peerOptions));
          setVideoPeer(new Peer(getScreenId(me.id, true), peerOptions));
        });
      }
      return () => {};
    }
  }, [isMeOK, isMeetingOK, me.id]);

  // Handle WebSocket events
  useEffect(() => {
    if(socket) {
      const
      onSocketConnect = () => {
        console.log('### CONNECTED ###');
        onSocketChanged(true);
      },
      onSocketReconnect = () => {
        console.log('### RECONNECTED ###');
        onSocketChanged(true, true);
      },
      onSocketReconnectFailed = () => {
        console.warn('### CONNECTION FAILED ###');
        onSocketChanged(false);
        notifyUser('重新连接失败，请刷新页面重试', NOTIFICATION_STYLES.ERROR);
      },
      onSocketReconnectAttempt = () => {
        notifyUser('正在重新连接...（第 {0} 次尝试）', NOTIFICATION_STYLES.WARNING);
      },
      onSocketError = error => {
        console.warn('### SOCKET ERROR ###');
        onSocketChanged(false);
        notifyUser('连接错误', NOTIFICATION_STYLES.ERROR);
      },
      onSocketDisconnect = reason => {
        console.warn('### DISCONNECTED ###');
        onSocketChanged(false);
        notifyUser('连接已断开，请重试', NOTIFICATION_STYLES.ERROR);
        setChatUsers([]);
        if(reason === "io server disconnect") {
          socket.connect();
        }
      };
      /** @type {(user: User) => void} */
      const onClientWelcomePublic = user => {
        notifyUser(utility.format(translate('网友【{0}】兴高采烈地来到了会议室， 大家热烈欢迎 ^_^！'), user.name), NOTIFICATION_STYLES.INFO, true);
      },
      /** @type {(user: User, screenId) => void} */
      onClientWelcomePrivate = (user, screenId) => {
        joinScreenSharing(screenId);
      };
      const
      /** @type {(callee: User, caller: User, screenId: string) => void} */
      onClientJoinScreen = (callee, caller, screenId) => {
        beeper.publish(Events.JoinScreenShareCallback, { callee, caller });
      },
      onClientLeave = data => {
        console.log('client:leave');
      },
      onClientError = code => {
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
      onUsers = (users) => {
        users.unshift(new All(translate));
        // for(let i = 0; i < 100; i++) {
        //   users.push(new User(crypto.randomUUID(), 'Fake user', '/images/avatars/00.png'));
        // }
        setChatUsers(users);
      },
      onUserMessage = (id, fromUser, data) => {
        /** @type {ChatRecord} */
        const chatRecord = {
          id,
          message: data.message,
          from: fromUser, to: data.to,
          time: new Date()
        };
        setChatHistory(x => [ ...x, chatRecord ]);
      };
      socket.on('connect', onSocketConnect);
      socket.on('reconnect', onSocketReconnect);
      socket.on('reconnect_failed', onSocketReconnectFailed);
      socket.on('error', onSocketError);
      socket.on('disconnect', onSocketDisconnect);
      socket.on('reconnect_attempt', onSocketReconnectAttempt);
      socket.on('client:welcome:public', onClientWelcomePublic);
      socket.on('client:welcome:private', onClientWelcomePrivate);
      socket.on('client:screen:join:callback', onClientJoinScreen);
      socket.on('client:leave', onClientLeave);
      socket.on('client:error', onClientError);
      socket.on('client:users', onUsers);
      socket.on('client:user:message', onUserMessage);
      socket.on('client:meeting:update:callback', onMeetingUpdated);

      return () => {
        socket.emit('leave');
        socket.off('connect', onSocketConnect);
        socket.off('reconnect', onSocketReconnect);
        socket.off('reconnect_failed', onSocketReconnectFailed);
        socket.off('error', onSocketError);
        socket.off('disconnect', onSocketDisconnect);
        socket.off('reconnect_attempt', onSocketReconnectAttempt);
        socket.off('client:welcome:public', onClientWelcomePublic);
        socket.off('client:welcome:private', onClientWelcomePrivate);
        socket.off('client:screen:join:callback', onClientJoinScreen);
        socket.off('client:leave', onClientLeave);
        socket.off('client:error', onClientError);
        socket.off('client:users', onUsers);
        socket.off('client:user:message', onUserMessage);
        socket.off('client:meeting:update:callback', onMeetingUpdated);
      };
    }
  }, [notifyUser, translate, socket]);

  // Audio
  useEffect(() => {
    Peers.Audio = audioPeer;
    if(audioPeer) {
      // Audio
      const
      /** @type {() => void} */
      onPeerOpen = () => {
        console.log(`Your device ID is: ${audioPeer.id}`);
        console.log('### AUDIO READY ###');
      },
      /** @type {() => void} */
      onPeerDisconnected = () => {
        console.info('### PEER DISCONNECTED ###');
        audioPeer.reconnect();
      },
      /** @type {(call: { peer: string, answer: (stream: ReadableStream?), on: (eventName: string, callback: (stream: ReadableStream) => void) => void }) => void} call Call */
      onPeerCall = call => {
        console.info('### PEER ON CALL ###');
        // Automatically join
        // if(vars.audio.streaming) {
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
      onPeerError = error => {
        console.warn('### AUDIO PEER ERROR ###');
        const message = Object.hasOwn(PEER.ERRORS, error.type) ? PEER.ERRORS[error.type] : 'Audio server connection error.';
        console.warn(message);
        beeper.publish(Events.ClientNotification, { message, style: NOTIFICATION_STYLES.WARNING });
      };
      Peers.Audio.on('open', onPeerOpen);
      Peers.Audio.on('disconnected', onPeerDisconnected);
      Peers.Audio.on('call', onPeerCall);
      Peers.Audio.on('error', onPeerError);
      return () => {
        Peers.Audio.off('open', onPeerOpen);
        Peers.Audio.off('disconnected', onPeerDisconnected);
        Peers.Audio.off('call', onPeerCall);
        Peers.Audio.off('error', onPeerError);
      };
    }
  }, [audioPeer]);

  // Screen
  useEffect(() => {
    Peers.Video = videoPeer;
    if(videoPeer) {
      // Screen
      const
      /** @type {() => void} */
      onPeerOpen = () => {
        console.log(`Your share ID is: ${Peers.Video.id}`);
        console.log('### SCREEN READY ###');
      },
      /** @type {() => void} */
      onPeerDisconnected = () => {
        console.info('### PEER DISCONNECTED ###');
        videoPeer.reconnect();
      },
      /** @type {(call: { peer: string, answer: (stream: ReadableStream?), on: (eventName: string, callback: (stream: ReadableStream) => void) => void }) => void} call Call */
      onPeerCall = call => {
        console.log(`### ON CALL: ${call.peer} ###`);
        const peerScreenId = methods.getScreenId(call.peer);
        // methods.queryVideoCover(peerScreenId);
        // I was sharing, but somebody interrupted
        // if(vars.screen.streaming) {
        //   if(screenId !== peerScreenId) {
        //     // methods.stopScreen(true);
        //   }
        // }
        setScreenId(peerScreenId);
        call.answer();
        call.on('stream', remoteStream => {
          // Unmute local video
          // methods.startVideo(remoteStream, false);
        });
      },
      /** @type {(error: { type: string }) => void} */
      onPeerError = error => {
        console.warn('### SCREEN PEER ERROR ###');
        const message = Object.hasOwn(PEER.ERRORS, error.type) ? PEER.ERRORS[error.type] : 'Video server connection error.';
        console.warn(message);
        beeper.publish(Events.ClientNotification, { message, style: NOTIFICATION_STYLES.WARNING });
      };
      Peers.Video.on('open', onPeerOpen);
      Peers.Video.on('disconnected', onPeerDisconnected);
      Peers.Video.on('call', onPeerCall);
      Peers.Video.on('error', onPeerError);
      return () => {
        Peers.Video.off('open', onPeerOpen);
        Peers.Video.off('disconnected', onPeerDisconnected);
        Peers.Video.off('call', onPeerCall);
        Peers.Video.off('error', onPeerError);
      };
    }
  }, [videoPeer]);

  // Handle join screen sharing
  useEffect(() => {
    if(socket && screenId) {
      socket.emit('server:user:screen:join', screenId);
    }
  }, [ screenId, socket ]);

  // Scroll chat history automatically
  useEffect(() => {
    if(uiProperties.scroll)
      scrollToBottom();
  }, [chatHistory, uiProperties.scroll]);

  // useEffect(() => {
  //   if(meeting) {
  //     console.log('meeting->', meeting);
  //   }
  // }, [ meeting ]);

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
      setUiProperties({ ...uiProperties, error });
    });
    const disposeJoinScreenSharingEvent = beeper.subscribe(Events.JoinScreenShare, remoteScreenId => {
      setScreenId(remoteScreenId);
    });
    const disposeJoinScreenSharingCallbackEvent = beeper.subscribe(Events.JoinScreenShareCallback, ({ callee, caller }) => {
      console.log('callee->', callee, 'caller->', caller);
      if(caller) {
        if(caller.id === me.id && vars.screen.streaming) {
          vars.screen.peer.call(getScreenId(callee.id, true), chatVideo.localStream, { metadata: {  } });
        }
      }
      else if(callee) {
        if(callee.id === me.id) {
  
        }
      }
    });
    const disposeStatusChangeEvent = beeper.subscribe(Events.StatusChange, () => {
      onStatusChange();
    });
    const disposeNotificationEvent = beeper.subscribe(Events.ClientNotification, ({ message, style }) => {
      notifyUser(message, style);
    });
    const disposeUpdateMeeting = beeper.subscribe(Events.UpdateMeeting, ({ user, meeting }) => {
      setMeeting(meeting);
      notifyUser(utility.format(translate('【{0}】更新了会议信息'), user.name), NOTIFICATION_STYLES.INFO, true);
    });

    return () => {
      disposeSocketConnectedEvent();
      disposeClientErrorEvent();
      disposeJoinScreenSharingEvent();
      disposeJoinScreenSharingCallbackEvent();
      disposeStatusChangeEvent();
      disposeNotificationEvent();
      disposeUpdateMeeting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let lastCheckTime = new Date();

  return (
    <Layout.Main className={styles['chat']}>
      {/* CHAT HEADER */}
      <Layout.Header>
        <IconButton size="sm"  onClick={evt => {
          goBackHome(true);
        }}>
          <HomeIcon />
        </IconButton>

        <span className={styles['chat-subject']}>{ chatNotification.message ? <>
          {chatNotification.message} <i>({getMinuteFormat(chatNotification.time)})</i>
          </> : meeting.id === ROOMS.DEFAULT.ID ? translate(ROOMS.DEFAULT.SUBJECT) : meeting.subject }
        </span>

        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.5
        }} className={styles['chat-menus']}
        >
          { ROOMS.DEFAULT.ID !== meeting.id && <IconButton
            size="sm"
            variant="plain"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            onClick={_evt => {
              setUiProperties({ ...uiProperties, link: true });
          }} className={styles['chat-menu']} disabled={isLoading}>
            <InfoIcon />
          </IconButton> }

          <IconButton
            size="sm"
            variant="soft"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            onClick={_evt => {
              setUiProperties({ ...uiProperties, profile: true });
            }} className={styles['chat-menu']} disabled={isLoading}>
            <PersonIcon />
          </IconButton>

          <Badge badgeContent={chatUsers.length ? chatUsers.length - 1 : ''}>
            <IconButton
              size="sm"
              variant="soft"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              onClick={_evt => {
                setUiProperties({ ...uiProperties, users: !uiProperties.users });
              }} className={styles['chat-menu']} disabled={isLoading}>
              <PeopleIcon />
            </IconButton>
          </Badge>

        </Box>
      </Layout.Header>

      {/* CHAT MODALS */}
      <ChatUserModal user={me} open={uiProperties.profile} translate={translate} handleClose={() => {
        setUiProperties({ ...uiProperties, profile: false });
      }} />
      {/* CHAT LINK */}
      <ChatLinkModal user={me} open={uiProperties.link} translate={translate} handleClose={() => {
        setUiProperties({ ...uiProperties, link: false });
      } } meeting={meeting} setMeeting={setMeeting} handleMeeting={onMeetingUpdate} />
      {/* CHAT ERROR */}
      <ChatErrorModal open={uiProperties.error.code > 0} translate={translate} handleClose={() => {
        setUiProperties({ ...uiProperties, error: { code: 0, message: '' } });
      }} message={uiProperties.error.message} handleBack={goBackHome} />

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
          {/* Video/Screen sharing */}
          { isLoading === false && (chatVideo.isPublishing || chatVideo.isReceiving) && <div className={styles['chat-screen']}>
            <div className={styles['videos']}>
              <div className={styles['local']}>
                <video autoPlay disablePictureInPicture></video>
              </div>
              <div className={styles['remote']}>
                <video autoPlay disablePictureInPicture></video>
              </div>
            </div>
            <div className={styles['controls']}>
              <IconButton onClick={evt => {
                // Play
              }}>
                <SlideshowIcon />
              </IconButton>
              <IconButton onClick={evt => {
                // Fullscreen
              }}>
                <FullscreenIcon />
              </IconButton>
            </div>
          </div> }
          {/* User list */}
          { uiProperties.users && <div className={styles['chat-users']}>
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
                    setUiProperties({ ...uiProperties, users: !uiProperties.users });
                    setChat({ ...chat, from: me, to: x });
                    focusInput();
                  }} key={x.id} id={x.id} data-window={x.windows && x.windows > 1 ? x.windows : ''} style={{'--background-avatar-placeholder': `url(${x.avatar})` }}>
                    <a>{x.name}{ emoji && <span className={styles['emoji']} dangerouslySetInnerHTML={{ __html: emoji }}></span> }</a>
                  </li>
                }) }
              </ul>
            </div>
          </div> }
        </Box>
      </Box>

      {/* CHAT FORM */}
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
          <form className={styles['chat-form']} onSubmit={evt => {
            evt.preventDefault();
            evt.stopPropagation();
            sendChatMessage();
          }}>
            <Input sx={{
              flex: 1
            }} placeholder={translate('说点什么...')} onChange={evt => {
              setChat({ ...chat, input: evt.target.value });
            }} value={chat.input} readOnly={isLoading} slotProps={{ input: { ref: chatInputRef } }}
            startDecorator={`${translate('对')}${chat.to.id === All.__id ? translate(chat.to.name) : chat.to.name}`}
            />
          </form>

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

            <IconButton size='sm' disabled={isLoading}>
              <TuneIcon />
            </IconButton>

            <IconButton size='sm' disabled={isLoading}>
              <MicIcon />
            </IconButton>

            <Tooltip
              disableHoverListener
              placement="top-end"
              variant="outlined"
              open={uiProperties.emoji}
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
                      setVars({ ...vars, status: { ...vars.status, emoji } });
                      setUiProperties({ ...uiProperties, emoji: false });
                      onStatusChange(emoji);
                      setChat({ ...chat, input: chat.input + emoji });
                      focusInput();
                    }}>
                      <span>{ emoji }</span>
                    </IconButton>
                  }) }
                </Box>
              }
            >
              <IconButton size='sm' disabled={isLoading} onClick={evt => {
                if(vars.status.emoji !== '') {
                  setVars({ ...vars, status: { ...vars.status, emoji: '' } });
                }
                setUiProperties({ ...uiProperties, emoji: !uiProperties.emoji });
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
