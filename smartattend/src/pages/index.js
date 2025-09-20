import Link from 'next/link';
import dynamic from 'next/dynamic';
import SplitText from "./SplitText";

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};
// Dynamically import the ThemeToggleButton with SSR turned off
const ThemeToggleButton = dynamic(() => import('../components/ThemeToggleButton'), {
  ssr: false,
});

export default function HomePage() {
  const heroStyles = {
    textAlign: 'center',
    maxWidth: '800px',
  };

  const headingStyles = {
    fontSize: '4rem',
    lineHeight: '1.1',
    marginBottom: '2rem',
  };

  const textStyles = {
    fontSize: '1.2rem',
    color: 'rgba(var(--foreground-rgb), 0.8)',
    marginBottom: '3rem',
  };

  return (
    <>
      <ThemeToggleButton />
      <div className="container">
        <div style={heroStyles}>
          <h1 style={headingStyles}>
            <SplitText
              text="SmartAttend"
              className="text-6xl font-bold"
              delay={200}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              onLetterAnimationComplete={handleAnimationComplete}
            />
          </h1>
          <p style={textStyles}>
            The future of attendance management. Seamless, intelligent, and
            effortless tracking for modern educational institutions.
          </p>
          <Link href="/login" className="form-button" style={{padding: '1rem 2rem', fontSize: '1.2rem'}}>
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}