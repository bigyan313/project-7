import { Product } from '../types';

const STORES = [
  'prada.com',
  'gucci.com',
  'louisvuitton.com',
  'nordstrom.com',
  'macys.com',
  'asos.com',
  'zara.com',
  'hm.com',
  'target.com',
  'uniqlo.com',
  'forever21.com',
  'fashionnova.com',
  'shein.com'
];

async function getUnsplashImage(query: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=portrait&per_page=5`,
      {
        headers: {
          'Authorization': `Client-ID ${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch from Unsplash');

    const data = await response.json();
    if (data.results?.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
      return data.results[randomIndex].urls.regular;
    }

    throw new Error('No images found');
  } catch (error) {
    console.error('Unsplash API error:', error);
    return `https://source.unsplash.com/400x600/?${encodeURIComponent(query)}`;
  }
}

async function searchForCategory(category: string, description: string): Promise<Product[]> {
  try {
    const siteRestriction = `(${STORES.map(site => `site:${site}`).join(' OR ')})`;
    const searchQuery = `${description} ${category} clothing ${siteRestriction}`;

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', import.meta.env.VITE_GOOGLE_API_KEY);
    url.searchParams.append('cx', import.meta.env.VITE_GOOGLE_CSE_ID);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('num', '3');
    url.searchParams.append('gl', 'us');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch search results');

    const data = await response.json();
    if (!data.items) return [];

    return Promise.all(data.items.map(async (item: any) => {
      const storeMatch = item.link.match(/(?:www\.)?([\w-]+)\.com/);
      const storeDomain = storeMatch ? storeMatch[1].toLowerCase() : '';

      const storeNames: Record<string, string> = {
        prada: 'PRADA',
        gucci: 'GUCCI',
        louisvuitton: 'LOUIS VUITTON',
        nordstrom: 'Nordstrom',
        macys: 'Macy\'s',
        asos: 'ASOS',
        zara: 'ZARA',
        hm: 'H&M',
        target: 'Target',
        uniqlo: 'UNIQLO',
        forever21: 'Forever 21',
        fashionnova: 'Fashion Nova',
        shein: 'SHEIN'
      };

      const store = storeNames[storeDomain] || storeDomain.toUpperCase();

      const priceMatch = 
        item.pagemap?.offer?.[0]?.price ||
        item.pagemap?.product?.[0]?.price ||
        item.title.match(/\$\d+(?:\.\d{2})?/) ||
        item.snippet.match(/\$\d+(?:\.\d{2})?/);

      const price = typeof priceMatch === 'string' 
        ? priceMatch 
        : priceMatch 
        ? `$${priceMatch}` 
        : '$29.99';

      const image = 
        item.pagemap?.cse_image?.[0]?.src ||
        item.pagemap?.cse_thumbnail?.[0]?.src ||
        await getUnsplashImage(`${category} ${description} fashion`);

      return {
        id: Math.random().toString(36).substring(2, 9),
        title: item.title.split(/[|\-]/)[0].trim(),
        link: item.link,
        image,
        price,
        store,
        category,
        description: item.snippet
      };
    }));
  } catch (error) {
    console.error(`Error searching for ${category}:`, error);
    return [];
  }
}

export async function searchProducts(outfit: any): Promise<Product[]> {
  if (!outfit?.description) {
    console.error('Invalid outfit data:', outfit);
    return [];
  }

  const products: Product[] = [];

  // Search for top
  if (outfit.description.top) {
    const tops = await searchForCategory('top', outfit.description.top);
    products.push(...tops);
  }

  // Search for outer layer if present
  if (outfit.description.outer) {
    const outers = await searchForCategory('outerwear', outfit.description.outer);
    products.push(...outers);
  }

  // Search for bottom
  if (outfit.description.bottom) {
    const bottoms = await searchForCategory('bottom', outfit.description.bottom);
    products.push(...bottoms);
  }

  // Search for shoes
  if (outfit.description.shoes) {
    const shoes = await searchForCategory('shoes', outfit.description.shoes);
    products.push(...shoes);
  }

  // Search for accessories
  if (Array.isArray(outfit.description.accessories)) {
    for (const accessory of outfit.description.accessories) {
      const accessoryItems = await searchForCategory('accessories', accessory);
      products.push(...accessoryItems.slice(0, 1));
    }
  }

  return products.filter(product => product.image && product.link);
}