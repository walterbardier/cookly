import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipeCard from './RecipeCard';
import RecipeModal from './RecipeModal';
import NotificationsModal from './NotificationsModal';
import { Recipe, CATEGORIES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import { useRecipes } from "../context/RecipesContext";
import { useLikes } from "../context/LikesContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function HomeTab() {
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
  const publicRecipes = recipes.filter(recipe => recipe.is_public !== false);

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

  const popular = publicRecipes.slice(0, 4);

  const suggested = activeCategory
    ? publicRecipes.filter(r => r.category === activeCategory)
    : publicRecipes;

  // Pantalla de carga con varita mágica naranja girando
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#F2F2F7',
        gap: 16
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          style={{ 
            fontSize: 42, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 6px 16px rgba(255,107,53,0.4))'
          }}
        >
          🪄
        </motion.div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', letterSpacing: '-0.2px' }}>
          Cargando recetas...
        </span>
      </div>
    );
  }

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100vh', paddingBottom: 100 }}>
      
      {/* 1. Header Fijo (Sticky) con Blur y Estilo iOS */}
      <div style={{
        background: 'rgba(242, 242, 247, 0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '0.5px solid rgba(0, 0, 0, 0.04)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/cookly-txt-beta-logo.png" 
            alt="Cookly" 
            style={{ 
              height: 38, 
              objectFit: 'contain', 
              pointerEvents: 'none' 
            }} 
            onContextMenu={(e) => e.preventDefault()} 
            draggable={false} 
          />
        </div>
        
        {/* Botón de notificaciones */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNotifications(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>

          {/* Badge de notificación */}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#FF3B30',
              color: 'white',
              fontSize: 10,
              fontWeight: 800,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
            }}>
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>
 
      {/* 2. Título Principal con Fade Rápido */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ padding: '0 20px', marginTop: 12, marginBottom: 20 }}
      >
        <p style={{ fontSize: 13, color: '#AEAEB2', fontWeight: 600, marginBottom: 4 }}>
          {t.greeting}
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1C1C1E', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
          {t.title}
        </h1>
      </motion.div>
 
      {/* 3. Contenido de las Secciones con Fade Rápido y Limpio */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}
        style={{ padding: '0 0' }}
      >
        <div style={{ padding: '0 0 0 0' }}>
          {/* Popular section */}
          <section style={{ marginBottom: 28, marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 14 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1E' }}>{t.popular}</h2>
              <button style={{ fontSize: 13, fontWeight: 700, color: '#FF6B35', background: 'none', border: 'none', cursor: 'pointer' }}>{t.seeAll}</button>
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
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
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
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, color 0.15s ease',
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