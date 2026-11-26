import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipeCard from './RecipeCard';
import RecipeModal from './RecipeModal';
import NotificationsModal from './NotificationsModal';
import { Recipe, CATEGORIES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import { useRecipes } from '../context/RecipesContext';
import { useLikes } from '../context/LikesContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const iosEase = [0.22, 1, 0.36, 1] as const;

interface HomeTabProps {
  onNavigateTab?: (tab: 'home' | 'discover' | 'search' | 'add' | 'friends' | 'profile') => void;
}

export default function HomeTab({ onNavigateTab }: HomeTabProps) {
  const { language } = useLanguage();
  const t = translations[language].home;
  const { user } = useAuth();

  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Estados para notificaciones
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const { initializeLikes } = useLikes();
  const { recipes, loading } = useRecipes();

  // Filtrar exclusivamente las recetas públicas para todo el Home
  const publicRecipes = recipes.filter((recipe) => recipe.is_public !== false);

  useEffect(() => {
    if (publicRecipes.length > 0) {
      initializeLikes(publicRecipes);
    }
  }, [publicRecipes]);

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    if (!user) return;

    async function fetchUnreadCount() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user!.id)
        .eq('read', false);

      setUnreadCount(count || 0);
    }

    fetchUnreadCount();
  }, [user]);

  const handleSeeAll = () => {
    if (onNavigateTab) {
      onNavigateTab('discover');
      return;
    }

    window.dispatchEvent(
      new CustomEvent('cookly:navigate-tab', { detail: { tab: 'discover' } })
    );
  };

  const popular = publicRecipes.slice(0, 4);

  const suggested = activeCategory
    ? publicRecipes.filter((r) => r.category === activeCategory)
    : publicRecipes;

  // Pantalla de carga con varita mágica girando
  if (loading) {
    return (
      <div className="flex min-h-screen select-none flex-col items-center justify-center gap-4 bg-[#F2F2F7]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="flex items-center justify-center text-[42px] drop-shadow-[0_6px_16px_rgba(255,107,53,0.4)]"
        >
          🪄
        </motion.div>
        <span className="text-[13px] font-semibold tracking-[-0.2px] text-[#8E8E93]">
          Cargando recetas...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen select-none bg-[#F2F2F7] pb-[100px]">
      {/* 1. Header Fijo (Sticky) con Degradé de Desvanecimiento (100% arriba -> 0% abajo) */}
      <header
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 58%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 58%, rgba(0,0,0,0) 100%)',
        }}
        className="sticky top-0 z-30 flex select-none items-center justify-between bg-[#F2F2F7]/85 px-5 pb-7 pt-5 backdrop-blur-[20px] backdrop-saturate-[180%]"
      >
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/cookly-txt-beta-logo.png"
            alt="Cookly"
            className="pointer-events-none h-[38px] select-none object-contain"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        </div>

        {/* Botón de notificaciones */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 460, damping: 28 }}
          onClick={() => setShowNotifications(true)}
          className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-[14px] border-none bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.09)]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1C1C1E"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>

          {/* Badge de notificación */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 26 }}
                className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#FF3B30] text-[10px] font-extrabold text-white"
              >
                {unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </header>

      {/* 2. Título Principal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: iosEase }}
        className="mb-5 mt-1 px-5"
      >
        <p className="mb-1 text-[13px] font-semibold text-[#AEAEB2]">
          {t.greeting}
        </p>
        <h1 className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.5px] text-[#1C1C1E]">
          {t.title}
        </h1>
      </motion.div>

      {/* 3. Contenido de las Secciones */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: iosEase, delay: 0.06 }}
      >
        {/* Popular section */}
        <section className="mb-7 mt-2.5">
          <div className="mb-3.5 flex items-center justify-between px-5">
            <h2 className="text-[20px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
              {t.popular}
            </h2>
            <motion.button
              type="button"
              onClick={handleSeeAll}
              whileHover={{ opacity: 0.78 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer select-none border-none bg-transparent text-[13px] font-bold text-[#FF6B35] transition-opacity duration-200"
            >
              {t.seeAll}
            </motion.button>
          </div>

          <div className="flex gap-3.5 overflow-x-auto px-5 pb-2 pt-1">
            {popular.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  ease: iosEase,
                  delay: Math.min(index * 0.05, 0.2),
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="shrink-0 transition-transform duration-200"
              >
                <RecipeCard recipe={recipe} size="large" onOpen={setOpenRecipe} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mb-7">
          <div className="mb-3.5 flex items-center justify-between px-5">
            <h2 className="text-[20px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
              {t.categories}
            </h2>
            <span className="text-[13px] font-semibold text-[#AEAEB2]">
              {suggested.length} {t.recipesCount}
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 pt-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => setActiveCategory(null)}
              style={{
                boxShadow:
                  activeCategory === null
                    ? '0 4px 12px rgba(255,107,53,0.35)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
              }}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-[24px] border-none px-4 py-2 text-[13px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] ${
                activeCategory === null
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-white text-[#636366]'
              }`}
            >
              {t.allCategories}
            </motion.button>

            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;

              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => setActiveCategory(isSelected ? null : cat.id)}
                  style={{
                    backgroundColor: isSelected ? cat.color : 'white',
                    boxShadow: isSelected
                      ? `0 4px 12px ${cat.color}55`
                      : '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[24px] border-none px-4 py-2 text-[13px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] ${
                    isSelected ? 'text-white' : 'text-[#1C1C1E]'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name[language]}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Suggested section */}
        <section>
          <div className="flex flex-col gap-3.5 px-5">
            <AnimatePresence mode="popLayout">
              {suggested.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: 0.28,
                    ease: iosEase,
                    delay: Math.min(index * 0.035, 0.18),
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className="rounded-2xl transition-shadow duration-200 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
                >
                  <RecipeCard
                    recipe={recipe}
                    size="medium"
                    onOpen={setOpenRecipe}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </motion.div>

      {/* Modales con soporte de AnimatePresence y transiciones limpias */}
      <AnimatePresence>
        {openRecipe && (
          <RecipeModal recipe={openRecipe} onClose={() => setOpenRecipe(null)} />
        )}

        {showNotifications && (
          <NotificationsModal
            onClose={() => {
              setShowNotifications(false);
              setUnreadCount(0);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}