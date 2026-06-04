'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useProjectStore } from '@/stores/project-store';
import {
  Home, ChevronDown, Undo2, Redo2, Download, Share2, Check, Loader2, Menu, X,
} from 'lucide-react';

export default function TopBar() {
  const router = useRouter();
  const mode = useProjectStore((s) => s.mode);
  const title = useProjectStore((s) => s.title);
  const autosave = useProjectStore((s) => s.autosaveStatus);
  const setMode = useProjectStore((s) => s.setMode);
  const setTitle = useProjectStore((s) => s.setTitle);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);

  const [editingTitle, setEditingTitle] = useState(false);
  const [prevTitle, setPrevTitle] = useState(title);
  const [titleVal, setTitleVal] = useState(title);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (title !== prevTitle) {
    setPrevTitle(title);
    setTitleVal(title);
  }

  const commitTitle = () => {
    setTitle(titleVal || 'Untitled Project');
    setEditingTitle(false);
  };

  const autosaveIcon = {
    saved: <Check size={11} style={{ color: 'hsl(var(--success))' }} />,
    saving: <Loader2 size={11} className="animate-spin" style={{ color: 'hsl(var(--text-muted))' }} />,
    unsaved: <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--warning))' }} />,
    error: <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--error))' }} />,
  }[autosave];

  const autosaveLabel = { saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved', error: 'Error' }[autosave];

  return (
    <header
      className="flex items-center justify-between px-2 sm:px-3 gap-1 sm:gap-2"
      style={{
        height: 'var(--topbar-h)',
        background: 'hsl(var(--bg-surface))',
        borderBottom: '1px solid hsl(var(--border-subtle))',
        zIndex: 50,
        gridColumn: '1 / -1',
      }}
    >
      {/* ── Left ──────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Home */}
        <button
          id="topbar-home"
          onClick={() => router.push('/')}
          className="toolbar-btn"
          title="Back to Dashboard"
        >
          <Home size={16} />
        </button>

        {/* File Dropdown — hidden on mobile */}
        <div className="relative hidden sm:block">
          <button
            id="topbar-file-menu"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              color: 'hsl(var(--text-secondary))',
              background: fileMenuOpen ? 'hsl(var(--bg-overlay))' : 'transparent',
            }}
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
          >
            File <ChevronDown size={12} />
          </button>
          {fileMenuOpen && (
            <div
              className="absolute left-0 top-full mt-1 w-48 rounded-xl py-1 z-50"
              style={{
                background: 'hsl(var(--bg-elevated))',
                border: '1px solid hsl(var(--border-default))',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {['Project Settings', 'Export as PDF', 'Export as PNG', 'Export as DXF', '—', 'Duplicate Project', 'Archive'].map((item) =>
                item === '—' ? (
                  <div key={item} className="h-px mx-2 my-1" style={{ background: 'hsl(var(--border-subtle))' }} />
                ) : (
                  <button
                    key={item}
                    className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-opacity-50"
                    style={{ color: 'hsl(var(--text-secondary))' }}
                    onClick={() => setFileMenuOpen(false)}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Autosave — hidden on mobile */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{ color: 'hsl(var(--text-muted))' }}
        >
          {autosaveIcon}
          <span className="text-xs">{autosaveLabel}</span>
        </div>
      </div>

      {/* ── Center: Project Title ─────────────────── */}
      <div className="flex-1 flex justify-center min-w-0">
        {editingTitle ? (
          <input
            ref={inputRef}
            id="project-title-input"
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            autoFocus
            className="text-sm font-semibold text-center rounded-lg px-3 py-1 outline-none w-full max-w-[220px]"
            style={{
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--brand-primary))',
              color: 'hsl(var(--text-primary))',
              boxShadow: '0 0 0 3px hsla(158,64%,52%,0.12)',
            }}
          />
        ) : (
          <button
            id="project-title-btn"
            onClick={() => { setEditingTitle(true); setTimeout(() => inputRef.current?.select(), 0); }}
            className="text-sm font-semibold px-2 sm:px-3 py-1 rounded-lg transition-colors truncate max-w-[120px] sm:max-w-[220px]"
            style={{ color: 'hsl(var(--text-primary))' }}
            title={title}
          >
            {title}
          </button>
        )}
      </div>

      {/* ── Right ─────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Undo / Redo — hidden on small mobile */}
        <button id="topbar-undo" className="toolbar-btn hidden xs:flex" onClick={undo} title="Undo"><Undo2 size={15} /></button>
        <button id="topbar-redo" className="toolbar-btn hidden xs:flex" onClick={redo} title="Redo"><Redo2 size={15} /></button>

        {/* Divider — desktop only */}
        <div className="w-px h-5 hidden sm:block" style={{ background: 'hsl(var(--border-subtle))' }} />

        {/* Studio / Board Toggle */}
        <div className="env-toggle" id="env-toggle">
          <button
            id="mode-studio"
            className={`env-toggle-btn ${mode === 'studio' ? 'active' : ''}`}
            onClick={() => setMode('studio')}
          >
            Studio
          </button>
          <button
            id="mode-board"
            className={`env-toggle-btn ${mode === 'board' ? 'active' : ''}`}
            onClick={() => setMode('board')}
          >
            Board
          </button>
        </div>

        {/* Divider — desktop only */}
        <div className="w-px h-5 hidden sm:block" style={{ background: 'hsl(var(--border-subtle))' }} />

        {/* Export — icon only on mobile */}
        <button
          id="topbar-download"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: 'hsl(var(--bg-elevated))',
            border: '1px solid hsl(var(--border-default))',
            color: 'hsl(var(--text-primary))',
          }}
        >
          <Download size={13} />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Share — icon only on mobile */}
        <button
          id="topbar-share"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: 'hsl(var(--brand-primary))',
            color: 'hsl(220, 22%, 7%)',
          }}
        >
          <Share2 size={13} />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Avatar */}
        <div
          id="topbar-avatar"
          className="flex items-center justify-center rounded-full text-xs font-bold cursor-pointer flex-shrink-0"
          style={{
            width: 30, height: 30,
            background: 'hsl(var(--brand-accent))',
            color: 'hsl(220, 22%, 8%)',
          }}
        >
          AK
        </div>
      </div>
    </header>
  );
}
