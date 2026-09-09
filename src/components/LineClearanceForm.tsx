import React, { useState } from 'react';
import { ProductionOrder } from '../types/crqs';
import { CheckCircle2, AlertTriangle, ShieldCheck, Factory, PenTool, ArrowRight } from 'lucide-react';

interface Props {
  onOrderCreated: (order: ProductionOrder) => void;
  onCancel?: () => void;
}

export const LineClearanceForm: React.FC<Props> = ({ onOrderCreated, onCancel }) => {
  const [line, setLine] = useState<'Thor (L1)' | 'Sif (L2)' | 'Loke (L5)'>('Sif (L2)');
  const [leaktestBottles, setLeaktestBottles] = useState<number>(0);
  const [lineCleared, setLineCleared] = useState<boolean>(true);
  const [cleanMatrixUsed, setCleanMatrixUsed] = useState<boolean>(true);
  const [liquidCheckConfirmed, setLiquidCheckConfirmed] = useState<boolean>(true);
  
  const [orderNumber, setOrderNumber] = useState('');
  const [mrdrProduct, setMrdrProduct] = useState('');
  const [mrdrFrontLabel, setMrdrFrontLabel] = useState('');
  const [mrdrBackLabel, setMrdrBackLabel] = useState('');
  const [mrdrCartonTray, setMrdrCartonTray] = useState('');
  const [mrdrBottles, setMrdrBottles] = useState('');
  const [mrdrLiquid, setMrdrLiquid] = useState('');
  const [tankNumber, setTankNumber] = useState('');
  
  const [operator1, setOperator1] = useState('');
  const [operator2, setOperator2] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!orderNumber.trim()) newErrors.orderNumber = 'Ordrenummer er påkrævet';
    if (!mrdrProduct.trim()) newErrors.mrdrProduct = 'MRDR færdigvare er påkrævet';
    if (!mrdrFrontLabel.trim()) newErrors.mrdrFrontLabel = 'MRDR forsideetiket er påkrævet';
    if (!mrdrBackLabel.trim()) newErrors.mrdrBackLabel = 'MRDR bagetiket er påkrævet';
    if (!lineCleared) newErrors.lineCleared = 'Linjen skal være ryddet før start';
    if (!liquidCheckConfirmed) newErrors.liquidCheckConfirmed = 'Væskekontrol skal bekræftes af 2 personer';
    if (!operator1.trim()) newErrors.operator1 = '1. person skal kvittere';
    if (!operator2.trim()) newErrors.operator2 = '2. person skal kvittere';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const now = new Date().toISOString();
    onOrderCreated({
      id: 'ord-' + Date.now(),
      createdAt: now,
      status: 'active',
      line,
      leaktestBottles: Number(leaktestBottles) || 0,
      lineCleared,
      cleanMatrixUsed,
      liquidCheckConfirmed,
      orderNumber,
      mrdrProduct,
      mrdrFrontLabel,
      mrdrBackLabel,
      mrdrCartonTray,
      mrdrBottles,
      mrdrLiquid,
      tankNumber,
      signature1: { name: operator1, timestamp: now },
      signature2: { name: operator2, timestamp: now },
      checks: []
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl mb-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/30">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Line Clearance & Materialetjek</h1>
              <p className="text-sm text-slate-400">Trin 1 af 2: Opret ordre og frigiv linjen til produktion</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Dato/Tid sættes automatisk
          </span>
        </div>

        <form onSubmit={validateAndSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Hvilken linje er du på? *</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Thor (L1)', 'Sif (L2)', 'Loke (L5)'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLine(l)}
                  className={`py-3.5 px-4 rounded-xl font-semibold text-center border transition-all text-base ${
                    line === l
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-[1.02]'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Antal utætte flasker fra Leaktest *
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              value={leaktestBottles}
              onChange={(e) => setLeaktestBottles(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-3 bg-slate-800/40 p-5 rounded-xl border border-slate-800">
            <label
              onClick={() => setLineCleared(!lineCleared)}
              className="flex items-start gap-3.5 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={lineCleared}
                onChange={() => {}}
                className="w-6 h-6 mt-0.5 accent-blue-600 rounded"
              />
              <span className="text-sm text-slate-200">
                <strong>Er linjen ryddet for tidligere materiale?</strong> Har du anvendt rengøringsmatrix ved produktskift? *
              </span>
            </label>
            {errors.lineCleared && <p className="text-xs text-rose-400 font-semibold">{errors.lineCleared}</p>}

            <label
              onClick={() => setLiquidCheckConfirmed(!liquidCheckConfirmed)}
              className="flex items-start gap-3.5 cursor-pointer select-none pt-3 border-t border-slate-800/60"
            >
              <input
                type="checkbox"
                checked={liquidCheckConfirmed}
                onChange={() => {}}
                className="w-6 h-6 mt-0.5 accent-blue-600 rounded"
              />
              <span className="text-sm text-slate-200">
                <strong>Tjek sammen med blanderi-operatør:</strong> Er den korrekte væske i tanken? <em>(Tankskift skal altid kontrolleres af 2 personer!) *</em>
              </span>
            </label>
            {errors.liquidCheckConfirmed && <p className="text-xs text-rose-400 font-semibold">{errors.liquidCheckConfirmed}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Ordrenummer *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="f.eks. 849201"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.orderNumber ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {errors.orderNumber && <p className="text-xs text-rose-400 mt-1">{errors.orderNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Tank nummer
              </label>
              <input
                type="text"
                placeholder="f.eks. L2A eller Tank 3"
                value={tankNumber}
                onChange={(e) => setTankNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                MRDR for færdigvare *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="f.eks. 67890123"
                value={mrdrProduct}
                onChange={(e) => setMrdrProduct(e.target.value)}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.mrdrProduct ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {errors.mrdrProduct && <p className="text-xs text-rose-400 mt-1">{errors.mrdrProduct}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                MRDR for forsidespejl (etiket) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="f.eks. 201948"
                value={mrdrFrontLabel}
                onChange={(e) => setMrdrFrontLabel(e.target.value)}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.mrdrFrontLabel ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {errors.mrdrFrontLabel && <p className="text-xs text-rose-400 mt-1">{errors.mrdrFrontLabel}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                MRDR for bagsideetiket *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="f.eks. 201949"
                value={mrdrBackLabel}
                onChange={(e) => setMrdrBackLabel(e.target.value)}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.mrdrBackLabel ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {errors.mrdrBackLabel && <p className="text-xs text-rose-400 mt-1">{errors.mrdrBackLabel}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                MRDR Flasker
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Valgfri"
                value={mrdrBottles}
                onChange={(e) => setMrdrBottles(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                MRDR Karton eller bakke
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Valgfri"
                value={mrdrCartonTray}
                onChange={(e) => setMrdrCartonTray(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                MRDR Væske
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Valgfri"
                value={mrdrLiquid}
                onChange={(e) => setMrdrLiquid(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
              <PenTool className="w-4 h-4" />
              <h3>Underskrift & Godkendelse (2 Personer på linjen)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">1. Person (Navn / Initialer) *</label>
                <input
                  type="text"
                  placeholder="f.eks. Thomas"
                  value={operator1}
                  onChange={(e) => setOperator1(e.target.value)}
                  className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.operator1 ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {errors.operator1 && <p className="text-xs text-rose-400 mt-1">{errors.operator1}</p>}
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">2. Person (Navn / Initialer) *</label>
                <input
                  type="text"
                  placeholder="f.eks. Hoang"
                  value={operator2}
                  onChange={(e) => setOperator2(e.target.value)}
                  className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.operator2 ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {errors.operator2 && <p className="text-xs text-rose-400 mt-1">{errors.operator2}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
              >
                Annuller
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-blue-600/30 text-lg transition-all scale-[1.01] active:scale-[0.99]"
            >
              Start Ordre & Gå til CRQS
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};