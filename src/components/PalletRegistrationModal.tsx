import React, { useState, useRef } from 'react';
import { Camera, X, Check, Package, Sparkles, Loader2, MapPin, Hash, FileText } from 'lucide-react';
import { PalletItem } from '../types/crqs';

interface Props {
  onClose: () => void;
  onSave: (pallet: Omit<PalletItem, 'id' | 'palletNumber' | 'registeredAt'>) => void;
}

export const PalletRegistrationModal: React.FC<Props> = ({ onClose, onSave }) => {
  const [location, setLocation] = useState('');
  const [oldItemNumber, setOldItemNumber] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState<PalletItem['unit']>('stk');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [registeredBy, setRegisteredBy] = useState('');
  const [note, setNote] = useState('');

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isAnalyzingOCR, setIsAnalyzingOCR] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  const quickLocations = ['BUFFER SYD', 'BUFFER NORD', 'REOL A', 'REOL B', 'KARANTÆNE'];

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 960;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
        }

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        setPhotoPreview(compressedBase64);
        setPhotoUrl(compressedBase64);

        setIsUploadingPhoto(true);
        setIsAnalyzingOCR(true);
        setOcrSuccessMsg(null);

        try {
          const uploadPromise = fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: compressedBase64,
              filename: `pallet-${Date.now()}.jpg`
            })
          }).then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data && data.url) setPhotoUrl(data.url);
            }
          }).catch(err => console.warn('Upload fallback:', err));

          const ocrPromise = fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: compressedBase64 })
          }).then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data && data.parsed) {
                const p = data.parsed;
                let foundAny = false;
                if (p.oldItemNumber) {
                  setOldItemNumber(p.oldItemNumber);
                  foundAny = true;
                }
                if (p.description) {
                  setDescription(p.description);
                  foundAny = true;
                }
                if (p.quantity) {
                  setQuantity(p.quantity);
                  foundAny = true;
                }
                if (p.batchNumber) {
                  setBatchNumber(p.batchNumber);
                  foundAny = true;
                }
                if (p.expiryDate) {
                  setExpiryDate(p.expiryDate);
                  foundAny = true;
                }

                if (foundAny) {
                  setOcrSuccessMsg('Data udlæst automatisk fra pallesedlen!');
                }
              }
            }
          }).catch(err => console.warn('OCR error:', err));

          await Promise.allSettled([uploadPromise, ocrPromise]);
        } finally {
          setIsUploadingPhoto(false);
          setIsAnalyzingOCR(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !oldItemNumber.trim() || !description.trim()) {
      alert('Udfyld venligst lokation, gammelt varenummer og beskrivelse.');
      return;
    }

    onSave({
      location: location.trim().toUpperCase(),
      oldItemNumber: oldItemNumber.trim(),
      description: description.trim(),
      quantity: Number(quantity) || 1,
      unit,
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      photoUrl: photoUrl || undefined,
      status: 'investigating',
      note: note.trim() || undefined,
      registeredBy: registeredBy.trim() || 'Lager / Operatør'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-t sm:border border-slate-700 w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        
        {/* Header - Mobil tilpasset med drag-indikator */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Registrer Palle</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-Scan
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">Palle udenfor SAP (udgået / ukendt)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Touch & Mobil Optimeret */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          
          {/* Foto & Auto-Scan Sektion */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Foto af Palleseddel
              </label>
              {isAnalyzingOCR && (
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Udlæser seddel...
                </span>
              )}
            </div>

            <input
              id="pallet-camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="sr-only"
            />

            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-h-48 flex items-center justify-center">
                <img src={photoPreview} alt="Palle preview" className="w-full h-48 object-contain bg-slate-950" />
                <label
                  htmlFor="pallet-camera-input"
                  className="cursor-pointer absolute bottom-2.5 right-2.5 bg-slate-900/90 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 shadow-lg active:scale-95"
                >
                  <Camera className="w-4 h-4" /> Tag nyt foto
                </label>
              </div>
            ) : (
              <label
                htmlFor="pallet-camera-input"
                className="cursor-pointer border-2 border-dashed border-amber-500/50 hover:border-amber-400 rounded-2xl p-5 text-center bg-amber-500/5 hover:bg-amber-500/10 transition-all flex flex-col items-center justify-center gap-2 group block active:bg-amber-500/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                    Tryk for at tage foto af sedlen
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kameraet aflæser automatisk varenummer, OMO/Knorr og antal!
                  </p>
                </div>
              </label>
            )}

            {ocrSuccessMsg && (
              <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{ocrSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Lokation med Hurtig-Knapper */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Lokation på lageret *
              </label>
              <span className="text-[11px] text-slate-500">Hvor står den?</span>
            </div>
            <input
              type="text"
              placeholder="f.eks. REOL B-12 eller BUFFER SYD"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-amber-500 uppercase font-black"
            />
            {/* Quick-chips for mobil */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    location === loc
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Gammelt Varenummer & Beskrivelse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Gammelt Varenummer / MRDR *
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="f.eks. 65644425"
                value={oldItemNumber}
                onChange={(e) => setOldItemNumber(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-amber-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Varebeskrivelse / Indhold *
              </label>
              <input
                type="text"
                placeholder="f.eks. OMO COLOR COLSENS 5X1840ML"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm sm:text-base focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Mængde & Enhed */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Mængde / Antal
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="f.eks. 720"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-amber-500 font-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Enhed
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="stk">Stk</option>
                <option value="kasser">Kasser</option>
                <option value="paller">Paller</option>
                <option value="kg">Kg</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Batch / Ordre Ref.
              </label>
              <input
                type="text"
                placeholder="f.eks. 2929627-0"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:ring-2 focus:ring-amber-500 uppercase font-mono"
              />
            </div>
          </div>

          {/* Udløb og Registreret af */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Dato fra seddel (Udløb/Lev.)
              </label>
              <input
                type="text"
                placeholder="f.eks. 25.08.26"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Registreret af
              </label>
              <input
                type="text"
                placeholder="f.eks. Operatør / Lager"
                value={registeredBy}
                onChange={(e) => setRegisteredBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Bemærkning (valgfri)
            </label>
            <textarea
              rows={2}
              placeholder="f.eks. Udgået emballage, afventer afklaring..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Footer Knapper - Store touch-knapper til mobil */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-sm text-center active:scale-95"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={isUploadingPhoto || isAnalyzingOCR}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 font-black px-7 py-3.5 rounded-xl shadow-lg text-sm transition-all active:scale-95 ${
                isUploadingPhoto || isAnalyzingOCR
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isUploadingPhoto || isAnalyzingOCR ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{isAnalyzingOCR ? 'Udlæser...' : 'Uploader...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Gem Palle
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
