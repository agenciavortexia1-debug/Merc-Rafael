
import React from 'react';

export const ICONS = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  ),
  Inventory: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  POS: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.69.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/><path d="M2 13h20"/><path d="m11 17 3 3 5-5"/></svg>
  ),
  Fiado: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Sales: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
  ),
  AI: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2.1 12.3"/><path d="M12 12l9.8 3.6"/><path d="M12 12l-5.1-8.5"/><path d="M12 12l8.3-9.4"/><path d="M12 12l-10 4.8"/></svg>
  )
};

export const INITIAL_PRODUCTS: any[] = [
  { id: '1', name: 'Arroz 5kg', category: 'Grãos', price: 25.50, costPrice: 18.00, stock: 50, minStock: 10, unit: 'un' },
  { id: '2', name: 'Feijão Preto 1kg', category: 'Grãos', price: 8.90, costPrice: 5.50, stock: 40, minStock: 15, unit: 'un' },
  { id: '3', name: 'Leite Integral 1L', category: 'Laticínios', price: 5.20, costPrice: 3.80, stock: 120, minStock: 24, unit: 'un' },
  { id: '4', name: 'Óleo de Soja', category: 'Mercearia', price: 6.50, costPrice: 4.20, stock: 8, minStock: 10, unit: 'un' },
  { id: '5', name: 'Banana Nanica', category: 'Hortifruti', price: 4.90, costPrice: 2.10, stock: 15, minStock: 5, unit: 'kg' },
];

export const INITIAL_CUSTOMERS: any[] = [
  { id: 'c1', name: 'Dona Maria', phone: '11 98888-7777', totalDebt: 150.00, history: [
    { id: 'h1', date: '2023-10-20', description: 'Compra de mantimentos', amount: 150.00, type: 'DEBIT' }
  ]},
  { id: 'c2', name: 'Seu José', phone: '11 91111-2222', totalDebt: 0, history: [] },
];
