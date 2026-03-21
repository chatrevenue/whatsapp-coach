'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MessageExample, Industry } from '@/lib/types';
import { INDUSTRIES } from '@/lib/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

function AuthGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.trim()) {
      setError('Bitte Passwort eingeben.');
      return;
    }
    onAuth(pw.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">WhatsApp Coach</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(''); }}
            placeholder="Admin-Passwort"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Einloggen
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExampleFormData {
  industry: Industry;
  occasion: string;
  message: string;
  quick_replies: string;
  auto_responses: string;
  openRate: string;
  responseRate: string;
  sentCount: string;
  notes: string;
}

const emptyForm = (): ExampleFormData => ({
  industry: 'autohaus',
  occasion: '',
  message: '',
  quick_replies: '',
  auto_responses: '',
  openRate: '',
  responseRate: '',
  sentCount: '0',
  notes: '',
});

// ─── Modal ────────────────────────────────────────────────────────────────────

function ExampleModal({
  initial,
  onSave,
  onClose,
  adminPw,
}: {
  initial?: MessageExample | null;
  onSave: () => void;
  onClose: () => void;
  adminPw: string;
}) {
  const [form, setForm] = useState<ExampleFormData>(() => {
    if (!initial) return emptyForm();
    return {
      industry: initial.industry,
      occasion: initial.occasion,
      message: initial.message,
      quick_replies: initial.quick_replies.join('\n'),
      auto_responses: initial.auto_responses.join('\n'),
      openRate: initial.stats.openRate?.toString() ?? '',
      responseRate: initial.stats.responseRate?.toString() ?? '',
      sentCount: initial.stats.sentCount.toString(),
      notes: initial.stats.notes,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.occasion.trim() || !form.message.trim()) {
      setError('Anlass und Nachricht sind Pflichtfelder.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      industry: form.industry,
      occasion: form.occasion.trim(),
      message: form.message.trim(),
      quick_replies: form.quick_replies.split('\n').map((s) => s.trim()).filter(Boolean),
      auto_responses: form.auto_responses.split('\n').map((s) => s.trim()).filter(Boolean),
      stats: {
        openRate: form.openRate ? parseFloat(form.openRate) : null,
        responseRate: form.responseRate ? parseFloat(form.responseRate) : null,
        sentCount: parseInt(form.sentCount || '0', 10),
        notes: form.notes,
      },
    };

    try {
      let res: Response;
      if (initial) {
        res = await fetch(`/api/examples/${initial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/examples', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Fehler beim Speichern.');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800 text-lg">
            {initial ? 'Beispiel bearbeiten' : 'Neues Beispiel'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Branche */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Branche</label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value as Industry })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.id} value={ind.id}>{ind.icon} {ind.label}</option>
              ))}
            </select>
          </div>

          {/* Anlass */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Anlass *</label>
            <input
              type="text"
              value={form.occasion}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              placeholder="z.B. Frühlingscheck, Mittagsmenü"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Nachricht */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Nachricht *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              placeholder="Die WhatsApp-Nachricht..."
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
            />
          </div>

          {/* Quick Replies */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Quick-Reply Buttons (je Zeile, max 20 Zeichen)</label>
            <textarea
              value={form.quick_replies}
              onChange={(e) => setForm({ ...form, quick_replies: e.target.value })}
              rows={3}
              placeholder={"Termin buchen\nMehr Infos\nKein Interesse"}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none font-mono"
            />
          </div>

          {/* Auto Responses */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Auto-Antworten (je Zeile, passend zu Buttons)</label>
            <textarea
              value={form.auto_responses}
              onChange={(e) => setForm({ ...form, auto_responses: e.target.value })}
              rows={3}
              placeholder={"Ich schicke dir gleich freie Termine!\nHier sind alle Infos...\nKein Problem, meld dich gerne wieder."}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none font-mono"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Öffnungsrate %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.openRate}
                onChange={(e) => setForm({ ...form, openRate: e.target.value })}
                placeholder="68"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Antwortrate %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.responseRate}
                onChange={(e) => setForm({ ...form, responseRate: e.target.value })}
                placeholder="34"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Verschickt</label>
              <input
                type="number"
                min="0"
                value={form.sentCount}
                onChange={(e) => setForm({ ...form, sentCount: e.target.value })}
                placeholder="100"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Notizen</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optionale Notizen..."
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [adminPw, setAdminPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<'examples' | 'stats'>('examples');
  const [industry, setIndustry] = useState<Industry | 'all'>('all');
  const [examples, setExamples] = useState<MessageExample[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<MessageExample | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const fetchExamples = useCallback(async (pw: string, ind: Industry | 'all' = 'all') => {
    setLoading(true);
    try {
      const industries: Industry[] = ind === 'all'
        ? ['autohaus', 'restaurant', 'fitnessstudio', 'andere']
        : [ind];

      const results = await Promise.all(
        industries.map((i) =>
          fetch(`/api/examples?industry=${i}&limit=50`, {
            headers: { 'x-admin-password': pw },
          }).then((r) => r.json())
        )
      );

      const all = results.flatMap((r) => r.examples ?? []) as MessageExample[];
      setExamples(all);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuth = async (pw: string) => {
    // Verify password by making a test request
    const res = await fetch('/api/examples?industry=autohaus&limit=1', {
      headers: { 'x-admin-password': pw },
    });
    if (res.ok) {
      setAdminPw(pw);
      setAuthed(true);
      setAuthError(false);
      fetchExamples(pw, 'all');
    } else {
      setAuthError(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/examples/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPw },
      });
      if (res.ok) {
        setExamples((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
    }
    setDeleteConfirm(null);
  };

  useEffect(() => {
    if (authed) {
      fetchExamples(adminPw, industry === 'all' ? 'all' : industry);
    }
  }, [authed, industry, adminPw, fetchExamples]);

  if (!authed) {
    return (
      <>
        <AuthGate onAuth={handleAuth} />
        {authError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
            Falsches Passwort. Bitte nochmal versuchen.
          </div>
        )}
      </>
    );
  }

  const filteredExamples = industry === 'all'
    ? examples
    : examples.filter((e) => e.industry === industry);

  const sortedByRate = [...examples].sort((a, b) => (b.stats.openRate ?? -1) - (a.stats.openRate ?? -1));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="font-bold text-gray-800">Admin Panel</h1>
            <p className="text-xs text-gray-500">WhatsApp Coach</p>
          </div>
        </div>
        <a href="/" className="text-sm text-green-600 hover:underline">← Zurück zur App</a>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0 max-w-5xl mx-auto">
          {(['examples', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'examples' ? '📚 Beispiele' : '📊 Statistiken'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'examples' && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as Industry | 'all')}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white"
              >
                <option value="all">Alle Branchen</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.id}>{ind.icon} {ind.label}</option>
                ))}
              </select>

              <button
                onClick={() => { setEditTarget(null); setShowModal(true); }}
                className="ml-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                + Neu erstellen
              </button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12 text-gray-400">Lade Beispiele...</div>
            ) : filteredExamples.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p>Keine Beispiele gefunden.</p>
                <p className="text-sm mt-1">Erstelle das erste Beispiel mit &ldquo;+ Neu erstellen&rdquo;.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExamples.map((ex) => {
                  const ind = INDUSTRIES.find((i) => i.id === ex.industry);
                  return (
                    <div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
                      <div className="text-2xl flex-shrink-0">{ind?.icon ?? '📌'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {ind?.label ?? ex.industry}
                          </span>
                          <span className="font-semibold text-gray-800 text-sm">{ex.occasion}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">{ex.message}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                          <span>
                            📬 Öffnungsrate: <strong className={ex.stats.openRate && ex.stats.openRate >= 60 ? 'text-green-600' : 'text-gray-600'}>
                              {ex.stats.openRate !== null ? `${ex.stats.openRate}%` : '–'}
                            </strong>
                          </span>
                          <span>
                            💬 Antwortrate: <strong>{ex.stats.responseRate !== null ? `${ex.stats.responseRate}%` : '–'}</strong>
                          </span>
                          <span>✉️ Verschickt: <strong>{ex.stats.sentCount}</strong></span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => { setEditTarget(ex); setShowModal(true); }}
                          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        {deleteConfirm === ex.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(ex.id)}
                              className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Löschen?
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-gray-600 border border-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-50"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(ex.id)}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'stats' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Beste Nachrichten nach Öffnungsrate</h2>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Lade Daten...</div>
            ) : sortedByRate.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Noch keine Daten vorhanden.</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Branche</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Anlass</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs hidden sm:table-cell">Nachricht</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">Öffnungsrate</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">Antwortrate</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">Verschickt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByRate.map((ex, i) => {
                      const ind = INDUSTRIES.find((ii) => ii.id === ex.industry);
                      return (
                        <tr key={ex.id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-base mr-1">{ind?.icon}</span>
                            <span className="text-xs text-gray-500">{ind?.label}</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{ex.occasion}</td>
                          <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-xs">
                            <span className="truncate block">{ex.message.substring(0, 60)}…</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {ex.stats.openRate !== null ? (
                              <span className={`font-bold ${ex.stats.openRate >= 60 ? 'text-green-600' : ex.stats.openRate >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                                {ex.stats.openRate}%
                              </span>
                            ) : <span className="text-gray-300">–</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {ex.stats.responseRate !== null ? `${ex.stats.responseRate}%` : <span className="text-gray-300">–</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{ex.stats.sentCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <ExampleModal
          initial={editTarget}
          onSave={() => fetchExamples(adminPw, industry === 'all' ? 'all' : industry)}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          adminPw={adminPw}
        />
      )}
    </div>
  );
}
