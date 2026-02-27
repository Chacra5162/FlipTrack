// Subcategory definitions — nested: category → subcategory → optional sub-subcategories
export const CLOTHING_TYPES = [
  'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Shorts', 'Jackets', 'Hoodies',
  'Sweaters', 'Dresses', 'Skirts', 'Socks', 'Underwear', 'Activewear',
  'Swimwear', 'Outerwear', 'Suits', 'Loungewear'
];

export const CAT_TREE = {
  Clothing: {
    subcats: {
      'Men':                 CLOTHING_TYPES,
      'Women':               CLOTHING_TYPES,
      'Children':            CLOTHING_TYPES,
      'Footwear':            ['Men', 'Women', 'Children'],
      "Men's Accessories":   [],
      "Women's Accessories": [],
    }
  },
  Books: {
    subcats: {
      'Fiction':             ['Literary', 'Sci-Fi', 'Fantasy', 'Mystery', 'Thriller', 'Romance', 'Horror', 'Historical'],
      'Non-Fiction':         ['Biography', 'History', 'Science', 'Self-Help', 'Business', 'Travel', 'Cooking', 'Health'],
      'Textbooks':           ['Math', 'Science', 'Engineering', 'Medicine', 'Law', 'Business', 'Humanities', 'Computer Science'],
      'Children':            ['Picture Books', 'Middle Grade', 'Young Adult', 'Board Books', 'Activity Books'],
      'Rare & Collectible':  ['First Editions', 'Signed Copies', 'Antiquarian', 'Limited Editions'],
      'Comics & Graphic Novels': [],
      'Art & Photography':   [],
      'Reference':           [],
    }
  }
};

// Flat SUBCATS for backwards-compat with populateSubcatSelect
export const SUBCATS = Object.fromEntries(
  Object.entries(CAT_TREE).map(([cat, def]) => [cat, Object.keys(def.subcats)])
);

// Sub-subcategories (third level)
export const SUBSUBCATS = Object.fromEntries(
  Object.entries(CAT_TREE).flatMap(([, def]) =>
    Object.entries(def.subcats).filter(([,v])=>v.length).map(([sub,vals])=>[sub,vals])
  )
);
