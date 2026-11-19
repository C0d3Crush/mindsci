const STUDY_TYPE_COLORS = {
  'RCT': '#7c8cff',
  'Meta-Analyse': '#a78bfa',
  'Review': '#34d399',
  'Kohortenstudie': '#fbbf24',
  'Querschnittsstudie': '#fb923c',
};

function typeColor(type) {
  if (!type) return 'var(--border)';
  for (const [k, v] of Object.entries(STUDY_TYPE_COLORS)) {
    if (type.includes(k)) return v;
  }
  return 'var(--text2)';
}

export default function WikiView({ studies, loading, onOpen }) {
  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Lade Studien...</div>
  );

  if (!studies.length) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
      <div>Keine Studien gefunden.</div>
      <div style={{ fontSize: 13, marginTop: 8 }}>
        Führe <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4 }}>npm run collect</code> aus, um Studien zu sammeln.
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 16,
      padding: 24,
      alignContent: 'start',
    }}>
      {studies.map(s => <StudyCard key={s.id} study={s} onOpen={onOpen} />)}
    </div>
  );
}

function StudyCard({ study, onOpen }) {
  const color = typeColor(study.study_type);
  return (
    <article
      onClick={() => onOpen(study.id)}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: 18, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.1s',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color, background: `${color}18`,
          padding: '3px 8px', borderRadius: 20, border: `1px solid ${color}40`, whiteSpace: 'nowrap',
        }}>
          {study.study_type || 'Studie'}
        </span>
        {study.year && <span style={{ fontSize: 12, color: 'var(--text2)', flexShrink: 0 }}>{study.year}</span>}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)' }}>
        {study.title}
      </h3>

      {study.authors && (
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{study.authors}</div>
      )}

      {study.journal && (
        <div style={{ fontSize: 12, color: 'var(--accent2)', fontStyle: 'italic' }}>{study.journal}</div>
      )}

      {study.summary && (
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {study.summary}
        </p>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <span style={{
          fontSize: 11, background: 'var(--bg3)', padding: '3px 8px',
          borderRadius: 20, color: 'var(--text2)',
        }}>
          {study.topic}
        </span>
      </div>
    </article>
  );
}
