
import React, { useState, useRef, useEffect } from 'react';
import { Product, SaleItem, Customer, Order } from '../types';
import CameraScanner from './CameraScanner';
import { supabase } from '../lib/supabase';

interface POSProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (items: SaleItem[], paymentMethod: 'Dinheiro' | 'Cartão' | 'Fiado' | 'Pix', customerId?: string) => void;
  onLogout: () => void;
}

const POS: React.FC<POSProps> = ({ products, customers, onCompleteSale, onLogout }) => {
  const [scannerValue, setScannerValue] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Cartão' | 'Fiado' | 'Pix'>('Dinheiro');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notifyAudioRef = useRef<HTMLAudioElement | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'finished')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      const mapped: Order[] = data.map(o => ({
        id: o.id,
        customerName: o.customer_name,
        items: o.items,
        total: Number(o.total),
        paymentMethod: o.payment_method,
        cashAmount: o.cash_amount ? Number(o.cash_amount) : undefined,
        changeAmount: o.change_amount ? Number(o.change_amount) : undefined,
        receiptData: o.receipt_data,
        status: o.status,
        createdAt: o.created_at
      }));

      if (mapped.length > orders.length && orders.length > 0) {
        if (notifyAudioRef.current) notifyAudioRef.current.play().catch(()=>{});
      }
      setOrders(mapped);
    }
  };

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    notifyAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [orders.length]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Sem produto no estoque.");
      return;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Limite de estoque atingido para ${product.name}`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * (item.price || 0) }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price || 0,
        total: product.price || 0
      }];
    });
    setScannerValue('');
    setSearchResults([]);
  };

  const handleSearch = (query: string) => {
    if (!query) return;
    let matches = products.filter(p => p.barcodes && p.barcodes.includes(query));
    if (matches.length === 0) matches = products.filter(p => p.name.toLowerCase() === query.toLowerCase());
    if (matches.length === 0 && searchResults.length === 1) matches = [searchResults[0]];
    
    if (matches.length === 0) { alert("Nenhum produto encontrado."); return; }
    
    const product = matches[0];
    if (product) {
      if (product.stock <= 0) {
        alert("Sem produto no estoque.");
      } else {
        addToCart(product);
      }
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Fiado' && !selectedCustomerId) {
      alert("Selecione o cliente.");
      return;
    }
    onCompleteSale(cart, paymentMethod, selectedCustomerId);
    if (selectedOrder) {
      supabase.from('orders').update({ status: 'finished' }).eq('id', selectedOrder.id).then();
      setSelectedOrder(null);
    }
    setShowSuccess(true);
    setCart([]);
    setSelectedCustomerId('');
    setPaymentMethod('Dinheiro');
    setIsCheckoutOpen(false);
    setTimeout(() => setShowSuccess(false), 2000); 
  };

  const handleImportOrder = (order: Order) => {
    const outOfStockItems = order.items.filter(item => {
      const p = products.find(prod => prod.id === item.productId);
      return !p || p.stock <= 0;
    });

    if (outOfStockItems.length > 0) {
      alert(`Alguns itens não possuem mais estoque: ${outOfStockItems.map(i => i.name).join(', ')}`);
    }

    setCart(order.items);
    setPaymentMethod(order.paymentMethod as any);
    setSelectedOrder(order);
    setIsOrdersOpen(false);
    supabase.from('orders').update({ status: 'processing' }).eq('id', order.id).then(fetchOrders);
  };

  const totalGeral = cart.reduce((acc, i) => acc + (i.total || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] max-w-4xl mx-auto relative">
      {isCameraOpen && <CameraScanner onScan={(barcode) => { handleSearch(barcode); setIsCameraOpen(false); }} onClose={() => setIsCameraOpen(false)} isBatch={false} />}

      {/* PDV Header */}
      <div className="flex items-center bg-white p-3 lg:p-5 rounded-3xl lg:rounded-[2rem] border-2 border-slate-100 shadow-sm gap-3 mb-4 sticky top-0 z-[100] mx-2 lg:mx-0">
        <div className="flex gap-2">
          <button 
            onClick={() => setIsOrdersOpen(true)}
            title="Listas de Clientes"
            className={`p-4 rounded-2xl relative transition-all ${pendingCount > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 relative">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(scannerValue); }}>
            <input
              ref={scannerInputRef}
              type="text"
              placeholder="Nome ou Código..."
              className="w-full px-5 py-4 lg:py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-black text-lg"
              value={scannerValue}
              onChange={(e) => {
                setScannerValue(e.target.value);
                if (e.target.value.length >= 2) {
                  const filtered = products.filter(p => 
                    p.name.toLowerCase().includes(e.target.value.toLowerCase()) || 
                    (p.barcodes && p.barcodes.some(b => b.includes(e.target.value)))
                  ).slice(0, 5);
                  setSearchResults(filtered);
                } else setSearchResults([]);
              }}
              autoComplete="off"
            />
          </form>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl z-[110] overflow-hidden">
              {searchResults.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  className={`w-full flex justify-between items-center p-4 hover:bg-slate-50 border-b last:border-0 ${p.stock <= 0 ? 'opacity-50 grayscale bg-slate-50' : ''}`}
                >
                  <div className="text-left">
                    <p className="font-black text-slate-800 uppercase text-xs">{p.name}</p>
                    <p className={`text-[10px] font-bold uppercase ${p.stock <= 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {p.stock <= 0 ? 'SEM PRODUTO NO ESTOQUE' : `ESTOQUE: ${p.stock}`}
                    </p>
                  </div>
                  <p className="font-black text-blue-600 text-sm">R$ {p.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setIsCameraOpen(true)} className="bg-blue-600 text-white p-4 lg:p-6 rounded-2xl shadow-xl border-b-4 border-blue-800">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>
      </div>

      {/* Cart Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] lg:rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col mx-2 lg:mx-0 relative">
        {selectedOrder && (
          <div className="bg-amber-50 p-3 border-b border-amber-100 flex justify-between items-center">
             <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-4 truncate">SEPARANDO PARA: {selectedOrder.customerName}</p>
             <button onClick={() => { setSelectedOrder(null); setCart([]); }} className="text-amber-600 font-black text-[10px] uppercase underline px-4 shrink-0">Cancelar</button>
          </div>
        )}

        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">CARRINHO</h3>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{cart.length} itens</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h18l-2 13H5L3 7z"/><path d="M16 10V5a4 4 0 0 0-8 0v5"/></svg>
              <p className="mt-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Aguardando Produtos...</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center p-4 bg-white border-2 border-slate-50 rounded-2xl">
                <div className="flex-1">
                  <p className="font-black text-sm text-slate-800 uppercase truncate pr-4">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item.quantity} x R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black text-slate-900 text-lg tracking-tighter">R$ {item.total.toFixed(2)}</p>
                  <button onClick={() => setCart(cart.filter(i => i.productId !== item.productId))} className="p-2 text-rose-500 bg-rose-50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 lg:p-10 border-t bg-slate-900 text-white flex justify-between items-end">
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">TOTAL DA VENDA</p>
             <p className="text-4xl lg:text-5xl font-black tracking-tighter text-emerald-400 leading-none">R$ {totalGeral.toFixed(2)}</p>
           </div>
           <button 
            onClick={() => cart.length > 0 && setIsCheckoutOpen(true)}
            className="px-8 lg:px-12 py-5 lg:py-6 bg-emerald-500 text-white rounded-2xl lg:rounded-3xl font-black text-lg uppercase shadow-2xl disabled:opacity-20 border-b-4 border-emerald-700"
           >
             Pagar
           </button>
        </div>
      </div>

      {/* Online Orders Modal */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-end lg:items-center justify-center p-0 lg:p-6">
          <div className="bg-white rounded-t-[3rem] lg:rounded-[3rem] w-full max-w-xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">LISTAS ENVIADAS</h3>
               <button onClick={() => setIsOrdersOpen(false)} className="p-3 bg-slate-100 rounded-2xl"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            </div>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-center py-10 font-bold text-slate-400 uppercase text-xs">Nenhum pedido pendente</p>
              ) : (
                orders.map(order => (
                  <div key={order.id} className={`p-6 rounded-3xl border-2 transition-all ${order.status === 'processing' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <p className="font-black text-slate-900 uppercase text-lg leading-none">{order.customerName}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Via {order.paymentMethod}</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${order.status === 'processing' ? 'bg-amber-200 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                         {order.status === 'processing' ? 'Em Separação' : 'Novo'}
                       </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl mb-4 space-y-1">
                      {order.items.map((it, idx) => {
                        const prod = products.find(p => p.id === it.productId);
                        const isOutOfStock = !prod || prod.stock <= 0;
                        return (
                          <p key={idx} className={`text-[10px] font-bold uppercase ${isOutOfStock ? 'text-rose-500 line-through' : 'text-slate-600'}`}>
                            {it.quantity}x {it.name} {isOutOfStock ? '(SEM ESTOQUE)' : ''}
                          </p>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center mb-6">
                       <p className="text-2xl font-black text-slate-900 tracking-tighter">R$ {order.total.toFixed(2)}</p>
                       <div className="flex gap-2">
                          {order.receiptData && (
                            <button 
                              onClick={() => setViewingReceipt(order.receiptData || null)}
                              className="bg-emerald-100 text-emerald-600 p-3 rounded-xl hover:bg-emerald-200 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </button>
                          )}
                          <button onClick={() => handleImportOrder(order)} className="px-6 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase">Separar</button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewing Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4">
           <div className="relative max-w-2xl w-full">
              <button 
                onClick={() => setViewingReceipt(null)}
                className="absolute -top-12 right-0 text-white font-black flex items-center gap-2"
              >
                FECHAR <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              <img src={viewingReceipt} alt="Comprovante" className="w-full h-auto rounded-3xl shadow-2xl border-4 border-white/10" />
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-end lg:items-center justify-center p-0 lg:p-6">
           <div className="bg-white rounded-t-[3rem] lg:rounded-[3rem] w-full max-w-lg p-8 lg:p-12 space-y-8 animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">FINALIZAR</h3>
               <button onClick={() => setIsCheckoutOpen(false)} className="p-3 bg-slate-100 rounded-2xl"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
             </div>
             <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4">MÉTODO</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Dinheiro', 'Pix', 'Cartão', 'Fiado'] as const).map(method => (
                      <button key={method} onClick={() => setPaymentMethod(method)} className={`py-5 rounded-2xl font-black text-xs uppercase border-4 transition-all ${paymentMethod === method ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
                {paymentMethod === 'Fiado' && (
                  <select className="w-full p-5 rounded-2xl border-2 border-blue-200 font-black text-sm" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                    <option value="">-- CLIENTE --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <div className="bg-slate-900 p-8 rounded-3xl text-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-2">VALOR TOTAL</p>
                   <p className="text-5xl font-black text-emerald-400 tracking-tighter">R$ {totalGeral.toFixed(2)}</p>
                </div>
                <button onClick={handleCheckout} className="w-full py-8 bg-emerald-500 text-white rounded-[2rem] font-black text-2xl border-b-8 border-emerald-700 active:scale-95 transition-all">
                  CONCLUIR VENDA
                </button>
             </div>
           </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[3000] bg-emerald-500 flex items-center justify-center animate-in fade-in">
          <div className="flex flex-col items-center text-white text-center">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3 className="text-4xl font-black uppercase">VENDA OK!</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
