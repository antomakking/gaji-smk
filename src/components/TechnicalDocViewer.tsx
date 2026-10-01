import React, { useState } from 'react';
import { 
  Database, 
  Code, 
  ShieldCheck, 
  Copy, 
  Check, 
  FileCode, 
  Layers, 
  GitBranch, 
  Key, 
  Server,
  Zap,
  Cloud
} from 'lucide-react';
import { POSTGRESQL_DDL_SCHEMA, MYSQL_DDL_SCHEMA, SUPABASE_DDL_SCHEMA } from '../data/sql_schema';
import { MERMAID_ERD, MERMAID_WORKFLOW } from '../data/erd_mermaid';

export const TechnicalDocViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'supabase' | 'postgresql' | 'mysql' | 'erd' | 'backend_code' | 'security'>('supabase');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const BACKEND_CONTROLLER_SAMPLE = `/**
 * Controller & Business Logic Penggajian Supabase & Express
 * SMK IT Ibnul Qayyim Makassar (TypeScript)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * 1. Ambil rekap slip gaji yang di-join dengan data master pegawai
 */
export async function getPayrollWithStaff(bulan: number, tahun: number) {
  const { data, error } = await supabase
    .from('slip_gaji')
    .select('*, pegawai:pegawai_id(*)')
    .eq('bulan', bulan)
    .eq('tahun', tahun);

  if (error) throw error;
  return data;
}

/**
 * 2. Update status approval berjenjang di Supabase
 */
export async function updateApprovalStatus(
  slipId: string, 
  nextStatus: 'pending_yayasan' | 'approved' | 'transferred' | 'rejected',
  approverName: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('slip_gaji')
    .update({
      status_approval: nextStatus,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', slipId);

  if (error) throw error;
  return data;
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Arsitektur Sistem, DDL Supabase & Backend API
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono">
              Supabase PostgreSQL Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dokumentasi lengkap skema database relasional (DDL), Entity Relationship Model (ERD), skrip mutasi Supabase, dan mekanisme approval berjenjang.
          </p>
        </div>

        <button
          onClick={() => {
            const currentCode = 
              activeSubTab === 'supabase' ? SUPABASE_DDL_SCHEMA :
              activeSubTab === 'postgresql' ? POSTGRESQL_DDL_SCHEMA :
              activeSubTab === 'mysql' ? MYSQL_DDL_SCHEMA :
              activeSubTab === 'backend_code' ? BACKEND_CONTROLLER_SAMPLE :
              MERMAID_ERD;
            handleCopy(currentCode);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode Aktif'}</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'supabase', label: 'DDL Supabase (Live Backend)', icon: Cloud },
          { id: 'postgresql', label: 'DDL PostgreSQL Standar', icon: Database },
          { id: 'mysql', label: 'DDL MySQL 8.0+', icon: Database },
          { id: 'backend_code', label: 'Supabase & API Client (TS)', icon: Code },
          { id: 'erd', label: 'ERD & Workflow Mermaid', icon: GitBranch },
          { id: 'security', label: 'Arsitektur Keamanan SHA-256', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      {activeSubTab === 'supabase' && (
        <div className="bg-slate-950 text-slate-200 p-6 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-slate-400 text-[11px]">
            <span>supabase_migration.sql (Supabase SQL Editor Ready)</span>
            <span className="text-emerald-400 font-bold">periode_penggajian, pegawai, slip_gaji, guru_inval, presensi_harian_jp</span>
          </div>
          <pre className="text-emerald-400/90 whitespace-pre">{SUPABASE_DDL_SCHEMA}</pre>
        </div>
      )}

      {activeSubTab === 'postgresql' && (
        <div className="bg-slate-950 text-slate-200 p-6 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-slate-400 text-[11px]">
            <span>postgresql_schema.sql (PostgreSQL 14 / 16 DDL)</span>
            <span>6 Tabel + Indexes + Foreign Keys + Constraints</span>
          </div>
          <pre className="text-emerald-400/90 whitespace-pre">{POSTGRESQL_DDL_SCHEMA}</pre>
        </div>
      )}

      {activeSubTab === 'mysql' && (
        <div className="bg-slate-950 text-slate-200 p-6 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-slate-400 text-[11px]">
            <span>mysql_schema.sql (MySQL 8.0+ DDL)</span>
            <span>InnoDB Engine • utf8mb4_unicode_ci</span>
          </div>
          <pre className="text-indigo-400/90 whitespace-pre">{MYSQL_DDL_SCHEMA}</pre>
        </div>
      )}

      {activeSubTab === 'backend_code' && (
        <div className="bg-slate-950 text-slate-200 p-6 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-slate-400 text-[11px]">
            <span>supabaseController.ts (TypeScript / Supabase Client)</span>
            <span>CRUD + Direct Approval Mutations</span>
          </div>
          <pre className="text-amber-300/90 whitespace-pre">{BACKEND_CONTROLLER_SAMPLE}</pre>
        </div>
      )}

      {activeSubTab === 'erd' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Mermaid ERD Script
            </h3>
            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
              {MERMAID_ERD}
            </pre>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Alur Workflow Persetujuan Gaji
            </h3>
            <pre className="bg-slate-950 text-indigo-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
              {MERMAID_WORKFLOW}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'security' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Kriptografi & Perlindungan Integritas Slip Gaji</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Setiap slip gaji yang diterbitkan dan dicetak memiliki checksum HMAC SHA-256 yang memvalidasi integritas data nominal, NIP pegawai, dan tanda tangan digital Kepala Sekolah dan Bendahara Yayasan.
          </p>
        </div>
      )}
    </div>
  );
};
