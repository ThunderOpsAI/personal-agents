'use client';

import React, { useState, useEffect } from 'react';

interface SelectedArea {
  area: string;
  percent: number;
  score: number;
}

interface FormState {
  selectedAreas: SelectedArea[];
  moodScore: number;
  moodLabel: string;
  notes: string;
}

const ALL_ANATOMY = [
  'Right Lumbar', 'Left Lumbar', 'Neck / Cervical', 'Thoracic',
  'Right Ankle', 'Left Ankle', 'Right Knee', 'Left Knee', 'Right Shoulder', 'Right Hip'
];

const INITIAL_STATE: FormState = {
  selectedAreas: [
    { area: 'Right Lumbar', percent: 75, score: 7.5 },
    { area: 'Neck / Cervical', percent: 25, score: 5.0 },
  ],
  moodScore: 6.0,
  moodLabel: 'Calm',
  notes: 'Post-morning hydrotherapy stiffness in lumbar; neck mobility improving.',
};

export default function TelegramPainFormPrototypePage() {
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE);

  const totalPercent = formState.selectedAreas.reduce((sum, s) => sum + Number(s.percent), 0);

  const toggleArea = (areaName: string) => {
    setFormState((prev) => {
      const exists = prev.selectedAreas.some((s) => s.area === areaName);
      if (exists) {
        if (prev.selectedAreas.length <= 1) {
          alert('You must have at least 1 pain area selected.');
          return prev;
        }
        const updated = prev.selectedAreas.filter((s) => s.area !== areaName);
        return { ...prev, selectedAreas: autoBalance(updated) };
      } else {
        if (prev.selectedAreas.length >= 3) {
          alert('Maximum 3 pain areas can be selected at a time.');
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

  const selectedNames = formState.selectedAreas.map((s) => s.area);

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f1f5f9', padding: '24px 16px 100px 16px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '1.6rem', color: '#00f0ff', marginBottom: '6px' }}>
            Telegram Bot Pain Form Prototype
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            Top Area Selector (1–3 Selected) &bull; Dynamic Below Cards (&plusmn;5% Steppers, Score) &bull; Combined RHS Mood & Notes
          </p>
        </header>

        {/* 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* LEFT COLUMN: Top Area Selector + Dynamic Below Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* 1. Top Area Selector */}
            <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#00f0ff' }}>
                  🎯 1. SELECT PAIN AREAS (1 TO 3 MAX)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#00f0ff', fontWeight: 'bold' }}>
                  {formState.selectedAreas.length}/3 Selected
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '8px', marginTop: '10px' }}>
                {ALL_ANATOMY.map((area) => {
                  const isSel = selectedNames.includes(area);
                  return (
                    <div
                      key={area}
                      onClick={() => toggleArea(area)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Dynamically Rendered Selected Area Cards */}
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
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color, fontSize: '0.92rem' }}>
                      Section {idx + 1}: {slot.area}
                    </strong>
                    {formState.selectedAreas.length > 1 && (
                      <button
                        onClick={() => toggleArea(slot.area)}
                        style={{ background: 'none', border: '1px solid rgba(255,61,0,0.4)', color: '#ff6e40', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Deselect
                      </button>
                    )}
                  </div>

                  {/* ±5% Stepper Box + Pain Score */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Pain % Weight</label>
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '8px', padding: '3px 6px', gap: '6px' }}>
                        <button
                          onClick={() => adjustPercent(slot.area, -5)}
                          disabled={!canStepDown}
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#00f0ff', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ▼
                        </button>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00e676', minWidth: '48px', textAlign: 'center' }}>
                          {slot.percent}%
                        </span>
                        <button
                          onClick={() => adjustPercent(slot.area, 5)}
                          disabled={!canStepUp}
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#00f0ff', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ▲
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Pain Score (0–10)</span>
                        <strong style={{ color: '#ff3d00' }}>{slot.score}/10</strong>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={slot.score}
                        onChange={(e) => setFormState((prev) => ({
                          ...prev,
                          selectedAreas: prev.selectedAreas.map((s) => (s.area === slot.area ? { ...s, score: Number(e.target.value) } : s)),
                        }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total Balance Status */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>Total Allocation ({formState.selectedAreas.length} area{formState.selectedAreas.length > 1 ? 's' : ''}): </span>
                <strong style={{ color: totalPercent === 100 ? '#00e676' : '#ff3d00' }}>
                  {totalPercent}% {totalPercent === 100 ? '(Balanced ✓)' : `(${100 - totalPercent}% remaining)`}
                </strong>
              </div>
              {totalPercent !== 100 && (
                <button
                  onClick={() => setFormState((prev) => ({ ...prev, selectedAreas: autoBalance(prev.selectedAreas) }))}
                  style={{ background: 'rgba(0,240,255,0.15)', border: '1px solid #00f0ff', color: '#00f0ff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Auto-Balance 100%
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Combined Mood & Notes Panel (No Spoons) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', borderTop: '3px solid #00f0ff', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              
              {/* 1. Mood Score Section */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#00f0ff', marginBottom: '6px' }}>
                  🧠 MOOD SCORE & TONE
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Mood Score (0–10)</span>
                    <strong style={{ color: '#00f0ff' }}>{formState.moodScore}/10 ({formState.moodLabel})</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={formState.moodScore}
                    onChange={(e) => setFormState((prev) => ({ ...prev, moodScore: Number(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
                  {['Calm', 'Good', 'Fatigued', 'Stressed'].map((mood) => (
                    <div
                      key={mood}
                      onClick={() => setFormState((prev) => ({ ...prev, moodLabel: mood }))}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        background: formState.moodLabel === mood ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: formState.moodLabel === mood ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                        color: formState.moodLabel === mood ? '#00f0ff' : '#cbd5e1',
                        fontWeight: formState.moodLabel === mood ? 'bold' : 'normal',
                      }}
                    >
                      {mood === 'Calm' ? '😌 Calm' : mood === 'Good' ? '🙂 Good' : mood === 'Fatigued' ? '😴 Tired' : '😣 Flare'}
                    </div>
                  ))}
                </div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.08)', margin: 0 }} />

              {/* 2. Notes Section */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#00e676', marginBottom: '6px' }}>
                  📝 CLINICAL NOTES
                </div>
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {['Morning stiffness', 'Post-hydro', 'Desk fatigue', 'Weather flare'].map((snippet) => (
                    <span
                      key={snippet}
                      onClick={() => setFormState((prev) => ({ ...prev, notes: prev.notes ? `${prev.notes}; ${snippet}` : snippet }))}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      {snippet}
                    </span>
                  ))}
                </div>

                <textarea
                  value={formState.notes}
                  onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', flex: 1, minHeight: '120px', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '8px' }}
                  placeholder="Clinical observations, triggers, and relief notes..."
                />
              </div>

              <button
                onClick={async () => {
                  if (totalPercent !== 100) {
                    alert(`⚠️ Please balance total percentage to 100% (currently ${totalPercent}%).`);
                    return;
                  }

                  const weightedPainSum = formState.selectedAreas.reduce((sum, s) => sum + (s.score * s.percent), 0);
                  const overallScore = totalPercent > 0 ? Number((weightedPainSum / totalPercent).toFixed(1)) : 5.0;

                  const generators = formState.selectedAreas.map(s => {
                    const lower = s.area.toLowerCase();
                    let side = 'unspecified';
                    if (lower.includes('right')) side = 'right';
                    else if (lower.includes('left')) side = 'left';

                    let area = 'lumbar';
                    if (lower.includes('lumbar')) area = 'lumbar';
                    else if (lower.includes('cervical') || lower.includes('neck')) area = 'cervical';
                    else if (lower.includes('thoracic') || lower.includes('mid-back')) area = 'thoracic';
                    else if (lower.includes('ankle')) area = 'ankle';
                    else if (lower.includes('knee')) area = 'knee';
                    else if (lower.includes('shoulder')) area = 'shoulder';
                    else if (lower.includes('hip')) area = 'hip';

                    return { area, side, percentage: s.percent, pain_score: s.score };
                  });

                  try {
                    const res = await fetch('/api/symptoms/log', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        pain_level: overallScore,
                        score: overallScore,
                        generators,
                        locations: generators,
                        pain_notes: formState.notes,
                        mood_level: formState.moodScore,
                        mood: formState.moodLabel,
                        mood_notes: formState.notes,
                      }),
                    });

                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.detail || err.error || 'Failed to save pain check-in');
                    }

                    alert(`✅ Pain check-in saved to live database!\n\nOverall Score: ${overallScore}/10\nAreas: ${formState.selectedAreas.map(s => `${s.area} (${s.percent}%)`).join(', ')}`);

                    // Close Telegram WebApp if running embedded inside Telegram
                    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                      (window as any).Telegram.WebApp.close();
                    }
                  } catch (e: any) {
                    alert(`⚠️ ${e.message || 'Error submitting check-in'}`);
                  }
                }}
                style={{ padding: '14px', background: 'linear-gradient(135deg, #00f0ff, #00e676)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                🚀 Submit Pain Check-in
              </button>
            </div>
          </div>
        </div>

        {/* Real-time State Inspector */}
        <div style={{ marginTop: '20px', padding: '14px', background: '#070b12', border: '1px dashed rgba(0,240,255,0.3)', borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8' }}>
          <strong>Reactive JSON Payload Preview:</strong>
          <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify({
              timestamp: new Date().toISOString(),
              source: 'telegram_bot_pain_form',
              selected_areas_count: formState.selectedAreas.length,
              total_percentage: `${totalPercent}%`,
              pain_locations: formState.selectedAreas.map((s) => ({ location: s.area, weight_percent: s.percent, pain_score: s.score })),
              mood: { score: formState.moodScore, label: formState.moodLabel },
              notes: formState.notes,
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
