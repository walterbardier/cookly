import { supabase } from "../lib/supabase";
import { RECIPES } from "../data/mockData";

export async function seedRecipes() {
  console.log("🌱 Iniciando seed...");

  for (const recipe of RECIPES) {
    const { error } = await supabase.from("recipes").insert({
      title: recipe.title,
      description: recipe.description,
      image: recipe.image,
      category: recipe.category,
      duration: recipe.duration,
      servings: recipe.servings,
      steps: recipe.steps,
      author: recipe.author,
      
      likes: recipe.likes,
      
      ingredients: recipe.ingredients,
      
      isLiked: recipe.isLiked ?? false,
      isSaved: recipe.isSaved ?? false,
    });

    if (error) {
      console.error(error);
    } else {
      console.log("✅", recipe.title);
    }
  }

  console.log("🎉 Seed terminado");
}