import { useState } from 'react';
import RecipeCard from './RecipeCard';
import RecipeModal from './RecipeModal';
import { Recipe, CATEGORIES } from '../data/mockData';
import { useRecipes } from "../context/RecipesContext";
import { useLanguage } from '../context/LanguageContext'; // <-- Importamos nuestro hook
import { translations } from '../utils/translations'; // <-- Importamos los textos


export default function DiscoverTab() {
  const { language } = useLanguage(); // Extraemos el idioma actual
  const t = translations[language].discover; // Accedemos a los textos

  const { recipes } = useRecipes();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [focused, setFocused] = useState(false);

  const filtered = recipes.filter(recipe => {
    const search = query.toLowerCase();
  
    const matchesQuery =
      search === "" ||
  
      recipe.title.toLowerCase().includes(search) ||
  
      recipe.description.toLowerCase().includes(search) ||
  
      recipe.ingredients.some(i =>
        i.toLowerCase().includes(search)
      );
  
    const matchesCategory =
      activeCategory === null ||
      recipe.category === activeCategory;
  
    return matchesQuery && matchesCategory;
  });

  const trending = [...recipes]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 4);

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: 'rgba(242,242,247,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 30,
        paddingTop: 'env(safe-area-inset-top, 44px)',
        padding: 'env(safe-area-inset-top, 44px) 20px 14px',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1C1C1E', marginBottom: 14, marginTop: 20, paddingTop: 7 }}>{t.title}</h1>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white',
          borderRadius: 16,
          padding: '12px 16px',
          boxShadow: focused ? '0 0 0 2px #FF6B35' : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, color: '#1C1C1E', fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#AEAEB2">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 0' }}>
        {/* Category filters */}
        <div
        className="
          flex
          gap-2.5
          overflow-x-auto
          px-5
          pt-1.5
          pb-2
          mb-5
          scrollbar-hide
        "
        >
          {/* All Button */}
          <button
            onClick={() => setActiveCategory(null)}
            className="
              transition-all
              duration-300
              ease-out
              hover:-translate-y-[2px]
              hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]
              active:translate-y-0
              active:scale-[0.98]
              will-change-transform
            "
            style={{
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 24,
              fontWeight: 700,
              fontSize: 13,
              background: activeCategory === null ? '#FF6B35' : 'white',
              color: activeCategory === null ? 'white' : '#636366',
              boxShadow: activeCategory === null
                ? '0 1px 12px rgba(255,107,53,0.35)'
                : '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
            }}
          >
            {t.allCategories}
          </button>
          
          {/* Category Buttons */}
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() =>
                setActiveCategory(activeCategory === cat.id ? null : cat.id)
              }
              className="
                transition-all
                duration-300
                ease-out
                hover:-translate-y-0.5
                hover:scale-[1.02]
                hover:shadow-lg
                active:scale-[0.98]
                will-change-transform
              "
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 24,
                fontWeight: 700,
                fontSize: 13,
                background: activeCategory === cat.id ? cat.color : 'white',
                color: activeCategory === cat.id ? 'white' : '#1C1C1E',
                boxShadow: activeCategory === cat.id
                  ? `0 1px 12px ${cat.color}55`
                  : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name[language]}</span>
            </button>
          ))}

        </div>

        {/* Trending (no search) */}
        {!query && !activeCategory && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 20px', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E' }}>{t.trending}</h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              padding: '0 20px',
            }}>
              {trending.map(r => (
                <div
                  key={r.id}
                  className="
                    transition-all
                    duration-300
                    ease-out
                    hover:-translate-y-1
                    hover:scale-[1.02]
                    hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]
                    active:scale-[0.98]
                    will-change-transform
                  "
                >
                  <RecipeCard
                    recipe={r}
                    size="small"
                    onOpen={setOpenRecipe}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ padding: '0 20px' }}>
          {(query || activeCategory) && (
            <p style={{ fontSize: 13, color: '#AEAEB2', fontWeight: 600, marginBottom: 12 }}>
              {filtered.length} {t.results}{filtered.length !== 1 ? 's' : ''}
            </p>
          )}
          {!query && !activeCategory && (
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E', marginBottom: 14 }}>{t.exploreAll}</h2>
          )}

          {/* Card recetas del resultado de busqueda */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {filtered.map(recipe => (
              <div
                key={recipe.id}
                className="
                  transition-all
                  duration-300
                  ease-out
                  hover:-translate-y-1
                  hover:scale-[1.010]
                  hover:drop-shadow-[0_10px_24px_rgba(0,0,0,0.10)]
                  active:scale-[0.99]
                "
              >
                <RecipeCard
                  recipe={recipe}
                  size="medium"
                  onOpen={setOpenRecipe}
                />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🍽</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E', marginBottom: 4 }}>{t.noResultsTitle}</p>
              <p style={{ fontSize: 14, color: '#AEAEB2' }}>{t.noResultsSubtitle}</p>
            </div>
          )}
        </div>
      </div>

      {openRecipe && <RecipeModal recipe={openRecipe} onClose={() => setOpenRecipe(null)} />}
    </div>
  );
}
