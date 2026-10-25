'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';

interface SelectedArea {
  area: string;
  percent: number;
  score: number;
}

interface FormState {
  selectedAreas: SelectedArea[];
  sorenessLevel: string;
  activeMoodTags: string[];
  activeModifiers: string[];
  manualMoodOverride: number | null;
  notes: string;
}

const ALL_ANATOMY = [
  'Right Lumbar', 'Left Lumbar', 'Neck / Cervical', 'Right Shoulder', 'Sciatica', 'Thoracic',
  'Scapula', 'Right Ankle', 'Right Knee', 'Left Knee', 'Right Hip'
];

const MOOD_TAGS = [
  { mood: 'Happy', emoji: '😊', weight: 2 },
  { mood: 'OK', emoji: '🙂', weight: 1 },
  { mood: 'Calm', emoji: '😌', weight: 1 },
  { mood: 'Frustrated', emoji: '😤', weight: -1 },
  { mood: 'Sad', emoji: '😔', weight: -2 },
  { mood: 'Anxious', emoji: '😰', weight: -2 },
];

const SORENESS_LEVELS = [
  { label: 'None', weight: 0 },
  { label: 'Mild', weight: -1 },
  { label: 'Moderate', weight: -2 },
  { label: 'Severe', weight: -3 },
  { label: 'Extreme', weight: -4 },
];

const MODIFIERS = [
  { name: 'Hydrotherapy', label: 'Hydro (+2)', weight: 2, type: 'therapy' },
  { name: 'TENS Machine', label: 'TENS (+2)', weight: 2, type: 'therapy' },
  { name: 'Meditate', label: 'Meditate (+1)', weight: 1, type: 'therapy' },
  { name: 'Yoga', label: 'Yoga (+1)', weight: 1, type: 'therapy' },
  { name: 'Heat Pack', label: 'Heat Pack (+1)', weight: 1, type: 'therapy' },
  { name: 'Cupping', label: 'Cupping (+1)', weight: 1, type: 'therapy' },
  { name: 'Massage Gun', label: 'Massage Gun (+1)', weight: 1, type: 'therapy' },
  { name: 'Chiro', label: 'Chiro (+1)', weight: 1, type: 'therapy' },
  { name: 'Walking', label: 'Walking (-2)', weight: -2, type: 'aggravator' },
  { name: 'Chores', label: 'Chores (-2)', weight: -2, type: 'aggravator' },
  { name: 'Big Day', label: 'Big Day (-3)', weight: -3, type: 'aggravator' },
];

const NOTE_CHIPS = [
  'Morning stiffness', 'Desk fatigue', 'Weather flare', 'Post-walk', 'Cold exposure',
  'Long drive', 'Overexertion', 'Rested well', 'Poor sleep', 'Post-hydro',
  'TENS active', 'Heat pack applied', 'Cupping', 'Massage gun', 'Chiro visit',
  'Stretches/Yoga done', 'Meditated'
];

const INITIAL_STATE: FormState = {
  selectedAreas: [
    { area: 'Right Lumbar', percent: 75, score: 7.5 },
    { area: 'Neck / Cervical', percent: 25, score: 5.0 },
  ],
  sorenessLevel: 'Mild',
  activeMoodTags: ['Calm'],
  activeModifiers: [],
  manualMoodOverride: null,
  notes: 'Post-morning hydrotherapy stiffness in lumbar; neck mobility improving.',
};

export default function TelegramPainFormPage() {
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE);
  const [standardRotation, setStandardRotation] = useState<'A' | 'B'>('A');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  // Expand Telegram WebApp if inside Telegram
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      try {
        (window as any).Telegram.WebApp.ready();
        (window as any).Telegram.WebApp.expand();
      } catch (e) {
        console.warn('Telegram WebApp init warning:', e);
      }
    }
    loadRecentLogs();
  }, []);

  const loadRecentLogs = async () => {
    try {
      const res = await fetch('/api/v1/pain/log');
      if (res.ok) {
        const json = await res.json();
        if (json.logs && Array.isArray(json.logs)) {
          setTodayLogs(json.logs.slice(0, 5));
        }
      }
    } catch {
      // Best effort load
    }
  };

  const totalPercent = formState.selectedAreas.reduce((sum, s) => sum + Number(s.percent), 0);

  // Compute Mood Score (0-10)
  const computeMoodScore = (): number => {
    if (formState.manualMoodOverride !== null) {
      return Number(formState.manualMoodOverride.toFixed(1));
    }
    let score = 5.0; // Base 5.0
    formState.activeMoodTags.forEach((tag) => {
      const found = MOOD_TAGS.find((m) => m.mood === tag);
      if (found) score += found.weight;
    });
    const soreness = SORENESS_LEVELS.find((s) => s.label === formState.sorenessLevel);
    if (soreness) score += soreness.weight;

    formState.activeModifiers.forEach((mod) => {
      const found = MODIFIERS.find((m) => m.name === mod);
      if (found) score += found.weight;
    });

    return Math.max(0, Math.min(10, Number(score.toFixed(1))));
  };

  const currentMoodScore = computeMoodScore();

  const getMoodLabel = (score: number): string => {
    if (score >= 8) return 'Happy';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Calm';
    if (score >= 2) return 'Tired';
    return 'Flare';
  };

  const currentMoodLabel = getMoodLabel(currentMoodScore);

  const appendNoteText = (text: string) => {
    setFormState((prev) => {
      const cur = prev.notes.trim();
      if (!cur) return { ...prev, notes: text };
      if (cur.toLowerCase().includes(text.toLowerCase())) return prev;
      return { ...prev, notes: `${cur}; ${text}` };
    });
  };

  const toggleArea = (areaName: string) => {
    setFormState((prev) => {
      const exists = prev.selectedAreas.some((s) => s.area === areaName);
      if (exists) {
        if (prev.selectedAreas.length <= 1) {
          showStatus('You must have at least 1 pain area selected.');
          return prev;
        }
        const updated = prev.selectedAreas.filter((s) => s.area !== areaName);
        return { ...prev, selectedAreas: autoBalance(updated) };
      } else {
        if (prev.selectedAreas.length >= 3) {
          showStatus('Maximum 3 pain areas can be selected at a time.');
          return prev;
        }
        const updated = [...prev.selectedAreas, { area: areaName, percent: 10, score: 5.0 }];
        return { ...prev, selectedAreas: autoBalance(updated) };
      }
    });
  };

  const autoBalance = (areas: SelectedArea[]): SelectedArea[] => {
    if (areas.length === 1) return [{ ...areas[0], percent: 100 }];
    if (areas.length === 2) return [{ ...areas[0], percent: 75 }, { ...areas[1], percent: 25 }];
    if (areas.length === 3) return [{ ...areas[0], percent: 70 }, { ...areas[1], percent: 20 }, { ...areas[2], percent: 10 }];
    return areas;
  };

  const adjustPercent = (areaName: string, delta: number) => {
    setFormState((prev) => {
      const currentTotal = prev.selectedAreas.reduce((sum, s) => sum + Number(s.percent), 0);
      const target = prev.selectedAreas.find((s) => s.area === areaName);
      if (!target) return prev;

      const maxAllowed = 100 - (currentTotal - target.percent);
      let nextVal = target.percent;
      if (delta > 0) nextVal = Math.min(maxAllowed, target.percent + delta);
      else nextVal = Math.max(5, target.percent + delta);
      nextVal = Math.floor(nextVal / 5) * 5;

      return {
        ...prev,
        selectedAreas: prev.selectedAreas.map((s) => (s.area === areaName ? { ...s, percent: nextVal } : s)),
      };
    });
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Stage Preset
  const stagePreset = (presetKey: string) => {
    let targetAreas: SelectedArea[] = [];
    let noteText = '';
    let sorenessLevel = 'None';
    let activeMoodTags: string[] = [];
    let activeModifiers: string[] = [];

    if (presetKey === 'standard') {
      const nextRot = standardRotation === 'A' ? 'B' : 'A';
      setStandardRotation(nextRot);
      if (nextRot === 'A') {
        targetAreas = [
          { area: 'Right Lumbar', percent: 70, score: 7.5 },
          { area: 'Right Ankle', percent: 15, score: 5.0 },
          { area: 'Thoracic', percent: 15, score: 5.0 },
        ];
        noteText = 'Standard check-in (70% lumbar 7.5, 15% ankle 5.0, 15% thoracic 5.0)';
      } else {
        targetAreas = [
          { area: 'Right Lumbar', percent: 70, score: 7.5 },
          { area: 'Right Knee', percent: 15, score: 5.0 },
          { area: 'Neck / Cervical', percent: 15, score: 5.0 },
        ];
        noteText = 'Standard check-in (70% lumbar 7.5, 15% knee 5.0, 15% neck 5.0)';
      }
      sorenessLevel = 'Mild';
      activeMoodTags = ['OK'];
    } else if (presetKey === 'hydro') {
      targetAreas = [
        { area: 'Right Lumbar', percent: 75, score: 6.0 },
        { area: 'Neck / Cervical', percent: 25, score: 4.5 },
      ];
      sorenessLevel = 'Mild';
      activeMoodTags = ['Calm'];
      activeModifiers = ['Hydrotherapy'];
      noteText = 'Good hydrotherapy session, water decompression relief';
    } else if (presetKey === 'big_day') {
      targetAreas = [
        { area: 'Right Lumbar', percent: 70, score: 8.0 },
        { area: 'Right Knee', percent: 20, score: 7.5 },
        { area: 'Thoracic', percent: 10, score: 7.0 },
      ];
      sorenessLevel = 'Severe';
      activeMoodTags = ['Frustrated'];
      activeModifiers = ['Big Day'];
      noteText = 'Big Day: heavy physical exertion, cumulative loading flare';
    } else if (presetKey === 'thoracic') {
      targetAreas = [
        { area: 'Thoracic', percent: 70, score: 7.5 },
        { area: 'Neck / Cervical', percent: 15, score: 7.5 },
        { area: 'Scapula', percent: 15, score: 7.5 },
      ];
      sorenessLevel = 'Moderate';
      activeMoodTags = ['OK'];
      noteText = 'Thoracic strain & fatigue (70% thoracic, 15% neck, 15% scapula @ 7.5)';
    } else if (presetKey === 'sciatica') {
      targetAreas = [{ area: 'Sciatica', percent: 100, score: 9.5 }];
      sorenessLevel = 'Extreme';
      activeMoodTags = ['Frustrated'];
      noteText = 'Sciatica pain attack flare, sharp radiating nerve pain';
    } else if (presetKey === 'post_walk') {
      targetAreas = [
        { area: 'Right Lumbar', percent: 70, score: 7.5 },
        { area: 'Right Knee', percent: 30, score: 6.5 },
      ];
      sorenessLevel = 'Moderate';
      activeMoodTags = ['Frustrated'];
      activeModifiers = ['Walking'];
      noteText = 'Post-walk loading flare, lumbar and lower extremity fatigue';
    } else if (presetKey === 'morning_stiffness') {
      targetAreas = [
        { area: 'Right Lumbar', percent: 60, score: 7.0 },
        { area: 'Thoracic', percent: 40, score: 6.5 },
      ];
      sorenessLevel = 'Moderate';
      activeMoodTags = ['OK'];
      noteText = 'Severe morning stiffness, slow mobility';
    } else if (presetKey === 'neck_shoulder') {
      targetAreas = [
        { area: 'Neck / Cervical', percent: 60, score: 7.5 },
        { area: 'Right Shoulder', percent: 40, score: 6.5 },
      ];
      sorenessLevel = 'Moderate';
      activeMoodTags = ['Frustrated'];
      noteText = 'Cervical/trapezius spasm, guarding';
    } else if (presetKey === 'white_fingers') {
      targetAreas = [
        { area: 'Neck / Cervical', percent: 50, score: 7.5 },
        { area: 'Sciatica', percent: 50, score: 7.0 },
      ];
      sorenessLevel = 'Moderate';
      activeMoodTags = ['Anxious'];
      noteText = 'Index fingertip pallor and numbness on cold exposure, radicular flare';
    } else if (presetKey === 'rest_day') {
      targetAreas = [{ area: 'Right Lumbar', percent: 100, score: 3.5 }];
      sorenessLevel = 'None';
      activeMoodTags = ['Calm', 'Happy'];
      noteText = 'Rest day, managed baseline pain';
    }

    setFormState((prev) => ({
      ...prev,
      selectedAreas: targetAreas,
      sorenessLevel,
      activeMoodTags,
      activeModifiers,
      manualMoodOverride: null,
      notes: noteText || prev.notes,
    }));

    showStatus(`Staged preset: ${presetKey.replace(/_/g, ' ').toUpperCase()}`);
  };

  // Submit
  const handleSavePainLog = async () => {
    if (totalPercent !== 100) {
      showStatus(`Location percentages must total 100% (currently ${totalPercent}%)`);
      return;
    }

    setIsSubmitting(true);

    const weightedPainSum = formState.selectedAreas.reduce((sum, s) => sum + s.score * s.percent, 0);
    const overallScore = totalPercent > 0 ? Number((weightedPainSum / totalPercent).toFixed(1)) : 5.0;

    const generators = formState.selectedAreas.map((s) => {
      const lower = s.area.toLowerCase();
      let side = 'unspecified';
      if (lower.includes('right')) side = 'right';
      else if (lower.includes('left')) side = 'left';

      let area = 'lumbar';
      if (lower.includes('sciatica')) area = 'sciatica';
      else if (lower.includes('scapula')) area = 'scapula';
      else if (lower.includes('lumbar')) area = 'lumbar';
      else if (lower.includes('cervical') || lower.includes('neck')) area = 'cervical';
      else if (lower.includes('thoracic') || lower.includes('mid-back')) area = 'thoracic';
      else if (lower.includes('ankle')) area = 'ankle';
      else if (lower.includes('knee')) area = 'knee';
      else if (lower.includes('shoulder')) area = 'shoulder';
      else if (lower.includes('hip')) area = 'hip';

      return {
        area,
        side,
        percentage: s.percent,
        pain_score: s.score,
      };
    });

    const payload = {
      pain_level: overallScore,
      score: overallScore,
      generators,
      locations: generators,
      pain_notes: formState.notes,
      mood_level: currentMoodScore,
      mood: currentMoodLabel,
      mood_notes: formState.notes,
    };

    try {
      const res = await fetch('/api/v1/pain/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details?.join(', ') || err.error || 'Failed to save pain check-in');
      }

      showStatus(`Pain log saved! Overall: ${overallScore}/10 (${currentMoodLabel})`);
      loadRecentLogs();

      // If running inside Telegram WebApp, close the view
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        setTimeout(() => {
          try {
            (window as any).Telegram.WebApp.close();
          } catch (e) {
            console.warn('Telegram WebApp close error:', e);
          }
        }, 1200);
      }
    } catch (e: any) {
      showStatus(e.message || 'Error submitting check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedNames = formState.selectedAreas.map((s) => s.area);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div style={{ minHeight: '100vh', background: '#090d16', color: '#f1f5f9', padding: '16px 12px 60px 12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
          
          {/* Header */}
          <header style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#00f0ff', margin: 0 }}>
                Log Pain & Symptom Check-in
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '3px 0 0 0' }}>
                Rumble OS Live Medical Tracking | Wangaratta VIC
              </p>
            </div>
            {typeof window !== 'undefined' && (window as any).Telegram?.WebApp && (
              <button
                type="button"
                onClick={() => {
                  try {
                    (window as any).Telegram.WebApp.close();
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#cbd5e1',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            )}
          </header>

          {/* Toast / Notification Banner */}
          {statusMessage && (
            <div style={{
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {statusMessage}
            </div>
          )}

          {/* 2-Column Responsive Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            
            {/* LEFT COLUMN: Anatomy Selector + Dynamic Weight/Score Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Anatomy Selection Chips */}
              <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#00f0ff', textTransform: 'uppercase' }}>
                    Select Pain Areas (1 to 3)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#00f0ff', fontWeight: 'bold', background: 'rgba(0, 240, 255, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                    {formState.selectedAreas.length}/3 Selected
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
                  {ALL_ANATOMY.map((area) => {
                    const isSel = selectedNames.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleArea(area)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          userSelect: 'none',
                          background: isSel ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSel ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
                          color: isSel ? '#00f0ff' : '#94a3b8',
                          fontWeight: isSel ? 'bold' : 'normal',
                        }}
                      >
                        {isSel ? '✓ ' : ''}{area}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Selected Area Cards */}
              {formState.selectedAreas.map((slot, idx) => {
                const borderColors = ['#00f0ff', '#a855f7', '#00e676'];
                const color = borderColors[idx % borderColors.length];
                const canStepUp = totalPercent < 100;
                const canStepDown = slot.percent > 5;

                return (
                  <div
                    key={slot.area}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      borderLeft: `4px solid ${color}`,
                      borderRadius: '10px',
                      padding: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color, fontSize: '0.88rem' }}>
                        Section {idx + 1}: {slot.area}
                      </strong>
                      {formState.selectedAreas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => toggleArea(slot.area)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(255, 61, 0, 0.4)',
                            color: '#ff6e40',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Deselect
                        </button>
                      )}
                    </div>

                    {/* Steppers & Pain Score */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px', alignItems: 'center', background: 'rgba(0, 0, 0, 0.25)', padding: '10px', borderRadius: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Pain % Weight
                        </label>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '6px', padding: '2px 4px', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => adjustPercent(slot.area, -5)}
                            disabled={!canStepDown}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#00f0ff',
                              width: '26px',
                              height: '26px',
                              borderRadius: '4px',
                              cursor: canStepDown ? 'pointer' : 'not-allowed',
                              fontWeight: 'bold',
                              opacity: canStepDown ? 1 : 0.4,
                            }}
                          >
                            ▼
                          </button>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#00e676', minWidth: '42px', textAlign: 'center' }}>
                            {slot.percent}%
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustPercent(slot.area, 5)}
                            disabled={!canStepUp}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#00f0ff',
                              width: '26px',
                              height: '26px',
                              borderRadius: '4px',
                              cursor: canStepUp ? 'pointer' : 'not-allowed',
                              fontWeight: 'bold',
                              opacity: canStepUp ? 1 : 0.4,
                            }}
                          >
                            ▲
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span>Pain Score (0–10)</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              inputMode="decimal"
                              value={slot.score}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const clamped = isNaN(val) ? 0 : Math.max(0, Math.min(10, Number(val.toFixed(1))));
                                setFormState((prev) => ({
                                  ...prev,
                                  selectedAreas: prev.selectedAreas.map((s) => (s.area === slot.area ? { ...s, score: clamped } : s)),
                                }));
                              }}
                              style={{
                                width: '48px',
                                padding: '1px 3px',
                                textAlign: 'right',
                                fontWeight: 'bold',
                                color: '#ff3d00',
                                background: 'rgba(0, 0, 0, 0.5)',
                                border: '1px solid rgba(255, 61, 0, 0.4)',
                                borderRadius: '4px',
                                fontSize: '0.82rem',
                              }}
                            />
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>/10</span>
                          </div>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={slot.score}
                          onChange={(e) => {
                            const val = Number(parseFloat(e.target.value).toFixed(1));
                            setFormState((prev) => ({
                              ...prev,
                              selectedAreas: prev.selectedAreas.map((s) => (s.area === slot.area ? { ...s, score: val } : s)),
                            }));
                          }}
                          style={{ width: '100%', accentColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total Balance Status */}
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.82rem' }}>
                  <span>Total Allocation: </span>
                  <strong style={{ color: totalPercent === 100 ? '#00e676' : '#ff3d00' }}>
                    {totalPercent}% {totalPercent === 100 ? '(Balanced ✓)' : `(${100 - totalPercent}% remaining)`}
                  </strong>
                </div>
                {totalPercent !== 100 && (
                  <button
                    type="button"
                    onClick={() => setFormState((prev) => ({ ...prev, selectedAreas: autoBalance(prev.selectedAreas) }))}
                    style={{
                      background: 'rgba(0, 240, 255, 0.15)',
                      border: '1px solid #00f0ff',
                      color: '#00f0ff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Auto-Balance 100%
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Staging Presets, Mood Model, Soreness, Modifiers & Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderTop: '3px solid #00f0ff', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 1. Staging Presets (9 Clinical Presets + Big Day) */}
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 'bold', color: '#00f0ff', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Staging Presets (Loads Form - Click Save below)</span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 'normal' }}>10 Presets</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    
                    {/* Standard */}
                    <button
                      type="button"
                      onClick={() => stagePreset('standard')}
                      style={{ padding: '6px 4px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid #38bdf8', borderRadius: '6px', color: '#38bdf8', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Standard</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>70% Lumbar &bull; Rotates Joint</div>
                    </button>

                    {/* Hydro */}
                    <button
                      type="button"
                      onClick={() => stagePreset('hydro')}
                      style={{ padding: '6px 4px', background: 'rgba(0, 230, 118, 0.08)', border: '1px solid #00e676', borderRadius: '6px', color: '#00e676', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Hydro</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Relief &bull; Water Decomp</div>
                    </button>

                    {/* Big Day */}
                    <button
                      type="button"
                      onClick={() => stagePreset('big_day')}
                      style={{ padding: '6px 4px', background: 'rgba(255, 82, 82, 0.12)', border: '1px solid #ff5252', borderRadius: '6px', color: '#ff5252', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Big Day</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Exertion 8.0 &bull; Mod -3</div>
                    </button>

                    {/* Thoracic */}
                    <button
                      type="button"
                      onClick={() => stagePreset('thoracic')}
                      style={{ padding: '6px 4px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid #a855f7', borderRadius: '6px', color: '#c084fc', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Thoracic</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>70% Thoracic &bull; 7.5 Pain</div>
                    </button>

                    {/* Sciatica */}
                    <button
                      type="button"
                      onClick={() => stagePreset('sciatica')}
                      style={{ padding: '6px 4px', background: 'rgba(255, 61, 0, 0.12)', border: '1px solid #ff3d00', borderRadius: '6px', color: '#ff6e40', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Sciatica</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>9.5 Pain &bull; 100% Flare</div>
                    </button>

                    {/* Post-Walk */}
                    <button
                      type="button"
                      onClick={() => stagePreset('post_walk')}
                      style={{ padding: '6px 4px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid #f59e0b', borderRadius: '6px', color: '#fbbf24', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Post-Walk</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Loading Flare &bull; Sore -2</div>
                    </button>

                    {/* Morning Stiff */}
                    <button
                      type="button"
                      onClick={() => stagePreset('morning_stiffness')}
                      style={{ padding: '6px 4px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid #06b6d4', borderRadius: '6px', color: '#22d3ee', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Morning Stiff</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Lumbar/Thoracic &bull; Sore -2</div>
                    </button>

                    {/* Neck/Shoulder */}
                    <button
                      type="button"
                      onClick={() => stagePreset('neck_shoulder')}
                      style={{ padding: '6px 4px', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid #ec4899', borderRadius: '6px', color: '#f472b6', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Neck/Shoulder</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Cervical/Trap &bull; 7.0 Pain</div>
                    </button>

                    {/* White Fingers */}
                    <button
                      type="button"
                      onClick={() => stagePreset('white_fingers')}
                      style={{ padding: '6px 4px', background: 'rgba(148, 163, 184, 0.08)', border: '1px solid #94a3b8', borderRadius: '6px', color: '#cbd5e1', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>White Fingers</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Cold Triggered &bull; Pallor</div>
                    </button>

                    {/* Rest Day */}
                    <button
                      type="button"
                      onClick={() => stagePreset('rest_day')}
                      style={{ padding: '6px 4px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #10b981', borderRadius: '6px', color: '#34d399', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Rest Day</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Baseline 3.5 &bull; Calm</div>
                    </button>
                  </div>
                </div>

                {/* 2. Mood Level & Scale Buttons */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.78rem' }}>
                      Mood Level <strong style={{ color: '#00f0ff' }}>{currentMoodScore.toFixed(1)}/10</strong> ({currentMoodLabel})
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {formState.manualMoodOverride !== null ? 'Manual Override' : `Calculated: ${currentMoodScore.toFixed(1)}`}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: '3px' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const isActive = Math.round(currentMoodScore) === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFormState((prev) => ({ ...prev, manualMoodOverride: num }))}
                          style={{
                            padding: '6px 0',
                            borderRadius: '4px',
                            border: isActive ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                            background: isActive ? '#00f0ff' : 'rgba(255, 255, 255, 0.04)',
                            color: isActive ? '#000' : '#cbd5e1',
                            fontWeight: isActive ? 'bold' : 'normal',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Emotional State Tags (Multi-Select) */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                    Emotional State (Multi-Select Tags)
                  </label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {MOOD_TAGS.map((tag) => {
                      const isAct = formState.activeMoodTags.includes(tag.mood);
                      return (
                        <button
                          key={tag.mood}
                          type="button"
                          onClick={() => {
                            setFormState((prev) => {
                              const exists = prev.activeMoodTags.includes(tag.mood);
                              const updated = exists
                                ? prev.activeMoodTags.filter((t) => t !== tag.mood)
                                : [...prev.activeMoodTags, tag.mood];
                              return { ...prev, activeMoodTags: updated, manualMoodOverride: null };
                            });
                            appendNoteText(tag.mood);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            background: isAct ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: isAct ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: isAct ? '#00f0ff' : '#cbd5e1',
                            fontWeight: isAct ? 'bold' : 'normal',
                          }}
                        >
                          {tag.emoji} {tag.mood} ({tag.weight > 0 ? `+${tag.weight}` : tag.weight})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Physical Soreness Severity (Single-Select) */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                    Physical Soreness Severity
                  </label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {SORENESS_LEVELS.map((s) => {
                      const isAct = formState.sorenessLevel === s.label;
                      return (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => {
                            setFormState((prev) => ({ ...prev, sorenessLevel: s.label, manualMoodOverride: null }));
                            if (s.label !== 'None') appendNoteText(`Soreness: ${s.label}`);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            background: isAct ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: isAct ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: isAct ? '#c084fc' : '#cbd5e1',
                            fontWeight: isAct ? 'bold' : 'normal',
                          }}
                        >
                          {s.label} ({s.weight})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Relief Therapies & Exertion Modifiers */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                    Relief Therapies &amp; Exertion Modifiers
                  </label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {MODIFIERS.map((mod) => {
                      const isAct = formState.activeModifiers.includes(mod.name);
                      const isTherapy = mod.type === 'therapy';
                      const accentColor = isTherapy ? '#00e676' : '#ff5252';
                      return (
                        <button
                          key={mod.name}
                          type="button"
                          onClick={() => {
                            setFormState((prev) => {
                              const exists = prev.activeModifiers.includes(mod.name);
                              const updated = exists
                                ? prev.activeModifiers.filter((m) => m !== mod.name)
                                : [...prev.activeModifiers, mod.name];
                              return { ...prev, activeModifiers: updated, manualMoodOverride: null };
                            });
                            appendNoteText(mod.name);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            background: isAct ? (isTherapy ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 82, 82, 0.2)') : 'rgba(255, 255, 255, 0.04)',
                            border: isAct ? `1px solid ${accentColor}` : `1px solid rgba(255, 255, 255, 0.12)`,
                            color: isAct ? accentColor : (isTherapy ? '#a7f3d0' : '#fca5a5'),
                            fontWeight: isAct ? 'bold' : 'normal',
                          }}
                        >
                          {mod.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                {/* 6. Clinical Notes & Quick Chips */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                    Clinical Notes &amp; Quick Chips
                  </label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {NOTE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => appendNoteText(chip)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#cbd5e1',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={formState.notes}
                    onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '8px',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                    }}
                    placeholder="Notes, triggers, relief observations..."
                  />
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                        try {
                          (window as any).Telegram.WebApp.close();
                        } catch (e) {
                          console.warn(e);
                        }
                      }
                    }}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSavePainLog}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: isSubmitting ? 'rgba(0, 230, 118, 0.4)' : '#ff3d00',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '0.88rem',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save pain log'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Check-ins Section */}
          {todayLogs.length > 0 && (
            <div style={{ marginTop: '20px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#00f0ff', textTransform: 'uppercase' }}>
                  Today&apos;s Check-ins ({todayLogs.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Live Database Feed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayLogs.map((log: any, idx: number) => {
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
                  const locs = Array.isArray(log.locations) ? log.locations.map((l: any) => `${l.area} (${l.percentage ?? l.weight ?? 0}%)`).join(', ') : 'Locations recorded';
                  return (
                    <div
                      key={log.id || idx}
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderLeft: `3px solid ${log.score >= 7 ? '#ff3d00' : '#00e676'}`,
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div>
                        <strong>{dateStr}</strong> &bull; <span style={{ color: log.score >= 7 ? '#ff5252' : '#00e676', fontWeight: 'bold' }}>{log.score}/10</span>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          {locs} {log.notes ? `— ${log.notes}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{log.mood || 'Calm'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
