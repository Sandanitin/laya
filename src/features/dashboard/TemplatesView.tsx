'use client';

import { Star } from 'lucide-react';

const TEMPLATES = [
  { id: 'tmpl-a3', name: 'A3 Technical Sheet', tag: 'Default', desc: 'Portrait A3 with title block', color: 'hsl(210,60%,24%)' },
  { id: 'tmpl-169', name: '16:9 Presentation', tag: 'Default', desc: 'Landscape widescreen board', color: 'hsl(270,40%,22%)' },
  { id: 'tmpl-a1', name: 'A1 Master Plan', tag: 'Default', desc: 'Large format landscape layout', color: 'hsl(158,50%,22%)' },
  { id: 'tmpl-square', name: 'Square Portfolio', tag: 'Default', desc: '1:1 ratio for social / web', color: 'hsl(30,60%,22%)' },
  { id: 'tmpl-minimal', name: 'Minimal White', tag: 'Saved', desc: 'Clean typography-first layout', color: 'hsl(200,30%,20%)' },
  { id: 'tmpl-dark', name: 'Dark Studio', tag: 'Saved', desc: 'Dark background, neon accents', color: 'hsl(220,22%,14%)' },
];

const STYLE_PRESETS = [
  { id: 'style-nordic', name: 'Nordic Minimal', fills: ['#e2ded6', '#b9b0a3', '#8a7f74', '#f5f2ee'] },
  { id: 'style-brutalist', name: 'Brutalist Concrete', fills: ['#a8a09a', '#7a7470', '#504c4a', '#c8c0ba'] },
  { id: 'style-tropical', name: 'Tropical Palette', fills: ['#4ade80', '#86efac', '#bbf7d0', '#dcfce7'] },
  { id: 'style-terracotta', name: 'Terracotta Warm', fills: ['#d97706', '#f59e0b', '#fcd34d', '#fef3c7'] },
];

export default function TemplatesView() {
  return (
    <main className="flex-1 overflow-y-auto px-10 py-8" style={{ background: 'hsl(var(--bg-void))' }}>
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
          Templates
        </h1>
        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          Board layouts and auto-style presets
        </p>
      </div>

      {/* Board Layouts */}
      <section className="mb-10 fade-up stagger-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'hsl(var(--text-muted))' }}>
          Board Layouts
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              id={`template-${t.id}`}
              className="project-card text-left group"
            >
              <div
                className="h-28 flex items-center justify-center relative overflow-hidden"
                style={{ background: t.color }}
              >
                <svg width="80%" height="70%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
                  <rect x="4" y="4" width="92" height="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" rx="1"/>
                  <rect x="10" y="10" width="80" height="8" fill="rgba(255,255,255,0.1)" rx="1"/>
                  <rect x="10" y="22" width="38" height="28" fill="rgba(255,255,255,0.07)" rx="1"/>
                  <rect x="52" y="22" width="38" height="13" fill="rgba(255,255,255,0.07)" rx="1"/>
                  <rect x="52" y="37" width="38" height="13" fill="rgba(255,255,255,0.07)" rx="1"/>
                </svg>
                <span
                  className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: t.tag === 'Saved'
                      ? 'hsla(158,64%,52%,0.25)'
                      : 'hsla(210,100%,66%,0.2)',
                    color: t.tag === 'Saved'
                      ? 'hsl(var(--brand-primary))'
                      : 'hsl(var(--brand-accent))',
                  }}
                >
                  {t.tag}
                </span>
              </div>
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>{t.name}</p>
                  <Star size={11} className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'hsl(var(--brand-primary))' }} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Style Presets */}
      <section className="fade-up stagger-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'hsl(var(--text-muted))' }}>
          Auto-Style Presets
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {STYLE_PRESETS.map((s) => (
            <button
              key={s.id}
              id={`style-preset-${s.id}`}
              className="project-card p-4 flex items-start gap-4"
            >
              <div className="flex gap-1 flex-shrink-0">
                {s.fills.map((f, i) => (
                  <div key={i} className="w-7 h-10 rounded-md" style={{ background: f }} />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-left" style={{ color: 'hsl(var(--text-primary))' }}>
                  {s.name}
                </p>
                <p className="text-xs mt-1 text-left" style={{ color: 'hsl(var(--text-muted))' }}>
                  {s.fills.length} room tones
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
