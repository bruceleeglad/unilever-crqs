import React, { useState, useRef } from 'react';
import { QualityRating } from '../types/crqs';
import { Camera, Check, AlertTriangle, XCircle, Clock, X, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  checkNumber: number;
  onSave: (checkData: {
    foretiket: QualityRating;
    bagetiket: QualityRating;
    kapsel: QualityRating;
    flaske: QualityRating;
    datokode: QualityRating;
    karton: QualityRating;
    comment: string;
    photoUrl?: string;
  }) => void;
  onClose: () => void;
}

export const CheckModal: React.FC<Props> = ({ checkNumber, onSave, onClose }) => {
  const [foretiket, setForetiket] = useState<QualityRating>('green');
  const [bagetiket, setBagetiket] = useState<QualityRating>('green');
  const [kapsel, setKapsel] = useState<QualityRating>('green');
  const [flaske, setFlaske] = useState<QualityRating>('green');
  const [datokode, setDatokode] = useState<QualityRating>('green');
  const [karton, setKarton] = useState<QualityRating>('green');
  
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTime = new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const scaleSize = MAX_WIDTH / img.width;
        const w = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        const h = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
        
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoPreview(compressedBase64);
        setPhotoUrl(compressedBase64);

        // Upload til skyen så chefen på en anden PC kan se billedet direkte
        try {
          setIsUploadingPhoto(true);
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            try {
              const formData = new FormData();
              formData.append('reqtype', 'fileupload');
              formData.append('time', '72h');
              formData.append('fileToUpload', blob, `crqs-${Date.now()}.jpg`);

              const uploadRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
                method: 'POST',
                body: formData
              });
              if (uploadRes.ok) {
                const cloudUrl = await uploadRes.text();
                if (cloudUrl && cloudUrl.startsWith('http')) {
                  setPhotoUrl(cloudUrl.trim());
                }
              }
            } catch (err) {
              console.warn('Billed-upload til skyen mislykkedes, bruger lokalt komprimeret billede:', err);
            } finally {
              setIsUploadingPhoto(false);
            }
          }, 'image/jpeg', 0.85);
        } catch (e) {
          setIsUploadingPhoto(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const setAllGreen = () => {
    setForetiket('green');
    setBagetiket('green');
    setKapsel('green');
    setFlaske('green');
    setDatokode('green');
    setKarton('green');
  };

  const handleSave = () => {
    const defaultPhoto = '/unilever-guide.jpg';
    onSave({
      foretiket,
      bagetiket,
      kapsel,
      flaske,
      datokode,
      karton,
      comment: comment || 'Kontrol udført.',
      photoUrl: photoUrl || defaultPhoto
    });

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch (e) {}
  };

  const renderTrafficLight = (
    label: string,
    value: QualityRating,
    onChange: (val: QualityRating) => void
  ) => {
    return (
      <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
        <span className="font-medium text-slate-200 text-base">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange('green')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
              value === 'green'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-300'
                : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Check className="w-4 h-4" /> Grøn
          </button>
          <button
            type="button"
            onClick={() => onChange('yellow')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
              value === 'yellow'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-300'
                : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Gul
          </button>
          <button
            type="button"
            onClick={() => onChange('red')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
              value === 'red'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105 ring-2 ring-rose-300'
                : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <XCircle className="w-4 h-4" /> Rød
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
              #{checkNumber}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">CRQS Kontrol #{checkNumber}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Registrering kl. {currentTime} (automatisk sat)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Kamera Sektion - iPad Tilpasset */}
          <div className="bg-slate-800/60 border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center relative overflow-hidden">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="CRQS Preview"
                  className="max-h-56 mx-auto rounded-xl shadow-lg object-cover border border-slate-600"
                />
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow"
                  >
                    <Camera className="w-4 h-4" /> Tag nyt billede
                  </button>
                  {isUploadingPhoto ? (
                    <span className="text-xs text-amber-400 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span> Synkroniserer billede til skyen...
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Billede klar til PC & iPad
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer py-6 px-4 flex flex-col items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-all border border-blue-500/30">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Tag billede med iPad</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Stil 2 flasker ved siden af hinanden så forside og bagside ses samtidigt (se guide herunder).
                </p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <img 
                    src="/unilever-guide.jpg" 
                    alt="Guide opstilling" 
                    className="h-20 w-auto rounded-lg border border-slate-600 object-cover shadow"
                    title="Eksempel fra produktionen"
                  />
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-600/30 group-hover:bg-blue-500">
                    Åbn Kamera Nu
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Hurtig-handling: Sæt alle Grøn */}
          <div className="flex items-center justify-between pt-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Kvalitetskontrol
            </h4>
            <button
              type="button"
              onClick={setAllGreen}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Sæt alle til Grøn
            </button>
          </div>

          {/* 6 Kontrolpunkter */}
          <div className="space-y-2.5">
            {renderTrafficLight('Foretiket', foretiket, setForetiket)}
            {renderTrafficLight('Bagetiket', bagetiket, setBagetiket)}
            {renderTrafficLight('Kapsel', kapsel, setKapsel)}
            {renderTrafficLight('Flaske', flaske, setFlaske)}
            {renderTrafficLight('Datokode', datokode, setDatokode)}
            {renderTrafficLight('Karton', karton, setKarton)}
          </div>

          {/* Kommentar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Kommentar (valgfri ved grøn, anbefalet ved gul/rød)
            </label>
            <input
              type="text"
              placeholder="f.eks. Lidt luftbobler på venstre kant, rettet..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-800/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-sm"
          >
            Annuller
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 text-base transition-all"
          >
            <Check className="w-5 h-5" /> Gem Tjek #{checkNumber}
          </button>
        </div>

      </div>
    </div>
  );
};