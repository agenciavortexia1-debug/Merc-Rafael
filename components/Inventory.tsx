
import React, { useState } from 'react';
import { Product } from '../types';
import CameraScanner from './CameraScanner';

interface InventoryProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onUpdateStock: (id: string, newStock: number) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    barcode: '',
    quantity: ''
  });

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        costPrice: product.costPrice.toString(),
        barcode: product.barcodes[0] || '',
        quantity: product.stock.toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        costPrice: '',
        barcode: '',
        quantity: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode || !formData.quantity) {
      return alert("Preencha Nome, Código de Barras e Quantidade.");
    }

    const productData: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      category: 'Geral',
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      stock: parseInt(formData.quantity) || 0,
      minStock: 2,
      unit: 'un',
      barcodes: [formData.barcode] // Agora tratamos como um código principal
    };

    if (editingProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {isCameraOpen && (
        <CameraScanner 
          onScan={(b) => {
            setFormData(prev => ({ ...prev, barcode: b }));
            setIsCameraOpen(false);
          }} 
          onClose={() => setIsCameraOpen(false)} 
          isBatch={false} 
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Estoque</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-widest">Gestão de produtos e preços.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="w-full sm:w-auto bg-blue-600 text-white px-8 py-5 rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase border-b-4 border-blue-800"
        >
          + Adicionar Produto
        </button>
      </div>

      <div className="relative mx-2">
        <input 
          type="text" 
          placeholder="Buscar no estoque..." 
          className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-slate-100 shadow-sm font-bold outline-none focus:border-blue-500" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
        {filteredProducts.map(p => (
          <div 
            key={p.id} 
            onClick={() => handleOpenModal(p)} 
            className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm active:scale-95 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${p.stock <= p.minStock ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {p.stock} em estoque
              </span>
              <p className="font-black text-xl tracking-tighter text-slate-900">R$ {p.price.toFixed(2)}</p>
            </div>
            <h4 className="font-black text-slate-800 uppercase text-lg leading-tight mb-1 truncate">{p.name}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cód: {p.barcodes[0] || '---'}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <p className="text-[9px] text-slate-300 font-bold uppercase">Custo: R$ {p.costPrice.toFixed(2)}</p>
              <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[500] flex items-end lg:items-center justify-center p-0 lg:p-6">
          <div className="bg-white rounded-t-[3rem] lg:rounded-[3.5rem] w-full max-w-2xl max-h-[95vh] overflow-y-auto p-8 lg:p-12 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                {editingProduct ? 'Editar' : 'Novo'} Produto
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Produto</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-black text-xl outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço de Compra</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-black text-lg outline-none" 
                    value={formData.costPrice} 
                    onChange={e => setFormData({ ...formData, costPrice: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço de Venda</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-blue-50 border-2 border-blue-100 font-black text-blue-600 text-lg outline-none" 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Código de Barras</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-mono text-sm outline-none" 
                    value={formData.barcode} 
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })} 
                  />
                  <button 
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="absolute right-2 top-[30px] p-3 bg-blue-600 text-white rounded-xl shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantidade em Estoque</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 font-black text-emerald-600 text-xl outline-none" 
                    value={formData.quantity} 
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-2xl uppercase tracking-tighter shadow-2xl active:scale-95 transition-all border-b-8 border-black mt-4"
              >
                Salvar no Estoque
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
