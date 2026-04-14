import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Package, CheckCircle, Tag, X, BookMarked } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';
import { formatCurrency } from '../utils/currency';
import { validatePromoCode, calculateDiscount, calculateTotal } from '../utils/promoCode';
import { applyBookClubDiscount, isBookClubMember } from '../utils/bookClubDiscount';

export function Checkout() {
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isBookClub = isBookClubMember(profile?.role);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    id: string;
    code: string;
    discountPercentage: number;
  } | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState(5.99);
  const [showVisaLogo, setShowVisaLogo] = useState(true);
  const [showPaypalLogo, setShowPaypalLogo] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    paymentMethod: 'credit_card',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
    fetchDeliveryPrice();
  }, [user]);

  const fetchDeliveryPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['delivery_price', 'show_visa_logo', 'show_paypal_logo']);

      console.log('Settings data:', data, error);
      if (data) {
        const deliveryData = data.find(s => s.key === 'delivery_price');
        if (deliveryData?.value) {
          const price = parseFloat(deliveryData.value);
          console.log('Setting delivery price to:', price);
          setDeliveryPrice(price);
        }

        const visaData = data.find(s => s.key === 'show_visa_logo');
        if (visaData) {
          setShowVisaLogo(visaData.value === 'true');
        }

        const paypalData = data.find(s => s.key === 'show_paypal_logo');
        if (paypalData) {
          setShowPaypalLogo(paypalData.value === 'true');
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

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
            stock
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        navigate('/books');
        return;
      }

      setCartItems(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      showToast('Failed to load cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = applyBookClubDiscount(item.books?.price || 0, profile?.role);
    return sum + itemPrice * item.quantity;
  }, 0);

  const discountAmount = appliedPromo ? calculateDiscount(subtotal, appliedPromo.discountPercentage) : 0;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const shipping = subtotalAfterDiscount > 150 ? 0 : deliveryPrice;
  const total = subtotalAfterDiscount + shipping;

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !user) return;

    if (isBookClub) {
      showToast('Book club members cannot use promo codes', 'error');
      return;
    }

    setPromoValidating(true);
    try {
      const result = await validatePromoCode(promoCode, user.id);

      if (result.valid && result.promoCodeId) {
        setAppliedPromo({
          id: result.promoCodeId,
          code: promoCode.toUpperCase(),
          discountPercentage: result.discountPercentage,
        });
        showToast(`Promo code applied! ${result.discountPercentage}% off`, 'success');
        setPromoCode('');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to validate promo code', 'error');
    } finally {
      setPromoValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    showToast('Promo code removed', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      for (const item of cartItems) {
        if (!item.books || item.books.stock < item.quantity) {
          showToast(`${item.books?.title || 'Un livre'} n'a pas assez de stock disponible`, 'error');
          setSubmitting(false);
          return;
        }
      }

      const orderNum = `ORD-${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user!.id,
          order_number: orderNum,
          status: 'pending',
          subtotal: subtotal,
          discount_amount: discountAmount,
          total_amount: total,
          promo_code_id: appliedPromo?.id || null,
          phone: formData.phone,
          shipping_name: formData.fullName,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_postal_code: formData.postalCode,
          shipping_country: formData.country,
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        book_id: item.book_id,
        quantity: item.quantity,
        price: item.books.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (appliedPromo) {
        await supabase
          .from('promo_code_usage')
          .insert([{
            promo_code_id: appliedPromo.id,
            order_id: order.id,
            user_id: user!.id,
            discount_amount: discountAmount,
          }]);

        await supabase.rpc('increment_promo_usage', {
          p_promo_code_id: appliedPromo.id,
        });
      }

      for (const item of cartItems) {
        await supabase
          .from('user_activity')
          .insert([{
            user_id: user!.id,
            book_id: item.book_id,
            activity_type: 'purchase',
          }]);

        const currentStock = item.books?.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        const newSales = (item.books?.total_sales || 0) + item.quantity;

        await supabase
          .from('books')
          .update({
            stock: newStock,
            total_sales: newSales
          })
          .eq('id', item.book_id);
      }

      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user!.id);

      setOrderNumber(orderNum);
      setOrderComplete(true);
      showToast('Order placed successfully!', 'success');
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]" />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-4">
            {t('checkout.success')}
          </h1>

          <p className="text-gray-600 mb-6">
            {t('checkout.thankYou')}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">{t('checkout.orderNumber')}</p>
            <p className="font-mono font-bold text-lg text-[#F05A28]">{orderNumber}</p>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              {t('checkout.viewOrder')}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/books')}
            >
              {t('cart.continueShopping')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/books')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#F05A28] transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        <h1 className="font-serif text-4xl font-bold text-gray-900 mb-8">{t('checkout.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="w-6 h-6 text-[#F05A28]" />
                  <h2 className="text-xl font-semibold">{t('checkout.shipping')}</h2>
                </div>

                <div className="space-y-4">
                  <Input
                    label={t('checkout.fullName')}
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />

                  <Input
                    label={t('checkout.phone')}
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+216 XX XXX XXX"
                    required
                  />

                  <Input
                    label={t('checkout.address')}
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t('checkout.city')}
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />

                    <Input
                      label={t('checkout.postalCode')}
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                    />
                  </div>

                  <Input
                    label={t('checkout.country')}
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-[#F05A28]" />
                  <h2 className="text-xl font-semibold">{t('checkout.payment')}</h2>
                </div>

                <div className="space-y-3">
                  {showVisaLogo && (
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === 'credit_card'
                        ? 'border-[#F05A28] bg-orange-50'
                        : 'border-gray-200 hover:border-[#F05A28]'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="credit_card"
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">{t('checkout.creditCard')}</p>
                        <p className="text-sm text-gray-500">{t('checkout.creditCard.desc')}</p>
                      </div>
                    </label>
                  )}

                  {showPaypalLogo && (
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === 'paypal'
                        ? 'border-[#F05A28] bg-orange-50'
                        : 'border-gray-200 hover:border-[#F05A28]'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={formData.paymentMethod === 'paypal'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">{t('checkout.paypal')}</p>
                        <p className="text-sm text-gray-500">{t('checkout.paypal.desc')}</p>
                      </div>
                    </label>
                  )}

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.paymentMethod === 'cash_on_delivery'
                      ? 'border-[#F05A28] bg-orange-50'
                      : 'border-gray-200 hover:border-[#F05A28]'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cash_on_delivery"
                      checked={formData.paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">{t('checkout.cod')}</p>
                      <p className="text-sm text-gray-500">{t('checkout.cod.desc')}</p>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? t('checkout.processing') : `${t('checkout.placeOrder')} - ${formatCurrency(total, language)}`}
              </Button>
            </form>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">{t('checkout.orderSummary')}</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{item.books?.title}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-[#F05A28]">
                        {formatCurrency((item.books?.price || 0) * item.quantity, language)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {isBookClub && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <BookMarked className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-700">Book Club Member Discount Applied</p>
                    <p className="text-xs text-blue-600">30% off on all books</p>
                  </div>
                </div>
              )}

              {!isBookClub && (
                <div className="border-t pt-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <h3 className="font-medium text-sm">Promo Code</h3>
                  </div>

                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-mono font-bold text-green-700">{appliedPromo.code}</p>
                          <p className="text-xs text-green-600">{appliedPromo.discountPercentage}% discount applied</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="p-1 hover:bg-green-100 rounded transition-colors"
                        title="Remove promo code"
                      >
                        <X className="w-4 h-4 text-green-700" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 font-mono"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyPromo();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={!promoCode.trim() || promoValidating}
                        className="whitespace-nowrap"
                      >
                        {promoValidating ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('cart.subtotal')}</span>
                  <span className="font-medium">{formatCurrency(subtotal, language)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount ({appliedPromo.discountPercentage}%)</span>
                    <span className="font-medium text-green-600">-{formatCurrency(discountAmount, language)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('cart.shipping')}</span>
                  <span className="font-medium">
                    {shipping === 0 ? t('checkout.freeShipping') : formatCurrency(shipping, language)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-lg">{t('cart.total')}</span>
                  <span className="font-bold text-2xl text-[#F05A28]">
                    {formatCurrency(total, language)}
                  </span>
                </div>
              </div>

              {subtotal < 150 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Add {formatCurrency(150 - subtotal, language)} more for free shipping!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
