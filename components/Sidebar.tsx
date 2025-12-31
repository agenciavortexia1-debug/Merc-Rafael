
import React from 'react';
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
    </>
  );
};

export default Sidebar;
