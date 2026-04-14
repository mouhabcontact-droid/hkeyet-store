import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { BookCard } from './BookCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';
import { getRecommendedBooks } from '../utils/recommendations';

export function RecommendedBooks() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const recommended = await getRecommendedBooks(user.id, 8);
      setBooks(recommended);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
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
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, book_id: bookId, quantity: 1 }]);
      }

      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Book added to cart!', 'success');
    } catch (error) {
      showToast('Failed to add to cart', 'error');
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

      showToast('Added to wishlist!', 'success');
    } catch (error: any) {
      if (error.code === '23505') {
        showToast('Already in wishlist', 'info');
      } else {
        showToast('Failed to add to wishlist', 'error');
      }
    }
  };

  if (!user || loading || books.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-[#F05A28]/5 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F05A28]/10 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-[#F05A28]" />
            <span className="text-sm font-medium text-[#F05A28]">Personalized for You</span>
          </div>
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-2">
            Recommended for You
          </h2>
          <p className="text-gray-600">Based on your reading preferences and activity</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
      </div>
    </section>
  );
}
