import React, { useState, useEffect } from 'react';
import { ProductionOrder } from './types/crqs';
import { getStoredOrders, getActiveOrderId, saveOrders, setActiveOrderId } from './services/storage';
import { LineClearanceForm } from './components/LineClearanceForm';
import { ActiveOrderView } from './components/ActiveOrderView';
import { ManagementDashboard } from './components/ManagementDashboard';
import { Tablet, LayoutDashboard, Plus, Factory, CheckCircle2, ShieldCheck } from 'lucide-react';

export function App() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [activeOrderId, setActiveId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'operator' | 'management'>('operator');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  useEffect(() => {
    const loaded = getStoredOrders();
    setOrders(loaded);
    const active = getActiveOrderId();
    setActiveId(active);
    if (!active) {
      // Find den første aktive hvis en findes
      const firstActive = loaded.find(o => o.status === 'active');
      if (firstActive) {
        setActiveId(firstActive.id);
        setActiveOrderId(firstActive.id);
      }
    }
  }, []);

  const activeOrder = orders.find(o => o.id === activeOrderId);

  const handleOrderCreated = (newOrder: ProductionOrder) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    saveOrders(updated);
    setActiveId(newOrder.id);
    setActiveOrderId(newOrder.id);
    setIsCreatingNew(false);
    setCurrentView('operator');
  };

  const handleOrderUpdated = (updatedOrder: ProductionOrder) => {
    const updated = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(updated);
    saveOrders(updated);
  };

  const handleFinishOrder = () => {
    const loaded = getStoredOrders();
    setOrders(loaded);
    setActiveId(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Unilever CRQS Logo Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/20">
            U
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">Unilever CRQS</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Kvalitetskontrol
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Line Clearance & 20-minutters Fototjek</p>
          </div>
        </div>

        {/* Navigation Switch mellem iPad Operatør og Ledelse */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setCurrentView('operator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              currentView === 'operator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">iPad Linje-App</span>
            <span className="sm:hidden">Linje</span>
          </button>

          <button
            onClick={() => setCurrentView('management')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              currentView === 'management'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Chefer & Audit</span>
            <span className="sm:hidden">Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'operator' ? (
          <div>
            {/* Vælg om der er en aktiv ordre eller oprettelse af ny */}
            {isCreatingNew || !activeOrder ? (
              <LineClearanceForm
                onOrderCreated={handleOrderCreated}
                onCancel={activeOrder ? () => setIsCreatingNew(false) : undefined}
              />
            ) : (
              <ActiveOrderView
                order={activeOrder}
                onOrderUpdated={handleOrderUpdated}
                onFinishOrder={handleFinishOrder}
                onNewOrderClick={() => setIsCreatingNew(true)}
              />
            )}
          </div>
        ) : (
          <ManagementDashboard orders={orders} />
        )}
      </main>

      {/* Footer Info */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Unilever Production Quality System • Live på Vercel</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Linjer: Thor (L1), Sif (L2), Loke (L5)</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">Autosave aktiv</span>
        </div>
      </footer>

    </div>
  );
}

export default App;

