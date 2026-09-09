import React, { useState } from 'react';
import { X, Check, Trash2, Tag, AlertTriangle, CheckCircle, RefreshCw, Calendar, MapPin, Hash, User, FileText } from 'lucide-react';
import { PalletItem, PalletStatus } from '../types/crqs';

interface Props {
  pallet: PalletItem;
  onClose: () => void;
  onUpdateStatus: (id: string, status: PalletStatus, note?: string, newItemNumber?: string) => void;
}

export const PalletDetailModal: React.FC<Props> = ({ pallet, onClose, onUpdateStatus }) => {
  const [status, setStatus] = useState<PalletStatus>(pallet.status);
  const [note, setNote] = useState(pallet.note || '');
  const [newItemNumber, setNewItemNumber] = useState(pallet.newItemNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onUpdateStatus(pallet.id, status, note, newItemNumber);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 200);
  };

  const statusOptions: { value: PalletStatus; label: string; desc: string; color: string; border: string }[] = [
    {
      value: 'investigating',
      label: 'Afventer Afklaring',
      desc: 'Driftschefen / Master Data undersøger sagen',
      color: 'bg-amber-500/20 text-amber-300',
      border: 'border-amber-500/40'
    },
    {
      value: 'ready_relabel',
      label: 'Klar til Ommærkning',
      desc: 'Nyt SAP-nummer fundet, klar til nye pallesedler',
      color: 'bg-blue-500/20 text-blue-300',
      border: 'border-blue-500/40'
    },
    {
      value: 'scrap',
      label: 'Skrottes / Kassation',
      desc: 'Godkendt til kassation og bortskaffelse',
      color: 'bg-rose-500/20 text-rose-300',
      border: 'border-rose-500/40'
    },
    {
      value: 'resolved',
      label: 'Afsluttet / Indlæst i SAP',
      desc: 'Færdigbehandlet og ude af karantæne',
      color: 'bg-emerald-500/20 text-emerald-300',
      border: 'border-emerald-500/40'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-mono font-black text-sm">
              {pallet.palletNumber}
            </span>
            <div>
              <h3 className="text-base md:text-lg font-black text-white">{pallet.description}</h3>
              <p className="text-xs text-slate-400">Gammelt MRDR: <span className="text-slate-200 font-mono font-bold">{pallet.oldItemNumber}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Venstre: Billede */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Fysisk Foto af Palle & Mærkeseddel
              </label>
              {pallet.photoUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner group relative">
                  <img
                    src={pallet.photoUrl}
                    alt={pallet.palletNumber}
                    className="w-full h-64 md:h-72 object-contain bg-slate-950/90 cursor-zoom-in"
                    onClick={() => window.open(pallet.photoUrl, '_blank')}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-1 rounded text-[11px] text-slate-300 pointer-events-none">
                    Klik for fuld størrelse
                  </div>
                </div>
              ) : (
                <div className="h-64 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center">
                  <span>Intet foto uploadet for denne palle</span>
                </div>
              )}
            </div>

            {/* Højre: Palle Data & Lokation */}
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Lokation:</span>
                  <span className="font-bold text-white text-sm bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                    {pallet.location}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-blue-400" /> Mængde:</span>
                  <span className="font-bold text-white text-sm">
                    {pallet.quantity} {pallet.unit}
                  </span>
                </div>

                {pallet.batchNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Batch / Lot:</span>
                    <span className="font-mono font-bold text-slate-200 uppercase">{pallet.batchNumber}</span>
                  </div>
                )}

                {pallet.expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Udløb:</span>
                    <span className="font-bold text-slate-200">{pallet.expiryDate}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {pallet.registeredBy}</span>
                  <span>{new Date(pallet.registeredAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Status Skifter */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Driftschef Status & Håndtering
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        status === opt.value
                          ? `${opt.color} ${opt.border} ring-2 ring-white/20 font-bold`
                          : 'bg-slate-800/50 border-slate-700/70 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-xs">{opt.label}</div>
                      <div className="text-[10px] opacity-80 line-clamp-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hvis klar til ommærkning: Nyt SAP nummer */}
              {status === 'ready_relabel' && (
                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-1.5">
                  <label className="block text-xs font-bold text-blue-300 uppercase">
                    Nyt SAP Varenummer (til ommærkning)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Indtast godkendt SAP nr..."
                    value={newItemNumber}
                    onChange={(e) => setNewItemNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-blue-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}

              {/* Notat */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Driftschef Notat & Handling
                </label>
                <textarea
                  rows={2}
                  placeholder="f.eks. Kontaktet Master Data, skrotning godkendt..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-800/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-sm"
          >
            Luk
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
          >
            <Check className="w-4 h-4" /> Gem Ændringer
          </button>
        </div>

      </div>
    </div>
  );
};
