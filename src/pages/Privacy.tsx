import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const SECTIONS = [
  {
    title: 'The Short Version',
    body: 'Tracksy collects anonymous usage data to understand how the app is used and fix bugs. No personal information, no Spotify credentials, no playlist contents. You can opt out anytime in Settings.',
  },
  {
    title: 'What Data We Collect',
    body: 'We record anonymous usage events such as "sort applied", "playlist selected", or "undo used". Events include only counts and category labels — never the actual content. We also collect basic technical data like browser type and device category to help diagnose bugs. Events are associated with an anonymous session identifier that resets each time you close the tab.',
  },
  {
    title: "What We Don't Collect",
    body: "We don't collect your Spotify credentials, username, email, or account ID. We don't record track names, playlist names, or any content from your library. We don't use cookies or tracking pixels, and we don't follow you across other websites. No personal information ever leaves your browser.",
  },
  {
    title: 'Why We Collect It',
    body: 'Usage data helps us understand which features are actually useful, catch bugs before they affect everyone, and decide what to build next. Nothing is used for advertising or shared with third parties for commercial purposes.',
  },
  {
    title: 'How We Store It',
    body: 'Events are sent to PostHog, running on EU servers (eu.i.posthog.com), which is GDPR compliant. PostHog is configured with in-memory storage only — nothing is written to cookies or localStorage on your device. We retain event data for 90 days, after which it is automatically deleted.',
  },
  {
    title: 'Your Rights',
    body: 'You can opt out of analytics at any time in Settings — your preference takes effect immediately. You have the right to request access to or deletion of any data associated with your session. Because data is anonymous, we cannot look up records by name or email, but we can delete data by session ID if you provide it.',
  },
  {
    title: 'Third-Party Services',
    body: 'Tracksy uses the Spotify Web API to read and modify your playlists — governed by Spotify\'s own Privacy Policy. Analytics events are processed by PostHog (posthog.com). No other third-party services receive your data.',
  },
];

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
            Last updated 7 May 2025
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {SECTIONS.map(({ title, body }) => (
              <div key={title}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  {title}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
                  {body}
                </p>
              </div>
            ))}

            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                Contact
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
                For privacy questions or data deletion requests, open an issue on{' '}
                <a
                  href="https://github.com/23ovii/tracksy/issues"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--green)', textDecoration: 'none' }}
                >
                  GitHub
                </a>{' '}
                or email ovii.23@icloud.com. We will respond within 30 days.
              </p>
            </div>

            <div style={{
              padding: '16px 20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                Want to opt out of analytics?
              </span>
              <Link
                to="/settings"
                style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--green)',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
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
