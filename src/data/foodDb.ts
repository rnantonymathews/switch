import { FoodDatabaseItem } from '../types';

// Verified nutrition database sourced from IFCT 2017 (Indian Food Composition Tables) & USDA FoodData Central
export const OFFLINE_FOOD_DB: FoodDatabaseItem[] = [
  // 1-10 Staples & Proteins
  { id: 'f-1', name: 'Chicken Breast', keywords: ['chicken breast', 'grilled chicken'], per100g: { kcal: 165, protein: 31.0, carbs: 0.0, fats: 3.6, fiber: 0.0, sugar: 0.0, sodium: 74 }, source: 'USDA' },
  { id: 'f-2', name: 'Chicken Curry', keywords: ['chicken curry', 'murgh curry'], per100g: { kcal: 145, protein: 15.8, carbs: 4.2, fats: 7.2, fiber: 0.8, sugar: 1.1, sodium: 310 }, source: 'IFCT 2017' },
  { id: 'f-3', name: 'Chapatti / Roti', keywords: ['chapatti', 'roti', 'phulka', 'chapati'], per100g: { kcal: 260, protein: 7.8, carbs: 50.0, fats: 3.0, fiber: 6.3, sugar: 1.0, sodium: 225 }, pieceWeightG: 40, source: 'IFCT 2017' },
  { id: 'f-4', name: 'Egg White', keywords: ['egg white', 'egg whites', 'boiled egg white'], per100g: { kcal: 52, protein: 10.9, carbs: 0.7, fats: 0.2, fiber: 0.0, sugar: 0.7, sodium: 166 }, pieceWeightG: 33, source: 'USDA' },
  { id: 'f-5', name: 'Egg Whole', keywords: ['egg whole', 'whole egg', 'boiled egg', 'egg', 'eggs'], per100g: { kcal: 155, protein: 12.6, carbs: 1.1, fats: 10.6, fiber: 0.0, sugar: 1.1, sodium: 124 }, pieceWeightG: 50, source: 'USDA' },
  { id: 'f-6', name: 'Toned Milk', keywords: ['toned milk', 'cow milk', 'boiled milk', 'milk'], per100g: { kcal: 58, protein: 3.1, carbs: 4.7, fats: 3.0, fiber: 0.0, sugar: 4.7, sodium: 45 }, source: 'IFCT 2017' },
  { id: 'f-7', name: 'White Rice', keywords: ['white rice', 'steamed rice', 'cooked rice', 'rice'], per100g: { kcal: 130, protein: 2.7, carbs: 28.2, fats: 0.3, fiber: 0.4, sugar: 0.1, sodium: 5 }, source: 'IFCT 2017' },
  { id: 'f-8', name: 'Brown Rice', keywords: ['brown rice', 'cooked brown rice'], per100g: { kcal: 123, protein: 2.7, carbs: 25.6, fats: 1.0, fiber: 1.6, sugar: 0.2, sodium: 4 }, source: 'USDA' },
  { id: 'f-9', name: 'Paneer', keywords: ['paneer', 'cottage cheese'], per100g: { kcal: 265, protein: 18.3, carbs: 3.4, fats: 20.8, fiber: 0.0, sugar: 1.2, sodium: 22 }, source: 'IFCT 2017' },
  { id: 'f-10', name: 'Toor Dal / Yellow Dal', keywords: ['toor dal', 'arhar dal', 'dal tadka', 'yellow dal', 'dal'], per100g: { kcal: 116, protein: 7.2, carbs: 17.5, fats: 1.9, fiber: 3.8, sugar: 1.0, sodium: 180 }, source: 'IFCT 2017' },

  // 11-20 Indian Breakfasts & Curries
  { id: 'f-11', name: 'Whey Protein', keywords: ['whey protein', 'whey isolate', 'whey', 'protein powder'], per100g: { kcal: 375, protein: 75.0, carbs: 9.4, fats: 4.7, fiber: 0.0, sugar: 3.1, sodium: 297 }, pieceWeightG: 32, source: 'USDA' },
  { id: 'f-12', name: 'Rolled Oats', keywords: ['rolled oats', 'oatmeal', 'oats'], per100g: { kcal: 389, protein: 16.9, carbs: 66.3, fats: 6.9, fiber: 10.6, sugar: 0.0, sodium: 2 }, source: 'USDA' },
  { id: 'f-13', name: 'Banana', keywords: ['banana', 'bananas'], per100g: { kcal: 89, protein: 1.1, carbs: 22.8, fats: 0.3, fiber: 2.6, sugar: 12.2, sodium: 1 }, pieceWeightG: 118, source: 'USDA' },
  { id: 'f-14', name: 'Mixed Veggies', keywords: ['mixed veggies', 'mixed vegetables', 'boiled vegetables', 'veggies'], per100g: { kcal: 45, protein: 2.4, carbs: 8.0, fats: 0.4, fiber: 3.2, sugar: 2.1, sodium: 35 }, source: 'IFCT 2017' },
  { id: 'f-15', name: 'Idli', keywords: ['idli', 'idlis', 'steamed idli'], per100g: { kcal: 135, protein: 3.8, carbs: 28.0, fats: 0.6, fiber: 1.4, sugar: 0.4, sodium: 160 }, pieceWeightG: 50, source: 'IFCT 2017' },
  { id: 'f-16', name: 'Plain Dosa', keywords: ['plain dosa', 'sada dosa', 'dosa'], per100g: { kcal: 210, protein: 4.2, carbs: 33.0, fats: 6.8, fiber: 1.6, sugar: 0.5, sodium: 210 }, pieceWeightG: 80, source: 'IFCT 2017' },
  { id: 'f-17', name: 'Sambar', keywords: ['sambar', 'sambhar'], per100g: { kcal: 65, protein: 2.8, carbs: 9.2, fats: 1.8, fiber: 2.2, sugar: 1.6, sodium: 260 }, source: 'IFCT 2017' },
  { id: 'f-18', name: 'Rava Upma', keywords: ['rava upma', 'sooji upma', 'upma'], per100g: { kcal: 180, protein: 3.5, carbs: 27.0, fats: 6.2, fiber: 1.8, sugar: 0.8, sodium: 240 }, source: 'IFCT 2017' },
  { id: 'f-19', name: 'Poha', keywords: ['kanda poha', 'batata poha', 'poha'], per100g: { kcal: 175, protein: 2.6, carbs: 28.5, fats: 5.5, fiber: 1.9, sugar: 1.1, sodium: 210 }, source: 'IFCT 2017' },
  { id: 'f-20', name: 'Plain Paratha', keywords: ['plain paratha', 'tawa paratha', 'paratha'], per100g: { kcal: 295, protein: 6.5, carbs: 46.0, fats: 9.2, fiber: 4.5, sugar: 0.8, sodium: 250 }, pieceWeightG: 60, source: 'IFCT 2017' },

  // 21-30 Legumes, Curries & Dairy
  { id: 'f-21', name: 'Aloo Paratha', keywords: ['aloo paratha', 'potato paratha'], per100g: { kcal: 240, protein: 4.8, carbs: 36.5, fats: 8.2, fiber: 3.5, sugar: 1.0, sodium: 290 }, pieceWeightG: 85, source: 'IFCT 2017' },
  { id: 'f-22', name: 'Rajma Curry', keywords: ['rajma curry', 'rajma masala', 'rajma'], per100g: { kcal: 140, protein: 6.8, carbs: 19.5, fats: 3.8, fiber: 5.2, sugar: 1.2, sodium: 320 }, source: 'IFCT 2017' },
  { id: 'f-23', name: 'Chole / Chana Masala', keywords: ['chana masala', 'chole masala', 'chole'], per100g: { kcal: 165, protein: 7.5, carbs: 21.5, fats: 5.2, fiber: 5.8, sugar: 1.4, sodium: 340 }, source: 'IFCT 2017' },
  { id: 'f-24', name: 'Chicken Biryani', keywords: ['chicken biryani', 'dum biryani', 'biryani'], per100g: { kcal: 195, protein: 9.5, carbs: 23.0, fats: 7.2, fiber: 1.2, sugar: 0.8, sodium: 320 }, source: 'IFCT 2017' },
  { id: 'f-25', name: 'Fish Curry', keywords: ['fish curry', 'machli curry'], per100g: { kcal: 135, protein: 14.5, carbs: 3.2, fats: 7.2, fiber: 0.6, sugar: 0.5, sodium: 280 }, source: 'IFCT 2017' },
  { id: 'f-26', name: 'Dahi / Curd', keywords: ['plain curd', 'dahi', 'curd', 'yogurt'], per100g: { kcal: 60, protein: 3.1, carbs: 4.4, fats: 3.3, fiber: 0.0, sugar: 4.4, sodium: 36 }, source: 'IFCT 2017' },
  { id: 'f-27', name: 'Peanut Butter', keywords: ['peanut butter', 'smooth peanut butter'], per100g: { kcal: 588, protein: 25.1, carbs: 20.0, fats: 50.4, fiber: 6.0, sugar: 9.2, sodium: 426 }, source: 'USDA' },
  { id: 'f-28', name: 'Almonds', keywords: ['badam', 'raw almonds', 'almonds', 'almond'], per100g: { kcal: 609, protein: 20.8, carbs: 10.5, fats: 58.9, fiber: 11.2, sugar: 4.6, sodium: 4 }, pieceWeightG: 1.2, source: 'IFCT 2017' },
  { id: 'f-29', name: 'Sweet Potato', keywords: ['boiled sweet potato', 'sweet potato', 'shakarkandi'], per100g: { kcal: 90, protein: 1.4, carbs: 21.0, fats: 0.2, fiber: 3.0, sugar: 4.2, sodium: 36 }, source: 'IFCT 2017' },
  { id: 'f-30', name: 'Apple', keywords: ['apple', 'apples'], per100g: { kcal: 52, protein: 0.3, carbs: 13.8, fats: 0.2, fiber: 2.4, sugar: 10.4, sodium: 1 }, pieceWeightG: 180, source: 'USDA' },

  // 31-40 Plant Proteins, Oils & Grains
  { id: 'f-31', name: 'Soya Chunks', keywords: ['soy chunks', 'soya chunks', 'mealmaker', 'nutrela'], per100g: { kcal: 345, protein: 52.0, carbs: 33.0, fats: 0.5, fiber: 13.0, sugar: 0.0, sodium: 20 }, source: 'IFCT 2017' },
  { id: 'f-32', name: 'Tofu', keywords: ['firm tofu', 'tofu'], per100g: { kcal: 83, protein: 10.0, carbs: 1.9, fats: 5.3, fiber: 0.9, sugar: 0.5, sodium: 12 }, source: 'USDA' },
  { id: 'f-33', name: 'White Bread', keywords: ['white bread slice', 'white bread', 'bread slice', 'bread'], per100g: { kcal: 265, protein: 8.9, carbs: 49.1, fats: 3.2, fiber: 2.7, sugar: 5.0, sodium: 491 }, pieceWeightG: 30, source: 'USDA' },
  { id: 'f-34', name: 'Brown Bread', keywords: ['whole wheat bread', 'brown bread slice', 'brown bread'], per100g: { kcal: 247, protein: 13.0, carbs: 41.3, fats: 3.4, fiber: 6.0, sugar: 5.6, sodium: 400 }, pieceWeightG: 32, source: 'USDA' },
  { id: 'f-35', name: 'Ghee', keywords: ['desi ghee', 'cow ghee', 'ghee'], per100g: { kcal: 900, protein: 0.0, carbs: 0.0, fats: 100.0, fiber: 0.0, sugar: 0.0, sodium: 2 }, source: 'IFCT 2017' },
  { id: 'f-36', name: 'Olive Oil', keywords: ['extra virgin olive oil', 'olive oil'], per100g: { kcal: 884, protein: 0.0, carbs: 0.0, fats: 100.0, fiber: 0.0, sugar: 0.0, sodium: 2 }, source: 'USDA' },
  { id: 'f-37', name: 'Moong Dal', keywords: ['moong dal', 'mung dal', 'yellow moong'], per100g: { kcal: 105, protein: 7.0, carbs: 16.5, fats: 1.2, fiber: 3.5, sugar: 0.8, sodium: 160 }, source: 'IFCT 2017' },
  { id: 'f-38', name: 'Paneer Bhurji', keywords: ['paneer bhurji'], per100g: { kcal: 215, protein: 13.5, carbs: 4.8, fats: 15.6, fiber: 1.2, sugar: 1.5, sodium: 280 }, source: 'IFCT 2017' },
  { id: 'f-39', name: 'Boiled Chana / Chickpeas', keywords: ['boiled chana', 'boiled chickpeas', 'kabuli chana'], per100g: { kcal: 164, protein: 8.9, carbs: 27.4, fats: 2.6, fiber: 7.6, sugar: 4.8, sodium: 24 }, source: 'USDA' },
  { id: 'f-40', name: 'Khichdi', keywords: ['moong dal khichdi', 'khichdi'], per100g: { kcal: 120, protein: 4.2, carbs: 22.0, fats: 1.8, fiber: 2.1, sugar: 0.5, sodium: 190 }, source: 'IFCT 2017' },

  // 41-50 Nuts, Vegetables & Fruits
  { id: 'f-41', name: 'Walnuts', keywords: ['akhrot', 'walnuts', 'walnut'], per100g: { kcal: 654, protein: 15.2, carbs: 13.7, fats: 65.2, fiber: 6.7, sugar: 2.6, sodium: 2 }, source: 'USDA' },
  { id: 'f-42', name: 'Boiled Potato', keywords: ['boiled potato', 'boiled aloo', 'potato'], per100g: { kcal: 87, protein: 1.9, carbs: 20.1, fats: 0.1, fiber: 1.8, sugar: 0.9, sodium: 6 }, pieceWeightG: 150, source: 'USDA' },
  { id: 'f-43', name: 'Egg Bhurji / Scrambled Egg', keywords: ['scrambled eggs', 'scrambled egg', 'egg bhurji'], per100g: { kcal: 149, protein: 10.0, carbs: 1.6, fats: 11.0, fiber: 0.0, sugar: 1.3, sodium: 160 }, source: 'USDA' },
  { id: 'f-44', name: 'Mutton Curry', keywords: ['mutton curry', 'lamb curry', 'mutton'], per100g: { kcal: 185, protein: 17.2, carbs: 3.5, fats: 11.2, fiber: 0.7, sugar: 0.8, sodium: 340 }, source: 'IFCT 2017' },
  { id: 'f-45', name: 'Palak / Spinach', keywords: ['cooked spinach', 'palak', 'spinach'], per100g: { kcal: 26, protein: 2.8, carbs: 2.9, fats: 0.4, fiber: 2.1, sugar: 0.4, sodium: 70 }, source: 'IFCT 2017' },
  { id: 'f-46', name: 'Cucumber', keywords: ['kheera', 'cucumber'], per100g: { kcal: 15, protein: 0.7, carbs: 3.6, fats: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2 }, pieceWeightG: 200, source: 'USDA' },
  { id: 'f-47', name: 'Tomato', keywords: ['tamatar', 'tomato', 'tomatoes'], per100g: { kcal: 18, protein: 0.9, carbs: 3.9, fats: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5 }, pieceWeightG: 120, source: 'USDA' },
  { id: 'f-48', name: 'Onion', keywords: ['pyaz', 'raw onion', 'onion', 'onions'], per100g: { kcal: 40, protein: 1.1, carbs: 9.3, fats: 0.1, fiber: 1.7, sugar: 4.2, sodium: 4 }, pieceWeightG: 110, source: 'USDA' },
  { id: 'f-49', name: 'Broccoli', keywords: ['steamed broccoli', 'broccoli'], per100g: { kcal: 35, protein: 2.4, carbs: 7.2, fats: 0.4, fiber: 3.3, sugar: 1.4, sodium: 41 }, source: 'USDA' },
  { id: 'f-50', name: 'Greek Yogurt', keywords: ['nonfat greek yogurt', 'greek yogurt'], per100g: { kcal: 59, protein: 10.2, carbs: 3.6, fats: 0.4, fiber: 0.0, sugar: 3.2, sodium: 36 }, source: 'USDA' },

  // 51-64 Fruits, Seeds, Traditional Staples & Beverages
  { id: 'f-51', name: 'Orange', keywords: ['santra', 'orange', 'oranges'], per100g: { kcal: 47, protein: 0.9, carbs: 11.8, fats: 0.1, fiber: 2.4, sugar: 9.4, sodium: 0 }, pieceWeightG: 130, source: 'USDA' },
  { id: 'f-52', name: 'Papaya', keywords: ['papita', 'papaya'], per100g: { kcal: 32, protein: 0.6, carbs: 7.2, fats: 0.1, fiber: 1.7, sugar: 5.9, sodium: 4 }, source: 'IFCT 2017' },
  { id: 'f-53', name: 'Watermelon', keywords: ['tarbooz', 'watermelon'], per100g: { kcal: 30, protein: 0.6, carbs: 7.6, fats: 0.2, fiber: 0.4, sugar: 6.2, sodium: 1 }, source: 'USDA' },
  { id: 'f-54', name: 'Roasted Chana', keywords: ['bhuna chana', 'roasted chana', 'roasted gram'], per100g: { kcal: 369, protein: 18.6, carbs: 58.1, fats: 5.2, fiber: 16.8, sugar: 2.0, sodium: 18 }, source: 'IFCT 2017' },
  { id: 'f-55', name: 'Cashew Nuts', keywords: ['kaju', 'cashew nuts', 'cashews'], per100g: { kcal: 582, protein: 21.2, carbs: 22.3, fats: 46.9, fiber: 3.3, sugar: 5.9, sodium: 12 }, source: 'IFCT 2017' },
  { id: 'f-56', name: 'Chia Seeds', keywords: ['chia seed', 'chia seeds'], per100g: { kcal: 486, protein: 16.5, carbs: 42.1, fats: 30.7, fiber: 34.4, sugar: 0.0, sodium: 16 }, source: 'USDA' },
  { id: 'f-57', name: 'Pumpkin Seeds', keywords: ['pumpkin seeds', 'pepitas'], per100g: { kcal: 559, protein: 30.2, carbs: 10.7, fats: 49.1, fiber: 6.0, sugar: 1.4, sodium: 7 }, source: 'USDA' },
  { id: 'f-58', name: 'Pure Honey', keywords: ['pure honey', 'honey'], per100g: { kcal: 304, protein: 0.3, carbs: 82.4, fats: 0.0, fiber: 0.2, sugar: 82.1, sodium: 4 }, source: 'USDA' },
  { id: 'f-59', name: 'Besan Chilla', keywords: ['besan chilla', 'besan cheela', 'chilla'], per100g: { kcal: 195, protein: 8.5, carbs: 23.0, fats: 7.5, fiber: 4.2, sugar: 2.1, sodium: 230 }, pieceWeightG: 70, source: 'IFCT 2017' },
  { id: 'f-60', name: 'Butter', keywords: ['table butter', 'salted butter', 'butter'], per100g: { kcal: 717, protein: 0.9, carbs: 0.1, fats: 81.1, fiber: 0.0, sugar: 0.1, sodium: 576 }, source: 'USDA' },
  { id: 'f-61', name: 'Rohu Fish', keywords: ['rohu fish', 'cooked fish', 'rohu'], per100g: { kcal: 110, protein: 17.5, carbs: 0.0, fats: 4.4, fiber: 0.0, sugar: 0.0, sodium: 78 }, source: 'IFCT 2017' },
  { id: 'f-62', name: 'Refined Sugar', keywords: ['refined sugar', 'table sugar', 'sugar'], per100g: { kcal: 387, protein: 0.0, carbs: 100.0, fats: 0.0, fiber: 0.0, sugar: 100.0, sodium: 1 }, source: 'USDA' },
  { id: 'f-63', name: 'Coconut Water', keywords: ['nariyal pani', 'tender coconut water', 'coconut water'], per100g: { kcal: 19, protein: 0.7, carbs: 3.7, fats: 0.2, fiber: 0.0, sugar: 2.6, sodium: 105 }, source: 'IFCT 2017' },
  { id: 'f-64', name: 'Coconut Milk', keywords: ['coconut milk'], per100g: { kcal: 230, protein: 2.3, carbs: 5.5, fats: 23.8, fiber: 2.2, sugar: 3.3, sodium: 15 }, source: 'USDA' }
];
