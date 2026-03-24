'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MessageExample, Industry, IndustryInstructions, QuickReplyPair } from '@/lib/types';
import { INDUSTRIES } from '@/lib/types';
import { calculateScore, getScoreLabel } from '@/lib/scoring';
import type { GlobalInstructions, IndustryInsight } from '@/lib/kv';

// ─── Auth ─────────────────────────────────────────────────────────────────────

function AuthGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.trim()) {
      setError('Bitte Passwort eingeben.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw.trim() }),
      });
      const data = await res.json() as { valid?: boolean; error?: string };
      if (data.valid) {
        onAuth(pw.trim());
      } else {
        setError(data.error === 'Not configured' ? 'Admin-Passwort nicht konfiguriert.' : 'Falsches Passwort.');
      }
    } catch {
      setError('Verbindungsfehler. Bitte nochmal versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">WhatsApp Coach</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(''); }}
            placeholder="Admin-Passwort"
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Prüfe...' : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Example Form Types ───────────────────────────────────────────────────────

interface ExampleFormData {
  industry: Industry;
  occasion: string;
  message: string;
  quickReplyPairs: QuickReplyPair[];
  sent: string;
  opened: string;
  responded: string;
  notes: string;
}

const emptyForm = (): ExampleFormData => ({
  industry: 'autohaus',
  occasion: '',
  message: '',
  quickReplyPairs: [{ button: '', autoResponse: '' }],
  sent: '0',
  opened: '0',
  responded: '0',
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

    let pairs: QuickReplyPair[] = [];
    if (initial.quickReplyPairs?.length) {
      pairs = initial.quickReplyPairs;
    } else if (initial.quick_replies?.length) {
      pairs = initial.quick_replies.map((btn, idx) => ({
        button: btn,
        autoResponse: initial.auto_responses?.[idx] ?? '',
      }));
    }
    if (!pairs.length) pairs = [{ button: '', autoResponse: '' }];

    const s = initial.stats;
    return {
      industry: initial.industry,
      occasion: initial.occasion,
      message: initial.message,
      quickReplyPairs: pairs,
      sent: String(s.sent ?? s.sentCount ?? 0),
      opened: String(s.opened ?? 0),
      responded: String(s.responded ?? 0),
      notes: s.notes,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updatePair = (idx: number, field: keyof QuickReplyPair, value: string | number | undefined) => {
    setForm((f) => {
      const pairs = [...f.quickReplyPairs];
      pairs[idx] = { ...pairs[idx], [field]: value };
      return { ...f, quickReplyPairs: pairs };
    });
  };

  const addPair = () => {
    if (form.quickReplyPairs.length >= 3) return;
    setForm((f) => ({ ...f, quickReplyPairs: [...f.quickReplyPairs, { button: '', autoResponse: '' }] }));
  };

  const removePair = (idx: number) => {
    if (form.quickReplyPairs.length <= 1) return;
    setForm((f) => ({ ...f, quickReplyPairs: f.quickReplyPairs.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.occasion.trim() || !form.message.trim()) {
      setError('Anlass und Nachricht sind Pflichtfelder.');
      return;
    }
    setSaving(true);
    setError('');

    const pairs = form.quickReplyPairs.filter((p) => p.button.trim());
    const totalClicks = pairs.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const stats = {
      sent: parseInt(form.sent || '0', 10),
      opened: parseInt(form.opened || '0', 10),
      responded: totalClicks > 0 ? totalClicks : parseInt(form.responded || '0', 10),
      notes: form.notes,
    };

    const payload = {
      industry: form.industry,
      occasion: form.occasion.trim(),
      message: form.message.trim(),
      quickReplyPairs: pairs,
      quick_replies: pairs.map((p) => p.button),
      auto_responses: pairs.map((p) => p.autoResponse),
      stats,
    };

    try {
      let res: Response;
      if (initial) {
        res = await fetch(`/api/examples/${initial.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/examples', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json() as { error?: string };
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

  const totalClicks = form.quickReplyPairs.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const autoResponded = totalClicks > 0 ? totalClicks : null;
  const statsPreview = {
    sent: parseInt(form.sent || '0', 10),
    opened: parseInt(form.opened || '0', 10),
    responded: autoResponded !== null ? autoResponded : parseInt(form.responded || '0', 10),
    notes: form.notes,
  };
  const previewScore = calculateScore(statsPreview);
  const previewLabel = getScoreLabel(previewScore);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 text-lg">
            {initial ? 'Beispiel bearbeiten' : 'Neues Beispiel'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Branche */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Branche</label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value as Industry })}
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.id} value={ind.id}>{ind.icon} {ind.label}</option>
              ))}
            </select>
          </div>

          {/* Anlass */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Anlass *</label>
            <input
              type="text"
              value={form.occasion}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              placeholder="z.B. Frühlingscheck, Mittagsmenü"
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Nachricht */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Nachricht *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              placeholder="Die WhatsApp-Nachricht..."
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
            />
          </div>

          {/* Quick-Reply Paare */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-2 block">
              Quick-Reply Paare ({form.quickReplyPairs.length}/3)
            </label>
            <div className="space-y-3">
              {form.quickReplyPairs.map((pair, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 font-medium w-4">#{idx + 1}</span>
                    <input
                      type="text"
                      value={pair.button}
                      onChange={(e) => updatePair(idx, 'button', e.target.value.slice(0, 20))}
                      placeholder="Button-Text (max 20 Zeichen)"
                      maxLength={20}
                      className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                    />
                    <span className="text-xs text-gray-400 w-8 text-right">{pair.button.length}/20</span>
                    {form.quickReplyPairs.length > 1 && (
                      <button
                        onClick={() => removePair(idx)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none ml-1"
                        title="Paar entfernen"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <textarea
                    value={pair.autoResponse}
                    onChange={(e) => updatePair(idx, 'autoResponse', e.target.value)}
                    rows={2}
                    placeholder="Automatische Antwort auf Button-Klick..."
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500 resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Klicks:</label>
                    <input
                      type="number"
                      min="0"
                      value={pair.clicks ?? ''}
                      onChange={(e) => updatePair(idx, 'clicks', e.target.value === '' ? undefined : parseInt(e.target.value))}
                      placeholder="0"
                      className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-900 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
            {form.quickReplyPairs.length < 3 && (
              <button
                onClick={addPair}
                className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                + Weiteres Quick-Reply Paar hinzufügen
              </button>
            )}
          </div>

          {/* Stats */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-2 block">
              Performance-Daten
              {previewScore > 0 && (
                <span className={`ml-2 ${previewLabel.color}`}>→ Score: {previewLabel.label} ({previewScore})</span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Verschickt</label>
                <input
                  type="number"
                  min="0"
                  value={form.sent}
                  onChange={(e) => setForm({ ...form, sent: e.target.value })}
                  placeholder="150"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Geöffnet</label>
                <input
                  type="number"
                  min="0"
                  value={form.opened}
                  onChange={(e) => setForm({ ...form, opened: e.target.value })}
                  placeholder="127"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  💬 Geantwortet
                  {autoResponded !== null && (
                    <span className="ml-2 text-green-600 text-xs">(auto: {autoResponded})</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  value={autoResponded !== null ? autoResponded : form.responded}
                  readOnly={autoResponded !== null}
                  onChange={(e) => { if (autoResponded === null) setForm(f => ({ ...f, responded: e.target.value })); }}
                  placeholder="45"
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white ${autoResponded !== null ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
                {autoResponded !== null && (
                  <p className="text-xs text-gray-400 mt-1">Automatisch aus Button-Klicks berechnet</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Notizen</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optionale Notizen..."
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KI-Einstellungen Tab ─────────────────────────────────────────────────────

function AISettingsTab({ adminPw }: { adminPw: string }) {
  const [industry, setIndustry] = useState<Industry>('autohaus');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [globalInstructions, setGlobalInstructions] = useState('');
  const [insight, setInsight] = useState<IndustryInsight | null>(null);
  const [globalInsight, setGlobalInsight] = useState<IndustryInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successGlobal, setSuccessGlobal] = useState(false);
  const [error, setError] = useState('');

  // Load global instructions once on mount
  const loadGlobalInstructions = useCallback(async () => {
    try {
      const res = await fetch('/api/instructions/global');
      const data = await res.json() as { instructions?: GlobalInstructions | null };
      setGlobalInstructions(data.instructions?.additionalInstructions ?? '');
    } catch {
      // ignore
    }
  }, []);

  // Load global cross-industry insight on mount
  const loadGlobalInsight = useCallback(async () => {
    try {
      const res = await fetch('/api/insights?industry=global');
      const data = await res.json() as { insight?: IndustryInsight | null };
      setGlobalInsight(data.insight ?? null);
    } catch {
      // ignore
    }
  }, []);

  const loadInstructions = useCallback(async (ind: Industry) => {
    setLoading(true);
    setError('');
    try {
      const instrRes = await fetch(`/api/instructions?industry=${ind}`);
      const instrData = await instrRes.json() as { instructions?: IndustryInstructions | null };
      if (instrData.instructions) {
        setAdditionalInstructions(instrData.instructions.additionalInstructions ?? '');
      } else {
        setAdditionalInstructions('');
      }
    } catch {
      setError('Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load insight for selected industry from the insights endpoint
  const loadInsight = useCallback(async (ind: Industry) => {
    try {
      const res = await fetch(`/api/insights?industry=${ind}`);
      const data = await res.json() as { insight?: IndustryInsight | null };
      setInsight(data.insight ?? null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadGlobalInstructions();
    loadGlobalInsight();
  }, [loadGlobalInstructions, loadGlobalInsight]);

  useEffect(() => {
    loadInstructions(industry);
    loadInsight(industry);
  }, [industry, loadInstructions, loadInsight]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/instructions', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
        body: JSON.stringify({ industry, schema: '', additionalInstructions }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Fehler beim Speichern.');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    setError('');
    setSuccessGlobal(false);
    try {
      const res = await fetch('/api/instructions/global', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
        body: JSON.stringify({ additionalInstructions: globalInstructions }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Fehler beim Speichern.');
      }
      setSuccessGlobal(true);
      setTimeout(() => setSuccessGlobal(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSavingGlobal(false);
    }
  };

  const triggerAnalysis = async (ind: Industry | undefined) => {
    setAnalyzing(true);
    setError('');
    try {
      const body: { adminPassword: string; industry?: string } = { adminPassword: adminPw };
      if (ind) body.industry = ind;

      const res = await fetch('/api/cron/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok?: boolean; results?: Record<string, string> };
      if (!res.ok) throw new Error('Analyse fehlgeschlagen.');

      if (ind) {
        // Einzelne Branche → Insight nachladen
        const insightRes = await fetch(`/api/insights?industry=${ind}`);
        const insightData = await insightRes.json() as { insight?: IndustryInsight | null };
        if (insightData.insight) {
          setInsight(insightData.insight);
        } else {
          setInsight({ insight: `ℹ️ ${data.results?.[ind] ?? 'Keine Daten'}`, generatedAt: new Date().toISOString(), exampleCount: 0 });
        }
      } else {
        // Alle Branchen + global → beide nachladen
        const [insightRes, globalInsightRes] = await Promise.all([
          fetch(`/api/insights?industry=${industry}`),
          fetch('/api/insights?industry=global'),
        ]);
        const insightData = await insightRes.json() as { insight?: IndustryInsight | null };
        const globalInsightData = await globalInsightRes.json() as { insight?: IndustryInsight | null };
        if (insightData.insight) setInsight(insightData.insight);
        if (globalInsightData.insight) setGlobalInsight(globalInsightData.insight);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei Analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const ind = INDUSTRIES.find((i) => i.id === industry);

  const selectedIndustryLabel = ind?.label ?? industry;

  return (
    <div className="space-y-6">
      {/* 1. Globaler Insight Box (immer oben) */}
      {globalInsight ? (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-sm font-semibold text-indigo-800">
              🌍 Globaler KI-Insight (alle Branchen)
            </span>
            <span className="text-xs text-indigo-500">
              🕐 {new Date(globalInsight.generatedAt).toLocaleString('de-AT')} · {globalInsight.exampleCount} Nachrichten
            </span>
          </div>
          <p className="text-sm text-indigo-700 leading-relaxed whitespace-pre-wrap">{globalInsight.insight}</p>
          <div className="mt-3">
            <button
              onClick={() => triggerAnalysis(undefined)}
              disabled={analyzing}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {analyzing ? '⏳ Analysiert...' : '🌍 Alle Branchen neu analysieren'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Noch kein globaler Insight. Mindestens 2 Branchen mit Daten benötigt.</p>
          <button
            onClick={() => triggerAnalysis(undefined)}
            disabled={analyzing}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {analyzing ? '⏳ Analysiert...' : '🌍 Alle Branchen analysieren'}
          </button>
        </div>
      )}

      {/* 2. Globale KI-Instruktionen Textarea */}
      <div className="bg-white shadow-sm rounded-2xl p-6">
        <label className="text-sm font-semibold text-gray-800 mb-1 block">
          🌍 Globale KI-Instruktionen (für alle Branchen)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Diese Instruktionen gelten für alle Branchen. Branchenspezifische Instruktionen ergänzen diese.
        </p>
        <textarea
          value={globalInstructions}
          onChange={(e) => setGlobalInstructions(e.target.value)}
          rows={4}
          placeholder="z.B. Immer duzen. Keine Preise nennen. Maximal 150 Zeichen..."
          className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 resize-y"
        />
        {successGlobal && <p className="text-green-700 text-sm bg-green-50 p-3 rounded-lg mt-3">✅ Globale Instruktionen gespeichert!</p>}
        <button
          onClick={handleSaveGlobal}
          disabled={savingGlobal}
          className="mt-3 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {savingGlobal ? 'Speichern...' : '💾 Globale Instruktionen speichern'}
        </button>
      </div>

      {/* 3. Separator */}
      <div className="border-t border-gray-200" />

      {/* 4. Branchen-Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {INDUSTRIES.map((i) => (
          <button
            key={i.id}
            onClick={() => setIndustry(i.id as Industry)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              industry === i.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {i.icon} {i.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Lade Einstellungen...</div>
      ) : (
        <div className="space-y-5">
          {/* 5. Branchen-Insight Box */}
          {insight ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="text-sm font-semibold text-blue-800">
                  📊 KI-Lern-Insight ({selectedIndustryLabel})
                </span>
                <span className="text-xs text-blue-500">
                  🕐 {new Date(insight.generatedAt).toLocaleString('de-AT')} · {insight.exampleCount} Beispiele analysiert
                </span>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">{insight.insight}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => triggerAnalysis(industry)}
                  disabled={analyzing}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {analyzing ? '⏳ Läuft...' : '🔄 Neu analysieren'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-gray-500 mb-2">Noch kein Insight vorhanden.</p>
              <button
                onClick={() => triggerAnalysis(industry)}
                disabled={analyzing}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {analyzing ? '⏳ Analysiert...' : '🔄 Jetzt analysieren'}
              </button>
            </div>
          )}

          {/* 6. Zusatz-Instruktionen Textarea (branchenspezifisch) */}
          <div className="bg-white shadow-sm rounded-2xl p-6">
            <label className="text-sm font-semibold text-gray-800 mb-1 block">
              🧠 Zusatz-Instruktionen ({selectedIndustryLabel})
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Branchenspezifisches Wissen, Beispiele, spezielle Regeln, Tonalität etc.
            </p>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={10}
              placeholder="Beispiel: Verwende immer den Vornamen des Kunden. Vermeide aggressive Verkaufssprache..."
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 resize-y"
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          {success && <p className="text-green-700 text-sm bg-green-50 p-3 rounded-lg">✅ Gespeichert!</p>}

          {/* 7. Speichern-Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichern...' : '💾 Instruktionen speichern'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

type TabType = 'examples' | 'stats' | 'ai-settings';

export default function AdminPage() {
  const [adminPw, setAdminPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('examples');
  const [industry, setIndustry] = useState<Industry | 'all'>('all');
  const [examples, setExamples] = useState<MessageExample[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<MessageExample | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [sessionChecked, setSessionChecked] = useState(false);

  // Session-Check beim Mount: Wenn Cookie-Session vorhanden → AuthGate überspringen
  // adminPw bleibt leer – API routes now also accept the session cookie
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((d: { authenticated?: boolean }) => {
        if (!cancelled && d.authenticated) {
          setAuthed(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSessionChecked(true);
      });
    return () => { cancelled = true; };
  }, []);

  const fetchExamples = useCallback(async (pw: string, ind: Industry | 'all' = 'all') => {
    setLoading(true);
    try {
      const industries: Industry[] = ind === 'all'
        ? ['autohaus', 'restaurant', 'fitnessstudio', 'andere']
        : [ind];

      const results = await Promise.all(
        industries.map((i) =>
          fetch(`/api/examples?industry=${i}&limit=50`, {
            credentials: 'include',
            headers: { 'x-admin-password': pw },
          }).then((r) => r.json())
        )
      );

      const all = (results as { examples?: MessageExample[] }[]).flatMap((r) => r.examples ?? []);
      setExamples(all);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuth = (pw: string) => {
    setAdminPw(pw);
    setAuthed(true);
    fetchExamples(pw, 'all');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {
      // ignore
    }
    setAuthed(false);
    setAdminPw('');
    setExamples([]);
    setActiveTab('examples');
    setIndustry('all');
    setShowModal(false);
    setEditTarget(null);
    setDeleteConfirm(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/examples/${id}`, {
        method: 'DELETE',
        credentials: 'include',
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

  // Show loading spinner during session check to prevent AuthGate flash
  if (!sessionChecked && !authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Prüfe Session...</div>
      </div>
    );
  }

  if (!authed) {
    return <AuthGate onAuth={handleAuth} />;
  }

  const filteredExamples = industry === 'all'
    ? examples
    : examples.filter((e) => e.industry === industry);

  const sortedByScore = [...examples].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const TABS: { id: TabType; label: string }[] = [
    { id: 'examples', label: '📚 Beispiele' },
    { id: 'stats', label: '📊 Statistiken' },
    { id: 'ai-settings', label: '🤖 KI-Einstellungen' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">WhatsApp Coach</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-green-700 hover:underline font-medium">← Zurück zur App</a>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0 max-w-5xl mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-gray-900 bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Examples Tab ──────────────────────────────── */}
        {activeTab === 'examples' && (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as Industry | 'all')}
                className="bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              >
                <option value="all">Alle Branchen</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.id}>{ind.icon} {ind.label}</option>
                ))}
              </select>

              <button
                onClick={() => { setEditTarget(null); setShowModal(true); }}
                className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                + Neu erstellen
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Lade Beispiele...</div>
            ) : filteredExamples.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-700 font-medium">Keine Beispiele gefunden.</p>
                <p className="text-sm text-gray-500 mt-1">Erstelle das erste Beispiel mit &ldquo;+ Neu erstellen&rdquo;.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExamples.map((ex) => {
                  const ind = INDUSTRIES.find((i) => i.id === ex.industry);
                  const scoreLabel = getScoreLabel(ex.score ?? 0);
                  const sent = ex.stats.sent ?? ex.stats.sentCount ?? 0;
                  const opened = ex.stats.opened ?? 0;
                  const responded = ex.stats.responded ?? 0;
                  const openPct = sent > 0 ? ((opened / sent) * 100).toFixed(1) : null;
                  const respPct = sent > 0 ? ((responded / sent) * 100).toFixed(1) : null;

                  return (
                    <div key={ex.id} className="bg-white shadow-sm rounded-2xl border border-gray-100 p-4 flex items-start gap-4">
                      <div className="text-2xl flex-shrink-0">{ind?.icon ?? '📌'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                            {ind?.label ?? ex.industry}
                          </span>
                          <span className="font-semibold text-gray-900 text-sm">{ex.occasion}</span>
                          <span className={`text-xs font-semibold ${scoreLabel.color}`}>
                            {scoreLabel.label} ({ex.score ?? 0})
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">{ex.message}</p>
                        {ex.quickReplyPairs?.some(p => (p.clicks || 0) > 0) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {ex.quickReplyPairs.map((p, i) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {p.button}: {p.clicks || 0}x
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          <span>✉️ Verschickt: <strong className="text-gray-800">{sent}</strong></span>
                          <span>📬 Geöffnet: <strong className="text-gray-800">{opened}</strong>{openPct && ` (${openPct}%)`}</span>
                          <span>💬 Geantwortet: <strong className="text-gray-800">{responded}</strong>{respPct && ` (${respPct}%)`}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => { setEditTarget(ex); setShowModal(true); }}
                          className="text-xs text-blue-700 hover:text-blue-900 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                        >
                          ✏️ Edit
                        </button>
                        {deleteConfirm === ex.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(ex.id)}
                              className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                              Löschen?
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-50"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(ex.id)}
                            className="text-xs text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium"
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

        {/* ── Stats Tab ─────────────────────────────────── */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Beste Nachrichten nach Score</h2>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Lade Daten...</div>
            ) : sortedByScore.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Noch keine Daten vorhanden.</div>
            ) : (
              <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs">Branche</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs">Anlass</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs hidden sm:table-cell">Nachricht</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 text-xs">Verschickt</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 text-xs">Geöffnet</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 text-xs">Geantwortet</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 text-xs">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByScore.map((ex, i) => {
                      const ind = INDUSTRIES.find((ii) => ii.id === ex.industry);
                      const scoreLabel = getScoreLabel(ex.score ?? 0);
                      const sent = ex.stats.sent ?? ex.stats.sentCount ?? 0;
                      const opened = ex.stats.opened ?? 0;
                      const responded = ex.stats.responded ?? 0;
                      const openPct = sent > 0 ? ((opened / sent) * 100).toFixed(1) : null;
                      const respPct = sent > 0 ? ((responded / sent) * 100).toFixed(1) : null;

                      return (
                        <tr key={ex.id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-base mr-1">{ind?.icon}</span>
                            <span className="text-xs text-gray-600">{ind?.label}</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{ex.occasion}</td>
                          <td className="px-4 py-3 text-gray-600 hidden sm:table-cell max-w-xs">
                            <span className="truncate block">{ex.message.substring(0, 60)}…</span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{sent}</td>
                          <td className="px-4 py-3 text-right">
                            {openPct ? (
                              <span className={Number(openPct) >= 80 ? 'text-green-700 font-bold' : 'text-gray-700'}>
                                {opened} ({openPct}%)
                              </span>
                            ) : <span className="text-gray-300">–</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {respPct ? (
                              <span className={Number(respPct) >= 30 ? 'text-green-700 font-bold' : 'text-gray-700'}>
                                {responded} ({respPct}%)
                              </span>
                            ) : <span className="text-gray-300">–</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${scoreLabel.color}`}>{scoreLabel.label} ({ex.score ?? 0})</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── AI Settings Tab ───────────────────────────── */}
        {activeTab === 'ai-settings' && (
          <AISettingsTab adminPw={adminPw} />
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
