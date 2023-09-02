'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CssVarsProvider } from '@mui/joy/styles';
import GlobalStyles from '@mui/joy/GlobalStyles';
import CssBaseline from '@mui/joy/CssBaseline';
import Sheet from '@mui/joy/Sheet';
import CircularProgress from '@mui/joy/CircularProgress';
import Grid from '@mui/joy/Grid';

import languageService from '@/components/services/language';

import languageTranslations from '@/components/data/translations.json';

import '@/styles/globals.scss';
import '@/styles/globals.dark.scss';

const app = function App({ Component, pageProps }) {

  const router = useRouter();
  languageService.loadTranslations(languageTranslations);
  const [ isDomReady, setIsDomReady ] = useState(false);
  useEffect(() => {
    if(window && window.navigator) {
      setIsDomReady(true);
      languageService.changeLanguage(window.navigator.language);
    }
  }, []);

  return (
    <CssVarsProvider disableTransitionOnChange>
      <GlobalStyles />
      <CssBaseline />
      <Sheet sx={{
        height: '100%'
      }}>
        { isDomReady ? <Component key={router.asPath} translate={key => {
          return languageService.translate(key);
        }} {...pageProps} />
        :
        <Grid
          height='100%'
          container
          direction="row"
          justifyContent="center"
          alignItems="center"><CircularProgress />
        </Grid> }
      </Sheet>
    </CssVarsProvider>
  );
};

export default (app);