import React, { useEffect, useState } from 'react';
import { Star, BookOpen, Download, Eye, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../components/Toast';
import SEO from '../components/SEO';
import { generatePageSEO } from '../utils/seo';

export function Ebooks() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price'>('newest');
  const [loading, setLoading] = useState(true);
  const [userLibrary, setUserLibrary] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [selectedCategory, sortBy, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ebooks')
        .select('*, categories(name)')
        .order(
          sortBy === 'newest' ? 'created_at' :
          sortBy === 'popular' ? 'views' :
          'price',
          { ascending: sortBy === 'price' }
        );

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data: ebooksData } = await query;
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setEbooks(ebooksData || []);
      setCategories(categoriesData || []);

      if (user) {
        const { data: libraryData } = await supabase
          .from('user_library')
          .select('ebook_id')
          .eq('user_id', user.id);

        if (libraryData) {
          setUserLibrary(new Set(libraryData.map(item => item.ebook_id)));
        }
      }
    } catch (error) {
      console.error('Error fetching ebooks:', error);
      showToast('Failed to load eBooks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredEbooks = ebooks.filter(ebook =>
    ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ebook.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredEbooks = ebooks.filter(ebook => ebook.rating >= 4).slice(0, 6);
  const newEbooks = ebooks.slice(0, 8);

  const handleBuyEbook = async (ebookId: string, price: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (userLibrary.has(ebookId)) {
      navigate(`/reader/${ebookId}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_library')
        .insert([{
          user_id: user.id,
          ebook_id: ebookId,
          purchase_date: new Date().toISOString(),
          reading_progress: 0,
          current_page: 1,
        }]);

      if (error) throw error;

      showToast('eBook purchased successfully!', 'success');
      setUserLibrary(new Set([...userLibrary, ebookId]));
    } catch (error) {
      console.error('Error purchasing ebook:', error);
      showToast('Failed to purchase eBook', 'error');
    }
  };

  const handlePreview = (ebookId: string) => {
    navigate(`/reader/${ebookId}?preview=true`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
      </div>
    );
  }

  const seo = generatePageSEO('ebooks');

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO {...seo} />
      <div className="bg-gradient-to-r from-[#F05A28] to-black text-white py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" />
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Digital Library
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto px-4">
            Discover thousands of eBooks. Read anywhere, anytime on any device.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <section className="mb-8 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Featured eBooks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {featuredEbooks.map((ebook) => (
              <EbookCard
                key={ebook.id}
                ebook={ebook}
                owned={userLibrary.has(ebook.id)}
                onBuy={() => handleBuyEbook(ebook.id, ebook.price)}
                onPreview={() => handlePreview(ebook.id)}
              />
            ))}
          </div>
        </section>

        <section className="mb-8 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">New Releases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {newEbooks.map((ebook) => (
              <EbookCard
                key={ebook.id}
                ebook={ebook}
                owned={userLibrary.has(ebook.id)}
                onBuy={() => handleBuyEbook(ebook.id, ebook.price)}
                onPreview={() => handlePreview(ebook.id)}
              />
            ))}
          </div>
        </section>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search eBooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28] text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-4 w-full">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-2 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28] text-sm sm:text-base"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-2 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-[#F05A28] text-sm sm:text-base"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>
        </div>

        <section>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            All eBooks {searchQuery && `(${filteredEbooks.length})`}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {filteredEbooks.map((ebook) => (
              <EbookCard
                key={ebook.id}
                ebook={ebook}
                owned={userLibrary.has(ebook.id)}
                onBuy={() => handleBuyEbook(ebook.id, ebook.price)}
                onPreview={() => handlePreview(ebook.id)}
              />
            ))}
          </div>

          {filteredEbooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No eBooks found</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface EbookCardProps {
  ebook: any;
  owned: boolean;
  onBuy: () => void;
  onPreview: () => void;
}

function EbookCard({ ebook, owned, onBuy, onPreview }: EbookCardProps) {
  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
        {ebook.cover_image_url ? (
          <img
            src={ebook.cover_image_url}
            alt={ebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
          </div>
        )}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium rounded ${
            ebook.format === 'EPUB' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {ebook.format}
          </span>
        </div>
        {owned && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
            <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium rounded bg-green-600 text-white">
              Owned
            </span>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base min-h-[2.5rem] sm:min-h-[2.5rem]">
          {ebook.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">{ebook.author}</p>

        <div className="flex items-center mb-2 sm:mb-3">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-xs sm:text-sm font-medium text-gray-700 ml-1">
            {ebook.rating?.toFixed(1) || '0.0'}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-base sm:text-lg font-bold text-[#F05A28]">
            {formatCurrency(ebook.price, 'fr')}
          </span>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          {owned ? (
            <button
              onClick={onBuy}
              className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors font-medium text-xs sm:text-sm"
            >
              Read Now
            </button>
          ) : (
            <>
              <button
                onClick={onBuy}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors font-medium text-xs sm:text-sm"
              >
                Buy eBook
              </button>
              <button
                onClick={onPreview}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm flex items-center justify-center"
              >
                <Eye size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                Preview
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
