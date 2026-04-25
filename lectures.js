import { useState, useRef } from 'react';
import './Lectures.css';
import { godine, lecturesData, summaries } from './lecturesData';
 
/* ── Stars helper ── */
function Stars({ n }) {
  return (
    <div className="predmet-card__stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star ${i <= n ? 'star--filled' : 'star--empty'}`}>★</span>
      ))}
    </div>
  );
}
 
/* ── Godina bar chart ── */
const BAR_COLORS = ['#a78bfa', '#7c3aed', '#fbbf24', '#f59e0b', '#6ee7b7'];
function GodinaChart({ bars }) {
  const max = Math.max(...bars);
  return (
    <div className="godina-card__bars">
      {bars.map((v, i) => (
        <div
          key={i}
          className="godina-card__bar"
          style={{
            height: `${(v / max) * 100}%`,
            background: BAR_COLORS[i % BAR_COLORS.length],
          }}
        />
      ))}
    </div>
  );
}
 
/* ── Convert File to base64 ── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
 
/* ── PDF Upload Section ── */
function PDFUploadSection({ predmetId, profesorId, onPdfReady }) {
  const storageKey = `pdf_meta_${predmetId}_${profesorId}`;
  const [uploadedMeta, setUploadedMeta] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [pdfObjectUrl, setPdfObjectUrl] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
 
  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Molimo odaberite PDF fajl.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPdfObjectUrl(objectUrl);
 
    const base64 = await fileToBase64(file);
    onPdfReady({ base64, name: file.name });
 
    const meta = { name: file.name, size: file.size, date: new Date().toLocaleDateString('bs-BA') };
    setUploadedMeta(meta);
    try { localStorage.setItem(storageKey, JSON.stringify(meta)); } catch {}
  };
 
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };
 
  const handleRemove = () => {
    setUploadedMeta(null);
    setPdfObjectUrl(null);
    onPdfReady(null);
    try { localStorage.removeItem(storageKey); } catch {}
  };
 
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
 
  return (
    <div className="pdf-upload-section">
      <div className="pdf-upload-label">
        <span className="pdf-upload-icon">📎</span>
        MOJ PDF
      </div>
 
      {uploadedMeta ? (
        <div className="pdf-upload-file">
          <div className="pdf-upload-file__info">
            <span className="pdf-upload-file__icon">📄</span>
            <div>
              <div className="pdf-upload-file__name">{uploadedMeta.name}</div>
              <div className="pdf-upload-file__meta">
                {formatSize(uploadedMeta.size)} • {uploadedMeta.date}
              </div>
            </div>
          </div>
          <div className="pdf-upload-file__actions">
            {pdfObjectUrl && (
              <a className="btn-upload-open" href={pdfObjectUrl} target="_blank" rel="noopener noreferrer">
                Otvori
              </a>
            )}
            <button className="btn-upload-remove" onClick={handleRemove} title="Ukloni fajl">✕</button>
          </div>
        </div>
      ) : (
        <div
          className={`pdf-dropzone ${dragging ? 'pdf-dropzone--drag' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <span className="pdf-dropzone__icon">☁️</span>
          <span className="pdf-dropzone__text">Prevuci PDF ili klikni za upload</span>
          <span className="pdf-dropzone__hint">Samo .pdf fajlovi</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}
    </div>
  );
}
 
/* ── Summary Modal — AI via Claude API, fallback na lokalni sažetak ── */
function SummaryModal({ predmet, profesor, pdfData, onClose }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [source, setSource] = useState(''); // 'ai' | 'local'
  const hasRunRef = useRef(false);
 
  const loadLocalSummary = () => {
    const text = summaries[predmet.id] || null;
    if (text) {
      setSummary(text);
      setWordCount(text.trim().split(/\s+/).length);
      setSource('local');
    } else {
      setError('Nema dostupnog sažetka za ovaj predmet.');
    }
  };
 
  const generateSummary = async () => {
    setLoading(true);
    setError('');
    setSummary('');
    setSource('');
 
    // Ako nema PDF-a, odmah koristi lokalni sažetak
    if (!pdfData) {
      setLoading(false);
      loadLocalSummary();
      return;
    }
 
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: pdfData.base64,
                  },
                },
                {
                  type: 'text',
                  text: `Napravi detaljan sažetak ovog PDF dokumenta za predmet "${predmet.naziv}" (${profesor.tip}) kod profesora ${profesor.ime}. Sažetak treba da bude između 500 i 1000 riječi, napisan na bosanskom/srpskom jeziku. Pokrij sve ključne teme, pojmove i koncepte iz dokumenta. Budi jasan i informativan.`,
                },
              ],
            },
          ],
        }),
      });
 
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || 'API greška');
 
      const text = data.content?.map(b => b.text || '').join('') || '';
      if (!text) throw new Error('Prazan odgovor');
 
      setSummary(text);
      setWordCount(text.trim().split(/\s+/).length);
      setSource('ai');
    } catch (err) {
      // API nije dostupan — tiho padamo na lokalni sažetak
      loadLocalSummary();
    } finally {
      setLoading(false);
    }
  };
 
  // Auto-pokreni kada se modal otvori
  if (!hasRunRef.current && !loading && !summary && !error) {
    hasRunRef.current = true;
    generateSummary();
  }
 
  return (
    <div className="summary-overlay" onClick={onClose}>
      <div className="summary-modal" onClick={e => e.stopPropagation()}>
        <div className="summary-modal__header">
          <div>
            <div className="summary-modal__title">{predmet.naziv} — {profesor.tip}</div>
            <div className="summary-modal__subtitle">Prof. {profesor.ime}</div>
          </div>
          <button className="summary-modal__close" onClick={onClose}>✕</button>
        </div>
 
        {loading ? (
          <div className="summary-loading">
            <div className="summary-loading__spinner" />
            <p className="summary-loading__text">Učitava sažetak...</p>
            <p className="summary-loading__hint">Trenutak strpljenja...</p>
          </div>
        ) : error ? (
          <div className="summary-error">
            <span style={{ fontSize: 28 }}>⚠️</span>
            <p>{error}</p>
            <button className="btn-retry" onClick={() => { hasRunRef.current = false; generateSummary(); }}>
              Pokušaj ponovo
            </button>
          </div>
        ) : (
          <>
            <span className="summary-modal__badge">
              {source === 'ai' ? '🤖 AI Sažetak' : '📚 Lokalni Sažetak'} • {predmet.naziv} • {wordCount} riječi
            </span>
            <p className="summary-modal__text">{summary}</p>
            <div className="summary-modal__footer">
              <span className="summary-modal__words">{wordCount} / 1000 riječi</span>
              <button className="btn-regenerate" onClick={() => { hasRunRef.current = false; generateSummary(); }}>
                ↺ Regeneriši
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
 
/* ── Lekcija view ── */
function LekcijaView({ predmet, godinaId, onBack }) {
  const [pdfMap, setPdfMap] = useState({});
  const [activeSummary, setActiveSummary] = useState(null);
 
  const handlePdfReady = (profId, data) => {
    setPdfMap(prev => ({ ...prev, [profId]: data }));
  };
 
  return (
    <>
      {activeSummary && (
        <SummaryModal
          predmet={predmet}
          profesor={activeSummary.profesor}
          pdfData={pdfMap[activeSummary.profesor.id] || null}
          onClose={() => setActiveSummary(null)}
        />
      )}
 
      <div className="lekcija-view">
        <div className="lekcija-view__top">
          <div className="lekcija-view__meta">
            <button className="lekcija-view__back" onClick={onBack}>
              ← Nazad na predmete
            </button>
            <div className="lekcija-view__naziv">{predmet.naziv}</div>
            <p className="lekcija-view__subtitle">
              Uploadujte PDF materijal i generišite AI sažetak direktno iz knjige ili skripta.
            </p>
          </div>
        </div>
 
        <div className="profesor-cards">
          {predmet.profesori.map(prof => (
            <div key={prof.id} className="profesor-card">
              <div className="profesor-card__avatar" style={{ background: prof.avatarBoja + '22' }}>
                {prof.avatar}
              </div>
              <div className="profesor-card__ime">{prof.ime}</div>
              <p className="profesor-card__opis">{prof.opis}</p>
 
              <PDFUploadSection
                predmetId={predmet.id}
                profesorId={prof.id}
                onPdfReady={(data) => handlePdfReady(prof.id, data)}
              />
 
              <div className="profesor-card__btns">
                <button className="btn-read" onClick={() => window.open(prof.pdfUrl, '_blank')}>
                  Read
                </button>
                <button
                  className={`btn-summary ${pdfMap[prof.id] ? 'btn-summary--active' : ''}`}
                  onClick={() => setActiveSummary({ profesor: prof })}
                  title={pdfMap[prof.id] ? 'Generiši AI sažetak' : 'Uploadujte PDF prvo'}
                >
                  {pdfMap[prof.id] ? '🤖 Summary' : 'Summary'}
                </button>
              </div>
            </div>
          ))}
        </div>
 
        <div className="lekcija-view__all-btn-row">
          <button className="btn-all-lectures" onClick={onBack}>All Lectures</button>
        </div>
      </div>
    </>
  );
}
 
/* ── Main Lectures page ── */
export default function Lectures() {
  const [aktivnaGodina, setAktivnaGodina] = useState('prva');
  const [odabraniPredmet, setOdabraniPredmet] = useState(null);
 
  const predmeti = lecturesData[aktivnaGodina];
  const godinaLabel = godine.find(g => g.id === aktivnaGodina)?.label || '';
 
  return (
    <div className="lectures-page">
      <div className="lectures-page__header">
        <h1 className="lectures-page__header-title">Jusuf Novalic 👋</h1>
        <div className="lectures-page__header-actions">
          <button className="lec-bell">🔔</button>
          <div className="lec-avatar">JN</div>
        </div>
      </div>
 
      <div className="lectures-page__body">
        <div className="lectures-section-label">Lectures</div>
        <div className="godina-cards">
          {godine.map(g => (
            <div
              key={g.id}
              className={`godina-card ${aktivnaGodina === g.id ? 'godina-card--active' : ''}`}
              onClick={() => { setAktivnaGodina(g.id); setOdabraniPredmet(null); }}
            >
              <div className="godina-card__title">{g.label}</div>
              <GodinaChart bars={g.bars} />
            </div>
          ))}
        </div>
 
        {odabraniPredmet ? (
          <>
            <div className="lectures-section-label" style={{ marginBottom: 18 }}>
              {odabraniPredmet.naziv}
            </div>
            <LekcijaView
              predmet={odabraniPredmet}
              godinaId={aktivnaGodina}
              onBack={() => setOdabraniPredmet(null)}
            />
          </>
        ) : (
          <div className="predmeti-section">
            <div className="lectures-section-label">{godinaLabel}</div>
            <div className="predmeti-grid">
              {predmeti.map(predmet => (
                <div key={predmet.id} className="predmet-card">
                  <div className="predmet-card__img" style={{ background: predmet.boja }}>
                    <span style={{ fontSize: 42, zIndex: 1 }}>
                      {predmet.kategorija.includes('ELEKTRO') ? '⚡' :
                       predmet.kategorija.includes('PROGRAMIR') ? '💻' :
                       predmet.kategorija.includes('OOP') ? '🔷' :
                       predmet.kategorija.includes('DIGITAL') ? '🔌' :
                       predmet.kategorija.includes('MATEMA') ? '📐' :
                       predmet.kategorija.includes('FIZIKA') ? '⚛️' :
                       predmet.kategorija.includes('BAZE') ? '🗄️' :
                       predmet.kategorija.includes('MREZE') ? '🌐' :
                       predmet.kategorija.includes('OPERAT') ? '🖥️' :
                       predmet.kategorija.includes('WEB') ? '🎨' :
                       predmet.kategorija.includes('ENGLESKI') ? '🇬🇧' :
                       predmet.kategorija.includes('SOFTVER') ? '🧩' :
                       predmet.kategorija.includes('INTELI') ? '🤖' :
                       predmet.kategorija.includes('MOBILNE') ? '📱' :
                       predmet.kategorija.includes('SIGUR') ? '🔐' :
                       predmet.kategorija.includes('CLOUD') ? '☁️' :
                       predmet.kategorija.includes('STATISTIKA') ? '📊' :
                       predmet.kategorija.includes('DIPLOMSKI') ? '🎓' :
                       predmet.kategorija.includes('DISTRIBUIR') ? '🔗' :
                       predmet.kategorija.includes('BIG') ? '📈' :
                       predmet.kategorija.includes('DEVOPS') ? '⚙️' :
                       predmet.kategorija.includes('BLOCKCHAIN') ? '⛓️' :
                       predmet.kategorija.includes('MENADZMENT') ? '💼' : '📚'}
                    </span>
                    <div className="predmet-card__img-decoration" />
                  </div>
                  <div className="predmet-card__body">
                    <div className="predmet-card__kategorija">{predmet.kategorija}</div>
                    <Stars n={predmet.ocjena} />
                    <div className="predmet-card__naziv">{predmet.naziv}</div>
                    <p className="predmet-card__opis">{predmet.opis}</p>
                  </div>
                  <div className="predmet-card__footer">
                    <button className="btn-learn" onClick={() => setOdabraniPredmet(predmet)}>
                      Learn
                    </button>
                    <span className="predmet-card__studenata">
                      {predmet.studenata} <span style={{ color: '#a1a1aa' }}>Enrolled</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
