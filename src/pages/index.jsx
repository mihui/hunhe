'use client';

import styles from '@/styles/home.module.scss';
import AspectRatio from '@mui/joy/AspectRatio';
import Box from '@mui/joy/Box';
import Container from '@mui/joy/Container';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import Typography, { typographyClasses } from '@mui/joy/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';

import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Stack from '@mui/joy/Stack';
import Input from '@mui/joy/Input';
import Radio from '@mui/joy/Radio';
import RadioGroup from '@mui/joy/RadioGroup';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Sheet from '@mui/joy/Sheet';
import Avatar from '@mui/joy/Avatar';
import CircularProgress from '@mui/joy/CircularProgress';

import { useEffect, useRef, useState } from 'react';

import Layout from '@/components/layout';
import { User } from '@/components/models/user';
import { storage, utility } from '@/components/helpers/utility';
import { Avatars, ROOMS, StorageKeys } from '@/components/config/vars';
import { useRouter } from 'next/router';
import { chatService } from '@/components/services/chat';

export default function Index({ translate }) {
  /** @type {[ dialog: { isOpen: boolean, isParticipant: boolean, isEnteringCode: boolean }, setDialog: (dialog: { isOpen: boolean, isParticipant: boolean, isEnteringCode: boolean }) => void ]} */
  const [ dialog, setDialog ] = useState({ isOpen: false, isParticipant: false, isEnteringCode: false });
  /** @type {[ user: User, setUser: (user: User) => void ]} */
  const [ user, setUser ] = useState(new User().toJSON());
  const [ isCalling, setIsCalling ] = useState(false);
  const [ meetingId, setMeetingId ] = useState('');
  const [ originalId, setOriginalId ] = useState('');

  const router = useRouter();

  const navigateToChat = (id) => {
    let route = '/chat';
    if(initMeeting(id) && id !== ROOMS.DEFAULT.ID)
      route = route.concat(`/${id}`);
    if(user.id && user.name && user.avatar) {
      router.push(route);
    }
  };

  const initMeeting = (id) => {
    if(utility.validateUUID(id)) {
      setMeetingId(id);
      return true;
    }
    return false;
  };

  /** @type {(data: User) => void} Returns user */
  const storeUser = (data) => {
    storage.save(StorageKeys.User, data, 'json');
  },
  /** @type {() => User} Returns user */
  getUser = () => {
    const storedUser = storage.get(StorageKeys.User, null, 'json');
    return storedUser;
  },
  doStartChatting = async () => {
    setIsCalling(true);
    try {
      if(meetingId && dialog.isParticipant) {
        // Verify meeting ID
        const verifiedMeeting = await chatService.getMeeting(meetingId);
        if(verifiedMeeting) {
          return navigateToChat(meetingId);
        }
      }
      else {
        // Request meeting ID
        const newMeeting = await chatService.createMeeting();
        if(newMeeting) {
          return navigateToChat(newMeeting.id);
        }
      }
      throw new Error('Invalid meeting ID');
    }
    catch(error) {
      // @todo: Handle error here...
      console.warn(error.message);
    }
    finally {
      setIsCalling(false);
    }
  }, doCancelRequest = () => {
    setIsCalling(false);
  };

  useEffect(() => {
    const { meeting } = router.query;
    console.log('[ROUTER] meeting->', meeting);
    if(meeting) {
      if(initMeeting(meeting)) {
        setOriginalId(meeting);
        setDialog({ isOpen: true, isParticipant: true, isEnteringCode: false });
      }
    }
  }, [router.query]);

  useEffect(() => {
    // 1. Initialize user
    if(user.id === '') {
      // 2. Try cache
      const storedUser = getUser();
      // 2.1 Initialize user from cache
      if(storedUser) {
        // 2.2 Set user from cache
        setUser(storedUser);
      }
      // 2.3 Initialize user from scatch
      else {
        const userWithId = { ...user, id: crypto.randomUUID() };
        setUser(userWithId);
        storeUser(userWithId);
      }
    }
  }, [ user ]);

  return (
    <Layout.Main className={styles['home']}>
      <Container sx={(theme) => ({
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 10,
        gap: 4,
        [theme.breakpoints.up(834)]: {
          flexDirection: 'row',
          gap: 6,
        },
        [theme.breakpoints.up(1199)]: {
          gap: 12,
        },
      })}
    >
      <Box sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '50ch',
        textAlign: 'center',
        flexShrink: 999,
        [theme.breakpoints.up(834)]: {
          minWidth: 420,
          alignItems: 'flex-start',
          textAlign: 'initial',
        },
        [`& .${typographyClasses.root}`]: {
          textWrap: 'balance',
        },
      })}
      >

      <Modal open={dialog.isOpen} onClose={() => setDialog({ ...dialog, isOpen: false })}>
        <ModalDialog
          aria-labelledby="basic-modal-dialog-title"
          aria-describedby="basic-modal-dialog-description"
          sx={{ minWidth: 300, maxWidth: 450 }}
        >
          <form
            onSubmit={evt => {
              evt.preventDefault();
              doStartChatting();
            }}
          >
            <Stack spacing={2}>
              { meetingId === ROOMS.DEFAULT.ID && dialog.isEnteringCode === false && dialog.isParticipant && <FormControl>
                <Typography id="basic-modal-dialog-title" level="h2">{ translate('主题') }</Typography>
                <Typography>{ translate(ROOMS.DEFAULT.SUBJECT) }</Typography>
              </FormControl> }

              { dialog.isEnteringCode && <FormControl>
                <Typography id="basic-modal-dialog-title" level="h2">{ translate('参与会议') }</Typography>
                <Typography>{ translate('会议代码') }</Typography>
                <Input placeholder={ translate('会议代码') } value={meetingId} autoFocus required disabled={isCalling} onChange={evt => {
                  initMeeting(evt.target.value);
                }} />
              </FormControl> }
              <FormControl>
                <FormLabel>{ translate('昵称') }</FormLabel>
                <Input placeholder={ translate('昵称') } value={user.name} autoFocus required onChange={evt => {
                  const newUser = { ...user, name: evt.target.value };
                  setUser(newUser);
                  storeUser(newUser);
                }} disabled={isCalling} />
              </FormControl>
              <FormControl>
                <FormLabel>{ translate('形象') }</FormLabel>
                <RadioGroup
                  overlay
                  orientation="horizontal"
                  sx={{ gap: 2, flexWrap: 'wrap' }}
                >
                  {Avatars.map(avatarItem => (
                    <Sheet
                      component="label"
                      key={avatarItem.key}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxShadow: 'sm',
                        borderRadius: 'md',
                        flex: 1,
                      }}
                    >
                      <Radio value={avatarItem.url}
                        variant="soft"
                        disabled={isCalling}
                        sx={{ mb: 2 }}
                        checked={user.avatar === avatarItem.url}
                        onChange={evt => {
                          const newUser = { ...user, avatar: evt.target.value };
                          setUser(newUser);
                          storeUser(newUser);
                        }}
                      />
                      <Avatar src={`/images/avatars/${avatarItem.key}.png`} />
                    </Sheet>
                  ))}
                </RadioGroup>
              </FormControl>
              { isCalling ? <Button type='button' color='danger' variant='outlined' onClick={evt => {
                evt.preventDefault();
                doCancelRequest();
              }} startDecorator={ isCalling ? <CircularProgress variant="soft" /> : null }>{ translate('取消') }</Button>
               : <Button type="submit" disabled={user.name === '' || Avatars.map(x => x.url).includes(user.avatar) === false} onClick={evt => {
               }}>{ dialog.isParticipant ? translate('加入') : translate('开始') }</Button> }
            </Stack>
          </form>
        </ModalDialog>
      </Modal>

      <Typography color="primary" fontSize="lg" fontWeight="lg">
        { translate('浑河网') }
      </Typography>
      <Typography
        level="h1"
        fontWeight="xl"
        fontSize="clamp(1.875rem, 1.3636rem + 2.1818vw, 2.5rem)"
      >
        { translate('流动的声音，链接的心灵。') }
      </Typography>
      <Typography fontSize="lg" textColor="text.secondary" lineHeight="lg">
      { translate('无论你在世界的哪个角落，都能找到一位愿意倾听的朋友。') }<br />
      { translate('无论你是跨越时区的深夜微语，还是清晨的轻松问候，在这里，每一个声音都将被珍视与尊重。') }<br />
      { translate('加入我们，倾诉你的故事，聆听他人的声音，让浑河的每一滴水波，都载满我们的交谈与分享。') }
      </Typography>
      <Stack direction='row' spacing={2}>
        <Button size="lg" onClick={evt => {
          setDialog({ isOpen: true, isParticipant: false, isEnteringCode: false });
        }} endDecorator={<ArrowForwardIcon fontSize="xl" />}>
          { translate('创建会议') }
        </Button>

        <Button size="lg" variant='plain' onClick={evt => {
          initMeeting(ROOMS.DEFAULT.ID);
          setDialog({ isOpen: true, isParticipant: true, isEnteringCode: false });
        }} endDecorator={<PeopleOutlineIcon fontSize="xl" />}>
          { translate('聊天大厅') }
        </Button>
      </Stack>

      <Typography>
      { translate('或者') } <Link fontWeight="lg" onClick={evt => {
          initMeeting(originalId);
          setDialog({ isOpen: true, isParticipant: true, isEnteringCode: true });
        }}>{ translate('输入会议代码') }</Link>
      </Typography>
      </Box>

      <AspectRatio className={styles['hero']}
        ratio={600 / 520}
        variant="outlined"
        maxHeight={300}
        sx={(theme) => ({
          minWidth: 300,
          alignSelf: 'stretch',
          [theme.breakpoints.up(834)]: {
            alignSelf: 'initial',
            flexGrow: 1,
            '--AspectRatio-maxHeight': '220px',
            '--AspectRatio-minHeight': '400px',
          },
          borderRadius: 'sm',
          bgcolor: 'background.level2',
          flexBasis: '30%',
        })}
      />
      </Container>
    </Layout.Main>
  );
};
