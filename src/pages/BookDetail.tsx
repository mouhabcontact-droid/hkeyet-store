import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShoppingCart, Heart, Star, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { BookCard } from '../components/BookCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';
import SEO from '../components/SEO';
import { generateBookSEO, generateStructuredData } from '../utils/seo';

interface BookDetailProps {
  slug: string;
}

export function BookDetail({ slug }: BookDetailProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [book, setBook] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookData();
    if (user) {
      trackView();
    }
  }, [slug, user]);

  const trackView = async () => {
    if (!user) return;

    try {
      const { data: bookData } = await supabase
        .from('books')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (bookData) {
        await supabase
          .from('user_activity')
          .insert([{ user_id: user.id, book_id: bookData.id, activity_type: 'view' }]);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchBookData = async () => {
    setLoading(true);
    try {
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*, categories(*), book_authors(authors(*))')
        .eq('slug', slug)
        .maybeSingle();

      if (bookError) throw bookError;
      if (!bookData) {
        navigate('/books');
        return;
      }

      setBook(bookData);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('book_id', bookData.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      const { data: recommendedData } = await supabase
        .from('books')
        .select('*, book_authors(authors(*))')
        .eq('category_id', bookData.category_id)
        .neq('id', bookData.id)
        .limit(4);

      setRecommended(recommendedData || []);
    } catch (error) {
      console.error('Error fetching book:', error);
      showToast('Failed to load book details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .maybeSingle();

      const newQuantity = existing ? existing.quantity + 1 : 1;

      if (newQuantity > book.stock) {
        showToast('Stock insuffisant pour cette quantité', 'error');
        return;
      }

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, book_id: book.id, quantity: 1 }]);
      }

      await supabase
        .from('user_activity')
        .insert([{ user_id: user.id, book_id: book.id, activity_type: 'add_to_cart' }]);

      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Livre ajouté au panier!', 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Échec de l\'ajout au panier', 'error');
    }
  };

  const addToWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await supabase
        .from('wishlists')
        .insert([{ user_id: user.id, book_id: book.id }]);

      await supabase
        .from('user_activity')
        .insert([{ user_id: user.id, book_id: book.id, activity_type: 'wishlist' }]);

      showToast('Added to wishlist!', 'success');
    } catch (error: any) {
      if (error.code === '23505') {
        showToast('Already in wishlist', 'info');
      } else {
        showToast('Failed to add to wishlist', 'error');
      }
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    try {
      await supabase
        .from('reviews')
        .insert([{
          book_id: book.id,
          user_id: user.id,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
        }]);

      showToast('Review submitted successfully!', 'success');
      setNewReview({ rating: 5, title: '', comment: '' });
      fetchBookData();
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
      </div>
    );
  }

  if (!book) return null;

  const seo = generateBookSEO(book);
  const structuredData = generateStructuredData('book', book);

  return (
    <div className="min-h-screen bg-white">
      <SEO {...seo} structuredData={structuredData} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/books')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#F05A28] transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Books
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="relative">
            <div className="sticky top-8">
              <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden shadow-2xl">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Cover
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              {book.categories && (
                <span className="inline-block px-3 py-1 bg-[#F05A28]/10 text-[#F05A28] text-sm font-medium rounded-full">
                  {book.categories.name}
                </span>
              )}
            </div>

            <h1 className="font-serif text-5xl font-bold text-gray-900 mb-4">
              {book.title}
            </h1>

            {book.book_authors && book.book_authors.length > 0 && (
              <p className="text-xl text-gray-600 mb-6">
                by {book.book_authors.map((ba: any) => ba.authors.name).join(', ')}
              </p>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(book.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {book.rating.toFixed(1)} ({book.total_reviews} reviews)
              </span>
            </div>

            <div className="text-4xl font-bold text-[#F05A28] mb-8">
              {book.price.toFixed(2)} TND
            </div>

            <div className="flex gap-4 mb-8">
              <Button
                variant="primary"
                size="lg"
                onClick={addToCart}
                className="flex-1 flex items-center justify-center gap-2"
                disabled={book.stock === 0}
              >
                <ShoppingCart className="w-5 h-5" />
                {book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={addToWishlist}
                className="flex items-center gap-2"
              >
                <Heart className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {book.stock > 0 && book.stock < 10 && (
              <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 font-medium">
                  Only {book.stock} left in stock!
                </p>
              </div>
            )}

            <div className="border-t pt-8 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">About this book</h3>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Publisher:</span>
                  <span className="ml-2 font-medium">{book.publisher}</span>
                </div>
                {book.pages && (
                  <div>
                    <span className="text-gray-500">Pages:</span>
                    <span className="ml-2 font-medium">{book.pages}</span>
                  </div>
                )}
                {book.isbn && (
                  <div>
                    <span className="text-gray-500">ISBN:</span>
                    <span className="ml-2 font-medium">{book.isbn}</span>
                  </div>
                )}
                {book.release_date && (
                  <div>
                    <span className="text-gray-500">Release Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(book.release_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="font-serif text-3xl font-bold mb-8">Customer Reviews</h2>

          {user && (
            <form onSubmit={submitReview} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Write a Review</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= newReview.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
                  required
                />
              </div>

              <Button type="submit" variant="primary" disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          )}

          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <h4 className="font-semibold">{review.title}</h4>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{review.comment}</p>
                <p className="text-sm text-gray-500">
                  by {review.profiles?.full_name || 'Anonymous'}
                </p>
              </div>
            ))}

            {reviews.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No reviews yet. Be the first to review this book!
              </p>
            )}
          </div>
        </div>

        {recommended.length > 0 && (
          <div>
            <h2 className="font-serif text-3xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommended.map((recBook) => (
                <BookCard
                  key={recBook.id}
                  book={recBook}
                  authors={recBook.book_authors?.map((ba: any) => ba.authors) || []}
                  onAddToCart={() => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    supabase.from('cart_items').insert([{ user_id: user.id, book_id: recBook.id, quantity: 1 }]);
                    showToast('Added to cart!', 'success');
                  }}
                  onAddToWishlist={() => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    supabase.from('wishlists').insert([{ user_id: user.id, book_id: recBook.id }]);
                    showToast('Added to wishlist!', 'success');
                  }}
                  onClick={() => navigate(`/books/${recBook.slug}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
