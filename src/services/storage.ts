import { ProductionOrder, CrqsCheck } from '../types/crqs';

const ORDERS_KEY = 'unilever_crqs_orders_v1';
const ACTIVE_ORDER_ID_KEY = 'unilever_crqs_active_order_id';

const INITIAL_ORDERS: ProductionOrder[] = [
  {
    id: 'ord-101',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'active',
    line: 'Sif (L2)',
    leaktestBottles: 0,
    lineCleared: true,
    cleanMatrixUsed: true,
    liquidCheckConfirmed: true,
    orderNumber: '849201',
    mrdrProduct: '67890123',
    mrdrFrontLabel: '201948',
    mrdrBackLabel: '201949',
    mrdrCartonTray: '40192',
    mrdrBottles: '50182',
    mrdrLiquid: '10928',
    tankNumber: 'L2A',
    signature1: { name: 'Thomas', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
    signature2: { name: 'Hoang', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
    checks: [
      {
        id: 'chk-1',
        checkNumber: 1,
        timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        timeFormatted: '04:00',
        foretiket: 'green',
        bagetiket: 'green',
        kapsel: 'green',
        flaske: 'green',
        datokode: 'green',
        karton: 'green',
        comment: 'Opstart fejlfri. Etiketter lige.',
        photoUrl: '/unilever-guide.jpg'
      },
      {
        id: 'chk-2',
        checkNumber: 2,
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        timeFormatted: '04:20',
        foretiket: 'green',
        bagetiket: 'yellow',
        kapsel: 'green',
        flaske: 'green',
        datokode: 'green',
        karton: 'green',
        comment: 'Lille skævhed på bagetiket justeret på rullen.',
        photoUrl: '/unilever-guide.jpg'
      },
      {
        id: 'chk-3',
        checkNumber: 3,
        timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
        timeFormatted: '04:40',
        foretiket: 'green',
        bagetiket: 'green',
        kapsel: 'green',
        flaske: 'green',
        datokode: 'green',
        karton: 'green',
        comment: 'Perfekt.',
        photoUrl: '/unilever-guide.jpg'
      }
    ]
  }
];

export const getStoredOrders = (): ProductionOrder[] => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load orders', e);
    return INITIAL_ORDERS;
  }
};

export const saveOrders = (orders: ProductionOrder[]) => {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders', e);
  }
};

export const getActiveOrderId = (): string | null => {
  return localStorage.getItem(ACTIVE_ORDER_ID_KEY) || (INITIAL_ORDERS[0] ? INITIAL_ORDERS[0].id : null);
};

export const setActiveOrderId = (id: string | null) => {
  if (id) {
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
