import { useEffect, useState } from 'react';
import RecipeCard from './RecipeCard';
import RecipeModal from './RecipeModal';
import { Recipe, CATEGORIES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext'; // <-- Importamos nuestro hook
import { translations } from '../utils/translations'; // <-- Importamos los textos
import { useRecipes } from "../context/RecipesContext";
import { useLikes } from "../context/LikesContext";

export default function HomeTab() {
  const { language } = useLanguage(); // Extraemos el idioma actual
  const t = translations[language].home; // Accedemos a los textos del perfil

  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { initializeLikes } = useLikes();

  const { recipes } = useRecipes();

  useEffect(() => {
      initializeLikes(recipes);
  }, [recipes]);

  const popular = recipes.slice(0, 4);

  const suggested = activeCategory
  ? recipes.filter(r => r.category === activeCategory)
  : recipes;

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
        <div style={{ padding: '14px 20px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 13, color: '#AEAEB2', fontWeight: 600, marginBottom: 4, marginTop: 20, paddingTop: 7 }}>{t.greeting}</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1C1C1E', lineHeight: 1.1 }}>
              {t.title}
            </h1>
          </div>
          <button style={{
            width: 42, height: 42, borderRadius: 14, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '0 0 0 0' }}>
        {/* Popular section */}
        <section style={{ marginBottom: 28, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1E' }}>{t.popular}</h2>
            <button style={{ fontSize: 13, fontWeight: 700, color: '#FF6B35' }}>{t.seeAll}</button>
          </div>
          <div style={{
            display: 'flex', gap: 14, overflowX: 'auto',
            paddingLeft: 20, paddingRight: 20,
          }}>
            {popular.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} size="large" onOpen={setOpenRecipe} />
            ))}
          </div>
        </section>

        {/* Categories */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1E' }}>{t.categories}</h2>
            <span style={{ fontSize: 13, color: '#AEAEB2', fontWeight: 600 }}>{suggested.length} {t.recipesCount}</span>
          </div>

          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            paddingLeft: 20, paddingRight: 20,
          }}>
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 24,
                fontWeight: 700,
                fontSize: 13,
                background: activeCategory === null ? '#FF6B35' : 'white',
                color: activeCategory === null ? 'white' : '#636366',
                boxShadow: activeCategory === null ? '0 4px 12px rgba(255,107,53,0.35)' : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {t.allCategories}
            </button>
            
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                style={{
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  borderRadius: 24,
                  fontWeight: 700,
                  fontSize: 13,
                  background: activeCategory === cat.id ? cat.color : 'white',
                  color: activeCategory === cat.id ? 'white' : '#1C1C1E',
                  boxShadow: activeCategory === cat.id ? `0 4px 12px ${cat.color}55` : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name[language]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Suggested section */}
        <section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 20px' }}>
            {suggested.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} size="medium" onOpen={setOpenRecipe} />
            ))}
          </div>
        </section>
      </div>

      {openRecipe && (
        <RecipeModal recipe={openRecipe} onClose={() => setOpenRecipe(null)} />
      )}
    </div>
  );
}
