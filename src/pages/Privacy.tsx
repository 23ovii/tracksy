import Footer from '../components/Footer';

const SECTIONS = [
  {
    title: 'What we collect',
    body: 'When you use Tracksy, we record anonymous usage events — things like "sort applied" or "playlist selected". These events contain only counts and category labels. We also collect basic technical data like browser type and device category to help fix bugs.',
  },
  {
    title: "What we don't collect",
    body: "No track names, playlist names, Spotify usernames, or account IDs are ever recorded. We don't use cookies, don't track you across other websites, and don't store any personal information. Analytics data lives only in memory during your session.",
  },
  {
    title: 'Why we collect it',
    body: 'Usage data helps us understand which features people actually use, catch bugs early, and prioritise what to build next. Nothing is used for advertising.',
  },
  {
    title: 'How we collect it',
    body: 'Events are sent to PostHog, our analytics provider. PostHog processes data on EU servers (eu.i.posthog.com) and is GDPR compliant. PostHog is configured with memory-only storage — no cookies are written to your browser.',
  },
  {
    title: 'How long we keep it',
    body: 'PostHog retains event data for 1 year by default. You can request deletion at any time by emailing us.',
  },
  {
    title: 'Your rights',
    body: 'Under GDPR you have the right to access, correct, or delete your data, and to object to processing. You can opt out of analytics at any time in Settings — your preference is saved locally and respected immediately.',
  },
  {
    title: 'Contact',
    body: 'For data requests or privacy questions, email ovii.23@icloud.com. We will respond within 30 days.',
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
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Privacy;
