
import Head from 'next/head';
import Link from 'next/link';

export default function LandingPage() {
  // Inline styles for a modern look
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
    },
    header: {
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #eaeaea',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem',
    },
    title: {
      fontSize: '3.5rem',
      fontWeight: 'bold',
      lineHeight: 1.15,
      margin: 0,
    },
    subtitle: {
      fontSize: '1.5rem',
      lineHeight: 1.5,
      color: '#555',
      marginTop: '1rem',
    },
    getStartedBtn: {
      display: 'inline-block',
      marginTop: '2.5rem',
      padding: '1rem 2rem',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#fff',
      backgroundColor: '#0070f3',
      borderRadius: '8px',
      textDecoration: 'none',
      transition: 'background-color 0.2s ease',
    },
    footer: {
      width: '100%',
      padding: '2rem 0',
      borderTop: '1px solid #eaeaea',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Automated Attendance System</title>
        <meta name="description" content="A smart, automated attendance monitoring and analytics system." />
      </Head>

      <header style={styles.header}>
        <h2>SmartAttend</h2>
        <Link href="/login" style={{textDecoration: 'underline'}}>Login</Link>
      </header>

      <main style={styles.main}>
        <h1 style={styles.title}>
          Welcome to the Future of Attendance
        </h1>
        <p style={styles.subtitle}>
          A smart, seamless, and automated attendance monitoring system designed for modern colleges.
        </p>
        <Link href="/login" style={styles.getStartedBtn}>
          Get Started
        </Link>
      </main>

      <footer style={styles.footer}>
        <p>Built for the Smart India Hackathon.</p>
      </footer>
    </div>
  );
}
