import React from 'react';
import { Bell, RefreshCw, Activity, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTitle, unreadCount = 0, onRefresh, onOpenNotifications }) {
  return (
    <header className="top-navbar">
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--secondary)' }}>
          {activeTitle}
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Transplant Allocation Decision-Support System
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '600',
          border: '1px solid #a7f3d0'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'inline-block'
          }}></span>
          Decision Support Active
        </div>

        {onRefresh && (
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onRefresh}
            title="Refresh current view data"
          >
            <RefreshCw size={14} />
            <span>Sync</span>
          </button>
        )}

        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onOpenNotifications}
          style={{ position: 'relative' }}
          title="Notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--danger)',
              color: 'white',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              fontSize: '0.65rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
