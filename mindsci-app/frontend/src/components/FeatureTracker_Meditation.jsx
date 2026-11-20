// study_id: c9d0e1f2-a3b4-5678-cdef-789012345678
// Goyal et al. (2014), JAMA Internal Medicine — Meditation reduziert Angst (g=0.38) und Depression (g=0.30) in 47 RCTs
import { useState, useEffect } from 'react';

const STUDY_ID = 'c9d0e1f2-a3b4-5678-cdef-789012345678';
const FEATURE_KEY = 'meditation';
const TARGET_MIN = 10;
const WEEKLY_TARGET = 5;

function getColor(minutes) {
  if (minutes === null || minutes === undefined) return 'var(--border)';
  if (minutes < 5) return '#e74c3c';
  if (minutes < TARGET_MIN) return '#f39c12';
  return '#27ae60';
}

function getLabel(minutes) {
  if (minutes === null || minutes === undefined) return '';
  if (minutes < 5) return 'Zu kurz';
  if (minutes < TARGET_MIN) return 'Gut begonnen';
  return 'Ziel erreicht!';
}

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

export default function FeatureTracker_Meditation({ onOpenStudy }) {
  const [entries, setEntries] = useState({});
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [today] = useState(todayStr);
  const days = last7Days();

  useEffect(() => {
    fetch('/api/tracking/meditation')
      .then(r => r.json())
      .then(data => {
        const map = {};
        data.forEach(e => { map[e.date] = e.value; });
        setEntries(map);
        if (map[today] != null) setInput(String(map[today]));
      })
      .catch(() => {});
  }, [today]);

  const save = async () => {
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 1 || val > 180) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tracking/meditation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val, date: today }),
      });
      const entry = await res.json();
      setEntries(prev => ({ ...prev, [entry.date]: entry.value }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const todayVal = entries[today];
  const daysHit = days.filter(d => {
    const v = entries[d];
    return v != null && v >= TARGET_MIN;
  }).length;

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
          Goyal et al. (2014) · JAMA Internal Medicine
        </button>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🧘 Meditations-Tracker</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
        Täglich 10 Min. Meditation reduziert Angst (g=0,38) und Depression (g=0,30) in 47 RCTs. Ziel: 5× pro Woche.
      </p>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
        <input
          type="number"
          min="1"
          max="180"
          step="1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="z.B. 10"
          style={{
            width: 80, background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 15,
            outline: 'none',
          }}
        />
        <span style={{ color: 'var(--text2)', fontSize: 14 }}>Min. heute meditiert</span>
        <button
          onClick={save}
          disabled={saving || !input}
          style={{
            marginLeft: 'auto', background: saved ? '#27ae60' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            opacity: saving || !input ? 0.5 : 1,
            transition: 'background 0.3s',
          }}
        >
          {saved ? '✓ Gespeichert' : saving ? '...' : 'Eintragen'}
        </button>
      </div>

      {/* Today status */}
      {todayVal != null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
          background: 'var(--bg)', borderRadius: 10, padding: '10px 14px',
          border: `1px solid ${getColor(todayVal)}40`,
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: getColor(todayVal), flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{todayVal} Min.</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{getLabel(todayVal)}</span>
        </div>
      )}

      {/* Week dots */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Letzte 7 Tage</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {days.map(d => {
            const val = entries[d];
            const hit = val != null && val >= TARGET_MIN;
            const isToday = d === today;
            return (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: hit ? '#27ae60' : val != null ? '#f39c12' : 'var(--border)',
                  opacity: val != null ? 1 : 0.35,
                  outline: isToday ? '2px solid var(--accent)' : 'none',
                  outlineOffset: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: val != null ? '#fff' : 'transparent',
                  fontWeight: 600,
                }}>
                  {val != null ? val : ''}
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
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Wochenziel (≥10 Min.)</span>
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
