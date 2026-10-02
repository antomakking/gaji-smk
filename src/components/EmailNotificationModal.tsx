import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  Clock, 
  Search, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  School
} from 'lucide-react';
import { EmailLog, PenggajianRecord } from '../types';
import { formatRupiah } from '../utils/security';

interface EmailNotificationModalProps {
  emailLogs: EmailLog[];
  onTriggerBatchEmail: () => void;
  onSendSingleEmail: (recordId: string) => void;
  records: PenggajianRecord[];
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  emailLogs,
  onTriggerBatchEmail,
  onSendSingleEmail,
  records,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(emailLogs[0] || null);

  const filteredLogs = emailLogs.filter((log) =>
    log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.kodeSlip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header - Soft Green Aesthetic */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Notifikasi Email Slip Gaji Otomatis
            </h2>
            <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              SMTP Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat log pengiriman slip gaji digital ke email resmi guru & tenaga kependidikan SMK IT Ibnul Qayyim Makassar.
          </p>
        </div>

        <button
          onClick={onTriggerBatchEmail}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          <span>Kirim Notifikasi ke Seluruh Pegawai</span>
        </button>
      </div>

      {/* Grid: Left Logs List, Right Email Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Logs List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-emerald-100/90 shadow-xs p-4 flex flex-col h-[580px]">
          <div className="pb-3 border-b border-slate-100 mb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari penerima atau kode slip..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Belum ada riwayat email terkirim.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 line-clamp-1">{log.recipientName}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {log.status === 'sent' ? 'Terkirim' : log.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{log.recipientEmail}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                      <span>{log.kodeSlip}</span>
                      <span>{new Date(log.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Email HTML Template Viewer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between h-[580px] overflow-y-auto">
          {selectedLog ? (
            <div className="space-y-4">
              {/* Email Client Header Preview */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Dari:</span>
                  <span className="font-semibold text-slate-800">Keuangan SMK IT Ibnul Qayyim &lt;keuangan@smkit-ibnulqayyim.sch.id&gt;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Kepada:</span>
                  <span className="font-semibold text-slate-900">{selectedLog.recipientName} &lt;{selectedLog.recipientEmail}&gt;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subjek:</span>
                  <span className="font-bold text-slate-900">{selectedLog.subject}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Waktu Kirim:</span>
                  <span>{new Date(selectedLog.sentAt).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Rendered Email Body */}
              <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-xs font-sans text-xs space-y-4">
                {/* School Header Banner in Email */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white font-bold text-sm">
                    IQ
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">SMK IT IBNUL QAYYIM MAKASSAR</div>
                    <div className="text-[10px] text-slate-400">Pemberitahuan Resmi Penerbitan Slip Gaji</div>
                  </div>
                </div>

                <div className="text-slate-700 leading-relaxed space-y-2">
                  <p><strong>Assalamu alaikum Warahmatullahi Wabarakatuh,</strong></p>
                  <p>
                    Yth. <strong>{selectedLog.recipientName}</strong>,
                  </p>
                  <p>
                    Alhamdulillah, dengan ini kami sampaikan bahwa proses penggajian & honorarium Anda untuk periode <strong>{records.find(r => r.id === selectedLog.penggajianId)?.periodeLabel || 'Bulan Berjalan'}</strong> telah selesai diproses dan ditransfer ke rekening bank Anda.
                  </p>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-100 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold text-emerald-900">Rincian Dokumen Terlampir:</div>
                  <div className="flex justify-between text-[11px]">
                    <span>Nomor Kode Slip:</span>
                    <span className="font-mono font-bold">{selectedLog.kodeSlip}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Status Pembayaran:</span>
                    <span className="font-bold text-emerald-700">LUNAS / SELESAI</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600">
                  Silakan mengunduh dokumen slip gaji resmi dalam format PDF yang telah terenkripsi dan diverifikasi oleh Kepala Sekolah serta Bendahara Yayasan.
                </p>

                <div className="pt-2">
                  <div className="inline-block bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm">
                    Unduh Slip Gaji PDF Resmi (Terlampir)
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                  <p>Wassalamu alaikum Warahmatullahi Wabarakatuh,</p>
                  <p className="font-semibold text-slate-600">Bagian Keuangan & Kepegawaian SMK IT Ibnul Qayyim Makassar</p>
                  <p>Jl. Hertasning Baru / Aroepala No. 88, Makassar, Sulawesi Selatan</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              Pilih log email di sebelah kiri untuk melihat template surat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
