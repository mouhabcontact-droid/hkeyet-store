import React from 'react';
import { ShoppingCart, Heart, BookMarked } from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/currency';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { applyBookClubDiscount, isBookClubMember } from '../utils/bookClubDiscount';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    cover_url: string | null;
    price: number;
    rating: number;
    slug: string;
  };
  authors?: { name: string }[];
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
  onClick?: () => void;
}

export function BookCard({ book, authors, onAddToCart, onAddToWishlist, onClick }: BookCardProps) {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const isBookClub = isBookClubMember(profile?.role);
  const displayPrice = applyBookClubDiscount(book.price, profile?.role);

  return (
    <div
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 flex-shrink-0">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            loading="eager"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            Pas de Couverture
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToWishlist?.();
          }}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </button>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="font-serif text-sm sm:text-lg font-semibold text-gray-900 line-clamp-2 mb-1 min-h-[2.5rem] sm:min-h-[3.5rem]">
            {book.title}
          </h3>

          {authors && authors.length > 0 && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-1">{authors[0].name}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isBookClub && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <BookMarked className="w-3 h-3 text-blue-600" />
                    <span className="text-base sm:text-xl font-bold text-[#F05A28]">
                      {formatCurrency(displayPrice, language)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 line-through">
                    {formatCurrency(book.price, language)}
                  </span>
                </div>
              )}
              {!isBookClub && (
                <span className="text-base sm:text-xl font-bold text-[#F05A28]">
                  {formatCurrency(book.price, language)}
                </span>
              )}
            </div>
            {book.rating > 0 && (
              <div className="flex items-center">
                <span className="text-yellow-500 text-xs sm:text-sm">★</span>
                <span className="text-xs sm:text-sm text-gray-600 ml-1">{book.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="flex items-center justify-center gap-1 sm:gap-2 w-full text-xs sm:text-sm py-1.5 sm:py-2"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Ajouter au Panier</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
