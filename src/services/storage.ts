import { ProductionOrder, CrqsCheck, PalletItem } from '../types/crqs';

const ORDERS_KEY = 'unilever_crqs_orders_v1';
const ACTIVE_ORDER_ID_KEY = 'unilever_crqs_active_order_id';

const INITIAL_ORDERS: ProductionOrder[] = [];

export const getStoredOrders = (): ProductionOrder[] => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: ProductionOrder[] = JSON.parse(raw);
    const cleaned = parsed.filter(o => o.id !== 'ord-101');
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Failed to load orders', e);
    return [];
  }
};

// Hent de seneste ordrer fra skyen (så chefen ser iPad'ens oprettelser og checks i realtid)
export const fetchCloudOrders = async (): Promise<ProductionOrder[]> => {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.orders)) {
        const cloudOrders: ProductionOrder[] = data.orders.filter((o: any) => o && o.id !== 'ord-101');
        const local = getStoredOrders();

        if (cloudOrders.length > 0) {
          // Flet lokale ordrer med cloud-ordrer (hvis en enhed har oprettet nye tjek lokalt)
          const orderMap = new Map<string, ProductionOrder>();
          
          // Først cloud ordrer
          cloudOrders.forEach(o => orderMap.set(o.id, o));

          // Sammenlign med lokale: Hvis lokalt har flere checks for samme ordre, brug den mest opdaterede
          local.forEach(loc => {
            const existing = orderMap.get(loc.id);
            if (!existing) {
              orderMap.set(loc.id, loc);
            } else if ((loc.checks?.length || 0) > (existing.checks?.length || 0)) {
              orderMap.set(loc.id, loc);
            }
          });

          const merged = Array.from(orderMap.values());
          localStorage.setItem(ORDERS_KEY, JSON.stringify(merged));
          return merged;
        } else if (local.length > 0) {
          // Hvis skyen er tom, upload de eksisterende lokale ordrer
          await syncOrdersToCloud(local);
          return local;
        }
      }
    }
  } catch (e) {
    console.warn('Cloud sync offline or unavailable, using local cache:', e);
  }
  return getStoredOrders();
};

export const syncOrdersToCloud = async (orders: ProductionOrder[]) => {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders })
    });
  } catch (e) {
    console.warn('Failed to sync orders to cloud:', e);
  }
};

// Hjælpefunktion: strip enorme base64 data-strenge fra tjek, så localStorage aldrig sprænges på iPad
const sanitizeOrdersForLocalStorage = (orders: ProductionOrder[]): ProductionOrder[] => {
  return orders.map(order => ({
    ...order,
    checks: (order.checks || []).map((chk, idx) => {
      // Hvis et billede er en rå base64 og ikke er det absolut nyeste tjek, eller hvis det er ældre,
      // erstattes det med placeholder eller sky-url så hukommelsen holdes minimal.
      if (chk.photoUrl && chk.photoUrl.startsWith('data:image')) {
        if (idx > 0) {
          return { ...chk, photoUrl: '/unilever-guide.jpg' };
        }
      }
      return chk;
    })
  }));
};

export const saveOrders = (orders: ProductionOrder[]) => {
  // Synkroniser altid de fulde ordrer til skyen i baggrunden
  syncOrdersToCloud(orders);

  try {
    const sanitized = sanitizeOrdersForLocalStorage(orders);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('LocalStorage save failed, applying aggressive cleanup:', e);
    try {
      // Ekstrem oprydning hvis kvoten er nået: fjern alle base64 billeder fra localStorage
      const ultraClean = orders.map(order => ({
        ...order,
        checks: (order.checks || []).map(chk => ({
          ...chk,
          photoUrl: chk.photoUrl?.startsWith('http') ? chk.photoUrl : '/unilever-guide.jpg'
        }))
      }));
      localStorage.setItem(ORDERS_KEY, JSON.stringify(ultraClean));
    } catch (retryError) {
      console.warn('LocalStorage unavailable or full, operating in-memory:', retryError);
    }
  }
};

export const getActiveOrderId = (): string | null => {
  const stored = localStorage.getItem(ACTIVE_ORDER_ID_KEY);
  if (stored === 'ord-101') {
    localStorage.removeItem(ACTIVE_ORDER_ID_KEY);
    return null;
  }
  return stored;
};

export const setActiveOrderId = (id: string | null) => {
  if (id && id !== 'ord-101') {
    localStorage.setItem(ACTIVE_ORDER_ID_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_ORDER_ID_KEY);
  }
};

export const addCheckToOrder = (orderId: string, check: Omit<CrqsCheck, 'id' | 'checkNumber' | 'timestamp' | 'timeFormatted'> & { customTime?: string }): ProductionOrder | null => {
  const orders = getStoredOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  const now = new Date();
  const timeFormatted = check.customTime || now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  
  const newCheck: CrqsCheck = {
    id: 'chk-' + Date.now(),
    checkNumber: (orders[index].checks?.length || 0) + 1,
    timestamp: now.toISOString(),
    timeFormatted,
    foretiket: check.foretiket,
    bagetiket: check.bagetiket,
    kapsel: check.kapsel,
    flaske: check.flaske,
    datokode: check.datokode,
    karton: check.karton,
    comment: check.comment,
    photoUrl: check.photoUrl
  };

  orders[index].checks = [newCheck, ...(orders[index].checks || [])];
  saveOrders(orders);
  return orders[index];
};

export const createNewOrder = (orderData: Omit<ProductionOrder, 'id' | 'createdAt' | 'status' | 'checks'>): ProductionOrder => {
  const orders = getStoredOrders();
  const newOrder: ProductionOrder = {
    ...orderData,
    id: 'ord-' + Date.now(),
    createdAt: new Date().toISOString(),
    status: 'active',
    checks: []
  };
  const updated = [newOrder, ...orders];
  saveOrders(updated);
  setActiveOrderId(newOrder.id);
  return newOrder;
};

export const completeOrder = (orderId: string) => {
  const orders = getStoredOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].status = 'completed';
    saveOrders(orders);
  }
  if (getActiveOrderId() === orderId) {
    setActiveOrderId(null);
  }
};

// ==========================================
// PALLELAGER / KARANTÆNE SERVICES
// ==========================================
const PALLETS_KEY = 'unilever_pallet_inventory_v1';

export const getStoredPallets = (): PalletItem[] => {
  try {
    const raw = localStorage.getItem(PALLETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read pallets from localStorage:', e);
    return [];
  }
};

export const syncPalletsToCloud = async (pallets: PalletItem[]) => {
  try {
    await fetch('/api/pallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pallets })
    });
  } catch (e) {
    console.warn('Failed to sync pallets to cloud:', e);
  }
};

export const fetchCloudPallets = async (): Promise<PalletItem[]> => {
  try {
    const res = await fetch('/api/pallets');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.pallets)) {
        const cloudPallets: PalletItem[] = data.pallets;
        const local = getStoredPallets();

        if (cloudPallets.length > 0) {
          const map = new Map<string, PalletItem>();
          cloudPallets.forEach(p => map.set(p.id, p));
          local.forEach(l => {
            if (!map.has(l.id)) {
              map.set(l.id, l);
            }
          });
          const merged = Array.from(map.values());
          localStorage.setItem(PALLETS_KEY, JSON.stringify(merged));
          return merged;
        } else if (local.length > 0) {
          await syncPalletsToCloud(local);
          return local;
        }
      }
    }
  } catch (e) {
    console.warn('Pallets cloud sync unavailable, using local cache:', e);
  }
  return getStoredPallets();
};

export const savePallets = (pallets: PalletItem[]) => {
  try {
    localStorage.setItem(PALLETS_KEY, JSON.stringify(pallets));
    syncPalletsToCloud(pallets);
  } catch (e) {
    console.warn('LocalStorage save pallets failed:', e);
  }
};

export const registerPallet = (palletData: Omit<PalletItem, 'id' | 'palletNumber' | 'registeredAt'>): PalletItem => {
  const pallets = getStoredPallets();
  const nextNum = pallets.length + 1;
  const palletNumber = `PAL-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
  
  const newPallet: PalletItem = {
    ...palletData,
    id: 'pal-' + Date.now(),
    palletNumber,
    registeredAt: new Date().toISOString()
  };

  const updated = [newPallet, ...pallets];
  savePallets(updated);
  return newPallet;
};

export const updatePalletStatus = (id: string, status: PalletItem['status'], note?: string, newItemNumber?: string): PalletItem | null => {
  const pallets = getStoredPallets();
  const index = pallets.findIndex(p => p.id === id);
  if (index === -1) return null;

  pallets[index] = {
    ...pallets[index],
    status,
    ...(note !== undefined ? { note } : {}),
    ...(newItemNumber !== undefined ? { newItemNumber } : {}),
    updatedAt: new Date().toISOString()
  };

  savePallets(pallets);
  return pallets[index];
};

