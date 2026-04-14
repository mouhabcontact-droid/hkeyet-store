import React, { useState } from 'react';
import { BookOpen, Mail, MapPin, Phone, Facebook, Twitter, Instagram } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email }]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Cet email est déjà abonné');
        } else {
          throw insertError;
        }
      } else {
        setSubscribed(true);
        setEmail('');
      }
    } catch (err) {
      console.error('Erreur d\'abonnement:', err);
      setError('Échec de l\'abonnement. Veuillez réessayer.');
    }
  };

  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/Untitled_design.png" alt="HKEYET Publishing" className="h-16 w-auto" />
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Des Histoires Qui Vivent Pour Toujours. Votre destination privilégiée pour la littérature intemporelle et les chefs-d'œuvre contemporains.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-gray-800 hover:bg-[#F05A28] rounded-full transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-[#F05A28] rounded-full transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-[#F05A28] rounded-full transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold mb-6">Explorer</h3>
            <ul className="space-y-3">
              <li><a href="/books" className="text-gray-400 hover:text-[#F05A28] transition-colors">Tous les Livres</a></li>
              <li><a href="/categories" className="text-gray-400 hover:text-[#F05A28] transition-colors">Catégories</a></li>
              <li><a href="/authors" className="text-gray-400 hover:text-[#F05A28] transition-colors">Auteurs</a></li>
              <li><a href="/blog" className="text-gray-400 hover:text-[#F05A28] transition-colors">Blog</a></li>
              <li><a href="/bestsellers" className="text-gray-400 hover:text-[#F05A28] transition-colors">Meilleures Ventes</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold mb-6">Support</h3>
            <ul className="space-y-3">
              <li><a href="/about" className="text-gray-400 hover:text-[#F05A28] transition-colors">À Propos de HKEYET</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-[#F05A28] transition-colors">Nous Contacter</a></li>
              <li><a href="/shipping" className="text-gray-400 hover:text-[#F05A28] transition-colors">Infos Livraison</a></li>
              <li><a href="/returns" className="text-gray-400 hover:text-[#F05A28] transition-colors">Retours</a></li>
              <li><a href="/faq" className="text-gray-400 hover:text-[#F05A28] transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold mb-6">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Abonnez-vous pour des offres exclusives et des actualités littéraires.
            </p>
            {subscribed ? (
              <div className="bg-green-900/30 border border-green-700 text-green-400 p-4 rounded-lg">
                Merci de vous être abonné!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button type="submit" variant="primary" className="w-full">
                  S'abonner
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2026 HKEYET Publishing. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="/privacy" className="text-gray-400 hover:text-[#F05A28] transition-colors">
              Politique de Confidentialité
            </a>
            <a href="/terms" className="text-gray-400 hover:text-[#F05A28] transition-colors">
              Conditions d'Utilisation
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
