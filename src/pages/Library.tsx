import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Calendar, TrendingUp, Headphones } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { useToast } from '../components/Toast';

export function Library() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [library, setLibrary] = useState<any[]>([]);
  const [audiobooks, setAudiobooks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ebooks' | 'audiobooks'>('ebooks');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalAudiobooks: 0,
    totalReadingTime: 0,
    booksInProgress: 0,
    booksCompleted: 0,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    fetchLibrary();
  }, [user, authLoading]);

  const fetchLibrary = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: libraryData } = await supabase
        .from('user_library')
        .select(`
          *,
          ebooks (
            id,
            title,
            author,
            cover_image_url,
            format,
            page_count,
            categories (name)
          )
        `)
        .eq('user_id', user.id)
        .order('last_opened', { ascending: false, nullsFirst: false })
        .order('purchase_date', { ascending: false });

      const { data: audiobookData } = await supabase
        .from('user_audiobook_library')
        .select(`
          *,
          audiobooks (
            id,
            title,
            author,
            narrator,
            cover_url,
            duration_seconds,
            categories (name)
          )
        `)
        .eq('user_id', user.id)
        .order('last_listened_at', { ascending: false, nullsFirst: false })
        .order('purchase_date', { ascending: false });

      if (libraryData) {
        setLibrary(libraryData);
      }

      if (audiobookData) {
        setAudiobooks(audiobookData);
      }

      const totalReadingTime = (libraryData || []).reduce((sum, item) => sum + (item.total_reading_time || 0), 0);
      const booksInProgress = (libraryData || []).filter(item => item.reading_progress > 0 && item.reading_progress < 100).length;
      const booksCompleted = (libraryData || []).filter(item => item.reading_progress >= 100).length;

      setStats({
        totalBooks: (libraryData || []).length,
        totalAudiobooks: (audiobookData || []).length,
        totalReadingTime,
        booksInProgress,
        booksCompleted,
      });
    } catch (error) {
      console.error('Error fetching library:', error);
      showToast('Failed to load library', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBook = (ebookId: string) => {
    navigate(`/reader/${ebookId}`);
  };

  const handleOpenAudiobook = (audiobookId: string) => {
    navigate(`/listen/${audiobookId}`);
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Library</h1>
          <p className="text-sm sm:text-base text-gray-600">Your personal collection of eBooks and audiobooks</p>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ebooks')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'ebooks'
                ? 'border-[#F05A28] text-[#F05A28]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            eBooks ({stats.totalBooks})
          </button>
          <button
            onClick={() => setActiveTab('audiobooks')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'audiobooks'
                ? 'border-[#F05A28] text-[#F05A28]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Headphones className="w-5 h-5" />
            Audiobooks ({stats.totalAudiobooks})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-[#F05A28] mb-1 sm:mb-2" />
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Total Books</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-1 sm:mb-2" />
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">In Progress</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.booksInProgress}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-1 sm:mb-2" />
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Reading Time</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalReadingTime}m</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-1 sm:mb-2" />
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Completed</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.booksCompleted}</p>
          </div>
        </div>

        {activeTab === 'ebooks' && library.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your eBook library is empty</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Start building your collection by purchasing eBooks</p>
            <button
              onClick={() => navigate('/ebooks')}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors font-medium text-sm sm:text-base"
            >
              Browse eBooks
            </button>
          </div>
        )}

        {activeTab === 'audiobooks' && audiobooks.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <Headphones className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your audiobook library is empty</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Start listening by purchasing audiobooks</p>
            <button
              onClick={() => navigate('/audiobooks')}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors font-medium text-sm sm:text-base"
            >
              Browse Audiobooks
            </button>
          </div>
        )}

        {activeTab === 'ebooks' && library.length > 0 && (
          <div className="space-y-6 sm:space-y-8">
            {library.some(item => item.reading_progress > 0 && item.reading_progress < 100) && (
              <section>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Continue Reading</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {library
                    .filter(item => item.reading_progress > 0 && item.reading_progress < 100)
                    .map((item) => (
                      <LibraryBookCard key={item.id} item={item} onOpen={handleOpenBook} />
                    ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">All Books</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {library.map((item) => (
                  <LibraryBookCard key={item.id} item={item} onOpen={handleOpenBook} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'audiobooks' && audiobooks.length > 0 && (
          <div className="space-y-6 sm:space-y-8">
            {audiobooks.some(item => item.progress_percentage > 0 && item.progress_percentage < 95) && (
              <section>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Continue Listening</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {audiobooks
                    .filter(item => item.progress_percentage > 0 && item.progress_percentage < 95)
                    .map((item) => (
                      <LibraryAudiobookCard key={item.id} item={item} onOpen={handleOpenAudiobook} />
                    ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">All Audiobooks</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {audiobooks.map((item) => (
                  <LibraryAudiobookCard key={item.id} item={item} onOpen={handleOpenAudiobook} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

interface LibraryBookCardProps {
  item: any;
  onOpen: (ebookId: string) => void;
}

function LibraryBookCard({ item, onOpen }: LibraryBookCardProps) {
  const ebook = item.ebooks;
  const progress = item.reading_progress || 0;
  const lastOpened = item.last_opened ? new Date(item.last_opened).toLocaleDateString() : 'Never';

  return (
    <div
      onClick={() => onOpen(ebook.id)}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
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

        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1.5 sm:p-2">
            <div className="flex items-center justify-between text-white text-xs mb-1">
              <span>{progress.toFixed(0)}%</span>
              <span className={progress >= 100 ? 'text-green-400' : ''}>
                {progress >= 100 ? 'Done' : 'Reading'}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-[#F05A28]'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base min-h-[2.5rem]">
          {ebook.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">{ebook.author}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs ${
            ebook.format === 'EPUB' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
          }`}>
            {ebook.format}
          </span>
          <span className="text-xs hidden sm:inline">Last: {lastOpened}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(ebook.id);
          }}
          className="w-full mt-2 sm:mt-4 px-3 py-2 sm:px-4 sm:py-2 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors font-medium text-xs sm:text-sm"
        >
          {progress >= 100 ? 'Read Again' : progress > 0 ? 'Continue' : 'Start Reading'}
        </button>
      </div>
    </div>
  );
}

interface LibraryAudiobookCardProps {
  item: any;
  onOpen: (audiobookId: string) => void;
}

function LibraryAudiobookCard({ item, onOpen }: LibraryAudiobookCardProps) {
  const audiobook = item.audiobooks;
  const progress = item.progress_percentage || 0;
  const lastListened = item.last_listened_at ? new Date(item.last_listened_at).toLocaleDateString() : 'Never';

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      onClick={() => onOpen(audiobook.id)}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
        {audiobook.cover_url ? (
          <img
            src={audiobook.cover_url}
            alt={audiobook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Headphones className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
          </div>
        )}

        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1.5 sm:p-2">
            <div className="flex items-center justify-between text-white text-xs mb-1">
              <span>{progress.toFixed(0)}%</span>
              <span className={progress >= 95 ? 'text-green-400' : ''}>
                {progress >= 95 ? 'Done' : 'Listening'}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${progress >= 95 ? 'bg-green-500' : 'bg-[#F05A28]'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base min-h-[2.5rem]">
          {audiobook.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{audiobook.author}</p>
        {audiobook.narrator && (
          <p className="text-xs text-gray-500 mb-2 truncate flex items-center gap-1">
            <Headphones className="w-3 h-3" />
            {audiobook.narrator}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
            {formatDuration(audiobook.duration_seconds)}
          </span>
          <span className="text-xs hidden sm:inline">Last: {lastListened}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(audiobook.id);
          }}
          className="w-full mt-2 sm:mt-4 px-3 py-2 sm:px-4 sm:py-2 bg-[#F05A28] text-white rounded-lg hover:bg-[#d94d20] transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <Headphones className="w-4 h-4" />
          {progress >= 95 ? 'Listen Again' : progress > 0 ? 'Continue' : 'Start Listening'}
        </button>
      </div>
    </div>
  );
}
