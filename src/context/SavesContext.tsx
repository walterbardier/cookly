import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";


type SavesContextType = {
  savedRecipes: Set<string>;
  loading: boolean;

  isSaved: (recipeId:string)=>boolean;

  toggleSaved:(recipeId:string)=>Promise<void>;

  refreshSaved:()=>Promise<void>;

  getSavedIds:()=>string[];
};


const SavesContext = createContext<SavesContextType | null>(null);



export function SavesProvider({
  children,
}:{
  children:ReactNode;
}){


  const { user } = useAuth();


  const [savedRecipes,setSavedRecipes] =
    useState<Set<string>>(new Set());


  const [loading,setLoading] =
    useState(true);



  useEffect(()=>{

    if(!user){

      setSavedRecipes(new Set());
      setLoading(false);
      return;

    }

    refreshSaved();

  },[user]);




  async function refreshSaved() {
    if (!user) return;
  
    setLoading(true);
  
    const { data, error } = await supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);
  
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
  
    setSavedRecipes(
      new Set((data ?? []).map(item => item.recipe_id))
    );
  
    setLoading(false);
  }





  function isSaved(recipeId:string){

    return savedRecipes.has(recipeId);

  }





  async function toggleSaved(recipeId:string){


    if(!user) return;



    const exists =
      savedRecipes.has(recipeId);



    if(exists){


      const {error}=await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id",user.id)
        .eq("recipe_id",recipeId);



      if(error){

        console.error(error);
        return;

      }



      setSavedRecipes(prev=>{

        const updated=new Set(prev);

        updated.delete(recipeId);

        return updated;

      });


      return;

    }





    const {error}=await supabase
      .from("saved_recipes")
      .insert({

        user_id:user.id,
        recipe_id:recipeId

      });



    if(error){

      console.error(error);
      return;

    }



    setSavedRecipes(prev=>{

      const updated=new Set(prev);

      updated.add(recipeId);

      return updated;

    });


  }




  function getSavedIds(){

    return Array.from(savedRecipes);

  }





  return(

    <SavesContext.Provider
      value={{

        savedRecipes,
        loading,

        isSaved,

        toggleSaved,

        refreshSaved,

        getSavedIds

      }}
    >

      {children}

    </SavesContext.Provider>

  )

}




export function useSaves(){

 const context = useContext(SavesContext);


 if(!context){

  throw new Error(
    "useSaves must be used inside SavesProvider"
  );

 }


 return context;

}