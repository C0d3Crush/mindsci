// study_id: d184f832-4b5e-48e1-ba38-5657bbd2763f
// Martino et al. (2017), American Journal of Lifestyle Medicine — Positive soziale Interaktionen reduzieren Cortisol und stärken Immunfunktion
import { useState, useEffect } from 'react';

const STUDY_ID = 'd184f832-4b5e-48e1-ba38-5657bbd2763f';
const FEATURE_KEY = 'verbindung';
const WEEKLY_TARGET = 5;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function FeatureTracker_Verbindung({ onOpenStudy }) {
  const [entries, setEntries] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [today] = useState(todayStr);
  const days = last7Days();

  useEffect(() => {
    fetch('/api/tracking/verbindung')
      .then(r => r.json())
      .then(data => {
        const map = {};
        data.forEach(e => { map[e.date] = e.value; });
        setEntries(map);
      })
      .catch(() => {});
  }, [today]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/tracking/verbindung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 1, date: today }),
      });
      const entry = await res.json();
      setEntries(prev => ({ ...prev, [entry.date]: entry.value }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const todayDone = entries[today] >= 1;
  const daysHit = days.filter(d => entries[d] >= 1).length;

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
      padding: 24, maxWidth: 480, width: '100%',
    }}>
      {/* Study Badge */}
      <div style={{
        fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)',
        border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px',
        marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        📄 Basiert auf:{' '}
        <button
          onClick={() => onOpenStudy && onOpenStudy(STUDY_ID)}
          style={{
            background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
            fontSize: 12, padding: 0, textDecoration: 'underline',
          }}
        >
          Martino et al. (2017) · Am. J. Lifestyle Medicine
        </button>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>💬 Verbindungs-Tracker</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
        Positive soziale Interaktionen reduzieren Cortisol und stärken die Immunfunktion.
        Starke soziale Verbindungen erhöhen die Überlebenswahrscheinlichkeit um 50%.
        Ziel: 5× pro Woche ein bedeutungsvolles Gespräch führen.
      </p>

      {/* CTA Button */}
      <div style={{ marginBottom: 24 }}>
        {todayDone ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg)', borderRadius: 10, padding: '12px 16px',
            border: '1px solid #27ae6040',
          }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27ae60', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#27ae60' }}>Heute erledigt ✓</span>
            <span style={{ fontSize: 13, color: 'var(--text2)', marginLeft: 4 }}>Verbindung gestärkt</span>
          </div>
        ) : (
          <button
            onClick={save}
            disabled={saving}
            style={{
              width: '100%', padding: '14px 20px',
              background: saved ? '#27ae60' : 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: saving ? 'default' : 'pointer',
              fontSize: 15, fontWeight: 700,
              opacity: saving ? 0.7 : 1,
              transition: 'background 0.3s',
            }}
          >
            {saved ? '✓ Gespeichert!' : saving ? '...' : '💬 Heute ein bedeutungsvolles Gespräch geführt'}
          </button>
        )}
      </div>

      {/* Week dots */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Letzte 7 Tage</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {days.map(d => {
            const hit = entries[d] >= 1;
            const isToday = d === today;
            return (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: hit ? '#27ae60' : 'var(--border)',
                  opacity: hit ? 1 : 0.35,
                  outline: isToday ? '2px solid var(--accent)' : 'none',
                  outlineOffset: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                }}>
                  {hit ? '✓' : ''}
                </div>
                <div style={{ fontSize: 10, color: isToday ? 'var(--accent)' : 'var(--text2)' }}>
                  {new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goal indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)', borderRadius: 8, padding: '10px 14px',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Wochenziel (1× tägl. Gespräch)</span>
        <span style={{
          fontSize: 14, fontWeight: 700,
          color: daysHit >= WEEKLY_TARGET ? '#27ae60' : daysHit >= 3 ? '#f39c12' : '#e74c3c',
        }}>
          {daysHit} / {WEEKLY_TARGET} Tage ✓
        </span>
      </div>
    </div>
  );
}
