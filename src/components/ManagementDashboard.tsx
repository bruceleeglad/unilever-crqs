import React, { useState } from 'react';
import { ProductionOrder, CrqsCheck, QualityRating } from '../types/crqs';
import { 
  Search, 
  Filter, 
  Calendar, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  ExternalLink,
  ChevronDown,
  Layers,
  Clock,
  Eye,
  X,
  FileText,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface Props {
  orders: ProductionOrder[];
}

export const ManagementDashboard: React.FC<Props> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCheckForDetail, setSelectedCheckForDetail] = useState<{ check: CrqsCheck; order: ProductionOrder } | null>(null);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);

  // Filtrering af ordrer
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.mrdrProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.signature1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.signature2.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.tankNumber && o.tankNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLine = selectedLine === 'all' || o.line === selectedLine;
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    return matchesSearch && matchesLine && matchesStatus;
  });

  // Statistikker
  const totalChecks = orders.reduce((acc, o) => acc + (o.checks?.length || 0), 0);
  const totalYellowOrRed = orders.reduce((acc, o) => {
    const issues = (o.checks || []).filter(c => 
      c.foretiket !== 'green' || 
      c.bagetiket !== 'green' || 
      c.kapsel !== 'green' || 
      c.flaske !== 'green' || 
      c.datokode !== 'green' || 
      c.karton !== 'green'
    ).length;
    return acc + issues;
  }, 0);

  const getStatusBadge = (rating: QualityRating) => {
    if (rating === 'green') return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OK</span>;
    if (rating === 'yellow') return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">GUL</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">RØD</span>;
  };

  const exportCSV = () => {
    let csv = 'Ordrenummer,Linje,Status,Oprettet,Tank,Operator1,Operator2,TjekNr,Tidspunkt,Foretiket,Bagetiket,Kapsel,Flaske,Datokode,Karton,Kommentar\n';
    orders.forEach(o => {
      if (!o.checks || o.checks.length === 0) {
        csv += `"${o.orderNumber}","${o.line}","${o.status}","${o.createdAt}","${o.tankNumber || ''}","${o.signature1.name}","${o.signature2.name}","Ingen","","","","","","","",""\n`;
      } else {
        o.checks.forEach(c => {
          csv += `"${o.orderNumber}","${o.line}","${o.status}","${o.createdAt}","${o.tankNumber || ''}","${o.signature1.name}","${o.signature2.name}","${c.checkNumber}","${c.timeFormatted}","${c.foretiket}","${c.bagetiket}","${c.kapsel}","${c.flaske}","${c.datokode}","${c.karton}","${c.comment || ''}"\n`;
        });
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CRQS_Eksport_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-blue-400 tracking-wider uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Kvalitetsportal & Database
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1.5">
            CRQS Ledelses- & Audit Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Realtidsovervågning af produktionslinjer, fotodokumentation og kvalitetsrapporter
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDocModal(true)}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Drift & Sikkerhed (0 kr.)
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Eksporter til Excel / CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Ordrer i dag
          </span>
          <div className="text-3xl font-black text-white">{orders.length}</div>
          <span className="text-xs text-blue-400 mt-1 block">På tværs af 3 linjer</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            CRQS Fototjek
          </span>
          <div className="text-3xl font-black text-white">{totalChecks}</div>
          <span className="text-xs text-emerald-400 mt-1 block">Dokumenteret i databasen</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Aktive Linjer
          </span>
          <div className="text-3xl font-black text-emerald-400">
            {orders.filter(o => o.status === 'active').length}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Kører produktion nu</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Registrerede Bemærkninger
          </span>
          <div className="text-3xl font-black text-amber-400">{totalYellowOrRed}</div>
          <span className="text-xs text-slate-400 mt-1 block">Gule/Røde afvigelser</span>
        </div>
      </div>

      {/* Filter og Søgebjælke */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Søgning */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Søg ordrenr, MRDR, operatør..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Linje Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'Thor (L1)', 'Sif (L2)', 'Loke (L5)'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLine(l)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLine === l
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {l === 'all' ? 'Alle Linjer' : l}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['all', 'active', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Alle' : s === 'active' ? 'Kun Aktive' : 'Afsluttede'}
            </button>
          ))}
        </div>
      </div>

      {/* Ordrer & Fototjek Feed */}
      <div className="space-y-8">
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 font-semibold text-sm">Ingen ordrer matchede dine søgekriterier.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Ordre Header Bar */}
              <div className="p-5 bg-slate-800/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className={`w-3 h-3 rounded-full ${order.status === 'active' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-black text-white">Ordre #{order.orderNumber}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {order.line}
                      </span>
                      {order.tankNumber && (
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          Tank: {order.tankNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Startet: {new Date(order.createdAt).toLocaleString('da-DK')} | Operatører: <strong>{order.signature1.name}</strong> & <strong>{order.signature2.name}</strong>
                    </p>
                  </div>
                </div>

                {/* MRDR Specifikationer */}
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <div className="hidden sm:block">
                    <span className="text-slate-500 block">MRDR Vare:</span>
                    <span className="font-mono font-bold text-white">{order.mrdrProduct}</span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-slate-500 block">Etiketter (For/Bag):</span>
                    <span className="font-mono text-slate-300">{order.mrdrFrontLabel} / {order.mrdrBackLabel}</span>
                  </div>
                  <span className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 font-bold text-white">
                    {order.checks?.length || 0} Tjek
                  </span>
                </div>
              </div>

              {/* Fototjek Tidslinje (Alle 20-min billeder) */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  Fotodokumentation & CRQS Parametre (Hvert 20. min):
                </h4>

                {order.checks?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">Ingen billeder registreret på denne ordre endnu.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {order.checks.map((chk) => (
                      <div
                        key={chk.id}
                        onClick={() => setSelectedCheckForDetail({ check: chk, order })}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col"
                      >
                        {/* Billede Preview */}
                        <div className="relative h-40 bg-slate-900 overflow-hidden">
                          {chk.photoUrl ? (
                            <img
                              src={chk.photoUrl.startsWith('http') ? `/api/image?url=${encodeURIComponent(chk.photoUrl)}` : chk.photoUrl}
                              alt={`Tjek #${chk.checkNumber}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                // Hvis proxy fejler, fallback til direkte URL
                                if (chk.photoUrl && (e.target as HTMLImageElement).src !== chk.photoUrl) {
                                  (e.target as HTMLImageElement).src = chk.photoUrl;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Camera className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-slate-950/90 backdrop-blur px-2.5 py-0.5 rounded text-[11px] font-bold text-white border border-slate-700/50">
                            Tjek #{chk.checkNumber}
                          </div>
                          <div className="absolute top-2 right-2 bg-slate-950/90 backdrop-blur px-2 py-0.5 rounded text-[11px] font-bold text-slate-300 flex items-center gap-1 border border-slate-700/50">
                            <Clock className="w-3 h-3 text-blue-400" /> {chk.timeFormatted}
                          </div>
                          <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-slate-950/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> Se detaljer
                            </span>
                          </div>
                        </div>

                        {/* Parametre Grid */}
                        <div className="p-3 text-[10px] space-y-1.5 flex-1 flex flex-col justify-between">
                          <div className="grid grid-cols-2 gap-1 text-slate-300">
                            <div className="flex items-center justify-between">
                              <span>Foretiket:</span> {getStatusBadge(chk.foretiket)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Bagetiket:</span> {getStatusBadge(chk.bagetiket)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Kapsel:</span> {getStatusBadge(chk.kapsel)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Flaske:</span> {getStatusBadge(chk.flaske)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Datokode:</span> {getStatusBadge(chk.datokode)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Karton:</span> {getStatusBadge(chk.karton)}
                            </div>
                          </div>

                          {chk.comment && (
                            <p className="text-[11px] text-slate-400 italic truncate pt-1 border-t border-slate-800">
                              "{chk.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detalje Modal (Zoom billede i fuld størrelse & audit) */}
      {selectedCheckForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Tjek #{selectedCheckForDetail.check.checkNumber} • Ordre #{selectedCheckForDetail.order.orderNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedCheckForDetail.order.line} | Registreret kl. {selectedCheckForDetail.check.timeFormatted} ({new Date(selectedCheckForDetail.check.timestamp).toLocaleDateString('da-DK')})
                </p>
              </div>
              <button
                onClick={() => setSelectedCheckForDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
              {/* Billede Zoom */}
              <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center min-h-[300px]">
                {selectedCheckForDetail.check.photoUrl ? (
                  <img
                    src={selectedCheckForDetail.check.photoUrl.startsWith('http') ? `/api/image?url=${encodeURIComponent(selectedCheckForDetail.check.photoUrl)}` : selectedCheckForDetail.check.photoUrl}
                    alt="CRQS Full"
                    className="max-h-[60vh] w-auto object-contain"
                    onError={(e) => {
                      const orig = selectedCheckForDetail.check.photoUrl;
                      if (orig && (e.target as HTMLImageElement).src !== orig) {
                        (e.target as HTMLImageElement).src = orig;
                      }
                    }}
                  />
                ) : (
                  <div className="text-slate-500">Intet billede</div>
                )}
              </div>

              {/* Detaljer */}
              <div className="w-full md:w-80 space-y-4 text-sm">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parametre</h4>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Foretiket:</span>
                    {getStatusBadge(selectedCheckForDetail.check.foretiket)}
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Bagetiket:</span>
                    {getStatusBadge(selectedCheckForDetail.check.bagetiket)}
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Kapsel:</span>
                    {getStatusBadge(selectedCheckForDetail.check.kapsel)}
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Flaske:</span>
                    {getStatusBadge(selectedCheckForDetail.check.flaske)}
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Datokode:</span>
                    {getStatusBadge(selectedCheckForDetail.check.datokode)}
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-300">Karton:</span>
                    {getStatusBadge(selectedCheckForDetail.check.karton)}
                  </div>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kommentar</h4>
                  <p className="text-xs text-slate-300 italic">
                    {selectedCheckForDetail.check.comment || 'Ingen kommentar tilføjet.'}
                  </p>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div><strong>Operatører på skift:</strong> {selectedCheckForDetail.order.signature1.name} & {selectedCheckForDetail.order.signature2.name}</div>
                  <div><strong>MRDR Vare:</strong> {selectedCheckForDetail.order.mrdrProduct}</div>
                  <div><strong>Tank:</strong> {selectedCheckForDetail.order.tankNumber || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dokumentation & Drift Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Teknisk Drift, Sikkerhed & Overdragelse</h3>
                  <p className="text-xs text-slate-400">Officiel dokumentation for Unilever CRQS • Total TCO: 0,00 kr.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/Unilever_CRQS_Drift_og_Overdragelse.pdf"
                  download="Unilever_CRQS_Drift_og_Overdragelse.pdf"
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow"
                >
                  <Download className="w-3.5 h-3.5" /> Hent PDF
                </a>
                <a
                  href="https://drive.google.com/file/d/1N0nOWEJvm1WVm5BBUVw4RPqG318teBWM/view?usp=drivesdk"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Google Drev
                </a>
                <button
                  onClick={() => setShowDocModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
              {/* Highlight TCO Card */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                <h4 className="text-emerald-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> 100% Gratis Drift (Total TCO: 0,- DKK)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Systemet er bygget til at køre omkostningsfrit på standard cloud-kvoter (Vercel & GitHub) uden krav om betalingskort eller brugerlicenser. Kan anvendes på uendeligt mange enheder samtidigt.
                </p>
              </div>

              {/* TCO Tabel */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Økonomi- & Ressourceoverblik</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-800/40">
                        <th className="p-2.5">Komponent</th>
                        <th className="p-2.5">Platform</th>
                        <th className="p-2.5">Pris Nu</th>
                        <th className="p-2.5">Pris Fremtid</th>
                        <th className="p-2.5">Kvote / Grænse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Hosting</td>
                        <td className="p-2.5">Vercel Community</td>
                        <td className="p-2.5 text-emerald-400 font-bold">0 kr.</td>
                        <td className="p-2.5 text-emerald-400 font-bold">0 kr.</td>
                        <td className="p-2.5 text-slate-400">100 GB/mdr (forbrug: under 1 GB)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Kildekode</td>
                        <td className="p-2.5">GitHub Repositories</td>
                        <td className="p-2.5 text-emerald-400 font-bold">0 kr.</td>
                        <td className="p-2.5 text-emerald-400 font-bold">0 kr.</td>
                        <td className="p-2.5 text-slate-400">Ubegrænset versionshistorik</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Billeder & Cloud Sync</td>
                        <td className="p-2.5">Serverless Edge Proxy</td>
                        <td className="p-2.5 text-emerald-400 font-bold">0 kr.</td>
                        <td className="p-2.5 text-emerald-400 font-bold">0 kr.</td>
                        <td className="p-2.5 text-slate-400">Automatisk komprimering & proxy</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Brugerlicenser</td>
                        <td className="p-2.5">Web standard (PWA)</td>
                        <td className="p-2.5 text-emerald-400 font-bold">0 kr.</td>
                        <td className="p-2.5 text-emerald-400 font-bold">0 kr.</td>
                        <td className="p-2.5 text-slate-400">Ingen begrænsning i brugere</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Overdragelse & Ejerskab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 text-blue-400">
                    Fuld Ejeroverdragelse
                  </h4>
                  <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
                    <li>Ledelsen inviteres som <strong>Admin på Vercel</strong> med <code>@unilever.com</code>.</li>
                    <li>Koden på GitHub kan overdrages til Unilevers egen IT-organisation.</li>
                    <li>Bygget i standard <strong>React 19 & TypeScript</strong> — enhver supporter kan overtage.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 text-blue-400">
                    AI-Support & Fjernvedligeholdelse
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ved produktionsændringer (nye linjer, ændring af felter eller fejlretning) kan der sendes en mail på dansk. AI-udvikleren retter koden, kører tests og deployer opdateringen til linjen på under 2 minutter.
                  </p>
                </div>
              </div>

              {/* Data & Backup */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5 text-slate-200">
                  Dataejerskab & Backup
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingen data er låst til systemet. Alle registreringer, linjeclearances og kvalitetskontroller kan til enhver tid downloades som Excel/CSV via knappen foroven og arkiveres på Unilevers eget netværksdrev eller SharePoint.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex items-center justify-between">
              <span className="text-xs text-slate-500">Unilever Production Quality System • Version 1.0</span>
              <button
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Luk Vindue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};