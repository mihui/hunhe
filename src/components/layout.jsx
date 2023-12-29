'use client';
import Head from 'next/head';
import VARS from './config/vars';
import Box from '@mui/joy/Box';
import languageService from './services/language';

const Main = (props) => {
  return (
    <>
      <Head>
        <title>{languageService.translate(props.title ?? VARS.APP_TITLE)}</title>
        <meta name="keywords" content={VARS.APP_KEYWORDS} />
        <meta name="description" content={VARS.APP_DESCRIPTION} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MiGG" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover" />
        <link rel="shortcut icon" href="/images/favicons/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/favicons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicons/favicon-16x16.png" />
      </Head>
      <div {...props} />
    </>
  )
};

const Header = (props) => {
  return (
    <Box
      component="header"
      className="header"
      {...props}
      sx={[
        {
          p: 2,
          gap: 2,
          bgcolor: 'background.surface',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gridColumn: '1 / -1',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'relative',
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
};

const Footer = (props) => {
  return (
    <Box
      component="footer"
      className="footer"
      {...props}
      sx={[
        {
          p: 2,
          gap: 2,
          bgcolor: 'background.surface',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          gridColumn: '1 / -1',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          minWidth: '280px'
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
};

const Layout = {
  Main, Header, Footer
};

export default Layout;
