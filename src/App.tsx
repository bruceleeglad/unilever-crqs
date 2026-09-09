import React, { useState, useEffect } from 'react';
import { ProductionOrder, PalletItem, PalletStatus } from './types/crqs';
import { 
  getStoredOrders, 
  getActiveOrderId, 
  saveOrders, 
  setActiveOrderId, 
  fetchCloudOrders, 
  syncOrdersToCloud,
  getStoredPallets,
  fetchCloudPallets,
  registerPallet,
  updatePalletStatus
} from './services/storage';
import { LineClearanceForm } from './components/LineClearanceForm';
import { ActiveOrderView } from './components/ActiveOrderView';
import { ManagementDashboard } from './components/ManagementDashboard';
import { PalletWarehouseView } from './components/PalletWarehouseView';
import { Tablet, LayoutDashboard, Plus, Factory, CheckCircle2, ShieldCheck, RefreshCw, Package } from 'lucide-react';

export function App() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [pallets, setPallets] = useState<PalletItem[]>([]);
  const [activeOrderId, setActiveId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'operator' | 'management' | 'pallets'>('operator');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Indlæs data og synkroniser med skyen
  useEffect(() => {
    // Først hurtig visning fra lokalt lager
    const local = getStoredOrders();
    setOrders(local);
    const localPallets = getStoredPallets();
    setPallets(localPallets);

    const active = getActiveOrderId();
    if (active) setActiveId(active);

    // Hent derefter fra skyen (Vercel)
    const loadFromCloud = async () => {
      setIsSyncing(true);
      const [cloudOrders, cloudPallets] = await Promise.all([
        fetchCloudOrders(),
        fetchCloudPallets()
      ]);
      setOrders(cloudOrders);
      if (cloudPallets && cloudPallets.length > 0) {
        setPallets(cloudPallets);
      }

      const curActive = getActiveOrderId();
      if (!curActive) {
        const firstActive = cloudOrders.find(o => o.status === 'active');
        if (firstActive) {
          setActiveId(firstActive.id);
          setActiveOrderId(firstActive.id);
        }
      } else {
        setActiveId(curActive);
      }
      setIsSyncing(false);
    };

    loadFromCloud();

    // Smart Cloud Polling: Kun når fanen er aktiv/synlig, og med 45 sekunders interval for at minimere serverless båndbredde
    const pollInterval = setInterval(async () => {
      if (document.hidden) return; // Pauser fuldstændigt når iPad/PC skærmen er slukket eller i baggrunden
      try {
        const [cloudData, cloudPallets] = await Promise.all([
          fetchCloudOrders(),
          fetchCloudPallets()
        ]);
        if (cloudData && cloudData.length > 0) {
          setOrders(cloudData);
        }
        if (cloudPallets && cloudPallets.length > 0) {
          setPallets(cloudPallets);
        }
      } catch (err) {
        console.warn('Sync poll error:', err);
      }
    }, 45000); // 45 sekunder i stedet for 5 sekunder sparer 90% båndbredde!

    // Gen-synkroniser lynhurtigt i samme sekund brugeren åbner fanen igen
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const [cloudData, cloudPallets] = await Promise.all([
          fetchCloudOrders(),
          fetchCloudPallets()
        ]);
        if (cloudData && cloudData.length > 0) setOrders(cloudData);
        if (cloudPallets && cloudPallets.length > 0) setPallets(cloudPallets);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  const handleRegisterPallet = (palletData: Omit<PalletItem, 'id' | 'palletNumber' | 'registeredAt'>) => {
    const newPallet = registerPallet(palletData);
    setPallets([newPallet, ...pallets]);
  };

  const handleUpdatePalletStatus = (id: string, status: PalletStatus, note?: string, newItemNumber?: string) => {
    const updated = updatePalletStatus(id, status, note, newItemNumber);
    if (updated) {
      setPallets(pallets.map(p => p.id === id ? updated : p));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Unilever CRQS Logo Badge */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-400 flex items-center justify-center font-black text-white text-base sm:text-lg shadow-lg shadow-blue-500/20 shrink-0">
            U
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base font-black tracking-tight text-white">CRQS</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hidden xs:inline-block">
                Kvalitet & Lager
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden lg:block">Line Clearance, 20-min Tjek & Pallelager</p>
          </div>
        </div>

        {/* Navigation Switch mellem iPad Operatør, Ledelse og Pallelager */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCurrentView('operator')}
            className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
              currentView === 'operator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">iPad Linje</span>
            <span className="sm:hidden">Linje</span>
          </button>

          <button
            onClick={() => setCurrentView('management')}
            className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
              currentView === 'management'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Chefer & Audit</span>
            <span className="sm:hidden">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('pallets')}
            className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
              currentView === 'pallets'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Pallelager</span>
            <span className="sm:hidden">Paller</span>
            {pallets.filter(p => p.status === 'investigating').length > 0 && (
              <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] rounded-full">
                {pallets.filter(p => p.status === 'investigating').length}
              </span>
            )}
          </button>
        </div>

        {/* Cloud Sync Status Indicator med Manuel Knap */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={async () => {
              setIsSyncing(true);
              const cur = getStoredOrders();
              if (cur.length > 0) {
                await syncOrdersToCloud(cur);
              }
              const [cloud, cloudPallets] = await Promise.all([
                fetchCloudOrders(),
                fetchCloudPallets()
              ]);
              setOrders(cloud);
              if (cloudPallets && cloudPallets.length > 0) {
                setPallets(cloudPallets);
              }
              setIsSyncing(false);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700/60 shadow-sm transition-all active:scale-95"
            title="Synkroniser med skyen nu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
            <span className="hidden md:inline">{isSyncing ? 'Synkroniserer...' : 'Synkroniser'}</span>
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
        ) : currentView === 'management' ? (
          <ManagementDashboard orders={orders} />
        ) : (
          <PalletWarehouseView
            pallets={pallets}
            onRegisterPallet={handleRegisterPallet}
            onUpdateStatus={handleUpdatePalletStatus}
          />
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

