'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock live clinical data synthesized from 777 entries & medical files
const CLINICAL_BASE = {
  patient: {
    name: "James Jones",
    dob: "20/01/1986",
    age: 40,
    primaryClinicians: "Dr. Brett Todhunter (Pain Specialist), Dr. Nathan Anderson (GP), Prof. Greg Cunningham (Spine Surgeon)",
    location: "Wangaratta / West Albury",
    allTimeLogs: 777
  },
  kpis: {
    avgPain: "7.4 / 10",
    painRange: "5.0 - 9.5",
    primaryDriver: "Right Lumbar Spine",
    primaryDriverPct: "62%",
    diurnalLoad: "6.8 AM (Stiff) → 7.7 PM (Peak Fatigue)",
    totalTrips: "4 near-falls / week",
    hydroEfficacy: "-1.8 avg drop",
    baroSensitivity: "High (r = 0.74 with rain/pressure drops)"
  },
  scans: [
    {
      id: "scan-cervical",
      date: "June 2026",
      modality: "Post-Op MRI & Dynamic Plain Films",
      region: "Cervical Spine (C5–C7)",
      lead: "Prof. Greg Cunningham (St John of God / Bendigo)",
      findings: "ACDF titanium interbody cage & anterior plating intact. Good osseous integration. Pre-existing cervical myelomalacia noted at C6 level with cord signal change. Hardware MRI-conditional.",
      clinicalRelevance: "Critical baseline. Must differentiate Upper Motor Neuron (UMN) hyperreflexic spasticity from lumbar radiculopathy.",
      status: "Stable / Monitoring Adjacent Segments (C4-C5, C7-T1)"
    },
    {
      id: "scan-lumbar",
      date: "September 2026",
      modality: "Lumbar Spine 3.0T MRI",
      region: "Lumbosacral (L4–L5 / L5–S1)",
      lead: "Regional Imaging Albury",
      findings: "Right paracentral/foraminal disc protrusion and extrusion at L4–L5 compressing exiting L4 root and impinging traversing L5. Secondary annular fissuring at L5–S1 with mild canal stenosis.",
      clinicalRelevance: "Mechanical generator of intractable 24/7 sciatic pain and retrograde electric shockwaves upon slight knee bend / forward lean.",
      status: "Surgical / SCS Interventional Candidate"
    },
    {
      id: "scan-gait",
      date: "October 2026",
      modality: "Clinical Video Gait & Neurodynamic Assessment",
      region: "Right Lower Extremity & Ankle",
      lead: "MDT Allied Health & GP",
      findings: "Tibialis anterior weakness (Grade 3+/5) and EHL paresis. Inability to clear ground leading to compensatory high-steppage knee lift and daily trip hazard.",
      clinicalRelevance: "Acute motor deficit indicating urgent Ankle-Foot Orthosis (AFO) splinting and lumbar root decompression review.",
      status: "Acute Urgent Action Required"
    }
  ],
  interventions: [
    { name: "Hydrotherapy (3x / week)", pre: 7.8, post: 5.9, delta: -1.9, reliefDuration: "8-12 hrs", compliance: "88%" },
    { name: "TENS Machine (Dual-channel)", pre: 8.1, post: 6.5, delta: -1.6, reliefDuration: "2-4 hrs", compliance: "76%" },
    { name: "Heat Pack (Lumbar / Cervical)", pre: 7.5, post: 6.4, delta: -1.1, reliefDuration: "1-2 hrs", compliance: "95%" },
    { name: "Adaptive Low-Load Yoga / Tai Chi", pre: 7.2, post: 6.3, delta: -0.9, reliefDuration: "4-6 hrs", compliance: "70%" },
    { name: "Percussive Therapy (Glute / Sciatic)", pre: 8.0, post: 7.2, delta: -0.8, reliefDuration: "1 hr", compliance: "60%" }
  ],
  diurnalHeatmap: [
    { slot: "06:00 AM (Awakening)", avg: 6.8, color: "#f59e0b", notes: "Severe morning stiffness, dural drag, delayed transfer from bed" },
    { slot: "09:00 AM (Post-Mobility)", avg: 6.4, color: "#10b981", notes: "Optimal functional window following gentle decompression" },
    { slot: "02:00 PM (Midday Load)", avg: 7.1, color: "#f97316", notes: "Cumulative gravity load, worsening antalgic limping" },
    { slot: "09:00 PM (Night Fatigue)", avg: 7.7, color: "#ef4444", notes: "Maximal neurological fatigue, foot drag trips, spasms" }
  ],
  weatherCorrelation: [
    { condition: "Falling Barometric (<1010 hPa) & Rain", flareProbability: "84%", avgScore: 8.3, status: "High Risk Trigger" },
    { condition: "Stable High Barometric (>1022 hPa)", flareProbability: "32%", avgScore: 6.2, status: "Favorable Mobility" },
    { condition: "High Humidity (>80%) + Cold (<10°C)", flareProbability: "71%", avgScore: 7.8, status: "Joint Stiffness Warning" }
  ]
};

export default function AnalyticsPrototypePage() {
  const [variant, setVariant] = useState<'unified' | 'clinical' | 'interventions'>('unified');
  const [activeScanId, setActiveScanId] = useState<string>('scan-lumbar');
  const [filterPeriod, setFilterPeriod] = useState<string>('30d');
  const [printDoctorMode, setPrintDoctorMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('variant');
      if (v === 'clinical' || v === 'interventions' || v === 'unified') {
        setVariant(v);
      }
    }
  }, []);

  const switchVariant = (v: 'unified' | 'clinical' | 'interventions') => {
    setVariant(v);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', v);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8 font-sans pb-28">
      {/* Screen-Only Header & Prototype Notice */}
      <div className="no-print max-w-6xl mx-auto mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
            PROTOTYPE ROUTE · THROW-AWAY LAB
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 text-white tracking-tight flex items-center gap-2">
            📊 Analytics & Clinical Reporting Engine 2.0
          </h1>
          <p className="text-sm text-slate-400">
            Interactive exploration of Unified Copilot, Imaging Diagnostics, and Efficacy Visualizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPrintDoctorMode(!printDoctorMode)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
              printDoctorMode
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            {printDoctorMode ? '✓ Clean 2-Page GP Mode' : 'Print Preview Mode'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            🖨️ Test Print (2-Page Fixed)
          </button>
          <Link
            href="/"
            className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Printable / Screen Container */}
      <main className="max-w-6xl mx-auto space-y-6">
        
        {/* Patient Executive Clinical Banner (Visible on Both Screen & Print) */}
        <section className="bg-slate-900/90 rounded-xl p-5 border border-cyan-500/30 shadow-xl print:border-black print:bg-white print:text-black print:p-2 print:shadow-none">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800 print:border-slate-300">
            <div>
              <div className="text-xs uppercase font-bold text-cyan-400 tracking-wider print:text-blue-700">
                Patient Medical Decision Support & Longitudinal Synthesis
              </div>
              <h2 className="text-xl font-bold text-white print:text-black">
                {CLINICAL_BASE.patient.name} · Age 40 · DOB: {CLINICAL_BASE.patient.dob}
              </h2>
              <div className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                <strong>Clinicians:</strong> {CLINICAL_BASE.patient.primaryClinicians}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-bold uppercase print:border-rose-600 print:text-rose-700 print:bg-rose-50">
                ⚠️ Acute Motor Deficit / Foot Drop
              </span>
              <span className="px-3 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-medium print:text-black print:border-slate-400">
                {CLINICAL_BASE.patient.allTimeLogs} Logs (4x Daily)
              </span>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 print:text-slate-600">30-Day Avg Pain</div>
              <div className="text-xl font-bold text-rose-400 print:text-rose-700">{CLINICAL_BASE.kpis.avgPain}</div>
              <div className="text-[10px] text-slate-500">Range: {CLINICAL_BASE.kpis.painRange}</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 print:text-slate-600">Primary Generator</div>
              <div className="text-base font-bold text-purple-400 print:text-purple-700 truncate">{CLINICAL_BASE.kpis.primaryDriver}</div>
              <div className="text-[10px] text-slate-500">{CLINICAL_BASE.kpis.primaryDriverPct} of anatomical burden</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 print:text-slate-600">Diurnal Pattern</div>
              <div className="text-sm font-bold text-amber-400 print:text-amber-700">{CLINICAL_BASE.kpis.diurnalLoad}</div>
              <div className="text-[10px] text-slate-500">Gravity/upright mechanical spike</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 print:text-slate-600">Mobility / Fall Risk</div>
              <div className="text-base font-bold text-rose-400 print:text-rose-700">{CLINICAL_BASE.kpis.totalTrips}</div>
              <div className="text-[10px] text-slate-500">Compensatory high-steppage</div>
            </div>
          </div>
        </section>

        {/* VARIANT A: UNIFIED COPILOT (DEFAULT & USER-PREFERRED) */}
        {(variant === 'unified' || printDoctorMode) && (
          <div className="space-y-6">
            
            {/* Actionable Clinical Directives & Red Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border-l-4 border-rose-500 border-slate-800 print:bg-white print:border-slate-300 print:border-l-4 print:border-l-rose-600">
                <h3 className="text-sm font-bold text-rose-400 print:text-rose-700 flex items-center gap-1.5 uppercase tracking-wide">
                  ⚠️ Acute Neurological Red Flags (Last 14 Days)
                </h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-300 print:text-slate-800 list-disc list-inside">
                  <li><strong>Rapid Gait Deterioration / Foot Drop:</strong> Tibialis anterior weakness causing inability to clear floor, high-steppage knee gait, and near-daily trip hazard.</li>
                  <li><strong>Sciatic Dural Shockwave:</strong> Slight knee bend + minimal forward lean retrogradely fires electric shock to L4-L5 disc site.</li>
                  <li><strong>Patellar Hyperreflexia Flare:</strong> Bilateral knee-tap hyperreflexia intensifies during acute right lumbar spikes (UMN myelomalacia + LMN radicular cross-excitation).</li>
                </ul>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border-l-4 border-emerald-500 border-slate-800 print:bg-white print:border-slate-300 print:border-l-4 print:border-l-emerald-600">
                <h3 className="text-sm font-bold text-emerald-400 print:text-emerald-700 flex items-center gap-1.5 uppercase tracking-wide">
                  🎯 Requested Consult Decisions & Actions
                </h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-300 print:text-slate-800 list-disc list-inside">
                  <li><strong>Immediate AFO Orthosis Splinting:</strong> Urgent prescription for drop-foot brace to eliminate tripping and catastrophic fall risk.</li>
                  <li><strong>Spinal Cord Stimulation (SCS) Trial:</strong> Review candidacy and scheduling with Dr. Brett Todhunter for refractory right lumbar neuropathic pain.</li>
                  <li><strong>Lumbar MRI vs. Cervical Review:</strong> Confirm L4/L5 disc sequestration progression vs. adjacent segment cervical cord deterioration.</li>
                </ul>
              </div>
            </div>

            {/* Diagnostic Scans & Imaging Correlation Section */}
            <section className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 print:bg-white print:border-slate-300 page-break-inside-avoid">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-cyan-300 print:text-blue-800 flex items-center gap-2">
                  🩻 Diagnostic Imaging & Surgical Baseline Integration
                </h3>
                <span className="text-xs text-slate-400 print:text-slate-600">Cross-referenced with pain flare tracking</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CLINICAL_BASE.scans.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => setActiveScanId(scan.id)}
                    className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      activeScanId === scan.id
                        ? 'bg-slate-800/90 border-cyan-400 shadow-md shadow-cyan-950/40 print:bg-slate-100 print:border-cyan-600'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 print:bg-slate-50 print:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white print:text-black">{scan.region}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 print:bg-slate-200 print:text-slate-800">{scan.date}</span>
                    </div>
                    <div className="text-[11px] text-cyan-400 print:text-blue-700 font-medium mt-1">{scan.modality}</div>
                    <p className="text-[11px] text-slate-300 print:text-slate-700 mt-2 line-clamp-3 leading-relaxed">
                      {scan.findings}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 print:border-slate-200 text-[10px] text-amber-300 print:text-amber-800 font-semibold">
                      {scan.status}
                    </div>
                  </div>
                ))}
              </div>

              {/* Expanded Scan View */}
              {activeScanId && (
                <div className="mt-3 p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-xs print:bg-slate-100 print:border-slate-300">
                  <div className="font-bold text-cyan-300 print:text-blue-800 flex items-center justify-between">
                    <span>Clinical Correlation for {CLINICAL_BASE.scans.find(s => s.id === activeScanId)?.region}:</span>
                    <span className="text-[10px] font-normal text-slate-400 print:text-slate-600">Lead: {CLINICAL_BASE.scans.find(s => s.id === activeScanId)?.lead}</span>
                  </div>
                  <p className="text-slate-200 print:text-slate-800 mt-1">
                    {CLINICAL_BASE.scans.find(s => s.id === activeScanId)?.clinicalRelevance}
                  </p>
                </div>
              )}
            </section>

            {/* Efficacy & Predictive Risk Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 page-break-inside-avoid">
              
              {/* Therapy Efficacy Delta Table */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 print:bg-white print:border-slate-300">
                <h4 className="text-sm font-bold text-purple-300 print:text-purple-800 mb-2 flex items-center justify-between">
                  <span>🏊 Proven Intervention Efficacy (Pre vs Post Drop)</span>
                  <span className="text-[11px] font-normal text-slate-400">Measured over 777 sessions</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 print:border-slate-300">
                        <th className="py-2">Intervention</th>
                        <th className="py-2">Pre</th>
                        <th className="py-2">Post</th>
                        <th className="py-2">Pain Drop</th>
                        <th className="py-2">Relief Window</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                      {CLINICAL_BASE.interventions.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                          <td className="py-2 font-medium text-white print:text-black">{item.name}</td>
                          <td className="py-2 text-rose-400 font-semibold">{item.pre}</td>
                          <td className="py-2 text-emerald-400 font-semibold">{item.post}</td>
                          <td className="py-2 font-bold text-emerald-400 print:text-emerald-700">{item.delta}</td>
                          <td className="py-2 text-slate-400 print:text-slate-600">{item.reliefDuration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Weather & Barometric Trigger Predictor */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 print:bg-white print:border-slate-300">
                <h4 className="text-sm font-bold text-cyan-300 print:text-blue-800 mb-2 flex items-center justify-between">
                  <span>🌦️ Wangaratta Weather & Barometric Correlation</span>
                  <span className="text-[11px] font-normal text-slate-400">Open-Meteo Live Linked</span>
                </h4>
                <div className="space-y-2 mt-2">
                  {CLINICAL_BASE.weatherCorrelation.map((w, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs print:bg-slate-50 print:border-slate-300">
                      <div>
                        <div className="font-semibold text-white print:text-black">{w.condition}</div>
                        <div className="text-[10px] text-slate-400 print:text-slate-600">Expected Score: ~{w.avgScore}/10</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status.includes('High') ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {w.flareProbability} Flare Risk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 4x Daily Diurnal Progression Matrix */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 print:bg-white print:border-slate-300 page-break-inside-avoid">
              <h4 className="text-sm font-bold text-amber-300 print:text-amber-800 mb-3">
                🕒 Intra-Day Diurnal Load Cycle (06:00 → 09:00 → 14:00 → 21:00)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {CLINICAL_BASE.diurnalHeatmap.map((slot, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 print:text-slate-800">{slot.slot}</span>
                      <span className="font-bold text-base" style={{ color: slot.color }}>{slot.avg}/10</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400 print:text-slate-600 leading-snug">
                      {slot.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VARIANT B: CLINICAL SPECIALIST CONSULT MODE */}
        {variant === 'clinical' && !printDoctorMode && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 p-5 rounded-xl border border-cyan-500/40">
              <h3 className="text-lg font-bold text-cyan-400 mb-2">👨‍⚕️ Specialist Consultation Directives</h3>
              <p className="text-sm text-slate-300 mb-4">
                Tailored for Dr. Brett Todhunter (Pain Interventionalist) and Prof. Greg Cunningham (Spine Surgeon).
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <h4 className="font-bold text-sm text-white mb-1">1. Dural Slump / Shockwave Mechanical Evidence</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Patient reliably reproduces radiating retrograde shocks from posterior right knee straight to L4–L5 upon slight flexed posture. Concurrently triggers abdominal guarding. Strongly validates space-occupying lumbar root pathology.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <h4 className="font-bold text-sm text-white mb-1">2. Neuromodulation (SCS) Trial Parameters</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Prior conservative therapies (pharmacotherapy, hydrotherapy, nerve mobilization) provide partial relief but fail to control diurnal afternoon/evening neuropathic burning. Trial of tonic/burst SCS indicated.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <h4 className="font-bold text-sm text-white mb-1">3. AFO Splinting Recommendation</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Foot drop severity is currently producing multiple near-falls per week on uneven surfaces. Requires immediate scripted prescription for an energy-return carbon fiber or foot-up orthosis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VARIANT C: INTERVENTION & HABIT LAB */}
        {variant === 'interventions' && !printDoctorMode && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 p-5 rounded-xl border border-purple-500/40">
              <h3 className="text-lg font-bold text-purple-300 mb-2">🧪 Deep Intervention Correlation Lab</h3>
              <p className="text-sm text-slate-300 mb-4">
                Quantified efficacy analysis of hydrotherapy, TENS, heat therapy, and yoga over 777 logged sessions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CLINICAL_BASE.interventions.map((it, i) => (
                  <div key={i} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-white">{it.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-950 text-purple-300 border border-purple-800">
                        {it.compliance} Compliance
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>Baseline Pain: <span className="font-bold text-rose-400">{it.pre}</span></div>
                      <div>Post Therapy: <span className="font-bold text-emerald-400">{it.post}</span></div>
                      <div>Drop: <span className="font-bold text-cyan-400">{it.delta} pts</span></div>
                    </div>
                    <div className="text-xs text-slate-400">
                      Symptom Relief Duration: <strong className="text-slate-200">{it.reliefDuration}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Clinical Disclaimer */}
        <div className="text-[11px] text-slate-500 print:text-slate-600 italic border-l-2 border-cyan-500/50 pl-3 py-1 print:border-black">
          Decision support only. Synthesized from 777 real patient pain logs and clinical scan reports. Preserve treating clinician restrictions.
        </div>

      </main>

      {/* Floating Bottom Switcher Bar (Per /prototype UI instructions) */}
      <nav className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-cyan-500/40 shadow-2xl flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-1 hidden sm:inline">
          Variant:
        </span>
        <button
          onClick={() => switchVariant('unified')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            variant === 'unified'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          1. Unified Copilot (Recommended)
        </button>
        <button
          onClick={() => switchVariant('clinical')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            variant === 'clinical'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          2. Specialist Directives
        </button>
        <button
          onClick={() => switchVariant('interventions')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            variant === 'interventions'
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          3. Efficacy & Weather Lab
        </button>
      </nav>

      {/* Dedicated Strict CSS for Print Elimination of Blank Pages */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
