import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipeModal from './RecipeModal';
import UserProfile from './UserProfile';
import CommentsModal from './CommentsModal';

import { CATEGORIES } from '../data/mockData';
import type { Recipe } from '../data/mockData';

import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

import { useLikes } from '../context/LikesContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const iosEase = [0.22, 1, 0.36, 1] as const;

export default function FriendsTab() {
  const { language } = useLanguage();
  const t = translations[language].friends;

  const { user } = useAuth();
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openCommentsRecipe, setOpenCommentsRecipe] = useState<Recipe | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [copiedRecipeId, setCopiedRecipeId] = useState<string | null>(null);

  // Modal y buscador para agregar/seguir usuarios desde el botón redondo superior derecho
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>({});

  // Referencias y estados para el scroll horizontal y arrastre de la barra
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbWidth, setThumbWidth] = useState(30);
  const [thumbLeft, setThumbLeft] = useState(0);

  const isThumbDragging = useRef(false);

  const { initializeLikes, getLikes, isLiked, toggleLike } = useLikes();

  useEffect(() => {
    loadFriends();
  }, [user]);

  useEffect(() => {
    const handleWindowScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  // Actualizar la posición de la barra de desplazamiento horizontal
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        const ratio = clientWidth / scrollWidth;
        const width = Math.max(ratio * 100, 20);
        setThumbWidth(width);
        const progress = scrollLeft / maxScroll;
        setThumbLeft(progress * (100 - width));
      }
    }
  };

  // Funciones para hacer "Click and Hold" y arrastrar la barra horizontal suavemente
  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isThumbDragging.current = true;
    updateScrollFromMouseX(e.clientX);

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const handleWindowMouseMove = (e: MouseEvent) => {
    if (!isThumbDragging.current) return;
    updateScrollFromMouseX(e.clientX);
  };

  const handleWindowMouseUp = () => {
    isThumbDragging.current = false;
    window.removeEventListener('mousemove', handleWindowMouseMove);
    window.removeEventListener('mouseup', handleWindowMouseUp);
  };

  const updateScrollFromMouseX = (clientX: number) => {
    if (!trackRef.current || !scrollRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = percentage * maxScroll;
  };

  async function loadCommentsCounts(recipeIds: string[]) {
    if (recipeIds.length === 0) {
      setCommentsCounts({});
      return;
    }

    const { data: commentsRows, error } = await supabase
      .from('comments')
      .select('recipe_id')
      .in('recipe_id', recipeIds);

    if (error) {
      console.log(error);
      return;
    }

    const countsMap: Record<string, number> = {};
    for (const row of commentsRows ?? []) {
      if (!row.recipe_id) continue;
      countsMap[row.recipe_id] = (countsMap[row.recipe_id] || 0) + 1;
    }

    setCommentsCounts(countsMap);
  }

  async function loadFriends() {
    if (!user) return;

    // 1. Cargar usuarios (excluyendo al usuario actual)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id);

    if (profilesError) {
      console.log(profilesError);
      return;
    }

    // 2. Cargar recetas públicas de otros usuarios
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
      .neq('author_id', user.id)
      .neq('is_public', false)
      .order('created_at', { ascending: false });

    if (recipeError) {
      console.log(recipeError);
      return;
    }

    const safeRecipes = recipeData ?? [];
    setRecipes(safeRecipes);
    await loadCommentsCounts(safeRecipes.map((r) => r.id));

    initializeLikes(
      safeRecipes.map((recipe) => ({
        id: recipe.id,
        likes: recipe.likes,
      }))
    );

    // 3. Mapear perfiles calculando cuántas recetas públicas pertenecen a cada author_id
    const profilesWithCounts = (profiles ?? []).map((profile) => ({
      ...profile,
      recipesCount:
        safeRecipes.filter((recipe) => recipe.author_id === profile.id).length ?? 0,
    }));

    setUsers(profilesWithCounts);

    // 4. Cargar a qué usuarios sigue el usuario actual
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    setFollowing(follows?.map((f) => f.following_id) ?? []);
  }

  async function toggleFollow(id: string) {
    if (!user || !id) return;

    const exists = following.includes(id);

    if (exists) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', id);

      setFollowing((prev) => prev.filter((x) => x !== id));
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: id,
      });

      setFollowing((prev) => [...prev, id]);
    }
  }

  async function handleShareRecipe(recipe: any) {
    const shareUrl = `${window.location.origin}/?recipe=${recipe.id}`;
    const shareTitle = recipe.title;
    const shareText = recipe.description
      ? `${recipe.title} — ${recipe.description}`
      : recipe.title;

    const isMobileDevice =
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      window.matchMedia('(pointer: coarse)').matches;

    if (isMobileDevice && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedRecipeId(recipe.id);
      setTimeout(() => {
        setCopiedRecipeId((prev) => (prev === recipe.id ? null : prev));
      }, 1600);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  }

  const suggestions = users;

  const filteredAddUsers = users.filter((u) => {
    const query = friendSearchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!query) return true;
    const nameMatch = (u.name || '').toLowerCase().includes(query);
    const usernameMatch = (u.username || '').toLowerCase().includes(query);
    return nameMatch || usernameMatch;
  });

  const followingRecipes = recipes.filter(
    (recipe) => following.includes(recipe.author?.id) && recipe.is_public !== false
  );

  return (
    <div className="min-h-screen select-none bg-[#F2F2F7] pb-[100px]">
      {/* Header fijo con degradé de desvanecimiento (100% arriba -> 0% abajo) */}
      <header
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 64%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 64%, rgba(0,0,0,0) 100%)',
        }}
        className="sticky top-0 z-30 mt-4 select-none bg-[#F2F2F7]/85 pb-7 pt-[calc(env(safe-area-inset-top,44px)+14px)] backdrop-blur-[20px] backdrop-saturate-[180%]"
      >
        <div className="flex items-end justify-between px-5 pt-3.5">
          <motion.h1
            animate={{ color: isScrolled ? '#FF6B35' : '#18181B' }}
            transition={{ duration: 0.25, ease: iosEase }}
            className="m-0 select-none text-3xl font-extrabold tracking-[-0.5px]"
          >
            {t.title}
          </motion.h1>

          {/* Botón redondo arriba a la derecha para agregar usuario */}
          <motion.button
            type="button"
            aria-label="Add user"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 460, damping: 28 }}
            onClick={() => setShowAddFriendModal(true)}
            className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded-full border-none bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.09)]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1C1C1E"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </motion.button>
        </div>
      </header>

      <div className="select-none py-4">
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <section className="mb-6">
            <div className="mb-2 px-5">
              <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
                {t.suggestions}
              </h2>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-3 overflow-x-auto px-5 py-2.5 [scrollbar-width:none]"
            >
              {suggestions.map((u, index) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: iosEase,
                    delay: Math.min(index * 0.04, 0.2),
                  }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedUserId(u.id)}
                  className="flex w-40 shrink-0 cursor-pointer select-none flex-col items-center rounded-3xl bg-white p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]"
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.name}
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="pointer-events-none mb-2 h-14 w-14 select-none rounded-full object-cover"
                    />
                  ) : (
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#E5E5EA]">
                      <svg
                        width="26"
                        height="26"
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

                  <p className="m-0 mb-0.5 text-[13px] font-extrabold text-[#1C1C1E]">
                    {u.name}
                  </p>

                  <p className="m-0 mb-1 text-[11px] font-semibold text-[#AEAEB2]">
                    @{u.username}
                  </p>

                  <p className="m-0 mb-3 text-[11px] text-[#636366]">
                    {u.recipesCount} {t.recipes}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(u.id);
                    }}
                    className={`w-full cursor-pointer select-none rounded-full border-none py-2 text-xs font-extrabold transition-all duration-200 ease-out active:scale-95 ${
                      following.includes(u.id)
                        ? 'bg-[#F2F2F7] text-[#636366] shadow-none hover:bg-[#E5E5EA]'
                        : 'bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] text-white shadow-[0_4px_12px_rgba(255,107,53,0.35)] hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(255,107,53,0.45)]'
                    }`}
                  >
                    {following.includes(u.id) ? t.following : t.follow}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Barra de desplazamiento horizontal */}
            <div className="mt-2 px-5">
              <div
                ref={trackRef}
                onMouseDown={handleTrackMouseDown}
                className="relative h-1.5 w-full cursor-grab select-none overflow-hidden rounded-[3px] bg-[#E5E5EA] active:cursor-grabbing"
              >
                <div
                  style={{
                    width: `${thumbWidth}%`,
                    left: `${thumbLeft}%`,
                  }}
                  className="absolute top-0 h-full cursor-grab rounded-[3px] bg-[#FF6B35] active:cursor-grabbing"
                />
              </div>
            </div>
          </section>
        )}

        {/* Following feed */}
        <section>
          <div className="mb-3 px-5">
            <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
              {t.recentActivity}
            </h2>
          </div>

          {followingRecipes.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center px-10 text-center">
              <p className="m-0 text-[15px] font-semibold leading-[1.4] text-[#8E8E93]">
                {t.emptyActivity}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-5">
              {followingRecipes.map((recipe, index) => {
                const category = CATEGORIES.find((c) => c.id === recipe.category);
                const isFollowingAuthor = following.includes(recipe.author?.id);
                const commentsCount = commentsCounts[recipe.id] || 0;

                return (
                  <motion.article
                    key={recipe.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: iosEase,
                      delay: Math.min(index * 0.05, 0.2),
                    }}
                    className="select-none overflow-hidden rounded-[24px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(0,0,0,0.07)]"
                  >
                    {/* Post header */}
                    <div
                      onClick={() =>
                        recipe.author?.id && setSelectedUserId(recipe.author.id)
                      }
                      className="flex cursor-pointer items-center justify-between px-4 pb-2.5 pt-3.5"
                    >
                      <div className="flex items-center gap-2.5">
                        {recipe.author?.avatar ? (
                          <img
                            src={recipe.author.avatar}
                            alt={recipe.author?.name}
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            className="pointer-events-none h-[38px] w-[38px] select-none rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#E5E5EA]">
                            <svg
                              width="20"
                              height="20"
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

                        <div>
                          <p className="m-0 text-sm font-extrabold text-[#1C1C1E]">
                            {recipe.author?.name}
                          </p>
                          <p className="m-0 text-[11px] font-semibold text-[#AEAEB2]">
                            @{recipe.author?.username}
                          </p>
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow(recipe.author?.id);
                        }}
                        className={`cursor-pointer select-none rounded-[10px] border-none px-3.5 py-1.5 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 ${
                          isFollowingAuthor
                            ? 'bg-[#F2F2F7] text-[#636366] shadow-none hover:bg-[#E5E5EA]'
                            : 'bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] text-white shadow-[0_4px_12px_rgba(255,107,53,0.35)]'
                        }`}
                      >
                        {isFollowingAuthor ? t.following : t.follow}
                      </motion.button>
                    </div>

                    {/* Recipe image */}
                    <button
                      type="button"
                      onClick={() => setOpenRecipe(recipe)}
                      className="block w-full cursor-pointer select-none border-none bg-transparent p-0"
                    >
                      <div className="relative h-[200px] overflow-hidden bg-[#F2F2F7]">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-300 ease-out hover:scale-[1.02]"
                        />
                        {category && (
                          <div
                            style={{ backgroundColor: category.bgColor }}
                            className="absolute bottom-2.5 left-3 flex items-center gap-1 rounded-[16px] px-2.5 py-1"
                          >
                            <span className="text-xs">{category.emoji}</span>
                            <span
                              style={{ color: category.color }}
                              className="text-[10px] font-bold"
                            >
                              {category.name[language]}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Post footer */}
                    <div className="px-4 pb-3.5 pt-3">
                      <p className="m-0 mb-1 text-[15px] font-extrabold text-[#1C1C1E]">
                        {recipe.title}
                      </p>
                      <p className="m-0 mb-3 text-[13px] text-[#636366]">
                        {recipe.description && recipe.description.length > 60
                          ? `${recipe.description.slice(0, 60)}…`
                          : recipe.description}
                      </p>

                      <div className="flex items-center gap-4">
                        <LikeButton
                          liked={isLiked(recipe.id)}
                          count={getLikes(recipe.id)}
                          onClick={() => toggleLike(recipe.id)}
                        />

                        <button
                          type="button"
                          onClick={() => setOpenCommentsRecipe(recipe)}
                          className="flex cursor-pointer select-none items-center gap-1.5 border-none bg-transparent p-0 text-[#AEAEB2] transition-colors duration-200 hover:text-[#1C1C1E]"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                          <span className="text-[13px] font-semibold">
                            {commentsCount > 0 ? commentsCount : t.comment}
                          </span>
                        </button>

                        <motion.button
                          type="button"
                          aria-label={t.share}
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleShareRecipe(recipe)}
                          className="flex cursor-pointer select-none items-center justify-center rounded-full border-none bg-transparent p-1 text-[#AEAEB2] transition-colors duration-200 hover:bg-[#F2F2F7] hover:text-[#1C1C1E]"
                        >
                          {copiedRecipeId === recipe.id ? (
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#FF6B35"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <circle cx="18" cy="5" r="3" />
                              <circle cx="6" cy="12" r="3" />
                              <circle cx="18" cy="19" r="3" />
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal para buscar y agregar usuarios */}
      <AnimatePresence>
        {showAddFriendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: iosEase }}
            onClick={() => {
              setShowAddFriendModal(false);
              setFriendSearchQuery('');
            }}
            className="fixed inset-0 z-[100] flex select-none items-end justify-center bg-black/45 backdrop-blur-[4px] sm:items-center sm:p-5"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="flex h-[76vh] max-h-[82vh] w-full max-w-[440px] select-none flex-col overflow-hidden rounded-t-[28px] bg-white p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.16)] sm:h-[620px] sm:rounded-[28px]"
            >
              <div className="mb-4 flex shrink-0 items-center justify-between">
                <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
                  {t.suggestions}
                </h2>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowAddFriendModal(false);
                    setFriendSearchQuery('');
                  }}
                  className="flex h-8 w-8 cursor-pointer select-none items-center justify-center rounded-full border-none bg-[#F2F2F7] text-xs font-bold text-[#636366] transition-colors duration-200 hover:bg-[#E5E5EA]"
                >
                  ✕
                </motion.button>
              </div>

              {/* Buscador con fade blanco suave hacia abajo sobre la lista */}
              <div className="relative z-20 shrink-0 pb-2">
                <input
                  type="text"
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  placeholder="@usuario"
                  autoFocus
                  className="w-full select-none rounded-[14px] border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-semibold text-[#1C1C1E] outline-none transition-all duration-200 focus:border-[1.5px] focus:border-[#FF6B35] focus:bg-[#FFFDFB] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.12)]"
                />
                {/* Fade blanco hacia abajo (blanco arriba -> 0% opacidad abajo) */}
                <div className="pointer-events-none absolute -bottom-5 left-0 right-0 h-6 bg-gradient-to-b from-white via-white/90 to-transparent" />
              </div>

              {/* Lista de usuarios encontrados con altura fija del modal */}
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pb-2 pt-3">
                {filteredAddUsers.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-center text-sm font-semibold text-[#8E8E93]">
                    @{friendSearchQuery.trim().replace(/^@/, '')}
                  </div>
                ) : (
                  filteredAddUsers.map((u) => {
                    const isFollowingUser = following.includes(u.id);

                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setShowAddFriendModal(false);
                          setFriendSearchQuery('');
                          setSelectedUserId(u.id);
                        }}
                        className="flex cursor-pointer select-none items-center justify-between rounded-2xl bg-[#F7F7FA] p-3 transition-colors duration-200 hover:bg-[#EFEFF4]"
                      >
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              className="pointer-events-none h-11 w-11 select-none rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E5E5EA]">
                              <svg
                                width="22"
                                height="22"
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

                          <div>
                            <p className="m-0 text-sm font-extrabold text-[#1C1C1E]">
                              {u.name}
                            </p>
                            <p className="m-0 text-xs font-semibold text-[#8E8E93]">
                              @{u.username}
                            </p>
                          </div>
                        </div>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(u.id);
                          }}
                          className={`cursor-pointer select-none rounded-full border-none px-4 py-2 text-xs font-extrabold transition-all duration-200 ${
                            isFollowingUser
                              ? 'bg-[#E5E5EA] text-[#636366]'
                              : 'bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] text-white shadow-[0_4px_12px_rgba(255,107,53,0.3)]'
                          }`}
                        >
                          {isFollowingUser ? t.following : t.follow}
                        </motion.button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {openRecipe && (
          <RecipeModal recipe={openRecipe} onClose={() => setOpenRecipe(null)} />
        )}

        {selectedUserId && (
          <UserProfile
            userId={selectedUserId}
            onClose={() => {
              setSelectedUserId(null);
              loadFriends();
            }}
          />
        )}

        {openCommentsRecipe && (
          <CommentsModal
            recipe={openCommentsRecipe}
            onClose={() => {
              setOpenCommentsRecipe(null);
              loadCommentsCounts(recipes.map((r) => r.id));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LikeButton({
  liked,
  count,
  onClick,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="flex cursor-pointer select-none items-center gap-[5px] border-none bg-transparent p-0"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? '#FF2D55' : 'none'}
        stroke={liked ? '#FF2D55' : '#AEAEB2'}
        strokeWidth="2"
        className="transition-colors duration-200"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>

      <span
        className={`text-[13px] font-semibold transition-colors duration-200 ${
          liked ? 'text-[#FF2D55]' : 'text-[#AEAEB2]'
        }`}
      >
        {count}
      </span>
    </motion.button>
  );
}