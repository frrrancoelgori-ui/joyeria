import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, MessageCircle, Sparkles, Diamond } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Cart() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, completePurchase, storeSettings } = useApp();

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const sendToWhatsApp = () => {
    if (cart.length === 0) return;

    let message = `¡Hola! Me interesan estos productos de ${storeSettings.storeName}:\n\n`;

    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   • Cantidad: ${item.quantity}\n`;
      message += `   • Precio: $${item.product.price.toLocaleString()}\n`;
      message += `   • Material: ${item.product.material}\n`;
      message += `   • Sucursal: ${item.product.branchName}\n`;
      if (item.product.gemstone) {
        message += `   • Gemas: ${item.product.gemstone}\n`;
      }
      if (item.product.isCustomizable) {
        message += `   • Personalizable (${item.product.craftingTime} días)\n`;
      }
      message += `   • Subtotal: $${(item.product.price * item.quantity).toLocaleString()}\n\n`;
    });

    message += `*TOTAL: $${total.toLocaleString()}*\n\n`;
    message += 'Me gustaría recibir más información sobre estos productos y conocer las opciones de pago y entrega. ¡Gracias!';

    const phoneNumber = storeSettings.whatsappNumber;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Diamond className="h-20 w-20 text-platinum-600 mx-auto mb-6" />
          <h2 className="font-luxury text-3xl font-semibold text-gradient-gold tracking-wide mb-3">
            Tu carrito está vacío
          </h2>
          <p className="text-platinum-400 mb-8 font-light">
            Explora nuestra colección y agrega piezas a tu carrito
          </p>
          <Link
            to="/"
            className="luxury-button px-6 py-3 rounded-lg inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Continuar comprando
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="font-luxury text-3xl sm:text-4xl font-semibold text-gradient-gold tracking-wide">
            Carrito de Compras
          </h1>
          <Link
            to="/"
            className="flex items-center text-platinum-300 hover:text-gold-400 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Seguir comprando
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-card rounded-2xl overflow-hidden"
        >
          <div className="p-4 sm:p-6">
            {cart.map((item, index) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-4 py-4 border-b border-platinum-700/20 last:border-b-0"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg border border-platinum-700/30 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{item.product.name}</h3>
                  <p className="text-gold-400 font-semibold">${item.product.price.toLocaleString()}</p>
                  <div className="text-xs text-platinum-400 font-light">
                    <p>Material: {item.product.material}</p>
                    <p>Sucursal: {item.product.branchName}</p>
                    {item.product.gemstone && <p>Gemas: {item.product.gemstone}</p>}
                    {item.product.isCustomizable && (
                      <p className="flex items-center gap-1 text-gold-300">
                        <Sparkles className="h-3 w-3" />
                        Personalizable ({item.product.craftingTime} días)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-platinum-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-platinum-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gold-400 whitespace-nowrap">
                    ${(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="bg-black/20 p-4 sm:p-6 border-t border-platinum-700/20">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-medium text-platinum-200">Total:</span>
              <span className="text-3xl font-luxury font-semibold text-gradient-gold">
                ${total.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={clearCart}
                className="px-6 py-3 border border-platinum-600/40 text-platinum-200 rounded-lg hover:bg-white/5 transition-colors"
              >
                Vaciar carrito
              </button>
              <button
                onClick={sendToWhatsApp}
                className="px-6 py-3 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-500/10 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => completePurchase()}
                className="luxury-button px-6 py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Proceder al pago</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
