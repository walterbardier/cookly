export type Category = {
  id: string;
  emoji: string;
  name: {
    en: string;
    es: string;
  }
  color: string;
  bgColor: string;
};

export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  recipesCount: number;
  isFollowing?: boolean;
};

export type Recipe = {
  id: string;

  title: string;
  description: string;
  image: string;

  category: string;

  duration: number;
  servings: number;

  ingredients: string[];
  steps: string[];
  tags: string[];

  likes: number;

  author_id: string;

  author: User;

  isLiked?: boolean;
  isSaved?: boolean;
};

export const CATEGORIES: Category[] = [
  { id: 'healthy', emoji: '🥗',
    name: {
      en: 'Healthy', 
      es: 'Saludable',
    },
      color: '#34C759', bgColor: '#E8FAE8' },
  { id: 'protein', emoji: '💪',
    name: {
      en: 'Protein', 
      es: 'Proteina',
    },
    color: '#FF6B35', bgColor: '#FFF0EB' },
  { id: 'vegan', emoji: '🌱',
    name: {
      en: 'Vegan', 
      es: 'Vegano',
    },
    color: '#30B54A', bgColor: '#E5F9E9' },
  { id: 'seafood', emoji: '🐟',
    name: {
      en: 'Seafood', 
      es: 'Mariscos',
    },
    color: '#007AFF', bgColor: '#E5F2FF' },
  { id: 'dessert', emoji: '🍰',
    name: {
      en: 'Dessert', 
      es: 'Postres',
    },
    color: '#FF2D55', bgColor: '#FFE5EA' },
  { id: 'pasta', emoji: '🍝',
    name: {
      en: 'Pasta', 
      es: 'Pasta',
    },
    color: '#FF9500', bgColor: '#FFF4E0' },
  {
    id: 'breakfast',
    emoji: '☕',
    name: {
      en: 'Breakfast',
      es: 'Desayuno',
    },
    color: '#FFCC00',
    bgColor: '#FFF9D6'
  },
  {
    id: 'dinner',
    emoji: '🌙',
    name: {
      en: 'Dinner',
      es: 'Cena',
    },
    color: '#5856D6',
    bgColor: '#EEEEFF'
  },
];

export const USERS: User[] = [
  {
    id: '1',
    name: 'Sofia Martínez',
    username: 'sofiacocina',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&auto=format',
    bio: 'Chef amateur 🍋 Amante de la comida mediterránea y los sabores frescos.',
    followers: 2840,
    following: 312,
    recipesCount: 48,
    isFollowing: true,
  },
  {
    id: '2',
    name: 'Marco Rivera',
    username: 'marcofit',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
    bio: 'Nutricionista y cocinero 💪 Recetas altas en proteína sin sacrificar el sabor.',
    followers: 5120,
    following: 198,
    recipesCount: 73,
    isFollowing: false,
  },
  {
    id: '3',
    name: 'Lucía Chen',
    username: 'luciaverde',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format',
    bio: 'Vegana apasionada 🌱 Todo lo que cocino tiene que ser colorido y delicioso.',
    followers: 3670,
    following: 445,
    recipesCount: 92,
    isFollowing: true,
  },
  {
    id: '4',
    name: 'Carlos Mendoza',
    username: 'chefcarlos',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format',
    bio: 'Cocinero profesional 🍝 Especialista en pasta artesanal y cocina italiana.',
    followers: 8910,
    following: 267,
    recipesCount: 134,
    isFollowing: false,
  },
  {
    id: 'me',
    name: 'Alex Torres',
    username: 'alexcocina',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format',
    bio: 'Explorando sabores del mundo 🍊 Foodie, viajero y eterno aprendiz.',
    followers: 824,
    following: 156,
    recipesCount: 23,
  },
];

export const RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Bowl Mediterráneo de Quinoa',
    description: 'Un bowl fresco y nutritivo con quinoa, verduras asadas, hummus cremoso y aderezo de limón y hierbas.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&auto=format',
    category: 'healthy',
    duration: 25,
    servings: 2,
    likes: 342,
    isLiked: true,
    isSaved: false,
    author_id: USERS[0].id,
    author: USERS[0],
    ingredients: [
      '1 taza de quinoa cocida',
      '1 pepino en cubos',
      '200g de tomates cherry',
      '1/2 pimiento rojo',
      '100g de hummus',
      '50g de aceitunas negras',
      'Jugo de 1 limón',
      'Aceite de oliva extra virgen',
      'Hojas de menta fresca',
      'Sal y pimienta al gusto',
    ],
    steps: [
      'Cocina la quinoa según las instrucciones del paquete y deja enfriar.',
      'Corta todas las verduras en trozos pequeños y uniformes.',
      'En un bol grande, mezcla la quinoa con las verduras.',
      'Agrega el hummus en el centro del bol.',
      'Rocía con aceite de oliva y jugo de limón.',
      'Sazona con sal, pimienta y hojas de menta.',
      'Sirve de inmediato o refrigera hasta 2 días.',
    ],
    tags: ['mediterráneo', 'sin gluten', 'vegetariano'],
  },
  {
    id: '2',
    title: 'Salmón con Costra de Pistachos',
    description: 'Filetes de salmón con una crujiente costra de pistachos y hierbas, servidos con espárragos salteados.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop&auto=format',
    category: 'seafood',
    duration: 30,
    servings: 2,
    likes: 521,
    isLiked: false,
    isSaved: true,
    author_id: USERS[3].id,
    author: USERS[3],
    ingredients: [
      '2 filetes de salmón (200g c/u)',
      '80g de pistachos sin sal',
      '2 cucharadas de mostaza Dijon',
      '1 manojo de espárragos',
      '2 dientes de ajo',
      'Ralladura de 1 limón',
      'Aceite de oliva',
      'Perejil fresco picado',
    ],
    steps: [
      'Precalienta el horno a 200°C.',
      'Tritura los pistachos hasta obtener una textura gruesa.',
      'Mezcla los pistachos con ralladura de limón y perejil.',
      'Unta los filetes con mostaza y presiona la mezcla de pistachos encima.',
      'Hornea 12-15 minutos hasta que la costra esté dorada.',
      'Saltea los espárragos con ajo y aceite de oliva.',
      'Sirve el salmón sobre los espárragos.',
    ],
    tags: ['omega-3', 'sin gluten', 'proteína'],
  },
  {
    id: '3',
    title: 'Proteína Bowl de Pollo',
    description: 'Bowl de arroz integral con pollo a la plancha, aguacate, huevo y verduras frescas. Alto en proteínas.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop&auto=format',
    category: 'protein',
    duration: 20,
    servings: 1,
    likes: 873,
    isLiked: true,
    isSaved: true,
    author_id: USERS[1].id,
    author: USERS[1],
    ingredients: [
      '150g de pechuga de pollo',
      '1/2 taza de arroz integral cocido',
      '1/2 aguacate maduro',
      '2 huevos',
      '1 taza de espinacas baby',
      '100g de edamame',
      'Salsa de soja baja en sodio',
      'Semillas de sésamo',
      'Jengibre rallado',
    ],
    steps: [
      'Sazona el pollo con sal, pimienta y jengibre.',
      'Cocina el pollo a la plancha 6 minutos por cada lado.',
      'Hierve los huevos durante 7 minutos para yema cremosa.',
      'Pela y corta el aguacate en láminas.',
      'Arma el bowl con el arroz como base.',
      'Coloca el pollo en lonchas, el huevo cortado, aguacate y edamame.',
      'Rocía con salsa de soja y decora con sésamo.',
    ],
    tags: ['alto en proteína', 'meal prep', 'sin gluten'],
  },
  {
    id: '4',
    title: 'Pappardelle al Ragú de Hongos',
    description: 'Pasta fresca con un rico ragú de hongos silvestres, trufa negra y parmesano aged.',
    image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&h=400&fit=crop&auto=format',
    category: 'pasta',
    duration: 45,
    servings: 4,
    likes: 1204,
    isLiked: false,
    isSaved: false,
    author_id: USERS[3].id,
    author: USERS[3],
    ingredients: [
      '400g de pappardelle fresca',
      '300g de hongos portobello',
      '200g de hongos shiitake',
      '100g de hongos porcini secos',
      '1 cebolla blanca',
      '3 dientes de ajo',
      '1 vaso de vino tinto',
      '200ml de caldo de verduras',
      'Aceite de trufa negra',
      'Parmesano aged al gusto',
    ],
    steps: [
      'Hidrata los porcini en agua caliente por 20 minutos.',
      'Sofríe cebolla y ajo en aceite de oliva hasta transparentar.',
      'Agrega todos los hongos y cocina hasta dorar.',
      'Vierte el vino tinto y deja reducir a la mitad.',
      'Agrega el caldo y los porcini con su agua de remojo filtrada.',
      'Cocina la salsa a fuego lento 20 minutos.',
      'Cuece la pasta al dente y mezcla con el ragú.',
      'Termina con aceite de trufa y parmesano.',
    ],
    tags: ['italiana', 'vegetariana', 'gourmet'],
  },
  {
    id: '5',
    title: 'Tarta de Limón y Albahaca',
    description: 'Una tarta refrescante con crema de limón yuzu, merengue italiano y hojas de albahaca cristalizada.',
    image: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&h=400&fit=crop&auto=format',
    category: 'dessert',
    duration: 90,
    servings: 8,
    likes: 2156,
    isLiked: true,
    isSaved: true,
    author_id: USERS[1].id,
    author: USERS[1],
    ingredients: [
      '200g de harina',
      '100g de mantequilla fría',
      '4 limones (jugo y ralladura)',
      '3 yemas de huevo',
      '200g de azúcar',
      '150ml de crema de leche',
      '3 claras de huevo para el merengue',
      'Hojas de albahaca fresca',
      'Azúcar glas para decorar',
    ],
    steps: [
      'Prepara la masa quebrada con harina, mantequilla y una pizca de sal.',
      'Refrigera la masa 30 minutos antes de estirar.',
      'Hornea a ciegas la base 15 minutos a 180°C.',
      'Mezcla yemas, limón, azúcar y crema para el relleno.',
      'Vierte el relleno en la base y hornea 25 minutos.',
      'Prepara el merengue italiano con las claras y almíbar a 118°C.',
      'Decora con merengue y albahaca cristalizada.',
    ],
    tags: ['repostería', 'cítrico', 'sin lactosa posible'],
  },
  {
    id: '6',
    title: 'Curry Verde Vegano',
    description: 'Un aromático curry verde tailandés con leche de coco, tofu firme y vegetales de temporada.',
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=400&fit=crop&auto=format',
    category: 'vegan',
    duration: 35,
    servings: 3,
    likes: 634,
    isLiked: false,
    isSaved: false,
    author_id: USERS[2].id,
    author: USERS[2],
    ingredients: [
      '300g de tofu firme',
      '400ml de leche de coco',
      '3 cucharadas de pasta de curry verde',
      '1 calabacín',
      '1 pimiento verde',
      '100g de guisantes',
      '2 cucharadas de salsa de soja',
      'Hojas de lima kaffir',
      'Jengibre fresco rallado',
      'Arroz jazmín para servir',
    ],
    steps: [
      'Presiona el tofu y córtalo en cubos.',
      'Fríe el tofu en aceite hasta dorar por todos lados.',
      'En la misma sartén, sofríe la pasta de curry con jengibre.',
      'Agrega la leche de coco y las hojas de lima.',
      'Incorpora las verduras y cocina 10 minutos.',
      'Añade el tofu y la salsa de soja.',
      'Sirve sobre arroz jazmín con cilantro fresco.',
    ],
    tags: ['tailandés', 'sin gluten', 'vegano'],
  },
];

export const FRIEND_RECIPES: Recipe[] = [
  {
    id: '7',
    title: 'Smoothie Bowl de Mango y Cúrcuma',
    description: 'Bowl de desayuno antiinflamatorio con mango, cúrcuma y toppings crunchy.',
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop&auto=format',
    category: 'healthy',
    duration: 10,
    servings: 1,
    likes: 89,
    isLiked: false,
    isSaved: false,
    author_id: USERS[0].id,
    author: USERS[0],
    ingredients: [],
    steps: [],
    tags: ['desayuno', 'vegano', 'antiinflamatorio'],
  },
  {
    id: '8',
    title: 'Tacos de Coliflor Asada',
    description: 'Tacos con coliflor tostada al comino, crema de aguacate y pico de gallo casero.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop&auto=format',
    category: 'vegan',
    duration: 30,
    servings: 2,
    likes: 156,
    isLiked: true,
    isSaved: false,
    author_id: USERS[2].id,
    author: USERS[2],
    ingredients: [],
    steps: [],
    tags: ['mexicano', 'vegano', 'sin gluten'],
  },
  {
    id: '9',
    title: 'Fettuccine Alfredo Trufa',
    description: 'Fettuccine casero con salsa alfredo de trufa blanca, panceta crujiente y parmesano.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop&auto=format',
    category: 'pasta',
    duration: 40,
    servings: 2,
    likes: 203,
    isLiked: false,
    isSaved: true,
    author_id: USERS[3].id,
    author: USERS[3],
    ingredients: [],
    steps: [],
    tags: ['italiana', 'gourmet', 'comfort food'],
  },
];
