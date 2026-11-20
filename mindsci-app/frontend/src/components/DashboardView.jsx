import { useState, useEffect } from 'react';
import FeatureTracker_Meditation from './FeatureTracker_Meditation.jsx';
import FeatureTracker_Sport from './FeatureTracker_Sport.jsx';
import FeatureTracker_Verbindung from './FeatureTracker_Verbindung.jsx';

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function DashboardView({ onOpenStudy, onViewStudies }) {
  const [topics, setTopics] = useState([]);
  const [recentStudies, setRecentStudies] = useState([]);
  const [totalStudies, setTotalStudies] = useState(0);
  const [featuredStudy, setFeaturedStudy] = useState(null);
  const [meditationWeek, setMeditationWeek] = useState([]);
  const [sportWeek, setSportWeek] = useState([]);
  const [verbindungWeek, setVerbindungWeek] = useState([]);
  const [showMeditationDetail, setShowMeditationDetail] = useState(false);
  const [showSportDetail, setShowSportDetail] = useState(false);
  const [showVerbindungDetail, setShowVerbindungDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/topics').then(r => r.json()),
      fetch('/api/studies?limit=5').then(r => r.json()),
      fetch('/api/tracking/meditation').then(r => r.json()),
      fetch('/api/tracking/sport').then(r => r.json()),
      fetch('/api/tracking/verbindung').then(r => r.json()),
    ]).then(([topicsRes, studiesRes, trackingRes, sportRes, verbindungRes]) => {
      if (topicsRes.status === 'fulfilled') setTopics(topicsRes.value);
      if (studiesRes.status === 'fulfilled') {
        setRecentStudies(studiesRes.value.studies || []);
        setTotalStudies(studiesRes.value.total || 0);
        const all = studiesRes.value.studies || [];
        if (all.length) setFeaturedStudy(all[Math.floor(Math.random() * Math.min(all.length, 20))]);
      }
      if (trackingRes.status === 'fulfilled') setMeditationWeek(trackingRes.value || []);
      if (sportRes.status === 'fulfilled') setSportWeek(sportRes.value || []);
      if (verbindungRes.status === 'fulfilled') setVerbindungWeek(verbindungRes.value || []);
      setLoading(false);
    });
  }, []);

  const topTopic = topics[0];
  const meditationDays = getLast7Days();
  const meditationDone = meditationDays.filter(d =>
    meditationWeek.some(e => e.date === d && e.value >= 10)
  ).length;
  const sportDone = meditationDays.filter(d =>
    sportWeek.some(e => e.date === d && e.value >= 45)
  ).length;
  const verbindungDone = meditationDays.filter(d =>
    verbindungWeek.some(e => e.date === d && e.value >= 1)
  ).length;

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>Lade Dashboard...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 900, width: '100%' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Dein Überblick für mentale Gesundheit</p>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard
          icon="📚"
          label="STUDIEN IM WIKI"
          value={totalStudies}
          sub={`${topics.length} Themengebiete`}
          onClick={onViewStudies}
          accent="var(--accent)"
        />
        <StatCard
          icon="🔬"
          label="BELIEBTESTES THEMA"
          value={topTopic?.topic || '—'}
          sub={topTopic ? `${topTopic.count} Studien` : ''}
          accent="var(--accent2)"
          onClick={() => topTopic && onViewStudies(topTopic.topic)}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          icon="🧘"
          label="MEDITATION DIESE WOCHE"
          value={`${meditationDone} / 5`}
          sub={meditationDone >= 5 ? 'Wochenziel erreicht! 🎉' : `Noch ${5 - meditationDone} Einheiten`}
          accent={meditationDone >= 5 ? 'var(--green)' : meditationDone >= 3 ? '#fbbf24' : '#ef4444'}
          progress={meditationDone / 5}
          onClick={() => setShowMeditationDetail(true)}
        />
        <StatCard
          icon="🏃"
          label="SPORT DIESE WOCHE"
          value={`${sportDone} / 4`}
          sub={sportDone >= 4 ? 'Wochenziel erreicht! 🎉' : `Noch ${4 - sportDone} Einheiten`}
          accent={sportDone >= 4 ? 'var(--green)' : sportDone >= 2 ? '#fbbf24' : '#ef4444'}
          progress={sportDone / 4}
          onClick={() => setShowSportDetail(true)}
        />
        <StatCard
          icon="💬"
          label="VERBINDUNG DIESE WOCHE"
          value={`${verbindungDone} / 5`}
          sub={verbindungDone >= 5 ? 'Wochenziel erreicht! 🎉' : `Noch ${5 - verbindungDone} Gespräche`}
          accent={verbindungDone >= 5 ? 'var(--green)' : verbindungDone >= 3 ? '#fbbf24' : '#ef4444'}
          progress={verbindungDone / 5}
          onClick={() => setShowVerbindungDetail(true)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Studies */}
        <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Zuletzt hinzugefügt
            </h2>
            <button onClick={() => onViewStudies(null)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Alle →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentStudies.map(s => (
              <button key={s.id} onClick={() => onOpenStudy(s.id)} style={{
                textAlign: 'left', background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px', cursor: 'pointer', width: '100%',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 8 }}>
                  <span>{s.topic}</span>
                  {s.year && <span>· {s.year}</span>}
                  {s.study_type && <span>· {s.study_type}</span>}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Study + Topics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {featuredStudy && (
            <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                📄 Studie des Tages
              </div>
              <div style={{ fontSize: 11, color: 'var(--accent2)', marginBottom: 6 }}>{featuredStudy.topic}</div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 8 }}>{featuredStudy.title}</div>
              {featuredStudy.summary && (
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  marginBottom: 10 }}>
                  {featuredStudy.summary}
                </p>
              )}
              <button onClick={() => onOpenStudy(featuredStudy.id)} style={{
                fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                Artikel lesen →
              </button>
            </section>
          )}

          {/* Topic breakdown */}
          <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
              Themen
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topics.slice(0, 5).map(t => (
                <button key={t.topic} onClick={() => onViewStudies(t.topic)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                  color: 'var(--text)',
                }}>
                  <span style={{ fontSize: 13 }}>{t.topic}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(t.count / topics[0].count) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text2)', width: 16, textAlign: 'right' }}>{t.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showMeditationDetail && (
        <div
          onClick={() => setShowMeditationDetail(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 28, maxWidth: 480, width: '90%', position: 'relative',
          }}>
            <button
              onClick={() => setShowMeditationDetail(false)}
              style={{
                position: 'absolute', top: 14, right: 14, background: 'var(--bg3)',
                border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)',
                cursor: 'pointer', fontSize: 13, padding: '3px 10px',
              }}
            >✕</button>
            <FeatureTracker_Meditation onOpenStudy={(id) => { setShowMeditationDetail(false); onOpenStudy(id); }} />
          </div>
        </div>
      )}

      {showSportDetail && (
        <div onClick={() => setShowSportDetail(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 480, width: '90%', position: 'relative' }}>
            <button onClick={() => setShowSportDetail(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'pointer', fontSize: 13, padding: '3px 10px' }}>✕</button>
            <FeatureTracker_Sport onOpenStudy={(id) => { setShowSportDetail(false); onOpenStudy(id); }} />
          </div>
        </div>
      )}

      {showVerbindungDetail && (
        <div onClick={() => setShowVerbindungDetail(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 480, width: '90%', position: 'relative' }}>
            <button onClick={() => setShowVerbindungDetail(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'pointer', fontSize: 13, padding: '3px 10px' }}>✕</button>
            <FeatureTracker_Verbindung onOpenStudy={(id) => { setShowVerbindungDetail(false); onOpenStudy(id); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent, onClick, progress, studyRef }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
      padding: 20, cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {icon} {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, marginBottom: 4 }}>{value}</div>
      {progress !== undefined && (
        <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, margin: '8px 0', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(progress * 100, 100)}%`, height: '100%', background: accent, borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{sub}</div>}
      {studyRef && <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 6, opacity: 0.6 }}>📄 {studyRef}</div>}
    </div>
  );
}
