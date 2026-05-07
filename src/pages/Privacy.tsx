import { useState } from 'react';
import type { ReactNode } from 'react';
import { getAnalyticsDisabled, setAnalyticsDisabled } from '../services/analytics';
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
  const [disabled, setDisabled] = useState(() => getAnalyticsDisabled());

  function handleToggle() {
    const next = !disabled;
    setDisabled(next);
    setAnalyticsDisabled(next);
  }

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
              <P>
                Tracksy uses anonymous analytics to understand how people use the app and fix bugs.
                We don&apos;t collect personal information, we don&apos;t write tracking cookies,
                and you can opt out below.
              </P>
            </Section>

            <Section title="What Data We Collect">
              <Ul items={[
                'Usage events — actions you take like "sort applied" or "playlist selected". These are category labels only, never the actual content.',
                'Anonymous session identifier — a random ID generated per session, not linked to your Spotify account or any personal information. Resets when you close the tab.',
              ]} />
            </Section>

            <Section title="What We Don't Collect">
              <Ul items={[
                'Your Spotify credentials, username, or account ID',
                'Playlist names, track names, or any content from your library',
                'Personal information of any kind',
                'Persistent tracking cookies or cross-site tracking',
                'Browser type, device type, or IP address — autocapture is disabled',
              ]} />
            </Section>

            <Section title="Why We Collect It">
              <P>
                To make Tracksy better — understand which features people actually use,
                find and fix bugs faster, and decide what to build next. Nothing is used for advertising.
              </P>
            </Section>

            <Section title="How We Store It">
              <Ul items={[
                'Analytics provider: PostHog (privacy-focused)',
                'Server location: EU (eu.i.posthog.com, GDPR compliant)',
                'Client storage: in-memory only — no analytics cookies or localStorage entries are written',
                'Your opt-out preference is stored in localStorage so it persists across sessions',
                'Retention: PostHog default of 1 year, then automatically deleted',
              ]} />
            </Section>

            <Section title="Your Rights">
              <Ul items={[
                'Opt out: use the toggle below — takes effect immediately',
                <span key="deletion">Data deletion: open an issue on <a href="https://github.com/23ovii/tracksy/issues" target="_blank" rel="noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>GitHub</a> and we&apos;ll remove your session data</span>,
                'Transparency: Tracksy is open-source — you can read exactly what gets tracked in the code',
              ]} />
            </Section>

            <Section title="Third-Party Services">
              <Ul items={[
                'Spotify API — used to read and modify your playlists. We never store your credentials.',
                'PostHog — anonymous usage analytics, EU servers, GDPR compliant.',
                'Vercel Analytics — page view counts, referrers, and aggregate device/country stats. No personal data.',
                'Sentry — error monitoring. If the app crashes, an error report is sent. No Spotify data is included.',
              ]} />
            </Section>

            <Section title="Changes to This Policy">
              <P>We&apos;ll update this page if our privacy practices change.</P>
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

            {/* Inline opt-out toggle */}
            <div style={{
              padding: '20px',
              background: 'var(--surface)',
              border: '1px solid var(--border2)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  Share anonymous usage data
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  {disabled
                    ? 'Analytics are disabled. No data is being sent.'
                    : 'Help improve Tracksy by sharing how you use it. No personal data is collected.'}
                </div>
              </div>
              <button
                role="switch"
                aria-checked={!disabled}
                aria-label="Toggle usage analytics"
                onClick={handleToggle}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: disabled ? 'var(--border2)' : 'var(--green)',
                  border: 'none', cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3, left: disabled ? 3 : 23,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  transition: 'left 0.18s var(--ease-out)',
                }} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Privacy;
