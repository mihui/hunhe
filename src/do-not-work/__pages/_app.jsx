'use client';
import React from 'react';

import './globals.scss';
import './globals.dark.scss';

export default function App({ Component, pageProps }) {
  return (
    <Component {...pageProps} />
  );
}
