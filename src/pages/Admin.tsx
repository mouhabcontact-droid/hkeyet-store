import React, { useEffect, useState } from 'react';
import { BarChart3, Package, Users, BookOpen, DollarSign, TrendingUp, CreditCard as Edit, Trash2, Check, X, Eye, Tag, Settings, FileText, PenTool, Headphones, CircleUser as UserCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';
import { AddBookModal } from '../components/AddBookModal';
import { EditBookModal } from '../components/EditBookModal';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { AddEbookModal } from '../components/AddEbookModal';
import { AddAuthorModal } from '../components/AddAuthorModal';
import { EditAuthorModal } from '../components/EditAuthorModal';
import { PromoCodeManager } from '../components/PromoCodeManager';
import { formatCurrency } from '../utils/currency';

export function Admin() {
  const { user, profile, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'ebooks' | 'authors' | 'orders' | 'users' | 'promos'>('overview');
  const [dataLoading, setDataLoading] = useState(true);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isAddEbookModalOpen, setIsAddEbookModalOpen] = useState(false);
  const [isAddAuthorModalOpen, setIsAddAuthorModalOpen] = useState(false);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editingAuthor, setEditingAuthor] = useState<any>(null);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [isEditAuthorModalOpen, setIsEditAuthorModalOpen] = useState(false);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalBooks: 0,
    totalUsers: 0,
    totalEbooks: 0,
    totalAuthors: 0,
  });

  const [books, setBooks] = useState<any[]>([]);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (profile?.is_admin === false) {
      navigate('/');
      showToast('Access denied. Admin only.', 'error');
      return;
    }

    if (profile?.is_admin === true) {
      fetchData();
    }
  }, [user, profile, authLoading]);

  const fetchData = async () => {
    try {
      const [ordersData, booksData, ebooksData, authorsData, usersData] = await Promise.all([
        supabase.from('orders').select('*, order_items(*, books(*))').order('created_at', { ascending: false }),
        supabase.from('books').select('*, categories(*), book_authors(authors(*))').order('created_at', { ascending: false }),
        supabase.from('ebooks').select('*, categories(*)').order('created_at', { ascending: false }),
        supabase.from('authors').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ]);

      setOrders(ordersData.data || []);
      setBooks(booksData.data || []);
      setEbooks(ebooksData.data || []);
      setAuthors(authorsData.data || []);
      setUsers(usersData.data || []);

      const totalRevenue = (ordersData.data || []).reduce((sum: number, order: any) =>
        order.status === 'delivered' ? sum + parseFloat(order.total_amount) : sum, 0
      );

      setStats({
        totalRevenue,
        totalOrders: ordersData.data?.length || 0,
        totalBooks: booksData.data?.length || 0,
        totalUsers: usersData.data?.length || 0,
        totalEbooks: ebooksData.data?.length || 0,
        totalAuthors: authorsData.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load admin data', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      showToast('Order status updated', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to update order', 'error');
    }
  };

  const deleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;
      showToast('Book deleted', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to delete book', 'error');
    }
  };

  const deleteEbook = async (ebookId: string) => {
    if (!confirm('Are you sure you want to delete this eBook?')) return;

    try {
      const { error } = await supabase
        .from('ebooks')
        .delete()
        .eq('id', ebookId);

      if (error) throw error;
      showToast('eBook deleted', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to delete eBook', 'error');
    }
  };

  const deleteAuthor = async (authorId: string) => {
    if (!confirm('Are you sure you want to delete this author? This will remove the author from all books.')) return;

    try {
      const { error } = await supabase
        .from('authors')
        .delete()
        .eq('id', authorId);

      if (error) throw error;
      showToast('Author deleted', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to delete author', 'error');
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'book_club' | 'admin', userEmail: string) => {
    if (userEmail === 'mouhab.contact@gmail.com' && newRole !== 'admin') {
      showToast('Cannot change role of master admin', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      showToast('User role updated successfully', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Failed to update user role', 'error');
    }
  };

  if (authLoading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
      </div>
    );
  }

  if (!user || !profile?.is_admin) return null;

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your bookstore</p>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#F05A28] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-5 h-5 inline-block mr-2" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'books'
                ? 'bg-[#F05A28] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-5 h-5 inline-block mr-2" />
            Books ({books.length})
          </button>

          <button
            onClick={() => setActiveTab('ebooks')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'ebooks'
                ? 'bg-[#F05A28] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-5 h-5 inline-block mr-2" />
            eBooks ({ebooks.length})
          </button>

          <button
            onClick={() => setActiveTab('authors')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'authors'
                ? 'bg-[#F05A28] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserCircle className="w-5 h-5 inline-block mr-2" />
            Authors ({authors.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#F05A28] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5 inline-block mr-2" />
            Orders ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'bg-[#F05A28] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5 inline-block mr-2" />
            Users ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'promos'
                ? 'bg-[#F05A28] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Tag className="w-5 h-5 inline-block mr-2" />
            Promo Codes
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            className="px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors bg-white text-gray-700 hover:bg-gray-100"
          >
            <Settings className="w-5 h-5 inline-block mr-2" />
            Site Settings
          </button>

          <button
            onClick={() => navigate('/admin/manuscripts')}
            className="px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors bg-white text-gray-700 hover:bg-gray-100"
          >
            <FileText className="w-5 h-5 inline-block mr-2" />
            Manuscripts
          </button>

          <button
            onClick={() => navigate('/admin/blog')}
            className="px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors bg-white text-gray-700 hover:bg-gray-100"
          >
            <PenTool className="w-5 h-5 inline-block mr-2" />
            Blog
          </button>

          <button
            onClick={() => navigate('/admin/audiobooks')}
            className="px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors bg-white text-gray-700 hover:bg-gray-100"
          >
            <Headphones className="w-5 h-5 inline-block mr-2" />
            Audiobooks
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue, 'fr')}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <Package className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Orders</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <BookOpen className="w-8 h-8 text-[#F05A28] mb-2" />
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Books</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total eBooks</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEbooks}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <Users className="w-8 h-8 text-emerald-600 mb-2" />
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.shipping_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#F05A28]">{formatCurrency(order.total_amount, 'fr')}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">All Books</h2>
              <Button variant="primary" onClick={() => setIsAddBookModalOpen(true)}>
                Add New Book
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {book.cover_url ? (
                              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Cover</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{book.title}</p>
                            <p className="text-sm text-gray-500">
                              {book.book_authors?.[0]?.authors?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{book.categories?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(book.price, 'fr')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{book.stock}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{book.total_sales}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/books/${book.slug}`)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingBook(book);
                              setIsEditBookModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBook(book.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ebooks' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">All eBooks</h2>
              <Button variant="primary" onClick={() => setIsAddEbookModalOpen(true)}>
                Add New eBook
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">eBook</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ebooks.map((ebook) => (
                    <tr key={ebook.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {ebook.cover_image_url ? (
                              <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Cover</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{ebook.title}</p>
                            <p className="text-sm text-gray-500">{ebook.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{ebook.categories?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          ebook.format === 'EPUB' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ebook.format}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(ebook.price, 'fr')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{ebook.rating?.toFixed(1) || '0.0'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteEbook(ebook.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'authors' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">All Authors</h2>
              <Button variant="primary" onClick={() => setIsAddAuthorModalOpen(true)}>
                Add New Author
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biography</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {authors.map((author) => (
                    <tr key={author.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                            {author.photo_url ? (
                              <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <UserCircle className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{author.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {author.bio || 'No biography'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{author.slug}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingAuthor(author);
                              setIsEditAuthorModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAuthor(author.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">All Orders</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.shipping_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#F05A28]">
                        {formatCurrency(order.total_amount, 'fr')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'pending' ? 'En attente' :
                           order.status === 'processing' ? 'En traitement' :
                           order.status === 'shipped' ? 'Expédié' :
                           order.status === 'delivered' ? 'Livré' :
                           'Annulé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderDetailsModalOpen(true);
                          }}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">All Users</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.full_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                          user.role === 'admin'
                            ? 'bg-[#F05A28] text-white'
                            : user.role === 'book_club'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'book_club' ? 'Book Club' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => updateUserRole(user.id, e.target.value as 'user' | 'book_club' | 'admin', user.email)}
                          disabled={user.email === 'mouhab.contact@gmail.com'}
                          className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#F05A28] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="user">User</option>
                          <option value="book_club">Book Club</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'promos' && (
          <PromoCodeManager />
        )}
      </div>

      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        onSuccess={fetchData}
      />

      <AddEbookModal
        isOpen={isAddEbookModalOpen}
        onClose={() => setIsAddEbookModalOpen(false)}
        onSuccess={fetchData}
      />

      <EditBookModal
        isOpen={isEditBookModalOpen}
        onClose={() => {
          setIsEditBookModalOpen(false);
          setEditingBook(null);
        }}
        onSuccess={fetchData}
        book={editingBook}
      />

      <OrderDetailsModal
        isOpen={isOrderDetailsModalOpen}
        onClose={() => {
          setIsOrderDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdate={fetchData}
      />

      <AddAuthorModal
        isOpen={isAddAuthorModalOpen}
        onClose={() => setIsAddAuthorModalOpen(false)}
        onSuccess={fetchData}
      />

      <EditAuthorModal
        isOpen={isEditAuthorModalOpen}
        onClose={() => {
          setIsEditAuthorModalOpen(false);
          setEditingAuthor(null);
        }}
        onSuccess={fetchData}
        author={editingAuthor}
      />
    </div>
  );
}
