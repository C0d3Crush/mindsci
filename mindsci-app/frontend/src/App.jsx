import { useState, useEffect, useCallback } from 'react';
import WikiView from './components/WikiView.jsx';
import StudyDetail from './components/StudyDetail.jsx';
import FeatureTracker_Meditation from './components/FeatureTracker_Meditation.jsx';

export default function App() {
  const [topics, setTopics] = useState([]);
  const [studies, setStudies] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('wiki'); // 'wiki' | 'tracking'

  useEffect(() => {
    fetch('/api/topics')
      .then(r => r.json())
      .then(setTopics)
      .catch(() => {});
  }, []);

  const fetchStudies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTopic) params.set('topic', selectedTopic);
      if (search) params.set('q', search);
      const res = await fetch(`/api/studies?${params}`);
      const data = await res.json();
      setStudies(data.studies);
      setTotal(data.total);
    } catch {}
    setLoading(false);
  }, [selectedTopic, search]);

  useEffect(() => { fetchStudies(); }, [fetchStudies]);

  const openStudy = async (id) => {
    const res = await fetch(`/api/studies/${id}`);
    const data = await res.json();
    setSelectedStudy(data);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        topics={topics}
        selected={selectedTopic}
        onSelect={t => { setSelectedTopic(t); setSelectedStudy(null); setView('wiki'); }}
        view={view}
        onViewChange={setView}
      />
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {view === 'wiki' ? (
          <>
            <Header search={search} onSearch={setSearch} total={total} />
            {selectedStudy
              ? <StudyDetail study={selectedStudy} onClose={() => setSelectedStudy(null)} />
              : <WikiView studies={studies} loading={loading} onOpen={openStudy} />
            }
          </>
        ) : (
          <TrackingView onOpenStudy={(id) => { openStudy(id); setView('wiki'); }} />
        )}
      </main>
    </div>
  );
}

function Sidebar({ topics, selected, onSelect, view, onViewChange }) {
  const totalCount = topics.reduce((s, t) => s + t.count, 0);
  return (
    <aside style={{
      width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '20px 0', overflowY: 'auto', flexShrink: 0,
    }}>
      <div style={{ padding: '0 16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>🧠 MindSci</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Mentale Gesundheit · Forschung</div>
      </div>
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        <SidebarItem label="📊 Tracking" count={0} active={view === 'tracking'} onClick={() => onViewChange('tracking')} />
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 2px' }} />
        <SidebarItem label="Alle Studien" count={totalCount} active={view === 'wiki' && !selected} onClick={() => onSelect(null)} />
        {topics.map(t => (
          <SidebarItem key={t.topic} label={t.topic} count={t.count} active={view === 'wiki' && selected === t.topic} onClick={() => onSelect(t.topic)} />
        ))}
      </nav>
    </aside>
  );
}

function TrackingView({ onOpenStudy }) {
  return (
    <div style={{ padding: 32, flex: 1, overflow: 'auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>📊 Tracking</h1>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>
        Evidenzbasierte Selbstmessung — jedes Feature basiert direkt auf einer peer-reviewed Studie.
      </p>
      <FeatureTracker_Meditation onOpenStudy={onOpenStudy} />
    </div>
  );
}

function SidebarItem({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', background: active ? 'var(--bg3)' : 'transparent',
      border: 'none', borderRadius: 7, padding: '8px 10px', cursor: 'pointer',
      color: active ? 'var(--text)' : 'var(--text2)', fontSize: 13, display: 'flex',
      justifyContent: 'space-between', alignItems: 'center', marginBottom: 2,
      transition: 'background 0.15s',
    }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {count > 0 && <span style={{ fontSize: 11, background: 'var(--border)', borderRadius: 10, padding: '1px 6px', flexShrink: 0, marginLeft: 6 }}>{count}</span>}
    </button>
  );
}

function Header({ search, onSearch, total }) {
  return (
    <header style={{
      padding: '16px 24px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <input
        type="text"
        placeholder="Suche in Studien..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        style={{
          flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 14px', color: 'var(--text)', fontSize: 14,
          outline: 'none', maxWidth: 420,
        }}
      />
      <span style={{ color: 'var(--text2)', fontSize: 13 }}>{total} Studien</span>
    </header>
  );
}
