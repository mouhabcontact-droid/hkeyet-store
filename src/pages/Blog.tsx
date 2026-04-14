import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Tag, Loader, Star, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate, truncateText, stripHtmlTags } from '../utils/blog';
import SEO from '../components/SEO';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  category: string;
  published_at: string;
  reading_time: number;
  featured: boolean;
}

export function Blog() {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchPosts();
  }, [searchQuery, selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const featured = data.find((post) => post.featured);
        if (featured) {
          setFeaturedPost(featured);
          setPosts(data.filter((post) => post.id !== featured.id));
        } else {
          setPosts(data);
        }

        const uniqueCategories = Array.from(
          new Set(data.map((post) => post.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const BlogCard = ({ post, featured = false }: { post: BlogPost; featured?: boolean }) => (
    <a
      href={`/blog/${post.slug}`}
      className={`group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
        featured ? 'md:flex md:gap-8' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          featured ? 'md:w-1/2' : 'aspect-[16/9]'
        }`}
      >
        <img
          src={post.cover_url || 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg'}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {featured && (
          <div className="absolute top-4 left-4 bg-[#F05A28] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Star className="w-4 h-4 fill-white" />
            Featured
          </div>
        )}
      </div>

      <div className={`p-6 ${featured ? 'md:w-1/2 flex flex-col justify-center' : ''}`}>
        {post.category && (
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
          </div>
        )}

        <h2
          className={`font-bold text-gray-900 group-hover:text-[#F05A28] transition-colors mb-3 ${
            featured ? 'text-3xl md:text-4xl' : 'text-xl'
          }`}
        >
          {post.title}
        </h2>

        <p className={`text-gray-600 mb-4 ${featured ? 'text-lg' : 'text-sm'}`}>
          {truncateText(
            post.excerpt || stripHtmlTags(post.content),
            featured ? 200 : 120
          )}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(post.published_at, language)}
          </div>
          {post.reading_time > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.reading_time} min
              {language === 'fr' ? ' de lecture' : language === 'ar' ? ' دقيقة قراءة' : ' read'}
            </div>
          )}
        </div>
      </div>
    </a>
  );

  return (
    <>
      <SEO
        title="Blog - HKAYET"
        description="Discover literary articles, book news, author spotlights, and reading recommendations from HKAYET bookstore."
        type="website"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-[#F05A28] to-[#d14920] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'fr'
                ? 'Le Blog HKAYET'
                : language === 'ar'
                ? 'مدونة حكايات'
                : 'HKAYET Blog'}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {language === 'fr'
                ? 'Articles littéraires, actualités des livres et recommandations de lecture'
                : language === 'ar'
                ? 'مقالات أدبية، أخبار الكتب وتوصيات القراءة'
                : 'Literary articles, book news, and reading recommendations'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'fr'
                      ? 'Rechercher des articles...'
                      : language === 'ar'
                      ? 'البحث عن المقالات...'
                      : 'Search articles...'
                  }
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28] focus:ring-opacity-20 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#F05A28] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {language === 'fr' ? 'Tous' : language === 'ar' ? 'الكل' : 'All'}
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-[#F05A28] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-8 h-8 text-[#F05A28] animate-spin" />
            </div>
          ) : (
            <>
              {featuredPost && selectedCategory === 'all' && !searchQuery && (
                <div className="mb-12">
                  <BlogCard post={featuredPost} featured />
                </div>
              )}

              {posts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {language === 'fr'
                      ? 'Aucun article trouvé'
                      : language === 'ar'
                      ? 'لم يتم العثور على مقالات'
                      : 'No articles found'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'fr'
                      ? 'Essayez de modifier votre recherche'
                      : language === 'ar'
                      ? 'حاول تعديل البحث'
                      : 'Try adjusting your search'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
