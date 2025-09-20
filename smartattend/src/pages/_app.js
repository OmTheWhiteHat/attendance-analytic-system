import '../styles/globals.css'; // Import global styles
import { ClerkProvider } from '@clerk/nextjs';
import { SessionProvider } from 'next-auth/react';

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <ClerkProvider {...pageProps}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </ClerkProvider>
  );
}

export default MyApp;