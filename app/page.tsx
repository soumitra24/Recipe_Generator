// src/app/page.tsx
'use client'; // Necessary for using React Hooks (useState, useEffect)

import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Optional: Import an icon library if you want actual icons
// import { FiPlus, FiSearch, FiShoppingBag, FiTrash2, FiClock, FiChevronDown, FiList } from 'react-icons/fi';

// --- Define Data Types (interfaces) ---
interface Ingredient {
  id: string; // Use simple string IDs for static data
  name: string;
}

interface Recipe {
  id: string;
  ingredientsUsed: Ingredient[]; // Store the ingredients used for this recipe
  recipeText: string;
  generatedAt: Date;
}

// --- Initial Static Data ---
const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Chicken' }, { id: '2', name: 'Rice' }, { id: '3', name: 'Tomatoes' },
  { id: '4', name: 'Onions' },  { id: '5', name: 'Garlic' }, { id: '6', name: 'Bell Peppers' },
  { id: '7', name: 'Olive Oil' }, { id: '8', name: 'Pasta' }, { id: '9', name: 'Eggs' },
  { id: '10', name: 'Milk' }, { id: '11', name: 'Cheese' }, { id: '12', name: 'Butter' },
];

const INITIAL_RECIPE_HISTORY: Recipe[] = [
    // Example initial recipe history item (optional)
    {
        id: 'hist_1',
        ingredientsUsed: [INITIAL_INGREDIENTS[0], INITIAL_INGREDIENTS[1]], // Chicken, Rice
        recipeText: 'A simple recipe for Chicken & Rice:\n1. Cook rice.\n2. Sauté chicken with onions and garlic.\n3. Combine and serve.',
        generatedAt: new Date(Date.now() - 3600000 * 2) // Example: 2 hours ago
    }
];


// --- Main Page Component ---
export default function HomePage() {
  // --- State Variables ---
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [newItemName, setNewItemName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(''); // State for search input
  const [basket, setBasket] = useState<Ingredient[]>([]);
  const [recipeHistory, setRecipeHistory] = useState<Recipe[]>(INITIAL_RECIPE_HISTORY);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Optional: State to track expanded history items if implementing accordion
  // const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);


  // --- Handler Functions ---

  // Add a new ingredient to the main list (local state only)
  const handleAddItem = () => {
    if (!newItemName.trim()) {
      setError('Please enter an ingredient name.');
      return;
    }
    setError(null); // Clear previous error
    const newItem: Ingredient = {
      id: Date.now().toString(), // Simple unique ID for local state
      name: newItemName.trim(),
    };
    setIngredients(prevIngredients => [newItem, ...prevIngredients]); // Add to beginning
    setNewItemName(''); // Clear input field
  };
  const handleClearBasket = () => {
    setBasket([]);
    setError(null); // Clear any potential errors related to the basket
  };

  // Add an ingredient from the list to the basket
  const handleAddToBasket = (itemToAdd: Ingredient) => {
    setError(null); // Clear error on interaction
    setBasket(prevBasket => [...prevBasket, itemToAdd]);
  };

  // Remove an ingredient from the basket (removes the first occurrence)
  const handleRemoveFromBasket = (idToRemove: string) => {
     setBasket(prevBasket => {
        const indexToRemove = prevBasket.findIndex(item => item.id === idToRemove);
        if (indexToRemove !== -1) {
            return [
                ...prevBasket.slice(0, indexToRemove),
                ...prevBasket.slice(indexToRemove + 1)
            ];
        }
        return prevBasket;
     });
  };

  // Simulate recipe generation
  const handleGenerateRecipe = async () => { // Make the function async
    if (basket.length === 0) {
      setError('Your basket is empty. Add some ingredients first!');
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-recipe', { // Call your API route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients: basket }), // Send basket contents
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle errors from the API route
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Successfully got a recipe
      const newRecipe: Recipe = {
        id: `recipe_${Date.now()}`,
        ingredientsUsed: [...basket], // Keep track of ingredients used
        recipeText: data.recipeText, // Use the text from Gemini
        generatedAt: new Date(),
      };
      setRecipeHistory(prevHistory => [newRecipe, ...prevHistory]);
      setBasket([]); // Clear basket after successful generation

    } catch (error: any) {
      console.error("Failed to generate recipe:", error);
      setError(error.message || 'An unexpected error occurred while generating the recipe.');
    } finally {
      setIsGenerating(false); // Stop loading indicator regardless of success/failure
    }
  };

  // Filter ingredients based on search term
  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Logic (JSX) ---
  return (
    // Main container - applying background, font (assuming global setup), padding
    <main className="min-h-screen bg-white p-4 sm:p-6 md:p-8 font-sans">
      {/* Centered content container */}
      <div className="container mx-auto max-w-4xl flex flex-col gap-8">

        {/* Optional: Title like in the reference */}
         <h1 className="text-2xl font-semibold text-center text-gray-700 mb-4">
           {/* Icon Placeholder */} <span className="inline-block align-middle mr-2">🍲</span>
           Recipe Generator
         </h1>

        {/* --- 1. Your Pantry Section --- */}
        <section aria-labelledby="pantry-heading">
          <h2 id="pantry-heading" className="text-xl font-semibold mb-4 text-gray-800">
            {/* Icon Placeholder */} <span className="inline-block align-middle mr-1">🛒</span>
            Your Pantry
          </h2>
          {/* Add New Item Form */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add new item..."
              className="flex-grow text-black border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <button
              onClick={handleAddItem}
              // Using bg-primary directly - ensure your tailwind.config has #6552FF defined as primary
              className="bg-[#6552FF] text-white px-4 py-2 rounded-md hover:opacity-90 shrink-0 flex items-center justify-center"
              aria-label="Add Ingredient"
            >
              {/* Icon Placeholder for Plus */} <span className="text-xl font-semibold">+</span>
              {/* <FiPlus size={20} /> */}
            </button>
          </div>
          {/* Search Input */}
          <div className="relative mb-4">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               {/* Icon Placeholder for Search */} <span className="text-gray-400">🔍</span>
               {/* <FiSearch className="text-gray-400" size={18}/> */}
             </div>
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search items..."
               className="w-full text-black border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
             />
          </div>

          {/* Ingredient Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddToBasket(item)}
                  className="border text-black cursor-pointer border-gray-200 bg-gray-50 rounded-md p-2 text-center text-sm hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors duration-150 truncate"
                  title={`Add ${item.name} to basket`}
                >
                  {item.name}
                </button>
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center py-4">No ingredients found matching your search.</p>
            )}
          </div>
        </section>

         {/* --- 2. Your Basket Section --- */}
         <section aria-labelledby="basket-heading">
           <div className="flex justify-between items-center mb-3">
               <div className="flex items-center gap-2"> {/* Group heading and icon */}
                 <h2 id="basket-heading" className="text-xl font-semibold text-gray-800">
                   {/* Icon Placeholder */} <span className="inline-block align-middle mr-1">🛍️</span>
                   Your Basket
                 </h2>
                 {/* Item Count Badge */}
                 <span className="bg-[#6552FF] text-white text-xs font-medium px-2.5 py-1 rounded-full">
                   {basket.length} items
                 </span>
               </div>
               {/* Clear Basket Button - Added */}
               {basket.length > 0 && ( // Only show if basket is not empty
                 <button
                   onClick={handleClearBasket}
                   className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-150"
                   aria-label="Clear all items from basket"
                 >
                   Clear All
                 </button>
               )}
           </div>

           <div className="border rounded-lg p-4 bg-gray-50 min-h-[8rem] flex flex-col justify-center items-center">
             {basket.length > 0 ? (
               <div className="flex flex-wrap gap-2 justify-start w-full">
                 {/* ... (basket item mapping) ... */}
                 {basket.map((item, index) => (
                   <span key={`${item.id}-${index}`} className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-purple-100 text-[#6552FF]">
                     {item.name}
                     <button
                        onClick={() => handleRemoveFromBasket(item.id)}
                        type="button"
                        className="flex-shrink-0 h-4 w-4 inline-flex items-center justify-center rounded-full text-[#6552FF]/50 hover:bg-purple-200 hover:text-[#6552FF] focus:outline-none focus:bg-purple-200 focus:text-[#6552FF]"
                        aria-label={`Remove ${item.name}`}
                     >
                       <svg className="h-3 w-3" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                           <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                       </svg>
                       {/* <FiTrash2 size={12} /> */}
                     </button>
                   </span>
                 ))}
               </div>
             ) : (
               // Enhanced Empty Basket Message
               <div className="text-center text-gray-500">
                  <span className="text-3xl block mb-2">🧺</span> {/* Larger Icon */}
                  <p>Your basket is empty.</p>
                  <p className="text-sm">Add ingredients from your pantry above!</p>
               </div>
             )}
           </div>

           {/* Generate Button & Error */}
           <div className="mt-4">
            <button
              onClick={handleGenerateRecipe} // No change needed here
              disabled={isGenerating || basket.length === 0}
              className="w-full bg-[#6552FF] text-white font-semibold py-2.5 px-4 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
            >
              {isGenerating ? 'Generating Recipe...' : 'Generate Recipe'}
            </button>
            {/* Display error messages */}
            {error && <p className="text-red-500 mt-2 text-sm text-center">{error}</p>}
          </div>
        </section>

        {/* --- 3. Recipe History Section --- */}
        <section aria-labelledby="history-heading">
           {/* ... (heading) ... */}
           <div className="space-y-3">
             {recipeHistory.length > 0 ? (
               recipeHistory.map((recipe, index) => (
                 <motion.div
                   key={recipe.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.3, delay: index * 0.05 }}
                   // Added hover effect
                   className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
                 >
                   {/* ... (recipe card content) ... */}
                   <div className="flex justify-between items-center mb-2">
                     <h3 className="font-semibold text-gray-700">
                        {recipe.ingredientsUsed.map(ing => ing.name).join(' & ')} Recipe
                     </h3>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                           {/* Icon Placeholder */} <span className="inline-block align-middle mr-0.5">🕒</span>
                           {recipe.generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {/* Dropdown Icon Placeholder */}
                        <span className="text-gray-400">▼</span>
                        {/* <FiChevronDown ... /> */}
                     </div>
                   </div>
                   {/* Recipe Details */}
                   <div>
                      <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Ingredients:</span> {recipe.ingredientsUsed.map(ing => ing.name).join(', ') || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {recipe.recipeText}
                      </p>
                   </div>
                 </motion.div>
               ))
             ) : (
               // ... (no recipes generated message) ...
               <div className="border rounded-lg p-4 text-center bg-gray-50">
                  <p className="text-gray-500">No recipes generated yet.</p>
               </div>
             )}
           </div>
        </section>

      </div> {/* End Centered Container */}
    </main>
  );
}