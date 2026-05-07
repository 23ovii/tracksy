import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
      {children}
    </p>
  );
}

function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{item}</li>
      ))}
    </ul>
  );
}

function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, paddingTop: 'calc(var(--nav-h) + 48px)', paddingBottom: 80 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 12 }}>
            Legal
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text)', marginBottom: 8 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 48 }}>
            Last updated: May 7, 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            <Section title="The Short Version">
              <P>Tracksy uses anonymous analytics to understand how people use the app and fix bugs. We don&apos;t collect personal information, we don&apos;t use cookies, and you can opt out anytime in Settings.</P>
            </Section>

            <Section title="What Data We Collect">
              <Ul items={[
                'Usage events (actions like "playlist sorted", "preset applied")',
                'Technical data (browser type, device type, error messages)',
                'Anonymous session identifiers (not linked to you personally)',
              ]} />
            </Section>

            <Section title="What We Don't Collect">
              <Ul items={[
                'Your Spotify credentials or login information',
                'Personal information (name, email, etc.)',
                'Playlist contents or song data',
                'Tracking cookies or cross-site tracking',
              ]} />
            </Section>

            <Section title="Why We Collect It">
              <P>To make Tracksy better — understand which features people use, find and fix bugs faster, improve user experience.</P>
            </Section>

            <Section title="How We Store It">
              <Ul items={[
                'Provider: PostHog (privacy-focused analytics)',
                'Location: EU servers (GDPR compliant)',
                'Storage: In-memory only (no cookies, no localStorage persistence)',
                'Retention: 90 days, then automatically deleted',
              ]} />
            </Section>

            <Section title="Your Rights">
              <Ul items={[
                <span key="opt-out">Opt out: Disable analytics anytime in <Link to="/settings" style={{ color: 'var(--green)', textDecoration: 'none' }}>Settings</Link></span>,
                <span key="deletion">Data deletion: Contact us via <a href="https://github.com/23ovii/tracksy/issues" target="_blank" rel="noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>GitHub Issues</a> to request data deletion</span>,
                'Transparency: This is open-source — you can see exactly what we track in the code',
              ]} />
            </Section>

            <Section title="Third-Party Services">
              <Ul items={[
                "Spotify API: To access your playlists (we don't store credentials)",
                'PostHog: For anonymous analytics (EU servers, GDPR compliant)',
              ]} />
            </Section>

            <Section title="Changes to This Policy">
              <P>We&apos;ll update this page if our privacy practices change. Check back occasionally.</P>
            </Section>

            <Section title="Contact">
              <P>
                Questions? Open an issue on{' '}
                <a
                  href="https://github.com/23ovii/tracksy/issues"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--green)', textDecoration: 'none' }}
                >
                  GitHub
                </a>.
              </P>
            </Section>

            <div style={{
              padding: '16px 20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Want to opt out of analytics?</span>
              <Link to="/settings" style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Go to Settings →
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Privacy;
