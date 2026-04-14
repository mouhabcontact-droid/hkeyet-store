import React, { useEffect, useState } from 'react';
import { BookOpen, Users as UsersIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';
import SEO from '../components/SEO';
import { generatePageSEO } from '../utils/seo';

export function Authors() {
  const { language } = useLanguage();
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*, book_authors(books(id))')
        .order('name');

      if (error) throw error;

      const authorsWithCount = (data || []).map((author) => ({
        ...author,
        bookCount: author.book_authors?.length || 0,
      }));

      setAuthors(authorsWithCount);
    } catch (error) {
      console.error('Error fetching authors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorClick = (authorId: string) => {
    navigate(`/books?author=${authorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
      </div>
    );
  }

  const seo = generatePageSEO('authors');

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO {...seo} />
      <div className="bg-gradient-to-br from-gray-900 to-black text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <UsersIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#F05A28]" />
            <h1 className="font-serif text-3xl sm:text-5xl font-bold">
              {language === 'ar' ? 'المؤلفون' : language === 'en' ? 'Authors' : 'Auteurs'}
            </h1>
          </div>
          <p className="text-base sm:text-xl text-gray-300">
            {language === 'ar'
              ? 'اكتشف الكتاب المفضلين لديك'
              : language === 'en'
              ? 'Discover your favorite writers'
              : 'Découvrez vos écrivains préférés'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {authors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <UsersIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {language === 'ar' ? 'لا يوجد مؤلفون' : language === 'en' ? 'No authors yet' : 'Aucun auteur'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {language === 'ar'
                ? 'لم يتم العثور على مؤلفين'
                : language === 'en'
                ? 'No authors found'
                : 'Aucun auteur trouvé'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {authors.map((author) => (
              <div
                key={author.id}
                onClick={() => handleAuthorClick(author.id)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
              >
                <div className="relative h-48 sm:h-64 bg-gradient-to-br from-gray-800 to-black overflow-hidden">
                  {author.photo_url ? (
                    <img
                      src={author.photo_url}
                      alt={author.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UsersIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>
                        {author.bookCount}{' '}
                        {language === 'ar'
                          ? author.bookCount === 1
                            ? 'كتاب'
                            : 'كتب'
                          : language === 'en'
                          ? author.bookCount === 1
                            ? 'book'
                            : 'books'
                          : author.bookCount === 1
                          ? 'livre'
                          : 'livres'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#F05A28] transition-colors">
                    {author.name}
                  </h3>
                  {author.bio && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">{author.bio}</p>
                  )}
                  {author.nationality && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      {language === 'ar' ? 'الجنسية' : language === 'en' ? 'Nationality' : 'Nationalité'}:{' '}
                      {author.nationality}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
