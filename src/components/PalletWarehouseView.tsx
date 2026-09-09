import React, { useState } from 'react';
import { Package, Search, Plus, Filter, Download, AlertTriangle, CheckCircle2, Clock, Trash2, ArrowUpRight, Camera, ExternalLink } from 'lucide-react';
import { PalletItem, PalletStatus } from '../types/crqs';
import { PalletRegistrationModal } from './PalletRegistrationModal';
import { PalletDetailModal } from './PalletDetailModal';

interface Props {
  pallets: PalletItem[];
  onRegisterPallet: (pallet: Omit<PalletItem, 'id' | 'palletNumber' | 'registeredAt'>) => void;
  onUpdateStatus: (id: string, status: PalletStatus, note?: string, newItemNumber?: string) => void;
}

export const PalletWarehouseView: React.FC<Props> = ({ pallets, onRegisterPallet, onUpdateStatus }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PalletStatus>('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPallet, setSelectedPallet] = useState<PalletItem | null>(null);

  // Filtrering
  const filteredPallets = pallets.filter((p) => {
    const matchesSearch =
      p.palletNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.oldItemNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.batchNumber && p.batchNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistik
  const stats = {
    total: pallets.length,
    investigating: pallets.filter(p => p.status === 'investigating').length,
    readyRelabel: pallets.filter(p => p.status === 'ready_relabel').length,
    scrap: pallets.filter(p => p.status === 'scrap').length,
    resolved: pallets.filter(p => p.status === 'resolved').length,
  };

  // CSV Export for Driftschefen / SAP Master Data
  const exportToCSV = () => {
    if (pallets.length === 0) {
      alert('Ingen paller at eksportere.');
      return;
    }

    const headers = [
      'Palle-ID',
      'Lokation',
      'Gammelt Varenummer',
      'Nyt SAP Nummer',
      'Beskrivelse',
      'Mængde',
      'Enhed',
      'Batch',
      'Udløbsdato',
      'Status',
      'Registreret Af',
      'Registreret Dato',
      'Bemærkning'
    ];

    const rows = pallets.map(p => [
      `"${p.palletNumber}"`,
      `"${p.location}"`,
      `"${p.oldItemNumber}"`,
      `"${p.newItemNumber || ''}"`,
      `"${p.description.replace(/"/g, '""')}"`,
      p.quantity,
      `"${p.unit}"`,
      `"${p.batchNumber || ''}"`,
      `"${p.expiryDate || ''}"`,
      `"${p.status}"`,
      `"${p.registeredBy}"`,
      `"${p.registeredAt}"`,
      `"${(p.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Unilever_Paller_Karantæne_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: PalletStatus) => {
    switch (status) {
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Afventer afklaring
          </span>
        );
      case 'ready_relabel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <ArrowUpRight className="w-3 h-3" /> Klar til ommærkning
          </span>
        );
      case 'scrap':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Trash2 className="w-3 h-3" /> Skrot / Kassation
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Afsluttet i SAP
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 pb-28 sm:pb-24 space-y-4 sm:space-y-6">
      
      {/* Top Banner & Handlinger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
              Skyggelager & Karantæne
            </span>
            <span className="text-[11px] text-slate-400">• TCO: 0 kr.</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400 shrink-0" />
            Paller Udenfor SAP
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Registrér og hold styr på paller med udgåede varenumre, ukendt status eller paller der afventer ommærkning.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-700 shadow-md text-xs md:text-sm transition-all"
            title="Eksportér alle registrerede paller til CSV / Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-amber-500/20 text-xs md:text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrer Palle</span>
          </button>
        </div>
      </div>

      {/* KPI Kasser (Kompakt og hurtigt overblik) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all active:scale-98 ${
            statusFilter === 'all' 
              ? 'bg-slate-800 border-slate-600 ring-2 ring-white/20' 
              : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-slate-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block">Paller i Alt</span>
          <span className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-0.5 sm:mt-1 block">{stats.total}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('investigating')}
          className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all active:scale-98 ${
            statusFilter === 'investigating' 
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30' 
              : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-amber-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block truncate">Afventer</span>
          <span className="text-xl sm:text-2xl md:text-3xl font-black text-amber-300 mt-0.5 sm:mt-1 block">{stats.investigating}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('ready_relabel')}
          className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all active:scale-98 ${
            statusFilter === 'ready_relabel' 
              ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30' 
              : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-blue-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block truncate">Ommærkning</span>
          <span className="text-xl sm:text-2xl md:text-3xl font-black text-blue-300 mt-0.5 sm:mt-1 block">{stats.readyRelabel}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('scrap')}
          className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all active:scale-98 ${
            statusFilter === 'scrap' 
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30' 
              : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-rose-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block truncate">Skrot</span>
          <span className="text-xl sm:text-2xl md:text-3xl font-black text-rose-400 mt-0.5 sm:mt-1 block">{stats.scrap}</span>
        </div>
      </div>

      {/* Søge- og Filterbar med touch-scroller */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-slate-900 p-2.5 sm:p-3 md:p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Søg pallenr, lokation (f.eks. B-12), MRDR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-base sm:text-xs md:text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        {/* Filter chips med let swipe på mobil */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1">
          {(['all', 'investigating', 'ready_relabel', 'scrap', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 shadow font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' && 'Alle'}
              {st === 'investigating' && 'Afventer'}
              {st === 'ready_relabel' && 'Ommærkning'}
              {st === 'scrap' && 'Skrot'}
              {st === 'resolved' && 'Afsluttet'}
            </button>
          ))}
        </div>
      </div>

      {/* Pallelager Liste / Tabel */}
      {filteredPallets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Ingen paller fundet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {search || statusFilter !== 'all'
              ? 'Prøv at ændre dine søgekriterier eller filter.'
              : 'Der er endnu ikke registreret nogen paller i karantænelageret.'}
          </p>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black px-5 py-3 rounded-xl text-sm shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Registrer Første Palle Nu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPallets.map((pallet) => (
            <div
              key={pallet.id}
              onClick={() => setSelectedPallet(pallet)}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer flex flex-col group"
            >
              {/* Palle Header */}
              <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {pallet.palletNumber}
                  </span>
                  <span className="font-mono font-bold text-xs text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    📍 {pallet.location}
                  </span>
                </div>
                {getStatusBadge(pallet.status)}
              </div>

              {/* Palle Billede (hvis findes) */}
              {pallet.photoUrl && (
                <div className="h-36 bg-slate-950 border-b border-slate-800/80 overflow-hidden relative">
                  <img
                    src={pallet.photoUrl}
                    alt={pallet.palletNumber}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-300 flex items-center gap-1">
                    <Camera className="w-3 h-3" /> Foto tilgængeligt
                  </div>
                </div>
              )}

              {/* Palle Body Info */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {pallet.description}
                  </h4>
                  
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Gammelt MRDR:</span>
                      <span className="font-mono font-bold text-white">{pallet.oldItemNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Mængde:</span>
                      <span className="font-bold text-white">{pallet.quantity} {pallet.unit}</span>
                    </div>
                  </div>

                  {pallet.newItemNumber && (
                    <div className="mt-2 text-[11px] bg-blue-950/50 border border-blue-800/50 p-2 rounded-lg text-blue-300">
                      <span className="font-bold">Nyt SAP nr:</span> <span className="font-mono font-bold">{pallet.newItemNumber}</span>
                    </div>
                  )}

                  {pallet.note && (
                    <p className="mt-2 text-[11px] text-slate-400 line-clamp-2 italic">
                      "{pallet.note}"
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Reg: {pallet.registeredBy}</span>
                  <span>{new Date(pallet.registeredAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registrer Palle Modal */}
      {showRegisterModal && (
        <PalletRegistrationModal
          onClose={() => setShowRegisterModal(false)}
          onSave={(data) => {
            onRegisterPallet(data);
            setShowRegisterModal(false);
          }}
        />
      )}

      {/* Detalje / Statusopdatering Modal */}
      {selectedPallet && (
        <PalletDetailModal
          pallet={selectedPallet}
          onClose={() => setSelectedPallet(null)}
          onUpdateStatus={(id, status, note, newItemNumber) => {
            onUpdateStatus(id, status, note, newItemNumber);
            setSelectedPallet(null);
          }}
        />
      )}

      {/* Floating Action Button (FAB) kun synlig på mobil for nem tommelfinger-adgang */}
      <div className="fixed bottom-6 right-4 sm:hidden z-30">
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 active:scale-95 text-slate-950 font-black px-4 py-3.5 rounded-full shadow-2xl shadow-amber-500/50 border-2 border-amber-400 text-sm"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Ny Palle</span>
        </button>
      </div>

    </div>
  );
};
