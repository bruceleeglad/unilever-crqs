export type QualityRating = 'green' | 'yellow' | 'red';

export interface CrqsCheck {
  id: string;
  checkNumber: number;
  timestamp: string;
  timeFormatted: string;
  foretiket: QualityRating;
  bagetiket: QualityRating;
  kapsel: QualityRating;
  flaske: QualityRating;
  datokode: QualityRating;
  karton: QualityRating;
  comment?: string;
  photoUrl?: string;
}

export interface ProductionOrder {
  id: string;
  createdAt: string;
  status: 'active' | 'completed';
  line: 'Thor (L1)' | 'Sif (L2)' | 'Loke (L5)';
  leaktestBottles: number;
  lineCleared: boolean;
  cleanMatrixUsed: boolean;
  liquidCheckConfirmed: boolean;
  orderNumber: string;
  mrdrProduct: string;
  mrdrFrontLabel: string;
  mrdrBackLabel: string;
  mrdrCartonTray?: string;
  mrdrBottles?: string;
  mrdrLiquid?: string;
  tankNumber?: string;
  signature1: {
    name: string;
    signatureData?: string;
    timestamp: string;
  };
  signature2: {
    name: string;
    signatureData?: string;
    timestamp: string;
  };
  checks: CrqsCheck[];
}

export type PalletStatus = 'investigating' | 'ready_relabel' | 'scrap' | 'resolved';

export interface PalletItem {
  id: string; // f.eks. PAL-2026-001
  palletNumber: string; // Internt pallenr
  location: string; // f.eks. "Reol B-14, Plads 3" eller "Buffer Syd"
  oldItemNumber: string; // Gammelt varenummer / udgået MRDR
  newItemNumber?: string; // Nyt tildelt SAP-nummer (hvis fundet)
  description: string; // f.eks. "Knorr Flasker 250ml klar"
  quantity: number; // Antal
  unit: 'kasser' | 'stk' | 'kg' | 'paller';
  batchNumber?: string; // Batch / Lot
  expiryDate?: string; // Udløb YYYY-MM
  photoUrl?: string; // Foto af palleseddel/palle
  status: PalletStatus;
  note?: string; // Kommentar/afklaring
  registeredBy: string; // Operatør / Lagermand
  registeredAt: string; // ISO dato
  updatedAt?: string;
}

