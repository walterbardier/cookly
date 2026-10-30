import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { supabase } from "../lib/supabase";
import type { Recipe } from "../data/mockData";

type RecipesContextType = {
  recipes: Recipe[];
  loading: boolean;

  // Recarga desde Supabase
  reloadRecipes: () => Promise<void>;

  // CRUD local
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  removeRecipe: (recipeId: string) => void;

  // CRUD Supabase
  deleteRecipe: (recipeId: string) => Promise<void>;

  // Helpers
  getRecipeById: (recipeId: string) => Recipe | undefined;
  getRecipesByUser: (userId: string) => Recipe[];
};

const RecipesContext =
  createContext<RecipesContextType | null>(null);

export function RecipesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   reloadRecipes();
  // }, []);
  useEffect(() => {
    reloadRecipes();
  
    const channel = supabase
      .channel("recipes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipes",
        },
        () => {
          console.log("🔄 Recipes updated");
          reloadRecipes();
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function reloadRecipes() {
    setLoading(true);

    const { data, error } = await supabase
      .from("recipes")
      .select(`
        *,
        profiles!recipes_author_id_fkey(
          id,
          name,
          avatar,
          username
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const formatted: Recipe[] = (data ?? []).map(
      (recipe: any) => ({
        ...recipe,

        author: {
          id: recipe.profiles?.id,
          name: recipe.profiles?.name,
          avatar: recipe.profiles?.avatar,
          username: recipe.profiles?.username,
        },
      })
    );

    setRecipes(formatted);
    setLoading(false);
  }

  function addRecipe(recipe: Recipe) {
    setRecipes(prev => [recipe, ...prev]);
  }

  function updateRecipe(updatedRecipe: Recipe) {
    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === updatedRecipe.id
          ? updatedRecipe
          : recipe
      )
    );
  }

  function removeRecipe(recipeId: string) {
    setRecipes(prev =>
      prev.filter(recipe => recipe.id !== recipeId)
    );
  }

  async function deleteRecipe(recipeId: string) {
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (error) {
      console.error(error);
      throw error;
    }

    removeRecipe(recipeId);
  }

  function getRecipeById(recipeId: string) {
    return recipes.find(
      recipe => recipe.id === recipeId
    );
  }

  function getRecipesByUser(userId: string) {
    return recipes.filter(
      recipe => recipe.author_id === userId
    );
  }

  return (
    <RecipesContext.Provider
      value={{
        recipes,
        loading,

        reloadRecipes,

        addRecipe,
        updateRecipe,
        removeRecipe,
        deleteRecipe,

        getRecipeById,
        getRecipesByUser,
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipesContext);

  if (!context) {
    throw new Error(
      "useRecipes must be used inside RecipesProvider"
    );
  }

  return context;
}