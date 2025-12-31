
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Customer, Sale, View } from '../types';

interface DashboardProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  onViewChange: (view: View) => void;
}

type Period = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

const Dashboard: React.FC<DashboardProps> = ({ products, customers, sales, onViewChange }) => {
  const [period, setPeriod] = useState<Period>('ALL');

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      switch (period) {
        case 'TODAY':
          return saleDate.toDateString() === now.toDateString();
        case 'WEEK':
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return saleDate >= weekAgo;
        case 'MONTH':
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return saleDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [sales, period]);

  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalDebts = customers.reduce((acc, c) => acc + c.totalDebt, 0);
  
  const salesByDate = filteredSales.reduce((acc: any[], sale) => {
    const date = sale.date.split('T')[0];
    const existing = acc.find(a => a.name === date);
    if (existing) {
      existing.value += sale.total;
    } else {
      acc.push({ name: date, value: sale.total });
    }
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500 text-sm">Resumo operacional e financeiro.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'TODAY', label: 'Hoje' },
            { id: 'WEEK', label: '7 Dias' },
            { id: 'MONTH', label: '30 Dias' },
            { id: 'ALL', label: 'Tudo' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as Period)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                period === p.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Receita</p>
          <h3 className="text-2xl font-black text-emerald-600">R$ {totalRevenue.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-2">{filteredSales.length} vendas</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">A Receber</p>
          <h3 className="text-2xl font-black text-rose-600">R$ {totalDebts.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-2">{customers.filter(c => c.totalDebt > 0).length} no fiado</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Alertas de Estoque</p>
          <h3 className="text-2xl font-black text-amber-600">{lowStockItems.length}</h3>
          <p className="text-xs text-amber-500 mt-2">Abaixo do mínimo</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Produtos Ativos</p>
          <h3 className="text-2xl font-black text-slate-800">{products.length}</h3>
          <p className="text-xs text-slate-400 mt-2">No catálogo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="text-lg font-bold mb-6 text-slate-800">Desempenho de Vendas</h4>
          <div className="h-[300px] w-full">
            {salesByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByDate}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 italic">
                Sem dados para exibição.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-slate-800">Reposição</h4>
            <button 
              onClick={() => onViewChange('INVENTORY')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Ver tudo
            </button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2">
            {lowStockItems.length > 0 ? lowStockItems.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  item.stock <= (item.minStock * 0.5) 
                    ? 'bg-rose-50 border-rose-100' 
                    : 'bg-amber-50 border-amber-100'
                }`}
              >
                <div>
                  <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                  <p className="text-xs font-medium text-slate-500">
                    Estoque: <span className="font-bold">{item.stock}</span> / Mín: {item.minStock}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 opacity-40">
                <p className="text-slate-500 text-sm font-medium">Estoque normalizado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
