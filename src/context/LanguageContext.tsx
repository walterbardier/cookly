import { createContext, useState, useContext, ReactNode } from 'react';

// 1. Definimos los idiomas disponibles
type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// 2. Creamos el "megáfono" (Contexto)
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 3. Este es el componente que envolverá tu App para compartir el idioma
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('es'); // Español por defecto

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 4. Un pequeño atajo para usar el idioma fácilmente en tus otras páginas
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
  }
  return context;
};