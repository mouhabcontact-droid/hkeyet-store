import React, { useEffect, useState } from 'react';
import { Package, ChevronRight, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';
import { formatCurrency } from '../utils/currency';

export function Orders() {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [user, authLoading]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, books(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return language === 'ar' ? 'قيد الانتظار' : language === 'en' ? 'Pending' : 'En attente';
      case 'processing':
        return language === 'ar' ? 'قيد المعالجة' : language === 'en' ? 'Processing' : 'En traitement';
      case 'shipped':
        return language === 'ar' ? 'تم الشحن' : language === 'en' ? 'Shipped' : 'Expédié';
      case 'delivered':
        return language === 'ar' ? 'تم التسليم' : language === 'en' ? 'Delivered' : 'Livré';
      case 'cancelled':
        return language === 'ar' ? 'ملغي' : language === 'en' ? 'Cancelled' : 'Annulé';
      default:
        return status;
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-900 to-black text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-2 sm:mb-4">
            {t('dashboard.orders')}
          </h1>
          <p className="text-base sm:text-xl text-gray-300">
            {language === 'ar' ? 'تتبع طلباتك' : language === 'en' ? 'Track your orders' : 'Suivez vos commandes'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <Package className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد طلبات' : language === 'en' ? 'No orders yet' : 'Aucune commande'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {language === 'ar' ? 'ابدأ التسوق لإنشاء طلبك الأول' : language === 'en' ? 'Start shopping to create your first order' : 'Commencez à magasiner pour créer votre première commande'}
            </p>
            <a
              href="/books"
              className="inline-block px-6 py-3 bg-[#F05A28] text-white rounded-lg hover:bg-[#D94D1F] transition-colors"
            >
              {language === 'ar' ? 'تصفح الكتب' : language === 'en' ? 'Browse Books' : 'Parcourir les livres'}
            </a>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        {language === 'ar' ? 'الطلب' : language === 'en' ? 'Order' : 'Commande'} #{order.order_number}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        {new Date(order.created_at).toLocaleDateString(
                          language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-US' : 'fr-FR',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs sm:text-sm rounded-full font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight
                          className={`w-5 h-5 text-gray-600 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm text-gray-600">
                        {order.order_items?.length || 0} {language === 'ar' ? 'عناصر' : language === 'en' ? 'items' : 'articles'}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-[#F05A28]">
                        {formatCurrency(order.total_amount, language)}
                      </div>
                    </div>
                  </div>

                  {selectedOrder?.id === order.id && (
                    <div className="mt-6 pt-6 border-t space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#F05A28]" />
                            {language === 'ar' ? 'عنوان الشحن' : language === 'en' ? 'Shipping Address' : 'Adresse de livraison'}
                          </h4>
                          <p className="text-sm sm:text-base text-gray-600">{order.shipping_name}</p>
                          <p className="text-sm sm:text-base text-gray-600">{order.shipping_address}</p>
                          <p className="text-sm sm:text-base text-gray-600">
                            {order.shipping_city}, {order.shipping_postal_code}
                          </p>
                          <p className="text-sm sm:text-base text-gray-600 mt-2 flex items-center gap-2">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                            {order.shipping_phone}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            {language === 'ar' ? 'العناصر المطلوبة' : language === 'en' ? 'Order Items' : 'Articles commandés'}
                          </h4>
                          <div className="space-y-3">
                            {order.order_items?.map((item: any) => (
                              <div key={item.id} className="flex gap-3">
                                <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
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
                                  <p className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2">
                                    {item.books?.title}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    {language === 'ar' ? 'الكمية' : language === 'en' ? 'Qty' : 'Qté'}: {item.quantity}
                                  </p>
                                  <p className="text-xs sm:text-sm font-medium text-[#F05A28] mt-1">
                                    {formatCurrency(item.price, language)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
