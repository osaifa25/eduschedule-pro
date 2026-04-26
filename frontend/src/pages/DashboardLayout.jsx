import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import NotifBell from '../components/NotifBell';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { dark, setDark } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [stats, setStats]         = useState({});
  const [sidebarOpen, setSidebar] = useState(true);
  const [emplois, setEmplois]     = useState([]);
  const [vacations, setVacations] = useState([]);

  // Couleurs selon le thème
  const bg      = dark ? '#0f172a' : '#f1f5f9';
  const card    = dark ? '#1e293b' : 'white';
  const text    = dark ? '#e2e8f0' : '#1e293b';
  const muted   = dark ? '#94a3b8' : '#64748b';
  const border  = dark ? '#334155' : '#f1f5f9';

  useEffect(() => {
    api.get('/dashboard.php').then(r => setStats(r.data.data)).catch(() => {});
    if (user?.role === 'administrateur') {
      api.get('/emploi_temps.php').then(r => setEmplois(r.data.data)).catch(() => {});
      api.get('/vacations.php').then(r => setVacations(r.data.data)).catch(() => {});
    }
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth.php?action=logout'); } catch {}
    logout();
    navigate('/login');
  };

  const menuParRole = {
    administrateur: [
      { label: 'Tableau de bord',      path: '/dashboard',    icon: '📊' },
      { label: 'Gestion référentiels', path: '/gestion',      icon: '⚙️' },
      { label: 'Emploi du temps',      path: '/emploi-temps', icon: '📅' },
      { label: 'Cahiers de texte',     path: '/cahiers',      icon: '📝' },
      { label: 'Vacations',            path: '/vacations',    icon: '💰' },
    ],
    enseignant: [
      { label: 'Tableau de bord', path: '/dashboard',  icon: '📊' },
      { label: 'Mon pointage',    path: '/pointage',   icon: '📷' },
      { label: 'Mes cahiers',     path: '/cahiers',    icon: '📝' },
      { label: 'Mes vacations',   path: '/vacations',  icon: '💰' },
    ],
    delegue: [
      { label: 'Tableau de bord',  path: '/dashboard',    icon: '📊' },
      { label: 'Emploi du temps',  path: '/emploi-temps', icon: '📅' },
      { label: 'Cahiers de texte', path: '/cahiers',      icon: '📝' },
    ],
    surveillant: [
      { label: 'Tableau de bord', path: '/dashboard',    icon: '📊' },
      { label: 'Emploi du temps', path: '/emploi-temps', icon: '📅' },
      { label: 'Vacations',       path: '/vacations',    icon: '💰' },
    ],
    comptable: [
      { label: 'Tableau de bord', path: '/dashboard',  icon: '📊' },
      { label: 'Vacations',       path: '/vacations',  icon: '💰' },
    ],
    etudiant: [
      { label: 'Tableau de bord', path: '/dashboard',    icon: '📊' },
      { label: 'Emploi du temps', path: '/emploi-temps', icon: '📅' },
    ]
  };

  const menu = menuParRole[user?.role] || [];

  const roleColors = {
    administrateur: '#ef4444',
    enseignant:     '#3b82f6',
    delegue:        '#10b981',
    surveillant:    '#f59e0b',
    comptable:      '#8b5cf6',
    etudiant:       '#6b7280'
  };

  const statCards = [
    { key: 'total_classes',        label: 'Classes',              icon: '🏫', color: '#3b82f6' },
    { key: 'total_enseignants',    label: 'Enseignants',          icon: '👨‍🏫', color: '#10b981' },
    { key: 'seances_aujourd_hui',  label: "Séances aujourd'hui",  icon: '📅', color: '#f59e0b' },
    { key: 'cahiers_non_signes',   label: 'Cahiers en attente',   icon: '📝', color: '#ef4444' },
    { key: 'vacations_en_attente', label: 'Vacations en attente', icon: '💰', color: '#8b5cf6' },
    { key: 'mes_seances_semaine',  label: 'Mes séances',          icon: '📅', color: '#3b82f6' },
    { key: 'mes_vacations',        label: 'Mes vacations',        icon: '💰', color: '#10b981' },
    { key: 'montant_total',        label: 'Montant total (FCFA)', icon: '💵', color: '#f59e0b' },
    { key: 'cahiers_a_remplir',    label: 'Cahiers à remplir',    icon: '📝', color: '#ef4444' },
    { key: 'cahiers_signes',       label: 'Cahiers signés',       icon: '✅', color: '#10b981' },
  ].filter(s => stats[s.key] !== undefined);

  const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const creneauxParJour = JOURS.map(jour => ({
    jour,
    seances: emplois.reduce((acc, et) => acc + (et.creneaux || []).filter(c => c.jour === jour).length, 0)
  }));

  const vacationsParStatut = [
    { name: 'Générée',   value: vacations.filter(v => v.statut === 'generee').length,          color: '#94a3b8' },
    { name: 'Visée',     value: vacations.filter(v => v.statut === 'visee_surveillant').length, color: '#f59e0b' },
    { name: 'Approuvée', value: vacations.filter(v => v.statut === 'approuvee').length,         color: '#10b981' },
  ].filter(v => v.value > 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg }}>

      {/* ===== SIDEBAR ===== */}
      <div style={{
        width: sidebarOpen ? 260 : 70,
        background: dark
          ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(180deg, #1e3a5f 0%, #0f2027 100%)',
        color: 'white', display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 1000, overflowX: 'hidden'
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0
            }}>📅</div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>EduSchedule</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Pro — ISGE</div>
              </div>
            )}
          </div>
        </div>

        {/* Infos utilisateur */}
        {sidebarOpen && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: roleColors[user?.role] || '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, marginBottom: 8, fontSize: '1.1rem'
            }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.email}</div>
            <div style={{
              fontSize: '0.7rem', marginTop: 4, padding: '2px 8px',
              background: roleColors[user?.role] || '#3b82f6',
              borderRadius: 20, display: 'inline-block'
            }}>{user?.role}</div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {menu.map(item => {
            const actif = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none', color: 'white',
                background: actif ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'background 0.2s',
                borderLeft: actif ? '3px solid #3b82f6' : '3px solid transparent'
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span style={{ fontSize: '0.9rem' }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bas sidebar */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Bouton mode sombre */}
          <button onClick={() => setDark(!dark)} style={{
            width: '100%', background: 'rgba(255,255,255,0.1)',
            border: 'none', color: 'white', borderRadius: 8,
            padding: '8px', cursor: 'pointer', marginBottom: 8,
            fontSize: '0.85rem', fontWeight: 600
          }}>
            {sidebarOpen ? (dark ? '☀️ Mode clair' : '🌙 Mode sombre') : (dark ? '☀️' : '🌙')}
          </button>

          {/* Bouton réduire */}
          <button onClick={() => setSidebar(!sidebarOpen)} style={{
            width: '100%', background: 'rgba(255,255,255,0.08)',
            border: 'none', color: 'white', borderRadius: 8,
            padding: '8px', cursor: 'pointer', marginBottom: 8
          }}>
            {sidebarOpen ? '◀ Réduire' : '▶'}
          </button>

          {/* Déconnexion */}
          <button onClick={handleLogout} style={{
            width: '100%', background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5', borderRadius: 8,
            padding: '8px', cursor: 'pointer', fontSize: '0.85rem'
          }}>
            {sidebarOpen ? '🚪 Déconnexion' : '🚪'}
          </button>
        </div>
      </div>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <div style={{ marginLeft: sidebarOpen ? 260 : 70, flex: 1, transition: 'margin-left 0.3s' }}>

        {/* Topbar */}
        <div style={{
          background: card, padding: '16px 32px',
          boxShadow: dark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: `1px solid ${border}`
        }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: text }}>Tableau de bord</h5>
            <p style={{ margin: 0, fontSize: '0.85rem', color: muted }}>
              Bienvenue, {user?.email} 👋
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '0.85rem', color: muted }}>
              📅 {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
            <NotifBell />
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '32px' }}>

          {/* Cartes statistiques */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20, marginBottom: 32
          }}>
            {statCards.map(s => (
              <div key={s.key} style={{
                background: card, borderRadius: 16, padding: '24px',
                boxShadow: dark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
                borderTop: `4px solid ${s.color}`
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: text }}>
                  {stats[s.key]}
                </div>
                <div style={{ fontSize: '0.85rem', color: muted, marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Graphiques admin */}
          {user?.role === 'administrateur' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

              {/* Graphique séances par jour */}
              <div style={{
                background: card, borderRadius: 16, padding: '24px',
                boxShadow: dark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)'
              }}>
                <h6 style={{ fontWeight: 700, marginBottom: 20, color: text }}>
                  📊 Séances par jour de la semaine
                </h6>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={creneauxParJour}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="jour" tick={{ fontSize: 11, fill: muted }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: muted }} />
                    <Tooltip
                      contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 8 }}
                      labelStyle={{ color: text }}
                    />
                    <Bar dataKey="seances" fill="#3b82f6" radius={[6,6,0,0]} name="Séances" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique vacations */}
              <div style={{
                background: card, borderRadius: 16, padding: '24px',
                boxShadow: dark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)'
              }}>
                <h6 style={{ fontWeight: 700, marginBottom: 20, color: text }}>
                  💰 Statut des fiches de vacation
                </h6>
                {vacationsParStatut.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={vacationsParStatut} cx="50%" cy="50%" outerRadius={80}
                        dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {vacationsParStatut.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend wrapperStyle={{ color: muted }} />
                      <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted }}>
                    Aucune vacation enregistrée
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bannière bienvenue */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
            borderRadius: 16, padding: '32px', color: 'white'
          }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8 }}>
              Bienvenue sur EduSchedule Pro 🎓
            </h4>
            <p style={{ opacity: 0.85, marginBottom: 16 }}>
              Gérez vos emplois du temps, suivez les séances et calculez les vacations en toute simplicité.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {menu.slice(1, 3).map(item => (
                <Link key={item.path} to={item.path} style={{
                  background: 'rgba(255,255,255,0.2)', color: 'white',
                  padding: '8px 20px', borderRadius: 50, textDecoration: 'none',
                  fontSize: '0.9rem', fontWeight: 600
                }}>
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}