import React, { useEffect, useState } from 'react';
import {
  ChevronLeft, ChevronRight, ArrowRight, Quote, Calendar, Clock, Headphones, User, Mic,
  Heart, Sword, Sparkles, BookOpen, Ghost, Rocket, History, Smile, Brain, Scroll,
  Drama, Flame, Search, Skull, Compass, Wand2, Trophy, Mountain, TreePine, Castle,
  Crown, Shield, Feather, GraduationCap, Briefcase, Plane, Ship, Zap, Moon, Star,
  Coffee, Wine, Camera, Music, Palette, Map, Globe
} from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { RecommendedBooks } from '../components/RecommendedBooks';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { navigate } from '../utils/navigation';
import SEO from '../components/SEO';
import { generatePageSEO, generateStructuredData } from '../utils/seo';
import { formatDate, truncateText, stripHtmlTags } from '../utils/blog';

const genreIcons: Record<string, React.ReactNode> = {
  romance: <Heart className="w-16 h-16 sm:w-20 sm:h-20" />,
  fiction: <BookOpen className="w-16 h-16 sm:w-20 sm:h-20" />,
  mystery: <Search className="w-16 h-16 sm:w-20 sm:h-20" />,
  thriller: <Flame className="w-16 h-16 sm:w-20 sm:h-20" />,
  fantasy: <Wand2 className="w-16 h-16 sm:w-20 sm:h-20" />,
  'science fiction': <Rocket className="w-16 h-16 sm:w-20 sm:h-20" />,
  'sci-fi': <Zap className="w-16 h-16 sm:w-20 sm:h-20" />,
  historical: <Castle className="w-16 h-16 sm:w-20 sm:h-20" />,
  comedy: <Smile className="w-16 h-16 sm:w-20 sm:h-20" />,
  horror: <Skull className="w-16 h-16 sm:w-20 sm:h-20" />,
  adventure: <Compass className="w-16 h-16 sm:w-20 sm:h-20" />,
  'non-fiction': <Brain className="w-16 h-16 sm:w-20 sm:h-20" />,
  biography: <Feather className="w-16 h-16 sm:w-20 sm:h-20" />,
  autobiography: <Scroll className="w-16 h-16 sm:w-20 sm:h-20" />,
  drama: <Drama className="w-16 h-16 sm:w-20 sm:h-20" />,
  poetry: <Sparkles className="w-16 h-16 sm:w-20 sm:h-20" />,
  classic: <Crown className="w-16 h-16 sm:w-20 sm:h-20" />,
  classics: <Crown className="w-16 h-16 sm:w-20 sm:h-20" />,
  crime: <Shield className="w-16 h-16 sm:w-20 sm:h-20" />,
  detective: <Search className="w-16 h-16 sm:w-20 sm:h-20" />,
  'young adult': <Star className="w-16 h-16 sm:w-20 sm:h-20" />,
  ya: <Star className="w-16 h-16 sm:w-20 sm:h-20" />,
  children: <Moon className="w-16 h-16 sm:w-20 sm:h-20" />,
  'self-help': <GraduationCap className="w-16 h-16 sm:w-20 sm:h-20" />,
  business: <Briefcase className="w-16 h-16 sm:w-20 sm:h-20" />,
  travel: <Plane className="w-16 h-16 sm:w-20 sm:h-20" />,
  sports: <Trophy className="w-16 h-16 sm:w-20 sm:h-20" />,
  nature: <TreePine className="w-16 h-16 sm:w-20 sm:h-20" />,
  'science & nature': <Mountain className="w-16 h-16 sm:w-20 sm:h-20" />,
  cooking: <Coffee className="w-16 h-16 sm:w-20 sm:h-20" />,
  food: <Wine className="w-16 h-16 sm:w-20 sm:h-20" />,
  photography: <Camera className="w-16 h-16 sm:w-20 sm:h-20" />,
  music: <Music className="w-16 h-16 sm:w-20 sm:h-20" />,
  art: <Palette className="w-16 h-16 sm:w-20 sm:h-20" />,
  history: <History className="w-16 h-16 sm:w-20 sm:h-20" />,
  philosophy: <Brain className="w-16 h-16 sm:w-20 sm:h-20" />,
  religion: <Scroll className="w-16 h-16 sm:w-20 sm:h-20" />,
  spiritual: <Sparkles className="w-16 h-16 sm:w-20 sm:h-20" />,
  mythology: <Wand2 className="w-16 h-16 sm:w-20 sm:h-20" />,
  war: <Sword className="w-16 h-16 sm:w-20 sm:h-20" />,
  military: <Shield className="w-16 h-16 sm:w-20 sm:h-20" />,
  nautical: <Ship className="w-16 h-16 sm:w-20 sm:h-20" />,
  western: <Compass className="w-16 h-16 sm:w-20 sm:h-20" />,
  memoir: <Feather className="w-16 h-16 sm:w-20 sm:h-20" />,
  essays: <Scroll className="w-16 h-16 sm:w-20 sm:h-20" />,
  'short stories': <BookOpen className="w-16 h-16 sm:w-20 sm:h-20" />,
  anthologies: <BookOpen className="w-16 h-16 sm:w-20 sm:h-20" />,
  paranormal: <Ghost className="w-16 h-16 sm:w-20 sm:h-20" />,
  supernatural: <Moon className="w-16 h-16 sm:w-20 sm:h-20" />,
  dystopian: <Flame className="w-16 h-16 sm:w-20 sm:h-20" />,
  'graphic novel': <Palette className="w-16 h-16 sm:w-20 sm:h-20" />,
  comics: <Zap className="w-16 h-16 sm:w-20 sm:h-20" />,
  manga: <Star className="w-16 h-16 sm:w-20 sm:h-20" />,
  guide: <Map className="w-16 h-16 sm:w-20 sm:h-20" />,
  reference: <GraduationCap className="w-16 h-16 sm:w-20 sm:h-20" />,
  textbook: <GraduationCap className="w-16 h-16 sm:w-20 sm:h-20" />,
  educational: <GraduationCap className="w-16 h-16 sm:w-20 sm:h-20" />,
  politics: <Globe className="w-16 h-16 sm:w-20 sm:h-20" />,
  economics: <Briefcase className="w-16 h-16 sm:w-20 sm:h-20" />,
  default: <BookOpen className="w-16 h-16 sm:w-20 sm:h-20" />,
};

const getGenreIcon = (categoryName: string) => {
  const normalized = categoryName.toLowerCase();
  return genreIcons[normalized] || genreIcons.default;
};

export function Home() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [featuredBooks, setFeaturedBooks] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<any[]>([]);
  const [featuredAudiobooks, setFeaturedAudiobooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [currentHero, setCurrentHero] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroTitle, setHeroTitle] = useState('Des Histoires Qui Vivent Pour Toujours');
  const [heroSubtitle, setHeroSubtitle] = useState('Découvrez la littérature intemporelle et les chefs-d\'œuvre contemporains chez HKEYET Publishing');
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [
        { data: featured },
        { data: releases },
        { data: sellers },
        { data: audiobooks },
        { data: cats },
        { data: bookQuotes },
        { data: settings },
        { data: posts }
      ] = await Promise.all([
        supabase
          .from('featured_books')
          .select(`
            books(
              id,
              title,
              slug,
              cover_url,
              price,
              is_featured,
              is_new_release,
              is_bestseller,
              book_authors(authors(*))
            )
          `)
          .order('position'),
        supabase.from('books').select('*, book_authors(authors(*))').eq('is_new_release', true).order('release_date', { ascending: false }).limit(8),
        supabase.from('books').select('*, book_authors(authors(*))').eq('is_bestseller', true).order('total_sales', { ascending: false }).limit(8),
        supabase.from('audiobooks').select('*').eq('is_published', true).eq('is_featured', true).order('published_at', { ascending: false }).limit(6),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('book_quotes').select('*, books(*)').eq('is_featured', true).limit(5),
        supabase.from('site_settings').select('*'),
        supabase.from('blog_posts').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(3)
      ]);

      const featuredBooksData = featured?.map(fb => fb.books).filter(Boolean) || [];
      setFeaturedBooks(featuredBooksData);

      setNewReleases(releases || []);
      setBestsellers(sellers || []);
      setFeaturedAudiobooks(audiobooks || []);
      setCategories(cats || []);
      setQuotes(bookQuotes || []);
      setBlogPosts(posts || []);

      if (settings) {
        const images = [
          settings.find(s => s.key === 'hero_image_1')?.value,
          settings.find(s => s.key === 'hero_image_2')?.value,
          settings.find(s => s.key === 'hero_image_3')?.value,
        ].filter(Boolean);

        setHeroImages(images);
        setHeroTitle(settings.find(s => s.key === 'hero_title')?.value || heroTitle);
        setHeroSubtitle(settings.find(s => s.key === 'hero_subtitle')?.value || heroSubtitle);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  const addToCart = async (bookId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
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
          .insert([{ user_id: user.id, book_id: bookId, quantity: 1 }]);
      }

      await supabase
        .from('user_activity')
        .insert([{ user_id: user.id, book_id: bookId, activity_type: 'add_to_cart' }]);

      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Livre ajouté au panier!', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      showToast('Échec de l\'ajout au panier', 'error');
    }
  };

  const addToWishlist = async (bookId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await supabase
        .from('wishlists')
        .insert([{ user_id: user.id, book_id: bookId }]);

      showToast('Ajouté aux favoris!', 'success');
    } catch (error: any) {
      if (error.code === '23505') {
        showToast('Déjà dans les favoris', 'info');
      } else {
        showToast('Échec de l\'ajout aux favoris', 'error');
      }
    }
  };

  const seo = generatePageSEO('home');
  const websiteStructuredData = generateStructuredData('website');

  return (
    <div className="min-h-screen bg-white">
      <SEO {...seo} structuredData={websiteStructuredData} />
      <section className="relative h-[500px] sm:h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.length > 0 && heroImages[currentHero % heroImages.length] && (
            <img
              src={heroImages[currentHero % heroImages.length]}
              alt="Hero background"
              className="w-full h-full object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              {heroTitle}
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a href="/books" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="flex items-center justify-center gap-2 w-full">
                  Parcourir les Livres
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <a href="/books?filter=new" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black w-full">
                  Nouvelles Sorties
                </Button>
              </a>
            </div>
          </div>

          {heroImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentHero((currentHero - 1 + heroImages.length) % heroImages.length)}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <button
                onClick={() => setCurrentHero((currentHero + 1) % heroImages.length)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                Livres en Vedette
              </h2>
              <p className="text-sm sm:text-base text-gray-600">Sélections choisies par nos éditeurs</p>
            </div>
            <a href="/books?filter=featured" className="hidden sm:block">
              <Button variant="ghost" className="flex items-center gap-2">
                Voir Tout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {featuredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                authors={book.book_authors?.map((ba: any) => ba.authors) || []}
                onAddToCart={() => addToCart(book.id)}
                onAddToWishlist={() => addToWishlist(book.id)}
                onClick={() => navigate(`/books/${book.slug}`)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              Parcourir par Catégorie
            </h2>
            <p className="text-sm sm:text-base text-gray-600">Explorez notre collection diversifiée</p>
          </div>

          <style>{`
            .flip-card {
              perspective: 1000px;
            }
            .flip-card-inner {
              position: relative;
              width: 100%;
              height: 100%;
              transition: transform 0.6s;
              transform-style: preserve-3d;
            }
            .flip-card:hover .flip-card-inner {
              transform: rotateY(180deg);
            }
            .flip-card-front, .flip-card-back {
              position: absolute;
              width: 100%;
              height: 100%;
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
            }
            .flip-card-back {
              transform: rotateY(180deg);
            }
          `}</style>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => navigate(`/books?category=${category.slug}`)}
                className="flip-card h-32 sm:h-48 rounded-lg overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F05A28] to-black opacity-80" />
                    {category.image_url && (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover opacity-40"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="font-serif text-base sm:text-2xl font-bold text-white text-center px-2 sm:px-4">
                        {category.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flip-card-back rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center text-white p-4">
                    <div className="mb-2 sm:mb-3 text-white/90 transform scale-100 hover:scale-110 transition-transform">
                      {getGenreIcon(category.name)}
                    </div>
                    <h3 className="font-serif text-sm sm:text-xl font-bold text-center mb-1 sm:mb-2">
                      {category.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/70 text-center">
                      Explorer la Collection
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                Nouvelles Sorties
              </h2>
              <p className="text-sm sm:text-base text-gray-600">Nouvelles arrivées pour les lecteurs avides</p>
            </div>
            <a href="/books?filter=new" className="hidden sm:block">
              <Button variant="ghost" className="flex items-center gap-2">
                Voir Tout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {newReleases.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                authors={book.book_authors?.map((ba: any) => ba.authors) || []}
                onAddToCart={() => addToCart(book.id)}
                onAddToWishlist={() => addToWishlist(book.id)}
                onClick={() => navigate(`/books/${book.slug}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {featuredAudiobooks.length > 0 && (
        <section className="py-12 sm:py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Headphones className="w-8 h-8 text-[#F05A28]" />
                  <h2 className="font-serif text-2xl sm:text-4xl font-bold">
                    Livres Audio Premium
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-gray-300">Histoires immersives magnifiquement narrées</p>
              </div>
              <a href="/audiobooks" className="hidden sm:block">
                <Button variant="ghost" className="flex items-center gap-2 text-white hover:text-[#F05A28] hover:bg-white/10">
                  Tout Explorer
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {featuredAudiobooks.map((audiobook: any) => (
                <div
                  key={audiobook.id}
                  onClick={() => navigate(`/audiobooks/${audiobook.slug}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 mb-3">
                    <img
                      src={audiobook.cover_url || 'https://via.placeholder.com/400x600?text=No+Cover'}
                      alt={audiobook.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="w-full bg-[#F05A28] text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#d94d1f] transition-colors">
                        <Headphones className="w-4 h-4" />
                        Écouter
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-[#F05A28] transition-colors line-clamp-2 mb-1 text-sm">
                    {audiobook.title}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                    <User className="w-3 h-3" />
                    {audiobook.author}
                  </p>
                  {audiobook.narrator && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      {audiobook.narrator}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <a href="/audiobooks">
                <Button variant="ghost" className="flex items-center gap-2 text-white hover:text-[#F05A28] hover:bg-white/10 mx-auto">
                  Explorer Tous les Livres Audio
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                Meilleures Ventes
              </h2>
              <p className="text-sm sm:text-base text-gray-600">Les plus aimés par nos lecteurs</p>
            </div>
            <a href="/books?filter=bestseller" className="hidden sm:block">
              <Button variant="ghost" className="flex items-center gap-2">
                Voir Tout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {bestsellers.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                authors={book.book_authors?.map((ba: any) => ba.authors) || []}
                onAddToCart={() => addToCart(book.id)}
                onAddToWishlist={() => addToWishlist(book.id)}
                onClick={() => navigate(`/books/${book.slug}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {quotes.length > 0 && (
        <section className="py-12 sm:py-20 bg-black text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Quote className="w-12 h-12 sm:w-16 sm:h-16 text-[#F05A28] mx-auto mb-6 sm:mb-8" />
            <blockquote className="font-serif text-xl sm:text-3xl md:text-4xl font-medium leading-relaxed mb-4 sm:mb-6">
              "{quotes[0]?.quote}"
            </blockquote>
            {quotes[0]?.books && (
              <p className="text-gray-400 text-base sm:text-lg">
                — {quotes[0].books.title}
              </p>
            )}
          </div>
        </section>
      )}

      <RecommendedBooks />

      {blogPosts.length > 0 && (
        <section className="py-12 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <div>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Du Blog
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Aperçus littéraires, actualités des livres et recommandations de lecture
                </p>
              </div>
              <a href="/blog" className="hidden sm:block">
                <Button variant="ghost" className="flex items-center gap-2">
                  Voir Tous les Articles
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {blogPosts.map((post) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.cover_url || 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    {post.category && (
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-3">
                        {post.category}
                      </span>
                    )}
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#F05A28] transition-colors mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {truncateText(post.excerpt || stripHtmlTags(post.content), 120)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.published_at, 'en')}
                      </div>
                      {post.reading_time > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.reading_time} min de lecture
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <a href="/blog">
                <Button variant="ghost" className="flex items-center gap-2 mx-auto">
                  Voir Tous les Articles
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 sm:py-20 bg-gradient-to-br from-[#F05A28] to-[#d94d20] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            Rejoignez Notre Communauté Littéraire
          </h2>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 text-white/90">
            Recevez des offres exclusives, des recommandations de lecture et un accès anticipé aux nouvelles sorties
          </p>
          <a href="/signup">
            <Button variant="secondary" size="lg" className="shadow-xl w-full sm:w-auto">
              Créer un Compte Gratuit
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
