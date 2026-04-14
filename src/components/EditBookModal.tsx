import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book: any;
}

export function EditBookModal({ isOpen, onClose, onSuccess, book }: EditBookModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    isbn: '',
    pages: '',
    category_id: '',
    publisher: '',
    release_date: '',
    is_featured: false,
    is_bestseller: false,
    is_new_release: false,
  });

  useEffect(() => {
    if (isOpen && book) {
      setFormData({
        title: book.title || '',
        description: book.description || '',
        price: book.price?.toString() || '',
        stock: book.stock?.toString() || '',
        isbn: book.isbn || '',
        pages: book.pages?.toString() || '',
        category_id: book.category_id || '',
        publisher: book.publisher || '',
        release_date: book.release_date || '',
        is_featured: book.is_featured || false,
        is_bestseller: book.is_bestseller || false,
        is_new_release: book.is_new_release || false,
      });
      fetchCategories();
    }
  }, [isOpen, book]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        isbn: formData.isbn,
        pages: parseInt(formData.pages, 10) || null,
        category_id: formData.category_id || null,
        publisher: formData.publisher,
        release_date: formData.release_date,
        is_featured: formData.is_featured,
        is_bestseller: formData.is_bestseller,
        is_new_release: formData.is_new_release,
      };

      console.log('Mise à jour du livre avec les données:', updateData);

      const { data, error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', book.id)
        .select();

      if (error) throw error;

      console.log('Livre mis à jour avec succès:', data);
      showToast('Livre mis à jour avec succès!', 'success');

      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du livre:', error);
      showToast(error.message || 'Échec de la mise à jour du livre', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Modifier le Livre</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISBN
              </label>
              <Input
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (TND) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-[#F05A28] outline-none"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pages
              </label>
              <Input
                type="number"
                value={formData.pages}
                onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Éditeur
              </label>
              <Input
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Sortie
              </label>
              <Input
                type="date"
                value={formData.release_date}
                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-[#F05A28] outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-[#F05A28] rounded focus:ring-[#F05A28]"
              />
              <span className="text-sm font-medium text-gray-700">Livre en Vedette</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_bestseller}
                onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                className="w-4 h-4 text-[#F05A28] rounded focus:ring-[#F05A28]"
              />
              <span className="text-sm font-medium text-gray-700">Meilleure Vente</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_new_release}
                onChange={(e) => setFormData({ ...formData, is_new_release: e.target.checked })}
                className="w-4 h-4 text-[#F05A28] rounded focus:ring-[#F05A28]"
              />
              <span className="text-sm font-medium text-gray-700">Nouvelle Sortie</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Mise à jour en cours...' : 'Mettre à Jour le Livre'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
