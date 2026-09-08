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
