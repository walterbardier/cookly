import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/mockData';
import type { Recipe } from '../data/mockData';
import RecipeModal from './RecipeModal';
import { useLanguage } from '../context/LanguageContext';
import { useLikes } from '../context/LikesContext';
import { translations } from '../utils/translations';

const iosEase = [0.22, 1, 0.36, 1] as const;

type Props = {
  userId: string;
  onClose: () => void;
};

export default function UserProfile({ userId, onClose }: Props) {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const [profile, setProfile] = useState<any>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);

  const { initializeLikes } = useLikes();

  useEffect(() => {
    if (!userId) return;

    async function loadUserProfile() {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select(`
            *,
            author:profiles!recipes_author_id_fkey(
              id,
              username,
              name,
              avatar
            )
          `)
          .eq('author_id', userId)
          .neq('is_public', false)
          .order('created_at', { ascending: false });

        if (!recipeError && recipeData) {
          setRecipes(recipeData);
          initializeLikes(recipeData);
        }

        const { count: followersTotal } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
        setFollowersCount(followersTotal || 0);

        const { count: followingTotal } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);
        setFollowingCount(followingTotal || 0);

        if (currentUser && currentUser.id !== userId) {
          const { data: followCheck } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .maybeSingle();

          setIsFollowing(!!followCheck);
        }
      } catch (err) {
        console.error('Error cargando perfil de usuario:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [userId, currentUser]);

  const toggleFollow = async () => {
    if (!currentUser || currentUser.id === userId) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);

      setIsFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: userId,
      });

      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: iosEase }}
        className="fixed inset-0 z-[110] flex select-none items-center justify-center bg-white"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-[3.5px] border-[#FF6B35]/20 border-t-[#FF6B35] border-r-[#FF9A5C] shadow-[0_4px_14px_rgba(255,107,53,0.25)]"
        />
      </motion.div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.34, ease: iosEase }}
      className="fixed inset-0 z-[100] flex h-screen w-screen select-none flex-col overflow-y-auto bg-white pb-12"
    >
      {/* Header Sticky con degradé de desvanecimiento (100% arriba -> 0% abajo) */}
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: iosEase }}
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.94) 64%, rgba(255,255,255,0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.94) 64%, rgba(255,255,255,0) 100%)',
        }}
        className="sticky top-0 z-30 flex select-none items-center justify-between bg-white/90 px-5 pb-7 pt-[calc(env(safe-area-inset-top,44px)+12px)] backdrop-blur-[20px] backdrop-saturate-[180%]"
      >
        <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.4px] text-[#1C1C1E]">
          {profile.name}
        </h2>

        <motion.button
          type="button"
          aria-label="Cerrar"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={onClose}
          className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded-full border-none bg-[#F2F2F7] text-sm font-extrabold text-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-colors duration-200 hover:bg-[#E5E5EA]"
        >
          ✕
        </motion.button>
      </motion.header>

      <div className="mx-auto w-full max-w-[520px] px-4 pt-1">
        {/* Tarjeta de Perfil principal con Banner limpio */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: iosEase, delay: 0.04 }}
          className="mb-4 overflow-hidden rounded-[32px] bg-[#F7F7FA] shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
        >
          {/* Imagen del Banner */}
          <div
            style={{
              background: profile.banner
                ? `url(${profile.banner}) center/cover no-repeat`
                : 'linear-gradient(135deg, #FF6B35, #FF9A5C)',
            }}
            className="relative h-[135px] w-full"
          >
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/15 to-transparent" />
          </div>

          {/* Contenido del Perfil */}
          <div className="px-5 pb-6 text-center">
            {/* Avatar flotante sobre el banner */}
            <div className="relative z-[2] -mt-[46px] mb-3 flex justify-center">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="pointer-events-none h-[84px] w-[84px] select-none rounded-full border-4 border-white object-cover shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
                />
              ) : (
                <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-4 border-white bg-[#E5E5EA] shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8E8E93"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>

            <h1 className="m-0 mb-0.5 text-[22px] font-extrabold tracking-[-0.4px] text-[#1C1C1E]">
              {profile.name}
            </h1>
            <p className="m-0 mb-2 text-[13px] font-semibold text-[#8E8E93]">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="mx-auto mb-4 max-w-[300px] text-[13px] leading-[1.5] text-[#636366]">
                {profile.bio}
              </p>
            )}

            {/* Botón Seguir / Siguiendo */}
            {currentUser && currentUser.id !== userId && (
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleFollow}
                className={`mb-4 w-full cursor-pointer select-none rounded-[20px] border-none py-3 text-[14px] font-extrabold transition-all duration-200 ${
                  isFollowing
                    ? 'bg-[#E5E5EA] text-[#1C1C1E] shadow-none hover:bg-[#DCDCE2]'
                    : 'bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] text-white shadow-[0_4px_14px_rgba(255,107,53,0.35)] hover:shadow-[0_8px_20px_rgba(255,107,53,0.42)]'
                }`}
              >
                {isFollowing ? t.friends.following : t.friends.follow}
              </motion.button>
            )}

            {/* Contadores */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: recipes.length, label: t.profile.recipesCount },
                { value: followersCount, label: t.profile.followers },
                { value: followingCount, label: t.profile.following },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[18px] bg-white px-1 py-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="text-[18px] font-extrabold text-[#1C1C1E]">
                    {stat.value}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-[#8E8E93]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Intereses */}
        {profile.interests && profile.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: iosEase, delay: 0.1 }}
            className="mb-4 rounded-[32px] bg-[#F7F7FA] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <p className="mb-3 mt-0 text-xs font-extrabold uppercase tracking-[0.5px] text-[#8E8E93]">
              {t.profile.interests}
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((catId: string) => {
                const cat = CATEGORIES.find((c) => c.id === catId);
                if (!cat) return null;
                return (
                  <div
                    key={cat.id}
                    style={{
                      backgroundColor: cat.bgColor,
                      borderColor: `${cat.color}33`,
                    }}
                    className="flex items-center gap-1.5 rounded-[20px] border-[1.5px] px-3 py-1.5 transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <span>{cat.emoji}</span>
                    <span
                      style={{ color: cat.color }}
                      className="text-xs font-bold"
                    >
                      {cat.name[language]}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recetas Públicas Listado / Grupo iOS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: iosEase, delay: 0.16 }}
          className="mb-5"
        >
          <h3 className="mb-3 mt-0 pl-1 text-[18px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
            {t.profile.publicRecipes}
          </h3>

          {recipes.length === 0 ? (
            <div className="rounded-[32px] bg-[#F7F7FA] py-10 text-center">
              <div className="mb-2 text-[36px]">🍳</div>
              <p className="m-0 text-sm font-bold text-[#1C1C1E]">
                Sin recetas públicas
              </p>
              <p className="mt-0.5 text-xs text-[#8E8E93]">
                Este usuario aún no ha compartido recetas.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[2px] overflow-hidden rounded-[24px] bg-[#ECECF2] shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
              {recipes.map((recipe, index) => {
                const isFirst = index === 0;
                const isLast = index === recipes.length - 1;
                const isSingle = recipes.length === 1;

                const itemRadiusClass = isSingle
                  ? 'rounded-[24px]'
                  : isFirst
                    ? 'rounded-t-[24px] rounded-b-[6px]'
                    : isLast
                      ? 'rounded-t-[6px] rounded-b-[24px]'
                      : 'rounded-[6px]';

                return (
                  <motion.button
                    key={recipe.id}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.32,
                      ease: iosEase,
                      delay: Math.min(0.18 + index * 0.04, 0.42),
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setOpenRecipe(recipe)}
                    className={`group flex w-full cursor-pointer select-none items-center gap-3.5 border-none bg-[#F7F7FA] p-3 text-left transition-colors duration-200 hover:bg-[#F2F2F7] ${itemRadiusClass}`}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[#E5E5EA]">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-[15px] font-extrabold text-[#1C1C1E]">
                        {recipe.title}
                      </p>
                      {recipe.description && (
                        <p className="m-0 mt-0.5 line-clamp-1 text-xs font-medium text-[#8E8E93]">
                          {recipe.description}
                        </p>
                      )}
                    </div>

                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C7C7CC"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {openRecipe && (
          <RecipeModal
            recipe={openRecipe}
            onClose={() => setOpenRecipe(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}