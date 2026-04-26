import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function NotifBell() {
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const [pulse, setPulse]     = useState(false);
  const intervalRef           = useRef(null);
  const navigate              = useNavigate();

  const charger = async () => {
    try {
      const res = await api.get('/notifications.php');
      const nouvelles = res.data.data || [];
      if (nouvelles.length > notifs.length) setPulse(true);
      setNotifs(nouvelles);
    } catch {}
  };

  useEffect(() => {
    charger();
    // Recharger toutes les 30 secondes
    intervalRef.current = setInterval(charger, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (pulse) {
      const t = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(t);
    }
  }, [pulse]);

  const couleurs = {
    warning: { bg: '#fffbeb', color: '#f59e0b', border: '#fcd34d' },
    danger:  { bg: '#fef2f2', color: '#ef4444', border: '#fca5a5' },
    info:    { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
    success: { bg: '#f0fdf4', color: '#10b981', border: '#86efac' },
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bouton cloche */}
      <button onClick={() => setOpen(!open)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '1.5rem', position: 'relative', padding: '4px 8px',
        animation: pulse ? 'shake 0.5s ease-in-out' : 'none'
      }}>
        🔔
        {notifs.length > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ef4444', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {notifs.length}
          </span>
        )}
      </button>

      {/* Dropdown notifications */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%',
          width: 340, background: 'white',
          borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 9999, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>
              🔔 Notifications
            </span>
            <span style={{
              background: '#ef4444', color: 'white',
              borderRadius: 20, padding: '2px 8px', fontSize: '0.75rem'
            }}>
              {notifs.length}
            </span>
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 350, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <p>Aucune notification</p>
              </div>
            ) : (
              notifs.map((n, i) => {
                const c = couleurs[n.type] || couleurs.info;
                return (
                  <div key={i} onClick={() => { navigate(n.lien); setOpen(false); }}
                    style={{
                      padding: '14px 20px', cursor: 'pointer',
                      borderLeft: `4px solid ${c.color}`,
                      borderBottom: '1px solid #f8fafc',
                      background: 'white', transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = c.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.3rem' }}>{n.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                          {n.message}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: c.color }}>
                          Cliquer pour voir →
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <button onClick={() => { charger(); }} style={{
              background: 'none', border: 'none', color: '#3b82f6',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
            }}>
              🔄 Actualiser
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  );
}