// study_id: a7b8c9d0-e1f2-3456-abcd-567890123456
// Cappuccio et al. (2010), Sleep — Optimale Schlafdauer 7–8h, <6h erhöht Mortalitätsrisiko
import { useState, useEffect } from 'react';

const STUDY_ID = 'a7b8c9d0-e1f2-3456-abcd-567890123456';
const FEATURE_KEY = 'schlaf';
const TARGET_MIN = 7;
const TARGET_MAX = 8;

function getColor(h) {
  if (h === null || h === undefined) return 'var(--border)';
  if (h < 6) return '#e74c3c';
  if (h < TARGET_MIN) return '#f39c12';
  if (h <= TARGET_MAX) return '#27ae60';
  if (h <= 9) return '#f39c12';
  return '#e67e22';
}

function getLabel(h) {
  if (h === null || h === undefined) return '';
  if (h < 6) return 'Zu wenig';
  if (h < TARGET_MIN) return 'Leicht darunter';
  if (h <= TARGET_MAX) return 'Optimal';
  if (h <= 9) return 'Leicht darüber';
  return 'Zu viel';
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

export default function FeatureTracker_Schlaf({ onOpenStudy }) {
  const [entries, setEntries] = useState({});
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [today] = useState(todayStr);
  const days = last7Days();

  useEffect(() => {
    fetch('/api/tracking/schlaf')
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
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val) || val < 0 || val > 24) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tracking/schlaf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val, date: today }),
      });
      const entry = await res.json();
      setEntries(prev => ({ ...prev, [entry.date]: entry.value }));
    } finally {
      setSaving(false);
    }
  };

  const todayVal = entries[today];
  const daysHit = days.filter(d => {
    const v = entries[d];
    return v != null && v >= TARGET_MIN && v <= TARGET_MAX;
  }).length;

  const maxVal = Math.max(...days.map(d => entries[d] ?? 0), TARGET_MAX);

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
          Cappuccio et al. (2010) · Sleep
        </button>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>💤 Schlaf-Tracker</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
        Optimale Schlafdauer: 7–8 Stunden. Ziel: mind. 5 von 7 Nächten im grünen Bereich.
      </p>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="z.B. 7.5"
          style={{
            width: 90, background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 15,
            outline: 'none',
          }}
        />
        <span style={{ color: 'var(--text2)', fontSize: 14 }}>Stunden heute Nacht</span>
        <button
          onClick={save}
          disabled={saving || !input}
          style={{
            marginLeft: 'auto', background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            opacity: saving || !input ? 0.5 : 1,
          }}
        >
          {saving ? '...' : 'Speichern'}
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>{todayVal}h</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{getLabel(todayVal)}</span>
        </div>
      )}

      {/* Week bars */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Letzte 7 Nächte</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72 }}>
          {days.map(d => {
            const val = entries[d];
            const barH = val != null ? Math.max(4, (val / (maxVal || 9)) * 60) : 4;
            const isToday = d === today;
            return (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text2)', height: 14 }}>
                  {val != null ? val : ''}
                </div>
                <div style={{
                  width: '100%', height: barH, borderRadius: 4,
                  background: val != null ? getColor(val) : 'var(--border)',
                  opacity: val != null ? 1 : 0.4,
                  outline: isToday ? '2px solid var(--accent)' : 'none',
                  outlineOffset: 1,
                }} />
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
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Wochenziel (7–8h)</span>
        <span style={{
          fontSize: 14, fontWeight: 700,
          color: daysHit >= 5 ? '#27ae60' : daysHit >= 3 ? '#f39c12' : '#e74c3c',
        }}>
          {daysHit} / 7 Nächte ✓
        </span>
      </div>
    </div>
  );
}
