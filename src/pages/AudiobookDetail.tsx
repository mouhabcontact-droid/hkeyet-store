import React, { useEffect, useState } from 'react';
import { Headphones, Clock, User, Mic, BookOpen, Play, ShoppingCart, Star, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/currency';
import { navigate } from '../utils/navigation';
import SEO from '../components/SEO';

interface Audiobook {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  author: string;
  narrator: string;
  cover_url: string;
  price: number;
  duration_seconds: number;
  isbn: string;
  language: string;
  sample_audio_url: string;
  is_featured: boolean;
  is_new_release: boolean;
  seo_title: string;
  seo_description: string;
  categories?: { name: string };
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  duration_seconds: number;
  display_order: number;
}

export default function AudiobookDetail() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [audiobook, setAudiobook] = useState<Audiobook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [relatedAudiobooks, setRelatedAudiobooks] = useState<Audiobook[]>([]);

  useEffect(() => {
    const slug = window.location.pathname.split('/').pop();
    if (slug) {
      fetchAudiobook(slug);
    }
  }, []);

  const fetchAudiobook = async (slug: string) => {
    setLoading(true);
    try {
      const { data: audiobookData, error } = await supabase
        .from('audiobooks')
        .select('*, categories(name)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      if (!audiobookData) {
        navigate('/audiobooks');
        return;
      }

      setAudiobook(audiobookData);

      const { data: chaptersData } = await supabase
        .from('audiobook_chapters')
        .select('id, title, chapter_number, duration_seconds, display_order')
        .eq('audiobook_id', audiobookData.id)
        .order('display_order');

      if (chaptersData) {
        setChapters(chaptersData);
      }

      if (user) {
        const { data: libraryData } = await supabase
          .from('user_audiobook_library')
          .select('id')
          .eq('user_id', user.id)
          .eq('audiobook_id', audiobookData.id)
          .maybeSingle();

        setHasAccess(!!libraryData);
      }

      if (audiobookData.categories) {
        const { data: related } = await supabase
          .from('audiobooks')
          .select('*, categories(name)')
          .eq('is_published', true)
          .neq('id', audiobookData.id)
          .limit(4);

        if (related) {
          setRelatedAudiobooks(related);
        }
      }
    } catch (error) {
      console.error('Error fetching audiobook:', error);
      navigate('/audiobooks');
    } finally {
      setLoading(false);
    }
  };

  const handleListen = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (hasAccess && audiobook) {
      navigate(`/listen/${audiobook.id}`);
    } else {
      handlePurchase();
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!audiobook) return;

    try {
      const { error } = await supabase.from('user_audiobook_library').insert([
        {
          user_id: user.id,
          audiobook_id: audiobook.id,
        },
      ]);

      if (error) throw error;

      setHasAccess(true);
      navigate(`/listen/${audiobook.id}`);
    } catch (error) {
      console.error('Error purchasing audiobook:', error);
      alert('Failed to add audiobook to library');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Headphones className="w-12 h-12 text-[#F05A28] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading audiobook...</p>
        </div>
      </div>
    );
  }

  if (!audiobook) {
    return null;
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Audiobook',
    name: audiobook.title,
    author: {
      '@type': 'Person',
      name: audiobook.author,
    },
    readBy: audiobook.narrator ? {
      '@type': 'Person',
      name: audiobook.narrator,
    } : undefined,
    description: audiobook.description,
    image: audiobook.cover_url,
    isbn: audiobook.isbn,
    inLanguage: audiobook.language,
    duration: `PT${audiobook.duration_seconds}S`,
    offers: {
      '@type': 'Offer',
      price: audiobook.price,
      priceCurrency: 'TND',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <SEO
        title={audiobook.seo_title || `${audiobook.title} - Audiobook`}
        description={
          audiobook.seo_description ||
          audiobook.short_description ||
          audiobook.description?.substring(0, 160)
        }
        image={audiobook.cover_url}
        type="product"
        price={audiobook.price.toString()}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-8">
              <div className="lg:col-span-2">
                <div className="sticky top-24">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-2xl">
                    <img
                      src={audiobook.cover_url || 'https://via.placeholder.com/400x600?text=No+Cover'}
                      alt={audiobook.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {audiobook.is_featured && (
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                          <Star className="w-4 h-4 fill-white" />
                          Featured
                        </span>
                      )}
                      {audiobook.is_new_release && (
                        <span className="bg-[#F05A28] text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                          New Release
                        </span>
                      )}
                    </div>
                  </div>

                  {audiobook.sample_audio_url && (
                    <div className="mt-6 bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Listen to Sample
                      </p>
                      <audio
                        controls
                        className="w-full"
                        src={audiobook.sample_audio_url}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      onClick={handleListen}
                      className="w-full bg-[#F05A28] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#d94d1f] transition-all shadow-lg hover:shadow-xl"
                    >
                      <Headphones className="w-6 h-6" />
                      {hasAccess ? 'Continue Listening' : `Listen Now - ${formatCurrency(audiobook.price, language)}`}
                    </button>
                    {!hasAccess && (
                      <p className="text-center text-sm text-gray-500 mt-3">
                        One-time purchase. Unlimited listening.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">{audiobook.title}</h1>
                    {audiobook.short_description && (
                      <p className="text-xl text-gray-600 mb-4">{audiobook.short_description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        <span className="font-semibold">By:</span> {audiobook.author}
                      </span>
                    </div>
                    {audiobook.narrator && (
                      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                        <Mic className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          <span className="font-semibold">Narrated by:</span> {audiobook.narrator}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        <span className="font-semibold">Length:</span> {formatDuration(audiobook.duration_seconds)}
                      </span>
                    </div>
                    {audiobook.categories && (
                      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{audiobook.categories.name}</span>
                      </div>
                    )}
                  </div>

                  {audiobook.description && (
                    <div className="border-t pt-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Audiobook</h2>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {audiobook.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {chapters.length > 0 && (
                    <div className="border-t pt-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <List className="w-6 h-6" />
                        Chapters ({chapters.length})
                      </h2>
                      <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                          {chapters.map((chapter, index) => (
                            <div
                              key={chapter.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 bg-[#F05A28] text-white rounded-full text-sm font-bold">
                                  {chapter.chapter_number}
                                </span>
                                <span className="font-medium text-gray-900">{chapter.title}</span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDuration(chapter.duration_seconds)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {relatedAudiobooks.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedAudiobooks.map((related) => (
                  <div
                    key={related.id}
                    onClick={() => navigate(`/audiobooks/${related.slug}`)}
                    className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                      <img
                        src={related.cover_url || 'https://via.placeholder.com/400x600?text=No+Cover'}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#F05A28] transition-colors line-clamp-2 mb-2">
                        {related.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{related.author}</p>
                      <p className="text-sm font-bold text-[#F05A28]">
                        {formatCurrency(related.price, language)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
