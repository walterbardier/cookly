import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipeCard from './RecipeCard';
import RecipeModal from './RecipeModal';
import { Recipe, CATEGORIES } from '../data/mockData';
import { useRecipes } from '../context/RecipesContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const iosEase = [0.22, 1, 0.36, 1] as const;

export default function DiscoverTab() {
  const { language } = useLanguage();
  const t = translations[language].discover;

  const { recipes } = useRecipes();

  // 1. Filtrar solo las recetas públicas para toda la pestaña Discover
  const publicRecipes = recipes.filter((recipe) => recipe.is_public !== false);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 18);

      if (currentY <= 24) {
        setShowSearchBar(true);
      } else if (currentY > lastScrollY.current + 8) {
        // Bajando: ocultar suavemente la barra de búsqueda
        setShowSearchBar(false);
      } else if (currentY < lastScrollY.current - 6) {
        // Subiendo: mostrar suavemente la barra de búsqueda
        setShowSearchBar(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filtered = publicRecipes.filter((recipe) => {
    const search = query.toLowerCase();

    const matchesQuery =
      search === '' ||
      recipe.title.toLowerCase().includes(search) ||
      recipe.description.toLowerCase().includes(search) ||
      recipe.ingredients.some((i) => i.toLowerCase().includes(search));

    const matchesCategory =
      activeCategory === null || recipe.category === activeCategory;

    return matchesQuery && matchesCategory;
  });

  const trending = [...publicRecipes]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 4);

  return (
    <div className="min-h-screen select-none bg-[#F2F2F7] pb-[100px]">
      {/* Header fijo solo con el título y degradé de desvanecimiento (100% arriba -> 0% abajo) */}
      <header
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 64%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 64%, rgba(0,0,0,0) 100%)',
        }}
        className="sticky top-0 z-30 select-none bg-[#F2F2F7]/85 px-5 pb-7 pt-[calc(env(safe-area-inset-top,44px)+14px)] backdrop-blur-[20px] backdrop-saturate-[180%]"
      >
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            color: isScrolled ? '#FF6B35' : '#1C1C1E',
          }}
          transition={{ duration: 0.28, ease: iosEase }}
          className="m-0 mt-4 pt-1 text-[28px] font-extrabold tracking-[-0.5px]"
        >
          {t.title}
        </motion.h1>
      </header>

      <div className="pt-1">
        {/* Buscador separado abajo con margen interno para que no se corte el ring naranja */}
        <AnimatePresence initial={false}>
          {showSearchBar && (
            <motion.div
              key="discover-search-bar"
              initial={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, y: 0, height: 56, marginBottom: 12 }}
              exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.28, ease: iosEase }}
              className="overflow-hidden px-4 py-1"
            >
              <div className="flex h-12 items-center gap-2.5 rounded-[16px] bg-white px-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#FF6B35]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#AEAEB2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 select-text border-none bg-transparent text-[15px] font-medium text-[#1C1C1E] outline-none placeholder:text-[#AEAEB2]"
                />

                <AnimatePresence>
                  {query && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuery('')}
                      className="flex cursor-pointer select-none items-center justify-center border-none bg-transparent p-0"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="#AEAEB2"
                      >
                        <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filters */}
        <div className="mb-5 flex gap-2.5 overflow-x-auto px-5 pb-2 pt-1.5 [scrollbar-width:none]">
          {/* All Button */}
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
            className={`shrink-0 cursor-pointer select-none whitespace-nowrap rounded-[24px] border-none px-4 py-2 text-[13px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] ${
              activeCategory === null
                ? 'bg-[#FF6B35] text-white'
                : 'bg-white text-[#636366]'
            }`}
          >
            {t.allCategories}
          </motion.button>

          {/* Category Buttons */}
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
                className={`flex shrink-0 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-[24px] border-none px-4 py-2 text-[13px] font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] ${
                  isSelected ? 'text-white' : 'text-[#1C1C1E]'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name[language]}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Trending (no search) */}
        {!query && !activeCategory && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: iosEase }}
            className="mb-6"
          >
            <div className="mb-3 px-5">
              <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
                {t.trending}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5">
              {trending.map((r, index) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: iosEase,
                    delay: Math.min(index * 0.04, 0.16),
                  }}
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl transition-shadow duration-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)]"
                >
                  <RecipeCard recipe={r} size="small" onOpen={setOpenRecipe} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Results */}
        <section className="px-5">
          {(query || activeCategory) && (
            <p className="mb-3 text-[13px] font-semibold text-[#AEAEB2]">
              {filtered.length} {t.results}
              {filtered.length !== 1 ? 's' : ''}
            </p>
          )}
          {!query && !activeCategory && (
            <h2 className="mb-3.5 mt-0 text-[18px] font-extrabold tracking-[-0.3px] text-[#1C1C1E]">
              {t.exploreAll}
            </h2>
          )}

          {/* Card recetas del resultado de busqueda */}
          <div className="flex flex-col gap-3.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((recipe, index) => (
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
                  className="rounded-2xl transition-shadow duration-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)]"
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

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: iosEase }}
              className="pt-[60px] text-center"
            >
              <div className="mb-3 text-[48px]">🍽</div>
              <p className="mb-1 text-[16px] font-bold text-[#1C1C1E]">
                {t.noResultsTitle}
              </p>
              <p className="m-0 text-[14px] text-[#AEAEB2]">
                {t.noResultsSubtitle}
              </p>
            </motion.div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {openRecipe && (
          <RecipeModal recipe={openRecipe} onClose={() => setOpenRecipe(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}