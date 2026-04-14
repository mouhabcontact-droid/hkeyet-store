import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, ShoppingBag, BookMarked } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';
import { applyBookClubDiscount, isBookClubMember } from '../utils/bookClubDiscount';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isBookClub = isBookClubMember(profile?.role);

  useEffect(() => {
    if (isOpen && user) {
      fetchCart();
    }
  }, [isOpen, user]);

  const fetchCart = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          books:book_id (
            id,
            title,
            cover_url,
            price,
            stock,
            slug
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération du panier:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number, stockAvailable: number) => {
    if (newQuantity < 1) return;

    if (newQuantity > stockAvailable) {
      alert(`Stock insuffisant. Seulement ${stockAvailable} disponible(s).`);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
    }
  };

  const total = cartItems.reduce((sum, item) => {
    const itemPrice = applyBookClubDiscount(item.books?.price || 0, profile?.role);
    return sum + itemPrice * item.quantity;
  }, 0);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-serif font-bold">Panier</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Veuillez Vous Connecter</h3>
            <p className="text-gray-600 mb-6">Connectez-vous pour voir votre panier et effectuer des achats</p>
            <a href="/login">
              <Button variant="primary">Se Connecter</Button>
            </a>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Votre panier est vide</h3>
            <p className="text-gray-600 mb-6">Ajoutez des livres pour commencer</p>
            <Button variant="primary" onClick={onClose}>
              Continuer Vos Achats
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="w-20 h-28 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                      {item.books?.cover_url ? (
                        <img
                          src={item.books.cover_url}
                          alt={item.books.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Cover
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                        {item.books?.title}
                      </h4>
                      {isBookClub ? (
                        <div className="flex items-center gap-2 mb-3">
                          <BookMarked className="w-3 h-3 text-blue-600" />
                          <div className="flex flex-col">
                            <p className="text-lg font-bold text-[#F05A28]">
                              {applyBookClubDiscount(item.books?.price || 0, profile?.role).toFixed(2)} TND
                            </p>
                            <p className="text-xs text-gray-400 line-through">
                              {(item.books?.price || 0).toFixed(2)} TND
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-[#F05A28] mb-3">
                          {(item.books?.price || 0).toFixed(2)} TND
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.books?.stock || 0)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.books?.stock || 0)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 text-sm hover:text-red-700 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t p-6 space-y-4">
              {isBookClub && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <BookMarked className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-700">Membre du Club de Lecture</p>
                    <p className="text-xs text-blue-600">30% de réduction appliquée sur tous les livres</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-[#F05A28]">
                  {total.toFixed(2)} TND
                </span>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
              >
                Passer à la Caisse
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Continuer Vos Achats
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
