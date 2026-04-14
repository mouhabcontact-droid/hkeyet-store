import React, { useState } from 'react';
import { X, Package, User, Phone, MapPin, CreditCard, Calendar } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { formatCurrency } from '../utils/currency';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onUpdate: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'En traitement', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Expédié', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Livré', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' },
];

export function OrderDetailsModal({ isOpen, onClose, order, onUpdate }: OrderDetailsModalProps) {
  const { showToast } = useToast();
  const [status, setStatus] = useState(order?.status || 'pending');
  const [notes, setNotes] = useState(order?.notes || '');
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, notes })
        .eq('id', order.id);

      if (error) throw error;

      showToast('Order updated successfully!', 'success');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating order:', error);
      showToast('Failed to update order', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Détails de la commande</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#F05A28]" />
                Informations de commande
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro:</span>
                  <span className="font-mono font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant total:</span>
                  <span className="font-bold text-[#F05A28]">
                    {formatCurrency(order.total_amount, 'fr')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode de paiement:</span>
                  <span className="font-medium capitalize">{order.payment_method?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut de paiement:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    order.payment_status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status === 'completed' ? 'Payé' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#F05A28]" />
                Informations client
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Nom complet</p>
                  <p className="font-medium">{order.shipping_name}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Téléphone
                  </p>
                  <p className="font-medium">{order.phone || 'Non fourni'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Adresse de livraison
                  </p>
                  <p className="font-medium">
                    {order.shipping_address}<br />
                    {order.shipping_city}, {order.shipping_postal_code}<br />
                    {order.shipping_country}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">Articles commandés</h3>
            <div className="space-y-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 bg-white p-3 rounded">
                  <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
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
                  <div className="flex-1">
                    <p className="font-medium">{item.books?.title}</p>
                    <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                    <p className="text-sm font-bold text-[#F05A28]">
                      {formatCurrency(item.price, 'fr')} × {item.quantity} = {formatCurrency(item.price * item.quantity, 'fr')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">Gestion de la commande</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut de la commande
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${currentStatus?.color}`}>
                    {currentStatus?.label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes administrateur
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F05A28] focus:border-transparent"
                  placeholder="Ajouter des notes sur cette commande..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={updating}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={handleUpdateStatus}
              disabled={updating}
            >
              {updating ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
