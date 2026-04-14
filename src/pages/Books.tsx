import React, { useEffect, useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { navigate } from '../utils/navigation';
import SEO from '../components/SEO';
import { generatePageSEO } from '../utils/seo';

export function Books() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();

    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('category');
    const authorId = urlParams.get('author');

    if (categorySlug) {
      setShowFilters(true);
      supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setSelectedCategory(data.id);
          }
        });
    }

    if (authorId) {
      setSelectedAuthor(authorId);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, selectedAuthor, sortBy, searchQuery]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('books')
        .select('*, book_authors(authors(*))');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedAuthor) {
        const { data: bookIds } = await supabase
          .from('book_authors')
          .select('book_id')
          .eq('author_id', selectedAuthor);

        if (bookIds && bookIds.length > 0) {
          const ids = bookIds.map((ba) => ba.book_id);
          query = query.in('id', ids);
        } else {
          setBooks([]);
          setLoading(false);
          return;
        }
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      switch (sortBy) {
        case 'newest':
          query = query.order('release_date', { ascending: false });
          break;
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'popular':
          query = query.order('total_sales', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (bookId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data: existing, error: selectError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

      if (selectError) {
        console.error('Erreur lors de la vérification du panier:', selectError);
        throw selectError;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Erreur lors de la mise à jour du panier:', updateError);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, book_id: bookId, quantity: 1 }]);

        if (insertError) {
          console.error('Erreur lors de l\'ajout au panier:', insertError);
          throw insertError;
        }
      }

      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Livre ajouté au panier!', 'success');
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      showToast(error?.message || 'Échec de l\'ajout au panier', 'error');
    }
  };

  const addToWishlist = async (bookId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await supabase
        .from('wishlists')
        .insert([{ user_id: user.id, book_id: bookId }]);

      showToast('Ajouté aux favoris!', 'success');
    } catch (error: any) {
      if (error.code === '23505') {
        showToast('Déjà dans les favoris', 'info');
      } else {
        showToast('Échec de l\'ajout aux favoris', 'error');
      }
    }
  };

  const seo = generatePageSEO('books');

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO {...seo} />
      <div className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-5xl font-bold mb-4">Notre Collection</h1>
          <p className="text-xl text-gray-300">Découvrez votre prochaine grande lecture</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="Rechercher des livres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
            />
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filtres
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
            >
              <option value="newest">Plus Récents</option>
              <option value="popular">Plus Populaires</option>
              <option value="price-low">Prix: Bas à Élevé</option>
              <option value="price-high">Prix: Élevé à Bas</option>
              <option value="rating">Mieux Notés</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-4">Filtrer par Catégorie</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
              >
                Tout
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">Aucun livre trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                authors={book.book_authors?.map((ba: any) => ba.authors) || []}
                onAddToCart={() => addToCart(book.id)}
                onAddToWishlist={() => addToWishlist(book.id)}
                onClick={() => navigate(`/books/${book.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
