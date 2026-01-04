
import React, { useState, useMemo } from 'react';
import { Customer, DebtEntry, UserRole } from '../types';

interface FiadoProps {
  customers: Customer[];
  onAddCustomer: (name: string, phone: string) => void;
  onRecordPayment: (customerId: string, amount: number) => void;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  role: UserRole;
}

const Fiado: React.FC<FiadoProps> = ({ customers, onAddCustomer, onRecordPayment, onDeleteCustomer, role }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentInputOpen, setIsPaymentInputOpen] = useState(false);
  const [paymentValue, setPaymentValue] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const activeCustomer = useMemo(() => {
    const customer = customers.find(c => c.id === selectedCustomerId) || null;
    // Reset confirmation text when switching customers
    return customer;
  }, [customers, selectedCustomerId]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentValue);
    if (!activeCustomer || isNaN(amount) || amount <= 0) return;

    onRecordPayment(activeCustomer.id, amount);
    setPaymentValue('');
    setIsPaymentInputOpen(false);
  };

  const handleDelete = async () => {
    if (!activeCustomer || isDeleting) return;
    
    if (deleteConfirmText !== activeCustomer.name) {
      alert("O nome digitado não corresponde ao nome do cliente.");
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteCustomer(activeCustomer.id);
      setSelectedCustomerId(null);
      setDeleteConfirmText('');
    } catch (err) {
      // Erro já tratado no App.tsx
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-10">
      {/* Lista de Clientes */}
      <div className={`lg:col-span-1 flex flex-col space-y-4 ${selectedCustomerId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex justify-between items-center px-2">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Clientes</h2>
          {role === 'ADMIN' && (
            <button onClick={() => setIsModalOpen(true)} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-90 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            </button>
          )}
        </div>

        <div className="relative">
          <input type="text" placeholder="Buscar cliente..." className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-white border-2 border-slate-100 shadow-sm outline-none focus:border-blue-500 font-bold transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="text-center p-10 opacity-30 italic font-bold text-sm uppercase">Nenhum cliente</div>
          ) : (
            filteredCustomers.map(customer => (
              <button key={customer.id} onClick={() => { setSelectedCustomerId(customer.id); setDeleteConfirmText(''); }} className={`w-full p-6 flex items-center justify-between rounded-[2rem] border-2 transition-all active:scale-95 ${selectedCustomerId === customer.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                <div className="text-left">
                  <p className="font-black text-lg leading-tight">{customer.name}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedCustomerId === customer.id ? 'text-blue-100' : 'text-slate-400'}`}>{customer.phone || 'Sem contato'}</p>
                </div>
                <div className="text-right">
                   <p className={`text-xl font-black tracking-tighter ${customer.totalDebt > 0 ? (selectedCustomerId === customer.id ? 'text-white' : 'text-rose-600') : 'opacity-20'}`}>
                     R$ {customer.totalDebt.toFixed(2)}
                   </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detalhes do Cliente */}
      <div className={`lg:col-span-2 ${selectedCustomerId ? 'block' : 'hidden lg:block'}`}>
        {activeCustomer ? (
          <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh] lg:max-h-none">
            {/* Header Detalhes */}
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex items-center gap-4 w-full">
                <button onClick={() => setSelectedCustomerId(null)} className="lg:hidden p-3 bg-white rounded-2xl shadow-sm text-slate-400 active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{activeCustomer.name}</h3>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase mt-2 inline-block">{activeCustomer.phone}</span>
                    </div>

                    {/* Campo de Exclusão Substituindo o Botão Trash */}
                    {role === 'ADMIN' && (
                      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col gap-2 min-w-[200px]">
                        <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Digite o nome para excluir</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Confirmar nome..."
                            className="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 ring-rose-500/20"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                          />
                          <button 
                            onClick={handleDelete}
                            disabled={isDeleting || deleteConfirmText !== activeCustomer.name}
                            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm ${
                              deleteConfirmText === activeCustomer.name 
                                ? 'bg-rose-600 text-white active:scale-90 hover:bg-rose-700' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {isDeleting ? "..." : "EXCLUIR"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-rose-50 p-6 rounded-[2rem] border-2 border-rose-100 w-full md:w-auto text-center md:text-right">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Dívida Atual</p>
                <p className="text-4xl font-black text-rose-600 tracking-tighter">R$ {activeCustomer.totalDebt.toFixed(2)}</p>
              </div>
            </div>

            {/* Ações e Histórico */}
            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              {!isPaymentInputOpen ? (
                <button onClick={() => setIsPaymentInputOpen(true)} disabled={activeCustomer.totalDebt <= 0} className="w-full bg-emerald-600 text-white py-6 rounded-[1.5rem] font-black text-xl shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-20 transition-all border-b-4 border-emerald-800 uppercase">
                  Abater Valor
                </button>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="p-8 bg-emerald-50 rounded-[2.5rem] border-2 border-emerald-100 animate-in zoom-in-95 duration-200">
                  <label className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 block text-center">Quanto o cliente pagou?</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="number" step="0.01" autoFocus required className="flex-1 px-8 py-5 rounded-2xl bg-white border-2 border-emerald-200 font-black text-2xl outline-none focus:ring-4 ring-emerald-500/20 text-emerald-700" placeholder="0,00" value={paymentValue} onChange={(e) => setPaymentValue(e.target.value)} />
                    <div className="flex gap-2">
                       <button type="button" onClick={() => setIsPaymentInputOpen(false)} className="px-6 py-5 bg-white text-slate-400 font-black rounded-2xl uppercase text-xs">Sair</button>
                       <button type="submit" className="px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl uppercase text-lg shadow-lg">OK</button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2">Movimentações</h4>
                {[...activeCustomer.history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                  <div key={entry.id} className="p-5 bg-white border-2 border-slate-50 rounded-[1.5rem] shadow-sm animate-in slide-in-from-bottom-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${entry.type === 'DEBIT' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {entry.type === 'DEBIT' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-xs">{entry.description}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(entry.date).toLocaleDateString('pt-BR')} às {new Date(entry.date).toLocaleTimeString('pt-BR')}</p>
                        </div>
                      </div>
                      <p className={`text-lg font-black tracking-tighter ${entry.type === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {entry.type === 'DEBIT' ? '+' : '-'} R$ {entry.amount.toFixed(2)}
                      </p>
                    </div>

                    {entry.type === 'DEBIT' && entry.items && entry.items.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
                        {entry.items.map((item, idx) => (
                          <span key={idx} className="text-[9px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded-lg uppercase border border-slate-100">
                            {item.quantity % 1 !== 0 ? item.quantity.toFixed(3) : item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Selecione um cliente para gerenciar o fiado</h3>
          </div>
        )}
      </div>

      {/* Modal Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">Novo Cliente</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Completo</label>
                <input type="text" required autoFocus className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">WhatsApp / Telefone</label>
                <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-xs">Cancelar</button>
                <button onClick={() => { if(newName) { onAddCustomer(newName, newPhone); setIsModalOpen(false); setNewName(''); setNewPhone(''); } }} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-500/20">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fiado;
