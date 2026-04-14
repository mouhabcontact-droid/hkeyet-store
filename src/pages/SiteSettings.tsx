import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Upload, X, Plus, GripVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toast } from '../components/Toast';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  price: number;
}

interface FeaturedBook {
  id: string;
  book_id: string;
  position: number;
  book?: Book;
}

export function SiteSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [settingsRes, featuredRes, booksRes] = await Promise.all([
        supabase
          .from('site_settings')
          .select('*')
          .order('key'),
        supabase
          .from('featured_books')
          .select(`
            id,
            book_id,
            position,
            books:book_id (
              id,
              title,
              cover_url,
              price,
              book_authors(
                authors(name)
              )
            )
          `)
          .order('position'),
        supabase
          .from('books')
          .select(`
            id,
            title,
            cover_url,
            price,
            book_authors!inner(
              authors(name)
            )
          `)
          .order('title')
      ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }

      if (featuredRes.data) {
        setFeaturedBooks(featuredRes.data.map((fb: any) => {
          const book = Array.isArray(fb.books) ? fb.books[0] : fb.books;
          if (book) {
            const authorName = book.book_authors?.[0]?.authors?.name || 'Unknown Author';
            return {
              ...fb,
              book: {
                id: book.id,
                title: book.title,
                author: authorName,
                coverUrl: book.cover_url,
                price: book.price
              }
            };
          }
          return fb;
        }));
      }

      console.log('Books query result:', booksRes);
      if (booksRes.error) {
        console.error('Error loading books:', booksRes.error);
      }

      if (booksRes.data) {
        console.log('Books loaded:', booksRes.data.length, booksRes.data);
        setAllBooks(booksRes.data.map((b: any) => {
          const authorName = b.book_authors?.[0]?.authors?.name || 'Unknown Author';
          return {
            id: b.id,
            title: b.title,
            author: authorName,
            coverUrl: b.cover_url,
            price: b.price
          };
        }));
      } else {
        console.log('No books data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    try {
      setSaving(true);

      for (const setting of settings) {
        await supabase
          .from('site_settings')
          .update({
            value: setting.value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })
          .eq('key', setting.key);
      }

      setToast({ message: 'Settings saved successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFeaturedBook() {
    if (!selectedBookId) return;

    try {
      const maxPosition = featuredBooks.length > 0
        ? Math.max(...featuredBooks.map(fb => fb.position))
        : 0;

      const { error } = await supabase
        .from('featured_books')
        .insert({
          book_id: selectedBookId,
          position: maxPosition + 1
        });

      if (error) throw error;

      setToast({ message: 'Book added to featured section', type: 'success' });
      setShowAddBook(false);
      setSelectedBookId('');
      loadData();
    } catch (error: any) {
      console.error('Error adding featured book:', error);
      if (error.code === '23505') {
        setToast({ message: 'This book is already featured', type: 'error' });
      } else {
        setToast({ message: 'Failed to add book', type: 'error' });
      }
    }
  }

  async function handleRemoveFeaturedBook(id: string) {
    try {
      const { error } = await supabase
        .from('featured_books')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setToast({ message: 'Book removed from featured section', type: 'success' });
      loadData();
    } catch (error) {
      console.error('Error removing featured book:', error);
      setToast({ message: 'Failed to remove book', type: 'error' });
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>, settingKey: string) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `hero-images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('book-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      updateSetting(settingKey, publicUrl);
      setToast({ message: 'Image uploaded successfully', type: 'success' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setToast({ message: 'Failed to upload image', type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleReorderFeaturedBook(id: string, direction: 'up' | 'down') {
    const currentIndex = featuredBooks.findIndex(fb => fb.id === id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === featuredBooks.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reordered = [...featuredBooks];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    try {
      for (let i = 0; i < reordered.length; i++) {
        await supabase
          .from('featured_books')
          .update({ position: i + 1 })
          .eq('id', reordered[i].id);
      }

      setFeaturedBooks(reordered);
    } catch (error) {
      console.error('Error reordering books:', error);
      setToast({ message: 'Failed to reorder books', type: 'error' });
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev =>
      prev.map(s => s.key === key ? { ...s, value } : s)
    );
  }

  function getSetting(key: string): string {
    return settings.find(s => s.key === key)?.value || '';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Site Settings</h1>
        <p className="text-gray-600">Manage your website's appearance and configuration</p>
      </div>

      {/* Hero Section Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Hero Section</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hero Title
            </label>
            <Input
              value={getSetting('hero_title')}
              onChange={(e) => updateSetting('hero_title', e.target.value)}
              placeholder="Main hero title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hero Subtitle
            </label>
            <Input
              value={getSetting('hero_subtitle')}
              onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
              placeholder="Hero subtitle text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Background Images
            </label>
            <div className="space-y-3">
              {[1, 2, 3].map(num => (
                <div key={num} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        value={getSetting(`hero_image_${num}`)}
                        onChange={(e) => updateSetting(`hero_image_${num}`, e.target.value)}
                        placeholder={`Image ${num} URL`}
                      />
                    </div>
                    {getSetting(`hero_image_${num}`) && (
                      <img
                        src={getSetting(`hero_image_${num}`)}
                        alt={`Hero ${num}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, `hero_image_${num}`)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Upload images or paste Unsplash URLs
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Price */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Delivery Settings</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standard Delivery Price (TND)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={getSetting('delivery_price')}
            onChange={(e) => updateSetting('delivery_price', e.target.value)}
            placeholder="5.99"
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Visibility Settings</h2>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={getSetting('show_ebooks_section') === 'true'}
              onChange={(e) => updateSetting('show_ebooks_section', e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Show Ebooks Section</span>
              <p className="text-sm text-gray-600">Display ebooks link in navigation and ebooks content</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={getSetting('show_visa_logo') === 'true'}
              onChange={(e) => updateSetting('show_visa_logo', e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Show Visa Payment Logo</span>
              <p className="text-sm text-gray-600">Display Visa logo in payment methods section</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={getSetting('show_paypal_logo') === 'true'}
              onChange={(e) => updateSetting('show_paypal_logo', e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Show PayPal Payment Logo</span>
              <p className="text-sm text-gray-600">Display PayPal logo in payment methods section</p>
            </div>
          </label>
        </div>
      </div>

      {/* Featured Books */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Featured Books</h2>
          <Button
            onClick={() => setShowAddBook(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </Button>
        </div>

        {featuredBooks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No featured books yet</p>
        ) : (
          <div className="space-y-3">
            {featuredBooks.map((fb, index) => (
              <div
                key={fb.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleReorderFeaturedBook(fb.id, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReorderFeaturedBook(fb.id, 'down')}
                    disabled={index === featuredBooks.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                </div>

                <img
                  src={fb.book?.coverUrl}
                  alt={fb.book?.title}
                  className="w-16 h-20 object-cover rounded"
                />

                <div className="flex-1">
                  <h3 className="font-semibold">{fb.book?.title}</h3>
                  <p className="text-sm text-gray-600">{fb.book?.author}</p>
                  <p className="text-sm font-medium text-green-600">
                    {fb.book?.price.toFixed(2)} TND
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveFeaturedBook(fb.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Add Featured Book</h3>
              <button
                onClick={() => {
                  setShowAddBook(false);
                  setSelectedBookId('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              {loading ? (
                <p className="text-center text-gray-500 py-8">Loading books...</p>
              ) : allBooks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No books available. Please add books first.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    {allBooks.filter(book => !featuredBooks.some(fb => fb.book_id === book.id)).length} books available
                  </p>
                  <div className="grid gap-3">
                    {allBooks
                      .filter(book => !featuredBooks.some(fb => fb.book_id === book.id))
                      .map(book => (
                      <button
                        key={book.id}
                        onClick={() => setSelectedBookId(book.id)}
                        className={`flex items-center gap-4 p-3 border rounded-lg text-left transition-colors ${
                          selectedBookId === book.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{book.title}</h4>
                          <p className="text-sm text-gray-600">{book.author}</p>
                          <p className="text-sm font-medium text-green-600">
                            {book.price.toFixed(2)} TND
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                onClick={() => {
                  setShowAddBook(false);
                  setSelectedBookId('');
                }}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFeaturedBook}
                disabled={!selectedBookId}
              >
                Add Book
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
