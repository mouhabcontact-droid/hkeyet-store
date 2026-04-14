import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Loader, User, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/currency';

interface Book {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  price: number;
  stock: number;
  description: string;
  publisher: string;
  category_name: string;
  author_names: string;
  relevance_score: number;
}

interface Ebook {
  id: string;
  title: string;
  cover_image_url: string;
  price: number;
  format: string;
  description: string;
  author_name: string;
}

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const debounce = setTimeout(() => {
        searchBooks();
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setBooks([]);
      setEbooks([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const searchBooks = async () => {
    setLoading(true);
    try {
      const [booksResult, ebooksResult] = await Promise.all([
        supabase.rpc('search_books', { search_query: searchQuery.trim() }),
        supabase
          .from('ebooks')
          .select('id, title, cover_image_url, price, format, description, author_name')
          .or(`title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%,author_name.ilike.%${searchQuery.trim()}%`)
          .limit(5)
      ]);

      if (booksResult.data) {
        setBooks(booksResult.data);
      }

      if (ebooksResult.data) {
        setEbooks(ebooksResult.data);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (slug: string) => {
    window.location.href = `/books/${slug}`;
    onClose();
    setSearchQuery('');
  };

  const handleEbookClick = (id: string) => {
    window.location.href = `/ebooks`;
    onClose();
    setSearchQuery('');
  };

  const totalResults = books.length + ebooks.length;

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl rounded-lg border border-gray-200 max-w-4xl mx-auto z-50 animate-slideDown"
      style={{
        maxHeight: 'calc(100vh - 120px)',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div className="flex flex-col">
        {/* Search Input */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'fr'
                  ? 'Rechercher par titre, auteur, genre ou description...'
                  : language === 'ar'
                  ? 'ابحث بالعنوان أو المؤلف أو النوع أو الوصف...'
                  : 'Search by title, author, genre, or description...'
              }
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setBooks([]);
                  setEbooks([]);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {language === 'fr' ? 'Titre' : language === 'ar' ? 'العنوان' : 'Title'}
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3" />
              {language === 'fr' ? 'Auteur' : language === 'ar' ? 'المؤلف' : 'Author'}
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {language === 'fr' ? 'Genre' : language === 'ar' ? 'النوع' : 'Genre'}
            </span>
          </p>
        </div>

        {/* Results */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-[#F05A28] animate-spin" />
            </div>
          )}

          {!loading && searchQuery.trim().length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {language === 'fr'
                  ? 'Commencez à taper pour rechercher'
                  : language === 'ar'
                  ? 'ابدأ الكتابة للبحث'
                  : 'Start typing to search'}
              </p>
            </div>
          )}

          {!loading && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-gray-400 text-sm">
                {language === 'fr'
                  ? 'Tapez au moins 2 caractères'
                  : language === 'ar'
                  ? 'اكتب حرفين على الأقل'
                  : 'Type at least 2 characters'}
              </p>
            </div>
          )}

          {!loading && searchQuery.trim().length >= 2 && totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {language === 'fr'
                  ? 'Aucun résultat trouvé'
                  : language === 'ar'
                  ? 'لم يتم العثور على نتائج'
                  : 'No results found'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {language === 'fr'
                  ? 'Essayez une recherche différente'
                  : language === 'ar'
                  ? 'جرب بحثًا مختلفًا'
                  : 'Try a different search'}
              </p>
            </div>
          )}

          {!loading && books.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {language === 'fr' ? 'Livres physiques' : language === 'ar' ? 'الكتب المادية' : 'Physical Books'} ({books.length})
              </h3>
              <div className="space-y-2">
                {books.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => handleBookClick(book.slug)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group text-left"
                  >
                    <img
                      src={book.cover_url || 'https://via.placeholder.com/150x200?text=No+Cover'}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-[#F05A28] transition-colors line-clamp-1">
                        {book.title}
                      </h4>
                      {book.author_names && (
                        <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {book.author_names}
                        </p>
                      )}
                      {book.category_name && (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {book.category_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-sm font-bold text-[#F05A28]">
                          {formatCurrency(book.price, language)}
                        </p>
                        {book.stock > 0 ? (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                            {language === 'fr' ? 'En stock' : language === 'ar' ? 'متوفر' : 'In Stock'}
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">
                            {language === 'fr' ? 'Rupture' : language === 'ar' ? 'نفذ' : 'Out of Stock'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && ebooks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {language === 'fr' ? 'Livres électroniques' : language === 'ar' ? 'الكتب الإلكترونية' : 'eBooks'} ({ebooks.length})
              </h3>
              <div className="space-y-2">
                {ebooks.map((ebook) => (
                  <button
                    key={ebook.id}
                    onClick={() => handleEbookClick(ebook.id)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group text-left"
                  >
                    <img
                      src={ebook.cover_image_url || 'https://via.placeholder.com/150x200?text=No+Cover'}
                      alt={ebook.title}
                      className="w-12 h-16 object-cover rounded shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-[#F05A28] transition-colors line-clamp-1">
                        {ebook.title}
                      </h4>
                      {ebook.author_name && (
                        <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ebook.author_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-sm font-bold text-[#F05A28]">
                          {formatCurrency(ebook.price, language)}
                        </p>
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                          {ebook.format}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!loading && totalResults > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600 text-center">
              {language === 'fr'
                ? `${totalResults} résultat${totalResults > 1 ? 's' : ''} trouvé${totalResults > 1 ? 's' : ''}`
                : language === 'ar'
                ? `تم العثور على ${totalResults} نتيجة`
                : `${totalResults} result${totalResults > 1 ? 's' : ''} found`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
