import { useState } from 'react';
import type { Recipe } from '../data/mockData';
import { CATEGORIES } from '../data/mockData';

import { useLanguage } from '../context/LanguageContext'; // <-- Importamos nuestro hook
import { translations } from '../utils/translations'; // <-- Importamos los textos

import { useLikes } from "../context/LikesContext";

type RecipeCardProps = {
  recipe: Recipe;
  size?: 'large' | 'medium' | 'small';
  onOpen?: (recipe: Recipe) => void;
};

export default function RecipeCard({ recipe, size = 'medium', onOpen }: RecipeCardProps) {
  const { language } = useLanguage(); // Extraemos el idioma actual
  const t = translations[language].addRecipe; // Accedemos a los textos

  const {
    isLiked,
    getLikes,
    toggleLike,
  } = useLikes();
  
  const liked = isLiked(recipe.id);
  const likeCount = getLikes(recipe.id);

  const category = CATEGORIES.find(c => c.id === recipe.category);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(recipe.id);
  };

  if (size === 'large') {
    return (
      <div
        onClick={() => onOpen?.(recipe)}
        style={{ width: 280, flexShrink: 0, cursor: 'pointer' }}
        className="rounded-3xl overflow-hidden bg-white shadow-sm"
        role="button"
        tabIndex={0}
      >
        <div style={{ height: 180, position: 'relative', background: '#F2F2F7' }}>
          <img
            src={recipe.image}
            alt={recipe.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: category?.bgColor ?? '#F2F2F7',
            borderRadius: 20,
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: 13 }}>{category?.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: category?.color ?? '#333' }}>{category?.name[language]}</span>
          </div>
        </div>
        <div className="p-4">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1E', lineHeight: 1.3, marginBottom: 6 }}>
            {recipe.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={recipe.author?.avatar}
                alt={recipe.author?.name}
                style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: 12, color: '#636366', fontWeight: 500 }}>{recipe.author?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>{recipe.duration}m</span>
              </div>
              <button onClick={handleLike} className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? '#FF2D55' : 'none'} stroke={liked ? '#FF2D55' : '#AEAEB2'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <span style={{ fontSize: 11, color: liked ? '#FF2D55' : '#AEAEB2', fontWeight: 600 }}>{likeCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (size === 'small') {
    return (
      <div
        onClick={() => onOpen?.(recipe)}
        style={{ cursor: 'pointer' }}
        className="rounded-2xl overflow-hidden bg-white shadow-sm"
        role="button"
        tabIndex={0}
      >
        <div style={{ height: 110, background: '#F2F2F7', position: 'relative' }}>
          <img src={recipe.image} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: '3px 7px',
          }}>
            <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>{recipe.duration}m</span>
          </div>
        </div>
        <div style={{ padding: '8px 10px 10px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1E', lineHeight: 1.3, marginBottom: 4 }}>
            {recipe.title}
          </p>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 11 }}>{category?.emoji}</span>
            <span style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600 }}>{category?.name[language]}</span>
          </div>
        </div>
      </div>
    );
  }

  // Medium (default) — full width card
  return (
    <div
      onClick={() => onOpen?.(recipe)}
      style={{ cursor: 'pointer' }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm"
      role="button"
      tabIndex={0}
    >
      <div style={{ height: 200, position: 'relative', background: '#F2F2F7' }}>
        <img src={recipe.image} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
          <div className="flex items-end justify-between">
            <div style={{
              background: category?.bgColor ?? '#F2F2F7',
              borderRadius: 20,
              padding: '4px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{ fontSize: 13 }}>{category?.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: category?.color }}>{category?.name[language]}</span>
            </div>
            <button
              onClick={handleLike}
              style={{
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 12,
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? '#FF2D55' : 'none'} stroke={liked ? '#FF2D55' : '#636366'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: liked ? '#FF2D55' : '#636366' }}>{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E', lineHeight: 1.3, marginBottom: 6 }}>
          {recipe.title}
        </h3>
        <p style={{ fontSize: 13, color: '#636366', lineHeight: 1.5, marginBottom: 10 }}>
          {recipe.description.length > 80 ? recipe.description.slice(0, 80) + '…' : recipe.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={recipe.author?.avatar} alt={recipe.author?.name}
              style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: 12, color: '#636366', fontWeight: 600 }}>{recipe.author?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 600 }}>{recipe.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <span style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 600 }}>{recipe.servings} pax</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
