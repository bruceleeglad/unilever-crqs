import React, { useState, useRef } from 'react';
import { Camera, X, Check, UploadCloud, AlertCircle, Package } from 'lucide-react';
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
  const [unit, setUnit] = useState<PalletItem['unit']>('kasser');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [registeredBy, setRegisteredBy] = useState('');
  const [note, setNote] = useState('');

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0, w, h);
        }

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
        setPhotoPreview(compressedBase64);
        setPhotoUrl(compressedBase64);

        try {
          setIsUploadingPhoto(true);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: compressedBase64,
              filename: `pallet-${Date.now()}.jpg`
            })
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            if (data && data.url) {
              setPhotoUrl(data.url);
            }
          }
        } catch (err) {
          console.warn('Pallet photo upload fallback to local:', err);
        } finally {
          setIsUploadingPhoto(false);
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Registrer Palle på Lageret</h3>
              <p className="text-xs text-slate-400">Paller der ikke kan scannes i SAP (udgåede / ældre varer)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Foto Sektion */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Foto af Palleseddel / Palle
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800 max-h-48 flex items-center justify-center">
                <img src={photoPreview} alt="Palle preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 shadow"
                >
                  <Camera className="w-3.5 h-3.5" /> Skift Foto
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-5 text-center bg-slate-800/30 hover:bg-slate-800/60 transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Tag foto af pallesedlen</span>
                  <p className="text-xs text-slate-400 mt-0.5">Brug iPad/mobil kamera så driftschefen kan se mærket</p>
                </div>
              </div>
            )}
          </div>

          {/* Lokation og Gammelt Varenummer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Lokation på lageret *
              </label>
              <input
                type="text"
                placeholder="f.eks. REOL B-12 eller BUFFER SYD"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 uppercase font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Gammelt Varenummer / MRDR *
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="f.eks. 67182944"
                value={oldItemNumber}
                onChange={(e) => setOldItemNumber(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Varebeskrivelse */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Varebeskrivelse / Indhold *
            </label>
            <input
              type="text"
              placeholder="f.eks. Knorr Flasker 250ml klar, gamle kapsler osv."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Mængde og Enhed */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Mængde / Antal
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="f.eks. 48"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Enhed
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="kasser">Kasser</option>
                <option value="stk">Stk</option>
                <option value="paller">Paller</option>
                <option value="kg">Kg</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Batch / Lot Nr.
              </label>
              <input
                type="text"
                placeholder="f.eks. L-4091"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>
          </div>

          {/* Udløb og Registreret af */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Udløbsdato (hvis angivet)
              </label>
              <input
                type="text"
                placeholder="f.eks. MM/YYYY eller DD/MM/YYYY"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Registreret af (Navn / Initialer)
              </label>
              <input
                type="text"
                placeholder="f.eks. Hans (Lager)"
                value={registeredBy}
                onChange={(e) => setRegisteredBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Note / Driftschef kommentar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Bemærkning / Hvorfor er den udgået?
            </label>
            <textarea
              rows={2}
              placeholder="f.eks. Emballagen har gammelt design, afventer afklaring om ommærkning eller skrot..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-sm"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={isUploadingPhoto}
              className={`flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl shadow-lg text-sm transition-all ${
                isUploadingPhoto
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black shadow-amber-500/20'
              }`}
            >
              {isUploadingPhoto ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Uploader foto...</span>
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
