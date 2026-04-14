import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, Heart, Menu, X, BookOpen, Shield, Languages, BookMarked, PenTool, Headphones } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import { SearchPanel } from './SearchPanel';

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
}

export function Header({ cartItemCount = 0, onCartClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showEbooks, setShowEbooks] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('key', 'show_ebooks_section')
        .maybeSingle();

      if (data) {
        setShowEbooks(data.value === 'true');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <a href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
                <img src="/Untitled_design.png" alt="HKEYET Publishing" className="h-10 sm:h-14 w-auto" />
              </a>

              <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
                <a href="/books" className="text-gray-700 hover:text-[#F05A28] transition-colors font-medium whitespace-nowrap">
                  {t('nav.books')}
                </a>
                {showEbooks && (
                  <a href="/ebooks" className="text-gray-700 hover:text-[#F05A28] transition-colors font-medium whitespace-nowrap">
                    {language === 'fr' ? 'eBooks' : language === 'ar' ? 'الكتب الإلكترونية' : 'eBooks'}
                  </a>
                )}
                <a href="/audiobooks" className="text-gray-700 hover:text-[#F05A28] transition-colors font-medium whitespace-nowrap">
                  {language === 'fr' ? 'Livres Audio' : language === 'ar' ? 'الكتب الصوتية' : 'Audiobooks'}
                </a>
                <a href="/blog" className="text-gray-700 hover:text-[#F05A28] transition-colors font-medium whitespace-nowrap">
                  {language === 'fr' ? 'Blog' : language === 'ar' ? 'المدونة' : 'Blog'}
                </a>
                <a href="/categories" className="text-gray-700 hover:text-[#F05A28] transition-colors font-medium whitespace-nowrap">
                  {t('footer.categories')}
                </a>
                <a href="/authors" className="text-gray-700 hover:text-[#F05A28] transition-colors font-medium whitespace-nowrap">
                  {language === 'fr' ? 'Auteurs' : language === 'ar' ? 'المؤلفون' : 'Authors'}
                </a>
                {profile?.is_admin && (
                  <a
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#F05A28] text-white rounded-lg hover:bg-[#D94D1F] transition-colors font-medium whitespace-nowrap"
                  >
                    <Shield className="w-4 h-4" />
                    {t('nav.admin')}
                  </a>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Languages className="w-5 h-5 text-gray-700" />
                  <span className="hidden lg:inline text-sm font-medium text-gray-700">
                    {language === 'fr' ? 'FR' : language === 'ar' ? 'AR' : 'EN'}
                  </span>
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg py-2 z-50">
                    <button
                      onClick={() => { setLanguage('fr'); setLangMenuOpen(false); }}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${language === 'fr' ? 'bg-orange-50 text-[#F05A28] font-medium' : 'text-gray-700'}`}
                    >
                      Français
                    </button>
                    <button
                      onClick={() => { setLanguage('ar'); setLangMenuOpen(false); }}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${language === 'ar' ? 'bg-orange-50 text-[#F05A28] font-medium' : 'text-gray-700'}`}
                    >
                      العربية
                    </button>
                    <button
                      onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${language === 'en' ? 'bg-orange-50 text-[#F05A28] font-medium' : 'text-gray-700'}`}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </button>

              {user && (
                <a href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex">
                  <Heart className="w-5 h-5 text-gray-700" />
                </a>
              )}

              <button
                onClick={onCartClick}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F05A28] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="relative group hidden sm:block">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                    <User className="w-5 h-5 text-gray-700" />
                    {profile?.role === 'book_club' && (
                      <BookMarked className="w-3 h-3 text-blue-600 absolute -top-0.5 -right-0.5 bg-white rounded-full" />
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {profile?.role === 'book_club' && (
                      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700">
                          <BookMarked className="w-4 h-4" />
                          <span className="text-xs font-semibold">Membre du Club de Lecture</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-0.5">30% de réduction sur tous les livres</p>
                      </div>
                    )}
                    <a href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      {t('nav.dashboard')}
                    </a>
                    <a href="/library" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      {language === 'fr' ? 'Ma Bibliothèque' : language === 'ar' ? 'مكتبتي' : 'My Library'}
                    </a>
                    <a href="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      {t('dashboard.orders')}
                    </a>
                    {profile?.is_admin && (
                      <a href="/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        <Shield className="w-4 h-4 inline-block mr-2" />
                        {t('nav.admin')}
                      </a>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <a href="/login" className="hidden sm:block">
                  <Button variant="primary" size="sm">
                    {t('nav.login')}
                  </Button>
                </a>
              )}
            </div>
          </div>

          <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white absolute left-0 right-0 shadow-lg">
          <nav className="px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <a href="/books" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
              <BookOpen className="w-5 h-5" />
              {t('nav.books')}
            </a>
            {showEbooks && (
              <a href="/ebooks" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
                <BookOpen className="w-5 h-5" />
                {language === 'fr' ? 'eBooks' : language === 'ar' ? 'الكتب الإلكترونية' : 'eBooks'}
              </a>
            )}
            <a href="/audiobooks" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
              <Headphones className="w-5 h-5" />
              {language === 'fr' ? 'Livres Audio' : language === 'ar' ? 'الكتب الصوتية' : 'Audiobooks'}
            </a>
            <a href="/blog" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
              <PenTool className="w-5 h-5" />
              {language === 'fr' ? 'Blog' : language === 'ar' ? 'المدونة' : 'Blog'}
            </a>
            <a href="/categories" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
              {t('footer.categories')}
            </a>
            <a href="/authors" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
              <User className="w-5 h-5" />
              {language === 'fr' ? 'Auteurs' : language === 'ar' ? 'المؤلفون' : 'Authors'}
            </a>

            {user && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <a href="/library" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
                  <BookOpen className="w-5 h-5" />
                  {language === 'fr' ? 'Ma Bibliothèque' : language === 'ar' ? 'مكتبتي' : 'My Library'}
                </a>
                <a href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
                  <User className="w-5 h-5" />
                  {t('nav.dashboard')}
                </a>
                <a href="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {t('dashboard.orders')}
                </a>
                <a href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors">
                  <Heart className="w-5 h-5" />
                  {language === 'fr' ? 'Favoris' : language === 'ar' ? 'المفضلة' : 'Wishlist'}
                </a>
              </>
            )}

            {profile?.is_admin && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <a href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 bg-[#F05A28] text-white hover:bg-[#d94d20] font-medium rounded-lg transition-colors">
                  <Shield className="w-5 h-5" />
                  {t('nav.admin')}
                </a>
              </>
            )}

            <div className="border-t border-gray-200 my-2"></div>

            <button
              onClick={() => {
                setSearchOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 py-3 px-3 w-full text-gray-700 hover:bg-gray-50 hover:text-[#F05A28] font-medium rounded-lg transition-colors text-left"
            >
              <Search className="w-5 h-5" />
              {language === 'fr' ? 'Rechercher' : language === 'ar' ? 'بحث' : 'Search'}
            </button>

            <div className="space-y-1 pt-2">
              <p className="px-3 text-sm font-medium text-gray-500 mb-2">
                {language === 'fr' ? 'Langue' : language === 'ar' ? 'اللغة' : 'Language'}
              </p>
              <button
                onClick={() => { setLanguage('fr'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 py-2 px-3 w-full rounded-lg transition-colors ${language === 'fr' ? 'bg-orange-50 text-[#F05A28] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Français
              </button>
              <button
                onClick={() => { setLanguage('ar'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 py-2 px-3 w-full rounded-lg transition-colors ${language === 'ar' ? 'bg-orange-50 text-[#F05A28] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                العربية
              </button>
              <button
                onClick={() => { setLanguage('en'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 py-2 px-3 w-full rounded-lg transition-colors ${language === 'en' ? 'bg-orange-50 text-[#F05A28] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                English
              </button>
            </div>

            {user ? (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-3 px-3 w-full text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors text-left"
                >
                  <X className="w-5 h-5" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <a href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button variant="primary" className="w-full">
                    {t('nav.login')}
                  </Button>
                </a>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
