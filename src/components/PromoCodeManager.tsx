import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, X, Tag, TrendingUp, Calendar, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_percentage: number;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

interface PromoCodeFormData {
  code: string;
  description: string;
  discount_percentage: string;
  is_active: boolean;
  usage_limit: string;
  valid_from: string;
  valid_until: string;
}

export function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    description: '',
    discount_percentage: '',
    is_active: true,
    usage_limit: '',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const discountPercentage = parseInt(formData.discount_percentage);
      if (isNaN(discountPercentage) || discountPercentage < 1 || discountPercentage > 100) {
        setError('Discount must be between 1 and 100');
        return;
      }

      const promoData = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discount_percentage: discountPercentage,
        is_active: formData.is_active,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        updated_at: new Date().toISOString(),
      };

      if (editingCode) {
        const { error } = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingCode.id);

        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('promo_codes')
          .insert([{ ...promoData, created_by: user?.id }]);

        if (error) throw error;
      }

      await fetchPromoCodes();
      closeModal();
    } catch (err: any) {
      if (err.code === '23505') {
        setError('This promo code already exists');
      } else {
        setError(err.message || 'Failed to save promo code');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPromoCodes();
    } catch (err: any) {
      alert('Failed to delete promo code: ' + err.message);
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingCode(promoCode);
    setFormData({
      code: promoCode.code,
      description: promoCode.description,
      discount_percentage: promoCode.discount_percentage.toString(),
      is_active: promoCode.is_active,
      usage_limit: promoCode.usage_limit?.toString() || '',
      valid_from: promoCode.valid_from.slice(0, 16),
      valid_until: promoCode.valid_until ? promoCode.valid_until.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCode(null);
    setFormData({
      code: '',
      description: '',
      discount_percentage: '',
      is_active: true,
      usage_limit: '',
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: '',
    });
    setError('');
  };

  const toggleActive = async (promoCode: PromoCode) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !promoCode.is_active, updated_at: new Date().toISOString() })
        .eq('id', promoCode.id);

      if (error) throw error;
      await fetchPromoCodes();
    } catch (err: any) {
      alert('Failed to update promo code: ' + err.message);
    }
  };

  const isExpired = (promoCode: PromoCode) => {
    return promoCode.valid_until && new Date(promoCode.valid_until) < new Date();
  };

  const isLimitReached = (promoCode: PromoCode) => {
    return promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="w-8 h-8 text-[#F05A28]" />
          <h2 className="text-2xl font-bold">Promo Code Management</h2>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Create Promo Code
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Active Codes</h3>
          </div>
          <p className="text-3xl font-bold text-[#F05A28]">
            {promoCodes.filter(pc => pc.is_active && !isExpired(pc) && !isLimitReached(pc)).length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Total Usage</h3>
          </div>
          <p className="text-3xl font-bold text-[#F05A28]">
            {promoCodes.reduce((sum, pc) => sum + pc.usage_count, 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Total Codes</h3>
          </div>
          <p className="text-3xl font-bold text-[#F05A28]">{promoCodes.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No promo codes yet. Create your first one!
                  </td>
                </tr>
              ) : (
                promoCodes.map((promoCode) => (
                  <tr key={promoCode.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-mono font-bold text-[#F05A28]">{promoCode.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{promoCode.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-green-600">{promoCode.discount_percentage}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-semibold">{promoCode.usage_count}</span>
                        {promoCode.usage_limit && (
                          <span className="text-gray-500"> / {promoCode.usage_limit}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {promoCode.valid_until ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(promoCode.valid_until).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">No expiration</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => toggleActive(promoCode)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            promoCode.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {promoCode.is_active ? 'Active' : 'Inactive'}
                        </button>
                        {isExpired(promoCode) && (
                          <span className="text-xs text-red-600 dark:text-red-400">Expired</span>
                        )}
                        {isLimitReached(promoCode) && (
                          <span className="text-xs text-orange-600 dark:text-orange-400">Limit Reached</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(promoCode)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(promoCode.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {editingCode ? 'Edit Promo Code' : 'Create New Promo Code'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Promo Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER2024"
                    required
                    maxLength={50}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alphanumeric characters only, will be converted to uppercase</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Summer Sale - 25% off all books"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Discount Percentage <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="25"
                    required
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Usage Limit (Optional)
                  </label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Leave empty for unlimited usage"
                    min="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Valid From <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Valid Until (Optional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#F05A28] bg-gray-100 border-gray-300 rounded focus:ring-[#F05A28] focus:ring-2"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium">
                    Active (users can use this code)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCode ? 'Update Promo Code' : 'Create Promo Code'}
                  </Button>
                  <Button type="button" onClick={closeModal} className="flex-1 bg-gray-500 hover:bg-gray-600">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
