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
      'Footwear':            ['Sneakers', 'Boots', 'Sandals', 'Dress Shoes', 'Athletic', 'Flats', 'Heels', 'Loafers', 'Slippers'],
      "Men's Accessories":   ['Watches', 'Belts', 'Wallets', 'Hats', 'Ties', 'Sunglasses', 'Bags', 'Cufflinks', 'Scarves', 'Gloves'],
      "Women's Accessories": ['Handbags', 'Jewelry', 'Scarves', 'Belts', 'Hats', 'Sunglasses', 'Watches', 'Hair Accessories', 'Gloves', 'Wallets'],
    }
  },
  Books: {
    subcats: {
      'Fiction':             ['Literary', 'Sci-Fi', 'Fantasy', 'Mystery', 'Thriller', 'Romance', 'Horror', 'Historical'],
      'Non-Fiction':         ['Biography', 'History', 'Science', 'Self-Help', 'Business', 'Travel', 'Cooking', 'Health'],
      'Textbooks':           ['Math', 'Science', 'Engineering', 'Medicine', 'Law', 'Business', 'Humanities', 'Computer Science'],
      'Children':            ['Picture Books', 'Middle Grade', 'Young Adult', 'Board Books', 'Activity Books'],
      'Rare & Collectible':  ['First Editions', 'Signed Copies', 'Antiquarian', 'Limited Editions'],
      'Comics & Graphic Novels': ['Marvel', 'DC', 'Manga', 'Indie', 'Graphic Memoirs', 'Omnibus', 'Trade Paperback'],
      'Art & Photography':   ['Photography', 'Illustration', 'Fine Art', 'Digital Art', 'Architecture', 'Fashion'],
      'Reference':           ['Dictionaries', 'Encyclopedias', 'Guides', 'Atlases', 'Manuals'],
    }
  },
  Electronics: {
    subcats: {
      'Phones & Tablets':    ['iPhone', 'Samsung', 'iPad', 'Android Tablet', 'Google Pixel', 'Cases', 'Chargers', 'Screen Protectors'],
      'Computers':           ['Laptops', 'Desktops', 'Monitors', 'Keyboards', 'Mice', 'Webcams', 'Docking Stations'],
      'Audio':               ['Headphones', 'Earbuds', 'Speakers', 'Turntables', 'Receivers', 'Microphones'],
      'Cameras':             ['DSLR', 'Mirrorless', 'Point & Shoot', 'Film', 'Lenses', 'Tripods', 'Bags'],
      'Gaming':              ['Consoles', 'Controllers', 'Games', 'Headsets', 'Handhelds', 'VR', 'Accessories'],
      'Smart Home':          ['Speakers', 'Lights', 'Thermostats', 'Cameras', 'Plugs', 'Displays'],
      'Accessories':         ['Cables', 'Chargers', 'Batteries', 'Cases', 'Stands', 'Adapters', 'Storage'],
    }
  },
  'Toys & Games': {
    subcats: {
      'Action Figures':      ['Marvel', 'DC', 'Star Wars', 'Anime', 'GI Joe', 'TMNT', 'Transformers', 'Vintage'],
      'Board Games':         ['Strategy', 'Party', 'Family', 'Cooperative', 'Card Games', 'Classic', 'RPG'],
      'Building Sets':       ['LEGO', 'Mega Bloks', 'K\'NEX', 'Magnetic', 'Wooden'],
      'Dolls':               ['Barbie', 'American Girl', 'Bratz', 'Porcelain', 'Fashion', 'Baby Dolls'],
      'Video Games':         ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Retro', 'Handheld'],
      'Outdoor':             ['Bikes', 'Scooters', 'Water Toys', 'Sports', 'Playsets'],
      'Puzzles':             ['Jigsaw', '3D', 'Brain Teasers', 'Wooden', 'Floor'],
      'Collectible Toys':    ['Funko Pop', 'Hot Wheels', 'Trading Cards', 'Beanie Babies', 'Vintage'],
    }
  },
  'Home & Garden': {
    subcats: {
      'Kitchen':             ['Appliances', 'Cookware', 'Bakeware', 'Utensils', 'Storage', 'Drinkware', 'Cutlery'],
      'Decor':               ['Wall Art', 'Candles', 'Vases', 'Frames', 'Mirrors', 'Clocks', 'Figurines'],
      'Furniture':           ['Tables', 'Chairs', 'Shelving', 'Desks', 'Dressers', 'Nightstands', 'Benches'],
      'Bedding':             ['Sheets', 'Comforters', 'Pillows', 'Blankets', 'Duvet Covers', 'Mattress Pads'],
      'Bath':                ['Towels', 'Shower Curtains', 'Mats', 'Accessories', 'Storage', 'Organizers'],
      'Tools':               ['Power Tools', 'Hand Tools', 'Tool Sets', 'Hardware', 'Painting', 'Electrical'],
      'Garden':              ['Planters', 'Tools', 'Decor', 'Lighting', 'Furniture', 'Seeds & Plants'],
    }
  },
  'Sports & Outdoors': {
    subcats: {
      'Fitness':             ['Weights', 'Resistance Bands', 'Yoga', 'Cardio', 'Mats', 'Apparel', 'Trackers'],
      'Cycling':             ['Bikes', 'Helmets', 'Lights', 'Locks', 'Apparel', 'Parts', 'Accessories'],
      'Camping':             ['Tents', 'Sleeping Bags', 'Backpacks', 'Lanterns', 'Stoves', 'Coolers', 'Chairs'],
      'Team Sports':         ['Baseball', 'Basketball', 'Football', 'Soccer', 'Hockey', 'Volleyball'],
      'Water Sports':        ['Kayaking', 'Fishing', 'Surfing', 'Swimming', 'Snorkeling', 'Boating'],
      'Winter Sports':       ['Skiing', 'Snowboarding', 'Ice Skating', 'Sleds', 'Apparel'],
      'Golf':                ['Clubs', 'Bags', 'Balls', 'Apparel', 'Accessories', 'Shoes'],
    }
  },
  Collectibles: {
    subcats: {
      'Trading Cards':       ['Pokémon', 'Magic: The Gathering', 'Yu-Gi-Oh', 'Sports Cards', 'Vintage'],
      'Coins & Currency':    ['US Coins', 'World Coins', 'Paper Money', 'Silver', 'Gold', 'Tokens'],
      'Stamps':              ['US Stamps', 'World Stamps', 'First Day Covers', 'Collections', 'Vintage'],
      'Figurines':           ['Funko Pop', 'Precious Moments', 'Hummel', 'Department 56', 'Anime'],
      'Memorabilia':         ['Sports', 'Music', 'Movie', 'TV', 'Political', 'Military', 'Autographs'],
      'Vintage':             ['Advertising', 'Toys', 'Glassware', 'Pottery', 'Jewelry', 'Signs', 'Maps'],
      'Antiques':            ['Furniture', 'China', 'Silver', 'Art', 'Books', 'Clocks', 'Textiles'],
    }
  },
  'Health & Beauty': {
    subcats: {
      'Skincare':            ['Cleansers', 'Moisturizers', 'Serums', 'Masks', 'Sunscreen', 'Anti-Aging'],
      'Makeup':              ['Foundation', 'Lipstick', 'Eyeshadow', 'Mascara', 'Brushes', 'Palettes'],
      'Hair Care':           ['Shampoo', 'Conditioner', 'Styling', 'Tools', 'Treatments', 'Accessories'],
      'Fragrance':           ['Perfume', 'Cologne', 'Body Spray', 'Sets', 'Travel Size', 'Vintage'],
      'Personal Care':       ['Oral Care', 'Shaving', 'Deodorant', 'Body Wash', 'Lotions'],
    }
  },
  'Crafts & DIY': {
    subcats: {
      'Sewing':              ['Fabric', 'Patterns', 'Notions', 'Machines', 'Thread', 'Accessories'],
      'Art Supplies':        ['Paints', 'Brushes', 'Canvas', 'Paper', 'Pencils', 'Markers', 'Pastels'],
      'Scrapbooking':        ['Paper', 'Stickers', 'Albums', 'Tools', 'Stamps', 'Embellishments'],
      'Knitting & Crochet':  ['Yarn', 'Needles', 'Hooks', 'Patterns', 'Kits', 'Accessories'],
      'Beading & Jewelry':   ['Beads', 'Wire', 'Tools', 'Findings', 'Kits', 'Charms'],
    }
  },
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
