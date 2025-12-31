
import React, { useState } from 'react';
import { View, UserRole } from '../types';
import { ICONS } from '../constants';
import Logo from './Logo';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  role: UserRole;
  onSwitchRole: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  role, 
  onSwitchRole, 
  isCollapsed, 
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const sellerItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'POS', label: 'Vender (PDV)', icon: <ICONS.POS /> },
  ];

  const adminItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: <ICONS.Dashboard /> },
    { id: 'INVENTORY', label: 'Estoque', icon: <ICONS.Inventory /> },
    { id: 'FIADO', label: 'Fiado / Clientes', icon: <ICONS.Fiado /> },
    { id: 'SALES', label: 'Histórico Vendas', icon: <ICONS.Sales /> },
  ];

  const menuItems = role === 'ADMIN' ? adminItems : sellerItems;

  const handleNavClick = (view: View) => {
    onViewChange(view);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarClasses = `
    fixed left-0 top-0 h-full z-50 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-all duration-300
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    ${isCollapsed ? 'w-20' : 'w-60'}
  `;

  const customerPortalUrl = `${window.location.origin}${window.location.pathname}?view=customer`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(customerPortalUrl)}`;

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        ></div>
      )}

      <div className={sidebarClasses}>
        <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          {isCollapsed && !isMobileOpen ? (
            <Logo size="sm" showText={false} />
          ) : (
            <Logo size="sm" light />
          )}
        </div>

        <div className="hidden lg:flex p-2 justify-center border-b border-slate-800">
          <button 
            onClick={onToggleCollapse}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            )}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {(!isCollapsed || isMobileOpen) && <span className="font-bold text-sm">{item.label}</span>}
            </button>
          ))}

          {/* Botão de QR Code na Sidebar (Posição Azul solicitada) */}
          {role !== 'CLIENTE' && (
            <button
              onClick={() => setIsQRModalOpen(true)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-white/5 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
            >
              <span className="shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1a2 2 0 0 1 2 2v1"/><path d="M21 12v.01"/><path d="M17 21h.01"/></svg>
              </span>
              {(!isCollapsed || isMobileOpen) && <span className="font-black text-[10px] uppercase tracking-widest">QR CODE CLIENTE</span>}
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onSwitchRole}
            className={`w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            {(!isCollapsed || isMobileOpen) && "Sair do Sistema"}
          </button>
        </div>
      </div>

      {/* Modal de QR Code Centralizado */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setIsQRModalOpen(false)}>
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 flex flex-col items-center space-y-8 animate-in zoom-in-90 duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-full flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">PORTAL DO CLIENTE</h3>
               <button onClick={() => setIsQRModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-[2.5rem] shadow-inner border-2 border-slate-100">
               <img src={qrCodeImageUrl} alt="QR Code Portal do Cliente" className="w-64 h-64 rounded-2xl mix-blend-multiply" />
            </div>

            <div className="text-center space-y-3">
               <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Aponte a câmera aqui</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                 O CLIENTE TERÁ ACESSO APENAS <br/> AO PORTAL DE COMPRAS DELE
               </p>
            </div>

            <button 
              onClick={() => setIsQRModalOpen(false)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest border-b-4 border-black active:scale-95 transition-all"
            >
              Fechar Janela
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
