import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

type LikesContextType = {
  likedRecipes: Set<string>;
  likesCount: Map<string, number>;
  loading: boolean;
  initializeLikes: (
    recipes: {
      id: string;
      likes: number;
    }[]
  ) => void;
  getLikes: (recipeId: string) => number;
  isLiked: (recipeId: string) => boolean;
  toggleLike: (recipeId: string) => Promise<void>;
};

const LikesContext = createContext<LikesContextType | null>(null);

export function LikesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();

  const [likedRecipes, setLikedRecipes] = useState<Set<string>>(new Set());
  const [likesCount, setLikesCount] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLikedRecipes(new Set());
      setLikesCount(new Map());
      setLoading(false);
      return;
    }

    loadLikes();
  }, [user]);

  async function loadLikes() {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("liked_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setLikedRecipes(
      new Set((data ?? []).map(like => like.recipe_id))
    );

    setLoading(false);
  }

  function initializeLikes(
    recipes: {
      id: string;
      likes: number;
    }[]
  ) {
    setLikesCount(prev => {
      const map = new Map(prev);

      recipes.forEach(recipe => {
        if (!map.has(recipe.id)) {
          map.set(recipe.id, recipe.likes);
        }
      });

      return map;
    });
  }

  function getLikes(recipeId: string) {
    return likesCount.get(recipeId) ?? 0;
  }

  function isLiked(recipeId: string) {
    return likedRecipes.has(recipeId);
  }

  async function toggleLike(recipeId: string) {
    if (!user) return;

    const liked = likedRecipes.has(recipeId);

    if (liked) {
      const { error } = await supabase
        .from("liked_recipes")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId);

      if (error) {
        console.error(error);
        return;
      }

      const { error: rpcError } = await supabase.rpc(
        "decrement_recipe_likes",
        { recipe_id: recipeId }
      );

      if (rpcError) {
        console.error(rpcError);
        return;
      }

      setLikedRecipes(prev => {
        const updated = new Set(prev);
        updated.delete(recipeId);
        return updated;
      });

      setLikesCount(prev => {
        const map = new Map(prev);
        map.set(
          recipeId,
          Math.max((map.get(recipeId) ?? 1) - 1, 0)
        );
        return map;
      });

    } else {
      const { error } = await supabase
        .from("liked_recipes")
        .insert({
          user_id: user.id,
          recipe_id: recipeId,
        });

      if (error) {
        console.error(error);
        return;
      }

      const { error: rpcError } = await supabase.rpc(
        "increment_recipe_likes",
        { recipe_id: recipeId }
      );

      if (rpcError) {
        console.error(rpcError);
        return;
      }

      setLikedRecipes(prev => {
        const updated = new Set(prev);
        updated.add(recipeId);
        return updated;
      });

      setLikesCount(prev => {
        const map = new Map(prev);
        map.set(
          recipeId,
          (map.get(recipeId) ?? 0) + 1
        );
        return map;
      });
    }
  }

  return (
    <LikesContext.Provider
      value={{
        likedRecipes,
        likesCount,
        loading,
        initializeLikes,
        getLikes,
        isLiked,
        toggleLike,
      }}
    >
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);

  if (!context) {
    throw new Error(
      "useLikes must be used inside LikesProvider"
    );
  }

  return context;
}