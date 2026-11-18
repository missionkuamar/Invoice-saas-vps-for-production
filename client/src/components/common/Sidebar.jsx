// frontend/src/components/common/Sidebar.jsx

import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  FaHome,
  FaFileInvoice,
  FaPlus,
  FaCog,
  FaCreditCard,
  FaUsers,
  FaChartBar,
  FaWallet,
  FaBell,
  FaShareAlt,
  FaChevronDown,
  FaChevronRight,
  FaFileAlt,
  FaTimes,
  FaUserShield,
  FaTools,
  FaBars,
  FaChevronLeft,
} from 'react-icons/fa';

import { HiOutlineMail } from 'react-icons/hi';
import { MdOutlineAlternateEmail } from 'react-icons/md';
import { SiMinutemailer } from 'react-icons/si';

import api from '../../services/api';
import { useTheme } from '../../themes/ThemeProvider';

const Sidebar = ({ onClose, isCollapsed, onToggleCollapse }) => {
  const { user } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const location = useLocation();

  const role = user?.role;
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';
  const hasAdminAccess = isAdmin || isSuperAdmin;

  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  const [isCreateSubmenuOpen, setIsCreateSubmenuOpen] = useState(
    location.pathname.startsWith('/create-invoice')
  );

  const [isEmailSubmenuOpen, setIsEmailSubmenuOpen] = useState(
    location.pathname.startsWith('/email-')
  );

  // ============================================================
  // FETCH ADMIN STATS
  // ============================================================

  useEffect(() => {
    if (!hasAdminAccess) return;

    fetchPendingCount();

    const interval = setInterval(() => {
      fetchPendingCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [hasAdminAccess]);

  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/admin/stats');
      setPendingWithdrawals(
        response.data?.data?.pendingWithdrawals || 0
      );
    } catch (error) {
      // Silent fail
    }
  };

  // ============================================================
  // MOBILE CLOSE
  // ============================================================

  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  // ============================================================
  // MENU DATA
  // ============================================================

  const userMenuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    {
      label: 'Create Invoice',
      icon: FaPlus,
      submenu: true,
      isOpen: isCreateSubmenuOpen,
      toggle: () => setIsCreateSubmenuOpen((prev) => !prev),
      submenuItems: [
        {
          path: '/create-invoice/simple',
          icon: FaFileAlt,
          label: 'Simple',
          description: 'Create simple invoice',
        },
      ],
    },
    {
      label: 'Email Service',
      icon: HiOutlineMail,
      submenu: true,
      isOpen: isEmailSubmenuOpen,
      toggle: () => setIsEmailSubmenuOpen((prev) => !prev),
      submenuItems: [
        {
          path: '/email-simple',
          icon: MdOutlineAlternateEmail,
          label: 'Simple Service',
          description: 'Send emails',
        },
        {
          path: '/email-scheduled',
          icon: SiMinutemailer,
          label: 'Scheduled Email',
          description: 'Schedule emails',
        },
      ],
    },
    { path: '/invoices', icon: FaFileInvoice, label: 'All Invoices' },
    { path: '/subscription', icon: FaCreditCard, label: 'Subscription' },
    { path: '/affiliate', icon: FaShareAlt, label: 'Affiliate' },
    { path: '/settings', icon: FaCog, label: 'Settings' },
  ];

  const adminMenuItems = [
    { path: '/admin/dashboard', icon: FaChartBar, label: 'Dashboard' },
    { path: '/admin/users', icon: FaUsers, label: 'Users' },
    {
      path: '/admin/withdrawals',
      icon: FaWallet,
      label: 'Withdrawals',
      badge: pendingWithdrawals > 0 ? pendingWithdrawals : null,
    },
    { path: '/admin/notifications', icon: FaBell, label: 'Notifications' },
  ];

  const superAdminMenuItems = [
    { path: '/admin/admins', icon: FaUserShield, label: 'Manage Admins' },
    { path: '/admin/system', icon: FaTools, label: 'System Settings' },
  ];

  // ============================================================
  // CLASSES
  // ============================================================

  const sidebarClass = `
    h-full
    w-full
    ${theme.colors.card}
    ${theme.colors.text}
    flex
    flex-col
    border-r
    ${theme.colors.border}
    overflow-hidden
    transition-all
    duration-300
    ease-in-out
  `;

  const navLinkClass = `
    group
    flex
    items-center
    justify-between
    w-full
    min-h-[44px]
    px-3
    py-2.5
    rounded-xl
    mb-1
    transition-all
    duration-200
    text-sm
  `;

  const inactiveClass = `
    opacity-70
    hover:opacity-100
    hover:bg-gray-100
    dark:hover:bg-gray-800
  `;

  const activeClass = `
    ${theme.colors.button}
    text-white
    shadow-sm
  `;

  // ============================================================
  // RENDER SUBMENU (collapsed mode shows nothing)
  // ============================================================

  const renderSubmenu = (item) => {
    if (isCollapsed) return null;

    return (
      <div
        className="
          ml-3 mt-1 mb-2 pl-2
          border-l-2 border-gray-200 dark:border-gray-700
          space-y-1
        "
      >
        {item.submenuItems.map((subItem, index) => (
          <NavLink
            key={subItem.path || index}
            to={subItem.path}
            onClick={handleLinkClick}
            className={({ isActive }) => `
              flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs
              transition-all duration-200
              ${isActive ? activeClass : 'opacity-65 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800'}
            `}
          >
            <subItem.icon className="flex-shrink-0" size={15} />
            <div className="min-w-0">
              <div className="truncate">{subItem.label}</div>
              {subItem.description && (
                <div className="text-[10px] opacity-50 truncate mt-0.5">
                  {subItem.description}
                </div>
              )}
            </div>
          </NavLink>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER NORMAL ITEM
  // ============================================================

  const renderNormalItem = (item, index) => {
    return (
      <NavLink
        key={item.path || index}
        to={item.path}
        onClick={handleLinkClick}
        title={isCollapsed ? item.label : undefined}
        className={({ isActive }) =>
          `${navLinkClass} ${isActive ? activeClass : inactiveClass} ${
            isCollapsed ? 'justify-center px-2' : ''
          }`
        }
      >
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
          <item.icon size={18} className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="truncate font-medium">{item.label}</span>
          )}
        </div>

        {!isCollapsed && item.badge && (
          <span className="flex-shrink-0 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}

        {isCollapsed && item.badge && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </NavLink>
    );
  };

  // ============================================================
  // RENDER SUBMENU ITEM
  // ============================================================

  const renderSubmenuItem = (item, index) => {
    return (
      <div key={index} className="relative">
        <button
          type="button"
          onClick={() => {
            if (isCollapsed) return;
            item.toggle();
          }}
          title={isCollapsed ? item.label : undefined}
          className={`
            ${navLinkClass} ${inactiveClass}
            ${isCollapsed ? 'justify-center px-2' : ''}
          `}
          aria-expanded={item.isOpen}
        >
          <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
            <item.icon size={18} className="flex-shrink-0" />
            {!isCollapsed && (
              <span className="truncate font-medium">{item.label}</span>
            )}
          </div>

          {!isCollapsed && (
            item.isOpen ? (
              <FaChevronDown size={12} className="flex-shrink-0 opacity-60" />
            ) : (
              <FaChevronRight size={12} className="flex-shrink-0 opacity-60" />
            )
          )}
        </button>

        {!isCollapsed && item.isOpen && renderSubmenu(item)}
      </div>
    );
  };

  // ============================================================
  // SECTION HEADER
  // ============================================================

  const SectionHeader = ({ title }) => {
    if (isCollapsed) {
      return (
        <div className="my-2 flex justify-center">
          <div className="w-6 h-px bg-gray-300 dark:bg-gray-700" />
        </div>
      );
    }
    return (
      <div className="px-3 mb-2 mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-40">
          {title}
        </p>
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <aside className={sidebarClass}>
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div
        className={`
          flex-shrink-0
          ${isCollapsed ? 'px-2 py-4' : 'px-4 py-4'}
          border-b
          ${theme.colors.border}
        `}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
          {isCollapsed ? (
            <div
              className={`
                w-10 h-10 rounded-xl ${theme.colors.button}
                flex items-center justify-center text-white font-bold text-lg
                shadow-md
              `}
              title="InvoicePro"
            >
              I
            </div>
          ) : (
            <div className="min-w-0">
              <h1 className={`text-xl font-bold tracking-tight ${theme.colors.text} truncate`}>
                Invoice<span className={theme.colors.primary}>Pro</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] opacity-50">v2.0</span>
                {isSuperAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                    Super Admin
                  </span>
                )}
                {isAdmin && !isSuperAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                    Admin
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mobile close */}
          {onClose && !isCollapsed && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close sidebar"
            >
              <FaTimes className={theme.colors.text} />
            </button>
          )}
        </div>

        {/* Desktop collapse toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`
              hidden lg:flex
              ${isCollapsed ? 'mx-auto mt-3' : 'mt-3 w-full'}
              items-center justify-center gap-2
              h-8 rounded-lg
              text-[11px] font-medium
              bg-gray-100 dark:bg-gray-800
              hover:bg-gray-200 dark:hover:bg-gray-700
              opacity-70 hover:opacity-100
              transition-all duration-200
            `}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <FaChevronRight size={12} />
            ) : (
              <>
                <FaChevronLeft size={12} />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ======================================================
          NAVIGATION
      ====================================================== */}
      <nav
        className={`
          flex-1 min-h-0 overflow-y-auto overflow-x-hidden
          ${isCollapsed ? 'px-1.5' : 'px-2 sm:px-3'}
          py-4
          scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700
        `}
      >
        {/* USER MENU */}
        <div>
          {userMenuItems.map((item, index) =>
            item.submenu
              ? renderSubmenuItem(item, index)
              : renderNormalItem(item, index)
          )}
        </div>

        {/* ADMIN SECTION */}
        {hasAdminAccess && (
          <div className={`${isCollapsed ? 'mt-2' : 'mt-2'}`}>
            <SectionHeader title="Administration" />
            {adminMenuItems.map((item, index) => renderNormalItem(item, index))}

            {isSuperAdmin && (
              <>
                <SectionHeader title="Super Admin" />
                {superAdminMenuItems.map((item, index) => renderNormalItem(item, index))}
              </>
            )}
          </div>
        )}
      </nav>

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <div
        className={`
          flex-shrink-0
          ${isCollapsed ? 'px-2 py-3' : 'px-4 py-3'}
          border-t
          ${theme.colors.border}
        `}
      >
        {isCollapsed ? (
          <div className="flex justify-center text-[10px] opacity-40">v2</div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] opacity-50">
            <span>© 2024 InvoicePro</span>
            <span>v2.0.0</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;