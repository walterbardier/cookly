import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const iosEase = [0.22, 1, 0.36, 1] as const;

type Props = {
  onSuccess: () => void;
};

export default function AddRecipeTab({ onSuccess }: Props) {
  const { language } = useLanguage();
  const t = translations[language].addRecipe;

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState(['', '']);
  const [steps, setSteps] = useState(['', '']);
  const [isPublic, setIsPublic] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
      setPhotoFile(file);
    }
  };

  const addIngredient = () => setIngredients((prev) => [...prev, '']);
  const addStep = () => setSteps((prev) => [...prev, '']);
  const removeIngredient = (i: number) =>
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  const removeStep = (i: number) =>
    setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const canPublish =
    !!photoFile &&
    title.trim() !== '' &&
    category !== '' &&
    duration.trim() !== '' &&
    servings.trim() !== '' &&
    ingredients.some((i) => i.trim() !== '') &&
    steps.some((s) => s.trim() !== '');

  const handleSubmit = async () => {
    if (!canPublish || !user) return;
    try {
      setLoading(true);
      let imageUrl = '';

      // 1. Subir imagen
      if (photoFile) {
        const extension = photoFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(filePath, photoFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
      }

      // 2. Crear receta incluyendo is_public
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          author_id: user.id,
          title,
          description,
          category,
          duration: duration ? Number(duration) : null,
          servings: servings ? Number(servings) : null,
          image: imageUrl,
          is_public: isPublic,
        })
        .select()
        .single();

      if (recipeError) {
        throw recipeError;
      }

      // Actualizar ingredientes y pasos dentro de recipes
      const { error: updateError } = await supabase
        .from('recipes')
        .update({
          ingredients: ingredients.filter((i) => i.trim() !== ''),
          steps: steps.filter((s) => s.trim() !== ''),
          tags: [],
        })
        .eq('id', recipe.id);

      if (updateError) {
        throw updateError;
      }

      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        onSuccess();
      }, 1800);
    } catch (error) {
      console.error('Error creando receta:', error);
      alert('No se pudo publicar la receta');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen select-none flex-col items-center justify-center gap-4 bg-[#F2F2F7]">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#34C759] to-[#5DD67A] text-[40px] text-white shadow-[0_8px_32px_rgba(52,199,89,0.4)]"
        >
          ✓
        </motion.div>
        <h2 className="m-0 text-2xl font-extrabold text-[#1C1C1E]">
          {t.successTitle}
        </h2>
        <p className="m-0 text-[15px] text-[#636366]">{t.successMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen select-none bg-[#F2F2F7] pb-[110px]">
      {/* Header Sticky con degradé abajo y botón de publicar nítido sin difuminar */}
      <div className="sticky top-0 z-30 select-none pt-[env(safe-area-inset-top,44px)]">
        {/* Capa de fondo con degradé (100% arriba -> 0% abajo) */}
        <div
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 64%, rgba(0,0,0,0) 100%)',
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 64%, rgba(0,0,0,0) 100%)',
          }}
          className="pointer-events-none absolute inset-0 bg-[#F2F2F7]/85 pb-7 backdrop-blur-[20px] backdrop-saturate-[180%]"
        />

        {/* Contenido superior nítido */}
        <div className="relative z-[1] flex items-center justify-between px-5 pb-4 pt-3.5">
          <motion.h1
            animate={{ color: isScrolled ? '#FF6B35' : '#1C1C1E' }}
            transition={{ duration: 0.25, ease: iosEase }}
            className="m-0 text-2xl font-extrabold tracking-[-0.4px]"
          >
            {t.title}
          </motion.h1>

          <motion.button
            type="button"
            whileHover={canPublish && !loading ? { scale: 1.03, y: -1 } : undefined}
            whileTap={canPublish && !loading ? { scale: 0.95 } : undefined}
            onClick={handleSubmit}
            disabled={loading || !canPublish}
            className={`cursor-pointer select-none rounded-[14px] border-none px-5 py-2.5 text-[14px] font-extrabold transition-all duration-200 ${
              canPublish
                ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] text-white shadow-[0_4px_14px_rgba(255,107,53,0.4)] hover:shadow-[0_8px_20px_rgba(255,107,53,0.48)]'
                : 'cursor-not-allowed bg-[#E5E5EA] text-[#AEAEB2] shadow-none'
            }`}
          >
            {loading ? 'Publicando...' : t.publish}
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-4">
        {/* Photo upload */}
        <div className="mb-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="hidden"
          />
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => fileRef.current?.click()}
            className={`relative flex h-[200px] w-full cursor-pointer select-none flex-col items-center justify-center gap-2 overflow-hidden rounded-[24px] transition-all duration-200 ${
              photo
                ? 'border-none bg-transparent'
                : 'border-2 border-dashed border-[#E5E5EA] bg-white hover:border-[#FF6B35]/50'
            }`}
          >
            {photo ? (
              <>
                <img
                  src={photo}
                  alt="foto de receta"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                />
                <div className="absolute bottom-3 right-3 rounded-[10px] bg-black/55 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white">
                    {t.changePhoto}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#FF6B35]/15 to-[#FF6B35]/30">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF6B35"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span className="text-[15px] font-bold text-[#FF6B35]">
                  {t.addPhoto}
                </span>
                <span className="text-xs text-[#AEAEB2]">{t.photoHint}</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Title */}
        <Field label={t.recipeTitle} required>
          <input
            type="text"
            placeholder={t.recipeTitlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full select-text rounded-[14px] border-none bg-white px-4 py-[13px] text-[15px] font-medium text-[#1C1C1E] shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none transition-all duration-200 placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#FF6B35]"
          />
        </Field>

        {/* Description */}
        <Field label={t.description}>
          <textarea
            placeholder={t.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none select-text rounded-[14px] border-none bg-white px-4 py-[13px] text-[15px] font-medium leading-relaxed text-[#1C1C1E] shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none transition-all duration-200 placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#FF6B35]"
          />
        </Field>

        {/* Category */}
        <Field label={t.category} required>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategory(isSelected ? '' : cat.id)}
                  style={{
                    backgroundColor: isSelected ? cat.color : 'white',
                    borderColor: isSelected ? cat.color : '#E5E5EA',
                    boxShadow: isSelected
                      ? `0 4px 12px ${cat.color}44`
                      : 'none',
                  }}
                  className={`flex cursor-pointer select-none items-center gap-1.5 rounded-[20px] border-2 px-3.5 py-2 text-[13px] font-bold transition-all duration-200 ${
                    isSelected ? 'text-white' : 'text-[#1C1C1E]'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name[language]}</span>
                </motion.button>
              );
            })}
          </div>
        </Field>

        {/* Duration + Servings */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Field label={t.duration}>
            <input
              type="number"
              placeholder={t.durationPlaceholder}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
              className="w-full select-text rounded-[14px] border-none bg-white px-4 py-[13px] text-[15px] font-medium text-[#1C1C1E] shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none transition-all duration-200 placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#FF6B35]"
            />
          </Field>
          <Field label={t.servings}>
            <input
              type="number"
              placeholder={t.servingsPlaceholder}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              min={1}
              className="w-full select-text rounded-[14px] border-none bg-white px-4 py-[13px] text-[15px] font-medium text-[#1C1C1E] shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none transition-all duration-200 placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#FF6B35]"
            />
          </Field>
        </div>

        {/* Ingredients */}
        <Field label={t.ingredients} required>
          <div className="flex flex-col gap-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex h-[30px] w-[30px] shrink-0 select-none items-center justify-center rounded-[10px] bg-[#FFF0EB]">
                  <span className="text-xs font-extrabold text-[#FF6B35]">
                    {i + 1}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={`${t.ingredientPlaceholder} ${i + 1}`}
                  value={ing}
                  onChange={(e) =>
                    setIngredients((prev) =>
                      prev.map((v, idx) => (idx === i ? e.target.value : v))
                    )
                  }
                  className="flex-1 select-text rounded-[14px] border-none bg-white px-4 py-[13px] text-[15px] font-medium text-[#1C1C1E] shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none transition-all duration-200 placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#FF6B35]"
                />
                {ingredients.length > 1 && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeIngredient(i)}
                    className="flex h-[30px] w-[30px] shrink-0 cursor-pointer select-none items-center justify-center rounded-[10px] border-none bg-[#FFE5EA]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF2D55"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </motion.button>
                )}
              </div>
            ))}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={addIngredient}
              className="flex cursor-pointer select-none items-center gap-2 rounded-[14px] border-2 border-dashed border-[#FF6B35]/40 bg-transparent px-3.5 py-2.5 text-[14px] font-bold text-[#FF6B35] transition-colors duration-200 hover:bg-[#FF6B35]/5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF6B35"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t.addIngredient}
            </motion.button>
          </div>
        </Field>

        {/* Steps */}
        <Field label={t.steps} required>
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-0.5 flex h-[30px] w-[30px] shrink-0 select-none items-center justify-center rounded-[10px] bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C]">
                  <span className="text-xs font-extrabold text-white">
                    {i + 1}
                  </span>
                </div>
                <textarea
                  placeholder={`${t.stepPlaceholder} ${i + 1}…`}
                  value={step}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((v, idx) => (idx === i ? e.target.value : v))
                    )
                  }
                  rows={2}
                  className="flex-1 resize-none select-text rounded-[14px] border-none bg-white px-4 py-[13px] text-[15px] font-medium leading-relaxed text-[#1C1C1E] shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none transition-all duration-200 placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#FF6B35]"
                />
                {steps.length > 1 && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeStep(i)}
                    className="mt-0.5 flex h-[30px] w-[30px] shrink-0 cursor-pointer select-none items-center justify-center rounded-[10px] border-none bg-[#FFE5EA]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF2D55"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </motion.button>
                )}
              </div>
            ))}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={addStep}
              className="mb-[30px] flex cursor-pointer select-none items-center gap-2 rounded-[14px] border-2 border-dashed border-[#FF6B35]/40 bg-transparent px-3.5 py-2.5 text-[14px] font-bold text-[#FF6B35] transition-colors duration-200 hover:bg-[#FF6B35]/5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF6B35"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t.addStep}
            </motion.button>
          </div>
        </Field>

        {/* Visibilidad de la receta - Switch naranja animado */}
        <Field label={t.visibility}>
          <div className="relative flex select-none rounded-full bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            {(
              [
                { value: true, label: `🌍 ${t.public}` },
                { value: false, label: `🔒 ${t.private}` },
              ] as const
            ).map((option) => {
              const active = isPublic === option.value;
              return (
                <motion.button
                  key={String(option.value)}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsPublic(option.value)}
                  className={`relative z-[1] flex-1 cursor-pointer select-none rounded-full border-none px-4 py-2.5 text-[14px] font-bold transition-colors duration-200 ${
                    active ? 'text-white' : 'bg-transparent text-[#8E8E93]'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="ios26-visibility-orange-thumb"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 32,
                      }}
                      className="absolute inset-0 -z-[1] rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] shadow-[0_4px_12px_rgba(255,107,53,0.35)]"
                    />
                  )}
                  {option.label}
                </motion.button>
              );
            })}
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block select-none text-[13px] font-bold uppercase tracking-[0.5px] text-[#636366]">
        {label}
        {required && <span className="ml-[3px] text-[#FF6B35]">*</span>}
      </label>
      {children}
    </div>
  );
}