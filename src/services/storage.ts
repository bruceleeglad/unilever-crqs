import { ProductionOrder, CrqsCheck } from '../types/crqs';

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

export const saveOrders = (orders: ProductionOrder[]) => {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    // Synkroniser automatisk til skyen i baggrunden
    syncOrdersToCloud(orders);
  } catch (e) {
    console.warn('LocalStorage save failed, attempting quota cleanup:', e);
    try {
      // Hvis localStorage er fyldt op (typisk pga. mange base64 billeder på iPad),
      // rens store base64-strenge fra ældre tjek så appen aldrig crasher!
      const sanitizedOrders = orders.map(order => ({
        ...order,
        checks: (order.checks || []).map((chk, idx) => {
          // Behold det nyeste tjek som det er, men erstat store base64 på ældre checks
          if (idx > 2 && chk.photoUrl && chk.photoUrl.startsWith('data:image')) {
            return { ...chk, photoUrl: '/unilever-guide.jpg' };
          }
          return chk;
        })
      }));
      localStorage.setItem(ORDERS_KEY, JSON.stringify(sanitizedOrders));
      syncOrdersToCloud(sanitizedOrders);
    } catch (retryError) {
      console.error('Fatal LocalStorage save error:', retryError);
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
