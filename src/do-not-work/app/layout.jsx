import '../styles/globals.scss';
import '@/styles/globals.dark.scss';

export const metadata = {
  title: '浑河聊天室',
  description: '红蜻蜓的延续。。。',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
