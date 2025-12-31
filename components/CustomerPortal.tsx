
import React, { useState, useMemo, useRef } from 'react';
import { Product, SaleItem } from '../types';
import Logo from './Logo';
import { supabase } from '../lib/supabase';

interface CustomerPortalProps {
  products: Product[];
  onOrderSubmitted: () => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ products, onOrderSubmitted }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [step, setStep] = useState<'browsing' | 'checkout' | 'success'>('browsing');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [cashAmount, setCashAmount] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    if (searchTerm.length < 2) return [];
    // Filtro rigoroso: apenas produtos com estoque estritamente maior que zero
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      p.stock > 0
    );
  }, [products, searchTerm]);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) return; // Proteção adicional

    setCart(prev => {
      const existing = prev.find(item => item.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) {
          alert("Limite de estoque atingido para este item.");
          return prev;
        }
        return prev.map(item => item.productId === p.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item);
      }
      return [...prev, { productId: p.id, name: p.name, quantity: 1, price: p.price, total: p.price }];
    });
    setSearchTerm('');
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.productId !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const total = cart.reduce((acc, i) => acc + i.total, 0);
  const change = paymentMethod === 'Dinheiro' && cashAmount ? Math.max(0, parseFloat(cashAmount) - total) : 0;

  const handleSubmitOrder = async () => {
    if (!customerName) return alert("Por favor, diga seu nome.");
    if (paymentMethod === 'Pix' && !receiptBase64) return alert("Por favor, anexe o comprovante do Pix.");
    
    setLoading(true);
    try {
      const { error } = await supabase.from('orders').insert([{
        customer_name: customerName,
        items: cart,
        total: total,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === 'Dinheiro' ? parseFloat(cashAmount) : null,
        change_amount: paymentMethod === 'Dinheiro' ? change : null,
        receipt_data: receiptBase64,
        status: 'pending'
      }]);
      if (error) throw error;
      setStep('success');
      onOrderSubmitted();
    } catch (e: any) {
      alert("Erro ao enviar pedido: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-emerald-500 flex flex-col items-center justify-center p-8 text-white text-center">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">LISTA ENVIADA!</h2>
        <p className="font-bold opacity-80 mt-2">O pessoal do mercadinho já recebeu sua lista e vai começar a separar seus itens agora.</p>
        <button onClick={() => window.location.reload()} className="mt-12 bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black uppercase text-sm">Fazer outra lista</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white p-6 border-b sticky top-0 z-50 flex justify-between items-center">
        <Logo size="sm" />
        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs">LISTA DE CASA</div>
      </header>

      <main className="flex-1 p-4 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
        {step === 'browsing' ? (
          <>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">O que você precisa?</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Busque os produtos e adicione à lista.</p>
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="Ex: Arroz, Feijão, Leite..."
                className="w-full p-5 rounded-2xl border-2 border-slate-100 shadow-sm font-bold outline-none focus:border-blue-500 transition-all bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-slate-100 shadow-2xl overflow-hidden z-40">
                  {filteredProducts.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full p-4 flex justify-between items-center hover:bg-slate-50 border-b last:border-0"
                    >
                      <span className="font-black text-slate-700 uppercase text-sm">{p.name}</span>
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-xs">R$ {p.price.toFixed(2)} +</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SUA LISTA</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{cart.length} ITENS</span>
              </div>
              <div className="flex-1 p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2"><path d="M3 7h18l-2 13H5L3 7z"/><path d="M16 10V5a4 4 0 0 0-8 0v5"/></svg>
                    <p className="font-black text-[10px] uppercase tracking-widest">Lista vazia</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.productId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-black text-slate-700 uppercase text-xs">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-rose-500 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VALOR TOTAL</p>
                   <p className="text-3xl font-black text-emerald-400 tracking-tighter">R$ {total.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => cart.length > 0 && setStep('checkout')}
                  disabled={cart.length === 0}
                  className="bg-emerald-500 px-8 py-4 rounded-2xl font-black uppercase text-sm disabled:opacity-20 shadow-lg"
                >
                  Finalizar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <button onClick={() => setStep('browsing')} className="text-slate-400 font-black text-xs uppercase flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
               Voltar para a lista
             </button>

             <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl space-y-6">
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Finalizar Pedido</h3>
               
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Como te chamamos?</label>
                 <input 
                  type="text" 
                  placeholder="Seu nome"
                  className="w-full p-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-black outline-none"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                 />
               </div>

               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Forma de Pagamento</label>
                 <div className="grid grid-cols-3 gap-2">
                   {['Pix', 'Dinheiro', 'Cartão'].map(m => (
                     <button 
                      key={m}
                      onClick={() => setPaymentMethod(m as any)}
                      className={`py-4 rounded-xl font-black uppercase text-[10px] border-4 transition-all ${paymentMethod === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-transparent text-slate-400'}`}
                     >
                       {m}
                     </button>
                   ))}
                 </div>
               </div>

               {paymentMethod === 'Pix' && (
                 <div className="animate-in zoom-in-95 space-y-4">
                    <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Chave Pix do Mercadinho</p>
                      <p className="font-mono text-sm font-bold text-slate-700">rafael@mercadinho.com.br</p>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Anexe o Comprovante</label>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full p-6 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${receiptBase64 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200 hover:bg-blue-50'}`}
                      >
                        {receiptBase64 ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <span className="font-black text-[10px] uppercase">Comprovante Anexado</span>
                            <img src={receiptBase64} alt="Preview" className="h-16 w-16 object-cover rounded-lg mt-2 border-2 border-emerald-200" />
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <span className="font-black text-[10px] uppercase">Toque para selecionar a foto</span>
                          </>
                        )}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                 </div>
               )}

               {paymentMethod === 'Dinheiro' && (
                 <div className="animate-in zoom-in-95">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Precisa de troco para quanto?</label>
                   <input 
                    type="number" 
                    placeholder="Ex: 50.00"
                    className="w-full p-4 rounded-xl bg-emerald-50 border-2 border-emerald-100 font-black outline-none text-emerald-700 text-lg"
                    value={cashAmount}
                    onChange={e => setCashAmount(e.target.value)}
                   />
                   {change > 0 && (
                     <p className="text-emerald-600 font-black text-xs uppercase mt-2">Troco: R$ {change.toFixed(2)}</p>
                   )}
                 </div>
               )}

               <div className="bg-slate-900 p-6 rounded-2xl">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">RESUMO DA LISTA</span>
                    <span className="text-[10px] font-black text-slate-500">{cart.length} ITENS</span>
                 </div>
                 <p className="text-4xl font-black text-emerald-400 tracking-tighter">R$ {total.toFixed(2)}</p>
               </div>

               <button 
                onClick={handleSubmitOrder}
                disabled={loading || !customerName}
                className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xl uppercase tracking-tighter shadow-xl disabled:opacity-50"
               >
                 {loading ? "ENVIANDO..." : "ENVIAR PARA O MERCADINHO"}
               </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerPortal;
