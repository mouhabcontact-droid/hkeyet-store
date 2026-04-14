import React, { useEffect, useState } from 'react';
import { Package, Heart, User, LogOut, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { BookCard } from '../components/BookCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';

export function Dashboard() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [ordersData, wishlistData] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            order_items(
              *,
              books(*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wishlists')
          .select(`
            *,
            books(
              *,
              book_authors(authors(*))
            )
          `)
          .eq('user_id', user.id)
      ]);

      setOrders(ordersData.data || []);
      setWishlist(wishlistData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      showToast('Failed to sign out', 'error');
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      await supabase.from('wishlists').delete().eq('id', itemId);
      showToast('Removed from wishlist', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to remove from wishlist', 'error');
    }
  };

  const addToCart = async (bookId: string) => {
    try {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user!.id)
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
          .insert([{ user_id: user!.id, book_id: bookId, quantity: 1 }]);
      }

      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Added to cart!', 'success');
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Welcome back, {profile?.full_name || user.email}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-[#F05A28] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">Orders</span>
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'wishlist'
                      ? 'bg-[#F05A28] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">Wishlist</span>
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-[#F05A28] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </button>

                <button
                  onClick={() => navigate('/submit-manuscript')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Submit Manuscript</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Order History</h2>

                {orders.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                    <Button variant="primary" onClick={() => navigate('/books')}>
                      Browse Books
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                          <div>
                            <p className="font-mono text-sm text-gray-600 mb-1">
                              Order #{order.order_number}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#F05A28]">
                              {order.total_amount.toFixed(2)} TND
                            </p>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex gap-4">
                              <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                {item.books?.cover_url ? (
                                  <img
                                    src={item.books.cover_url}
                                    alt={item.books.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    No Cover
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.books?.title}</h4>
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                <p className="text-sm font-bold text-[#F05A28]">
                                  {(item.price * item.quantity).toFixed(2)} TND
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>

                {wishlist.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No saved books yet</h3>
                    <p className="text-gray-600 mb-6">Save your favorite books for later</p>
                    <Button variant="primary" onClick={() => navigate('/books')}>
                      Browse Books
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="relative">
                        <BookCard
                          book={item.books}
                          authors={item.books.book_authors?.map((ba: any) => ba.authors) || []}
                          onAddToCart={() => addToCart(item.books.id)}
                          onClick={() => navigate(`/books/${item.books.slug}`)}
                        />
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

                <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <p className="text-lg text-gray-900">{profile?.full_name || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <p className="text-lg text-gray-900">{user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <p className="text-lg text-gray-900">
                      {new Date(profile?.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {profile?.is_admin && (
                    <div className="mt-6 p-4 bg-[#F05A28]/10 border border-[#F05A28] rounded-lg">
                      <p className="text-[#F05A28] font-medium">Admin Account</p>
                      <p className="text-sm text-gray-600 mt-1">
                        You have administrator privileges
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
