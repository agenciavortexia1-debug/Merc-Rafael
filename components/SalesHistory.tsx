
import React from 'react';
import { Sale } from '../types';

interface SalesHistoryProps {
  sales: Sale[];
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales }) => {
  return (
    <div className="space-y-6">
      <div className="px-2">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Histórico</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Registros de todas as operações de caixa.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produtos</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Meio de Pagamento</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold text-sm">
              {sales.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center opacity-20 uppercase font-black italic">Sem vendas registradas</td></tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <span className="block text-slate-900 uppercase">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                      <span className="text-[10px] text-slate-400">{new Date(sale.date).toLocaleTimeString('pt-BR')}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1 max-w-xs">
                        {sale.items?.map((item, idx) => (
                          <span key={idx} className="text-[10px] text-slate-600 truncate bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] uppercase font-black ${
                        sale.paymentMethod === 'Dinheiro' ? 'bg-emerald-100 text-emerald-700' :
                        sale.paymentMethod === 'Fiado' ? 'bg-rose-100 text-rose-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-900 text-base">
                      R$ {sale.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
