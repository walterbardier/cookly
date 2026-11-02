import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import UserProfile from './UserProfile';

type Props = {
  onClose: () => void;
};

export default function NotificationsModal({ onClose }: Props) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].notifications;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchNotifications() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            *,
            sender:profiles!notifications_sender_id_fkey(
              id,
              name,
              username,
              avatar
            )
          `)
          .eq('recipient_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);

        // Marcar todas como leídas al abrirlas
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('recipient_id', userId)
          .eq('read', false);

      } catch (err) {
        console.error('Error cargando notificaciones:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          background: 'white',
          borderRadius: '28px 28px 0 0',
          overflowY: 'auto',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1E', margin: 0 }}>
            {t.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#F2F2F7',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E8E93' }}>{t.loading}</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>{t.emptyTitle}</p>
            <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{t.emptySubtitle}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
            {notifications.map((notif) => {
              const isComment = notif.type === 'comment';

              return (
                <div
                  key={notif.id}
                  onClick={() => notif.sender?.id && setSelectedUserId(notif.sender.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 16,
                    background: notif.read ? '#F7F7FA' : '#FFF0EB',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {/* Contenedor del Avatar con la burbuja #FF6B35 sin borde blanco */}
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <img
                      src={notif.sender?.avatar || 'https://via.placeholder.com/150'}
                      alt={notif.sender?.name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        background: '#FF6B35',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(255,107,53,0.4)',
                      }}
                    >
                      {isComment ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: '#1C1C1E', margin: 0, fontWeight: 500 }}>
                      <strong style={{ fontWeight: 700 }}>{notif.sender?.name}</strong>{' '}
                      {isComment ? t.commentedOnRecipe : t.startedFollowing}
                    </p>
                    <span style={{ fontSize: 11, color: '#8E8E93' }}>
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedUserId && (
          <UserProfile userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </motion.div>
    </motion.div>
  );
}