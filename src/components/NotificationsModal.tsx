import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import UserProfile from './UserProfile';

type Props = {
  onClose: () => void;
};

export default function NotificationsModal({ onClose }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      try {
        // Traemos las notificaciones con la info del usuario que la generó (sender)
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
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);

        // Marcar todas como leídas al abrirlas
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('recipient_id', user.id)
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
            Notificaciones
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
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E8E93' }}>Cargando...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>Sin notificaciones</p>
            <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>Aquí aparecerán cuando alguien empiece a seguirte.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
            {notifications.map((notif) => (
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
                <img
                  src={notif.sender?.avatar || 'https://via.placeholder.com/150'}
                  alt={notif.sender?.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: '#1C1C1E', margin: 0, fontWeight: 500 }}>
                    <strong style={{ fontWeight: 700 }}>{notif.sender?.name}</strong> empezó a seguirte.
                  </p>
                  <span style={{ fontSize: 11, color: '#8E8E93' }}>
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedUserId && (
          <UserProfile userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </motion.div>
    </motion.div>
  );
}