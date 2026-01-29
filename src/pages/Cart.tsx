import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Cart() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, completePurchase } = useApp();

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const sendToWhatsApp = () => {
    if (cart.length === 0) return;

    let message = '¡Hola! Me interesan estos productos de Diamante Real:\n\n';
    
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
        message += `   • ✨ Personalizable (${item.product.craftingTime} días)\n`;
      }
      message += `   • Subtotal: $${(item.product.price * item.quantity).toLocaleString()}\n\n`;
    });
    
    message += `*TOTAL: $${total.toLocaleString()}*\n\n`;
    message += 'Me gustaría recibir más información sobre estos productos y conocer las opciones de pago y entrega. ¡Gracias!';
    
    const phoneNumber = '941228089'; // Reemplazar con el número  de WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-500 mb-6">
            Explora nuestros productos y agrega algunos al carrito
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Carrito de Compras</h1>
          <Link
            to="/"
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Seguir comprando
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                  <p className="text-gray-600">${item.product.price.toLocaleString()}</p>
                  <div className="text-sm text-gray-500">
                    <p>Material: {item.product.material}</p>
                    <p>Sucursal: {item.product.branchName}</p>
                    {item.product.gemstone && <p>Gemas: {item.product.gemstone}</p>}
                    {item.product.isCustomizable && (
                      <p className="text-purple-600">✨ Personalizable ({item.product.craftingTime} días)</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                ${total.toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={clearCart}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Vaciar carrito
              </button>
              <button
                onClick={sendToWhatsApp}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Enviar por WhatsApp</span>
              </button>
              <button 
                onClick={() => completePurchase()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Proceder al pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}