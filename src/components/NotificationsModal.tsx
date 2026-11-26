import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import UserProfile from './UserProfile';
import CommentsModal from './CommentsModal';

const iosEase = [0.22, 1, 0.36, 1] as const;

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
  const [openCommentsRecipe, setOpenCommentsRecipe] = useState<any | null>(null);

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
            ),
            recipe:recipes(
              id,
              title,
              image,
              category,
              description,
              author_id,
              author:profiles!recipes_author_id_fkey(
                id,
                username,
                name,
                avatar
              )
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
      transition={{ duration: 0.2, ease: iosEase }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex select-none items-end justify-center bg-black/45 backdrop-blur-[4px]"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="max-h-[85vh] w-full max-w-[480px] select-none overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.14)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="m-0 text-[20px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
            {t.title}
          </h2>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-[#F2F2F7] text-xs font-bold text-[#636366] transition-colors duration-200 hover:bg-[#E5E5EA]"
          >
            ✕
          </motion.button>
        </div>

        {loading ? (
          <div className="flex select-none items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
              className="h-9 w-9 rounded-full border-[3.5px] border-[#FF6B35]/20 border-t-[#FF6B35] border-r-[#FF9A5C] shadow-[0_4px_14px_rgba(255,107,53,0.25)]"
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mb-2 text-[36px]">🔔</div>
            <p className="m-0 text-sm font-bold text-[#1C1C1E]">
              {t.emptyTitle}
            </p>
            <p className="mt-0.5 text-xs text-[#8E8E93]">{t.emptySubtitle}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {notifications.map((notif, index) => {
              const isComment = notif.type === 'comment';

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    ease: iosEase,
                    delay: Math.min(index * 0.04, 0.2),
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    if (isComment && notif.recipe) {
                      setOpenCommentsRecipe(notif.recipe);
                    } else if (notif.sender?.id) {
                      setSelectedUserId(notif.sender.id);
                    }
                  }}
                  className={`flex cursor-pointer items-center gap-3 rounded-[16px] p-3 transition-colors duration-200 hover:brightness-[0.98] ${
                    notif.read ? 'bg-[#F7F7FA]' : 'bg-[#FFF0EB]'
                  }`}
                >
                  <div className="relative h-11 w-11 shrink-0">
                    <img
                      src={
                        notif.sender?.avatar ||
                        'https://via.placeholder.com/150'
                      }
                      alt={notif.sender?.name}
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="pointer-events-none h-full w-full select-none rounded-full object-cover"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B35] shadow-[0_2px_5px_rgba(255,107,53,0.4)]">
                      {isComment ? (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                      ) : (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="m-0 text-sm font-medium text-[#1C1C1E]">
                      <strong className="font-bold">
                        {notif.sender?.name}
                      </strong>{' '}
                      {isComment ? t.commentedOnRecipe : t.startedFollowing}
                    </p>
                    <span className="text-[11px] text-[#8E8E93]">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modal de perfil de usuario */}
        <AnimatePresence>
          {selectedUserId && (
            <UserProfile
              userId={selectedUserId}
              onClose={() => setSelectedUserId(null)}
            />
          )}

          {/* Modal de comentarios de la publicación */}
          {openCommentsRecipe && (
            <CommentsModal
              recipe={openCommentsRecipe}
              onClose={() => setOpenCommentsRecipe(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}