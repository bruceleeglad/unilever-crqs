import React, { useState, useEffect } from 'react';
import { ProductionOrder, CrqsCheck, QualityRating } from '../types/crqs';
import { CheckModal } from './CheckModal';
import { addCheckToOrder, completeOrder } from '../services/storage';
import { 
  PlusCircle, 
  Camera, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronRight, 
  FileCheck,
  Factory,
  Check,
  Info
} from 'lucide-react';

interface Props {
  order: ProductionOrder;
  onOrderUpdated: (order: ProductionOrder) => void;
  onFinishOrder: () => void;
  onNewOrderClick: () => void;
}

export const ActiveOrderView: React.FC<Props> = ({ 
  order, 
  onOrderUpdated, 
  onFinishOrder,
  onNewOrderClick 
}) => {
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [minutesSinceLastCheck, setMinutesSinceLastCheck] = useState<number>(0);

  useEffect(() => {
    const calculateTime = () => {
      if (!order.checks || order.checks.length === 0) {
        const orderStarted = new Date(order.createdAt).getTime();
        setMinutesSinceLastCheck(Math.floor((Date.now() - orderStarted) / 60000));
        return;
      }
      const latest = new Date(order.checks[0].timestamp).getTime();
      setMinutesSinceLastCheck(Math.floor((Date.now() - latest) / 60000));
    };

    calculateTime();
    const timer = setInterval(calculateTime, 30000);
    return () => clearInterval(timer);
  }, [order]);

  const handleSaveCheck = (checkData: any) => {
    const updated = addCheckToOrder(order.id, checkData);
    if (updated) {
      onOrderUpdated(updated);
    }
    setShowCheckModal(false);
  };

  const getStatusBadge = (rating: QualityRating) => {
    if (rating === 'green') return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" title="Grøn" />;
    if (rating === 'yellow') return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse" title="Gul" />;
    return <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" title="Rød" />;
  };

  const isCheckDue = minutesSinceLastCheck >= 20;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-28">
      
      {/* Top Bar: Aktiv Ordre Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/30">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {order.line}
              </span>
              <span className="text-xs text-slate-400">Tank: {order.tankNumber || 'Ikke angivet'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              Ordre #{order.orderNumber}
            </h1>
          </div>
        </div>

        {/* MRDR & Operatører */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-800/60 py-2.5 px-4 rounded-xl border border-slate-700/60">
          <div>
            <span className="text-slate-500 block">Færdigvare MRDR:</span>
            <span className="font-bold text-white">{order.mrdrProduct}</span>
          </div>
          <div className="w-px h-6 bg-slate-700 hidden sm:block" />
          <div>
            <span className="text-slate-500 block">Etiketter (For/Bag):</span>
            <span className="font-bold text-white">{order.mrdrFrontLabel} / {order.mrdrBackLabel}</span>
          </div>
          <div className="w-px h-6 bg-slate-700 hidden sm:block" />
          <div>
            <span className="text-slate-500 block">Operatører:</span>
            <span className="font-bold text-white">{order.signature1.name} & {order.signature2.name}</span>
          </div>
        </div>

        {/* Handling */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Er du sikker på, at du vil afslutte denne produktionsordre?')) {
                completeOrder(order.id);
                onFinishOrder();
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all"
          >
            Afslut Ordre
          </button>
          <button
            onClick={onNewOrderClick}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-all"
          >
            Ny Ordre
          </button>
        </div>
      </div>

      {/* Stor iPad Action Banner: Tag næste tjek */}
      <div className={`rounded-2xl p-6 mb-8 border transition-all shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ${
        isCheckDue 
          ? 'bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500/50 shadow-amber-900/20 ring-2 ring-amber-500/30' 
          : 'bg-gradient-to-r from-slate-900 to-blue-950/50 border-slate-800 shadow-blue-950/20'
      }`}>
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg ${
            isCheckDue 
              ? 'bg-amber-500 text-slate-950 animate-bounce' 
              : 'bg-blue-600 text-white'
          }`}>
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                isCheckDue 
                  ? 'bg-amber-500 text-slate-950 font-black' 
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {isCheckDue ? 'Tid til kontrol!' : '20-minutters cyklus'}
              </span>
              <span className="text-xs text-slate-400">
                {order.checks?.length || 0} kontroller udført i dag
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              {isCheckDue ? 'Tag nyt CRQS fototjek nu' : `Næste kontrol anbefales om ${Math.max(0, 20 - minutesSinceLastCheck)} min`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Seneste kontrol: {minutesSinceLastCheck === 0 ? 'Lige nu' : `${minutesSinceLastCheck} minutter siden`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCheckModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black text-lg px-8 py-5 rounded-2xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
        >
          <Camera className="w-6 h-6" />
          Tag CRQS Tjek #{(order.checks?.length || 0) + 1}
        </button>
      </div>

      {/* Liste over udførte kontroller i denne ordre */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            Udførte Kontroller ({order.checks?.length || 0})
          </h3>
          <span className="text-xs text-slate-400">
            Automatisk synkroniseret og gemt
          </span>
        </div>

        {order.checks?.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-300">Ingen kontroller endnu</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Tryk på knappen foroven for at tage det første CRQS fototjek af produkterne.
            </p>
            <button
              onClick={() => setShowCheckModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              <PlusCircle className="w-4 h-4" /> Opret Tjek #1
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {order.checks.map((chk) => (
              <div
                key={chk.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col"
              >
                {/* Billede */}
                <div className="relative h-48 bg-slate-950 overflow-hidden group">
                  {chk.photoUrl ? (
                    <img
                      src={chk.photoUrl.startsWith('http') ? `/api/image?url=${encodeURIComponent(chk.photoUrl)}` : chk.photoUrl}
                      alt={`Tjek #${chk.checkNumber}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
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
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-slate-700/50">
                    Tjek #{chk.checkNumber}
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-1.5 border border-slate-700/50">
                    <Clock className="w-3 h-3 text-blue-400" /> {chk.timeFormatted}
                  </div>
                </div>

                {/* Indhold & Kontrolpunkter */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Status på de 6 parametre */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-slate-300 mb-3 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(chk.foretiket)} Foretiket
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(chk.bagetiket)} Bagetiket
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(chk.kapsel)} Kapsel
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(chk.flaske)} Flaske
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(chk.datokode)} Datokode
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(chk.karton)} Karton
                      </div>
                    </div>

                    {chk.comment && (
                      <p className="text-xs text-slate-300 italic bg-slate-800/20 p-2 rounded-lg border border-slate-800/60">
                        "{chk.comment}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(chk.timestamp).toLocaleDateString('da-DK')}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Godkendt
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCheckModal && (
        <CheckModal
          checkNumber={(order.checks?.length || 0) + 1}
          onSave={handleSaveCheck}
          onClose={() => setShowCheckModal(false)}
        />
      )}
    </div>
  );
};