import ReactMarkdown from 'react-markdown';

export default function StudyDetail({ study, onClose }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 32, maxWidth: 760, width: '100%' }}>
      <button
        onClick={onClose}
        style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text2)', padding: '6px 14px', cursor: 'pointer', fontSize: 13,
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        ← Zurück
      </button>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {study.study_type && (
          <span style={{ fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20, color: 'var(--accent)' }}>
            {study.study_type}
          </span>
        )}
        <span style={{ fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20, color: 'var(--text2)' }}>
          {study.topic}
        </span>
        {study.year && (
          <span style={{ fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20, color: 'var(--text2)' }}>
            {study.year}
          </span>
        )}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
        {study.title}
      </h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {study.authors && <span style={{ fontSize: 13, color: 'var(--text2)' }}>{study.authors}</span>}
        {study.journal && <span style={{ fontSize: 13, color: 'var(--accent2)', fontStyle: 'italic' }}>{study.journal}</span>}
      </div>

      {(study.url || study.doi) && (
        <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
          {study.url && (
            <a href={study.url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 13, background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 14px', color: 'var(--accent)',
            }}>
              Studie öffnen ↗
            </a>
          )}
          {study.doi && !study.url && (
            <a href={`https://doi.org/${study.doi}`} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 13, background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 14px', color: 'var(--accent)',
            }}>
              DOI: {study.doi} ↗
            </a>
          )}
        </div>
      )}

      {study.content ? (
        <div style={{ lineHeight: 1.75, color: 'var(--text)' }} className="study-content">
          <ReactMarkdown>{study.content}</ReactMarkdown>
        </div>
      ) : (
        <>
          {study.summary && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zusammenfassung</h2>
              <p style={{ lineHeight: 1.75 }}>{study.summary}</p>
            </section>
          )}
          {study.key_findings && (
            <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kernerkenntnisse</h2>
              <p style={{ lineHeight: 1.75, color: 'var(--text)' }}>{study.key_findings}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
