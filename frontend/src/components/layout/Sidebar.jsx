import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Box,
  FileText,
  BarChart3,
  Mail,
  Users,
  Globe,
  ClipboardList,
  Settings,
  Shield,
  Monitor,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const mainMenu = [
    { name: 'Dashboard', icon: LayoutGrid, path: '/' },
    { name: 'Products', icon: Box, path: '/products' },
    { name: 'Orders', icon: FileText, path: '/orders', badge: 47 },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    { name: 'Messages', icon: Mail, path: '/messages', badge: 3 },
  ];

  const customerMenu = [
    { name: 'Client List', icon: Users, path: '/clients' },
    { name: 'Channels', icon: Globe, path: '/channels' },
    { name: 'Pipeline', icon: ClipboardList, path: '/pipeline' },
  ];

  const managementMenu = [
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Roles', icon: Shield, path: '/roles' },
    { name: 'Integrations', icon: Monitor, path: '/integrations' },
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <NavLink
        to={item.path}
        data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
      >
        <item.icon size={18} />
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <span className="bg-crm-green text-white text-xs px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        data-testid="mobile-menu-toggle"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-crm-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-crm-border flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-crm-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-crm-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <p className="label-uppercase text-[9px]">Promo Products</p>
              <p className="font-serif text-lg text-crm-text-primary">SOA East LLC</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Main Menu */}
          <div className="mb-6">
            <p className="label-uppercase px-4 mb-2">Main Menu</p>
            <div className="space-y-1">
              {mainMenu.map(item => <NavItem key={item.path} item={item} />)}
            </div>
          </div>

          {/* Customers */}
          <div className="mb-6">
            <p className="label-uppercase px-4 mb-2">Customers</p>
            <div className="space-y-1">
              {customerMenu.map(item => <NavItem key={item.path} item={item} />)}
            </div>
          </div>

          {/* Management */}
          <div>
            <p className="label-uppercase px-4 mb-2">Management</p>
            <div className="space-y-1">
              {managementMenu.map(item => <NavItem key={item.path} item={item} />)}
            </div>
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-crm-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-crm-green-light rounded-full flex items-center justify-center">
              <span className="text-crm-green font-bold">{user?.initials || 'SH'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name || 'Scott'}</p>
              <p className="text-xs text-crm-text-secondary truncate">{user?.role || 'CEO / President'}</p>
            </div>
            <button
              data-testid="logout-btn"
              onClick={logout}
              className="p-2 text-crm-text-secondary hover:text-crm-danger rounded-lg hover:bg-crm-hover transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
