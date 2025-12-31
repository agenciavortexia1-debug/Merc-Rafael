
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Fiado from './components/Fiado';
import SalesHistory from './components/SalesHistory';
import Logo from './components/Logo';
import CustomerPortal from './components/CustomerPortal';
import { View, Product, Customer, Sale, SaleItem, UserRole, DebtEntry } from './types';
import { supabase } from './lib/supabase';

const ADMIN_PASSWORD = '1234';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'LOGIN_SCREEN' | 'APP_MAIN'>('LOGIN_SCREEN');
  const [role, setRole] = useState<UserRole>('VENDEDOR');
  const [currentView, setCurrentView] = useState<View>('POS');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Verificação de acesso direto via QR Code para clientes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'customer') {
      setRole('CLIENTE');
      setAppState('APP_MAIN');
      setCurrentView('CUSTOMER_PORTAL');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [
        { data: productsData, error: pErr },
        { data: salesData, error: sErr },
        { data: customersData, error: cErr }
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('sales').select(`*, sale_items(*)`).order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name')
      ]);

      if (pErr) console.error("Erro na tabela products:", pErr);
      if (sErr) console.error("Erro na tabela sales:", sErr);
      if (cErr) console.error("Erro na tabela customers:", cErr);

      if (pErr || sErr || cErr) {
        throw new Error("Erro de conexão. Verifique se as tabelas existem no Supabase.");
      }

      const mappedProducts: Product[] = (productsData || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Geral',
        price: Number(p.price || 0),
        costPrice: Number(p.cost_price || 0),
        stock: Number(p.stock || 0),
        minStock: Number(p.min_stock || 0),
        unit: p.unit || 'un',
        barcodes: p.barcode ? [p.barcode] : []
      }));

      const mappedCustomers: Customer[] = (customersData || []).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        totalDebt: Number(c.total_debt || 0),
        history: Array.isArray(c.history) ? c.history : []
      }));

      const mappedSales: Sale[] = (salesData || []).map(s => ({
        id: s.id,
        date: s.created_at,
        total: Number(s.total || 0),
        paymentMethod: (s.payment_method as any) || 'Dinheiro',
        customerId: s.customer_id,
        items: (s.sale_items || []).map((item: any) => ({
          productId: item.product_id,
          name: item.name,
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
          total: Number(item.total || 0)
        }))
      }));

      setProducts(mappedProducts);
      setCustomers(mappedCustomers);
      setSales(mappedSales);
    } catch (err: any) {
      console.error("Erro crítico no fetchData:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddProduct = async (p: Product) => {
    try {
      const { error } = await supabase.from('products').insert([{
        name: p.name,
        price: p.price,
        cost_price: p.costPrice,
        stock: p.stock,
        barcode: p.barcodes[0] || null,
        category: p.category,
        unit: p.unit,
        min_stock: p.minStock
      }]);
      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      alert("Erro ao cadastrar: " + e.message);
    }
  };
  
  const handleUpdateProduct = async (p: Product) => {
    try {
      const { error } = await supabase.from('products').update({
        name: p.name,
        price: p.price,
        cost_price: p.costPrice,
        stock: p.stock,
        barcode: p.barcodes[0] || null
      }).eq('id', p.id);
      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      alert("Erro ao atualizar: " + e.message);
    }
  };

  const handleCompleteSale = async (items: SaleItem[], method: string, customerId?: string) => {
    const total = items.reduce((acc, i) => acc + i.total, 0);
    
    try {
      const { data: saleData, error: saleError } = await supabase.from('sales').insert([{ 
        total, 
        payment_method: method,
        customer_id: customerId || null
      }]).select();

      if (saleError || !saleData) throw saleError;
      const saleId = saleData[0].id;

      const { error: itemsError } = await supabase.from('sale_items').insert(
        items.map(i => ({
          sale_id: saleId,
          product_id: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.total
        }))
      );
      if (itemsError) throw itemsError;

      for (const item of items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          await supabase.from('products')
            .update({ stock: Math.max(0, prod.stock - item.quantity) })
            .eq('id', item.productId);
        }
      }

      if (method === 'Fiado' && customerId) {
        const client = customers.find(c => c.id === customerId);
        if (client) {
          const newHistory: DebtEntry[] = [...client.history, {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            description: `Venda #${saleId.substring(0,4)}`,
            amount: total,
            type: 'DEBIT',
            saleId: saleId
          }];
          await supabase.from('customers').update({
            total_debt: client.totalDebt + total,
            history: newHistory
          }).eq('id', customerId);
        }
      }

      await fetchData();
    } catch (e: any) {
      alert("Falha no checkout: " + e.message);
    }
  };

  const handleRecordPayment = async (customerId: string, amount: number) => {
    const client = customers.find(c => c.id === customerId);
    if (!client) return;

    try {
      const newHistory: DebtEntry[] = [...client.history, {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        description: 'Pagamento de dívida',
        amount: amount,
        type: 'PAYMENT'
      }];

      const { error } = await supabase.from('customers').update({
        total_debt: Math.max(0, client.totalDebt - amount),
        history: newHistory
      }).eq('id', customerId);
      
      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      alert("Erro ao registrar pagamento: " + e.message);
    }
  };

  const handleLogout = () => {
    // Ao sair, limpamos o parâmetro da URL para não prender o próximo login no portal do cliente
    if (window.location.search.includes('view=customer')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setAppState('LOGIN_SCREEN');
    setRole('VENDEDOR');
    setCurrentView('POS');
  };

  const renderContent = () => {
    if (role === 'CLIENTE') return <CustomerPortal products={products} onOrderSubmitted={() => {}} />;

    switch (currentView) {
      case 'DASHBOARD': return <Dashboard products={products} customers={customers} sales={sales} onViewChange={setCurrentView} />;
      case 'INVENTORY': return <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onUpdateStock={()=>{}} />;
      case 'POS': return <POS products={products} customers={customers} onCompleteSale={handleCompleteSale} onLogout={handleLogout} />;
      case 'FIADO': return <Fiado customers={customers} onAddCustomer={(n, p) => supabase.from('customers').insert([{ name: n, phone: p, total_debt: 0, history: [] }]).then(() => fetchData())} onRecordPayment={handleRecordPayment} role={role} />;
      case 'SALES': return <SalesHistory sales={sales} />;
      default: return role === 'ADMIN' ? <Dashboard products={products} customers={customers} sales={sales} onViewChange={setCurrentView} /> : <POS products={products} customers={customers} onCompleteSale={handleCompleteSale} onLogout={handleLogout} />;
    }
  };

  if (appState === 'LOGIN_SCREEN') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <Logo size="xl" className="mb-16" light />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <button onClick={() => { setRole('VENDEDOR'); setAppState('APP_MAIN'); setCurrentView('POS'); }} className="bg-white/10 backdrop-blur-lg border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/20 transition-all text-center group">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Entrar no Caixa</h3>
          </button>
          
          <button onClick={() => setShowPasswordInput(true)} className="bg-white/10 backdrop-blur-lg border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/20 transition-all text-center group">
            <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gerência</h3>
          </button>
        </div>
        
        <p className="mt-12 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Acesso restrito para funcionários</p>

        {showPasswordInput && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-[600]">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-xs border border-white/10">
              <input type="password" autoFocus className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center text-3xl font-black text-white mb-6 outline-none" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={() => setShowPasswordInput(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs">Sair</button>
                <button onClick={() => passwordInput === ADMIN_PASSWORD ? (setRole('ADMIN'), setAppState('APP_MAIN'), setCurrentView('DASHBOARD')) : alert('Senha Errada')} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-500/20">Entrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {role !== 'CLIENTE' && (
        <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-40">
          <Logo size="sm" light />
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/10 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {role !== 'CLIENTE' && (
        <Sidebar 
          currentView={currentView} 
          onViewChange={(v) => { setCurrentView(v); setIsMobileMenuOpen(false); }} 
          role={role} 
          onSwitchRole={handleLogout} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className={`flex-1 ${role !== 'CLIENTE' ? (role === 'ADMIN' ? (isSidebarCollapsed ? 'lg:ml-20 p-4 lg:p-8' : 'lg:ml-60 p-4 lg:p-8') : 'ml-0 p-4 lg:p-8') : 'ml-0'} transition-all`}>
        <div className={`mx-auto ${role !== 'CLIENTE' ? 'max-w-7xl pb-24 lg:pb-0' : ''}`}>
          {loading ? (
             <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 opacity-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">Carregando...</p>
             </div>
          ) : renderContent()}
        </div>
      </main>

      {role === 'ADMIN' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
          {[
            { id: 'DASHBOARD', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
            { id: 'INVENTORY', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M12 22V12"/></svg> },
            { id: 'FIADO', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
            { id: 'SALES', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg> }
          ].map(btn => (
            <button key={btn.id} onClick={() => setCurrentView(btn.id as View)} className={`p-3 rounded-2xl transition-all ${currentView === btn.id ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30' : 'text-slate-400'}`}>
              {btn.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
