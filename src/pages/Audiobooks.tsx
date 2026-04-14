import React, { useEffect, useState } from 'react';
import { Headphones, Search, Filter, Clock, User, Mic, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/currency';
import { navigate } from '../utils/navigation';
import SEO from '../components/SEO';

interface Audiobook {
  id: string;
  title: string;
  slug: string;
  author: string;
  narrator: string;
  short_description: string;
  cover_url: string;
  price: number;
  duration_seconds: number;
  is_featured: boolean;
  is_new_release: boolean;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Audiobooks() {
  const { language, t } = useLanguage();
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [featuredAudiobooks, setFeaturedAudiobooks] = useState<Audiobook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchCategories();
    fetchAudiobooks();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const fetchAudiobooks = async () => {
    setLoading(true);
    try {
      const { data: featured } = await supabase
        .from('audiobooks')
        .select('*, categories(name)')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(6);

      if (featured) setFeaturedAudiobooks(featured);

      const { data: all } = await supabase
        .from('audiobooks')
        .select('*, categories(name)')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (all) setAudiobooks(all);
    } catch (error) {
      console.error('Error fetching audiobooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredAudiobooks = audiobooks.filter((audiobook) => {
    const matchesSearch =
      audiobook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audiobook.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audiobook.narrator?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || audiobook.categories?.name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const AudiobookCard = ({ audiobook }: { audiobook: Audiobook }) => (
    <div
      onClick={() => navigate(`/audiobooks/${audiobook.slug}`)}
      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-[#F05A28]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={audiobook.cover_url || 'https://via.placeholder.com/400x600?text=No+Cover'}
          alt={audiobook.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {audiobook.is_featured && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-white" />
              Featured
            </span>
          )}
          {audiobook.is_new_release && (
            <span className="bg-[#F05A28] text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
              New
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="w-full bg-white text-[#F05A28] py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Headphones className="w-4 h-4" />
            Listen Now
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-[#F05A28] transition-colors mb-2 line-clamp-2 min-h-[3rem]">
          {audiobook.title}
        </h3>
        <div className="space-y-1.5 mb-3">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{audiobook.author}</span>
          </p>
          {audiobook.narrator && (
            <p className="text-sm text-gray-600 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{audiobook.narrator}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {formatDuration(audiobook.duration_seconds)}
          </p>
        </div>
        {audiobook.short_description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {audiobook.short_description}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-lg font-bold text-[#F05A28]">
            {formatCurrency(audiobook.price, language)}
          </span>
          {audiobook.categories && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {audiobook.categories.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Headphones className="w-16 h-16 text-[#F05A28] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading audiobooks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Audiobooks - Immersive Stories to Listen Anywhere"
        description="Discover our premium audiobook collection. Enjoy captivating stories narrated by talented voices. Perfect for your commute, workout, or relaxation time."
        type="website"
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-r from-[#F05A28] to-[#d94d1f] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Headphones className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Premium Audiobooks
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Immerse yourself in captivating stories, narrated beautifully. Listen anytime, anywhere.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {featuredAudiobooks.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <h2 className="text-3xl font-bold text-gray-900">Featured Audiobooks</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredAudiobooks.map((audiobook) => (
                  <AudiobookCard key={audiobook.id} audiobook={audiobook} />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 sticky top-20 z-10">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search audiobooks by title, author, or narrator..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                />
              </div>
              <div className="lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent appearance-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory ? `${selectedCategory} Audiobooks` : 'All Audiobooks'}
            </h2>
            <p className="text-gray-600">
              {filteredAudiobooks.length} audiobook{filteredAudiobooks.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredAudiobooks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Headphones className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No audiobooks found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your search or filters'
                  : 'Check back soon for new releases'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAudiobooks.map((audiobook) => (
                <AudiobookCard key={audiobook.id} audiobook={audiobook} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
