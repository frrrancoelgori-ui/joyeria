import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Phone, Image, Save, Loader2, MessageCircle, Diamond } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScrollReveal } from '../components/ScrollReveal';

export function Settings() {
  const { storeSettings, updateStoreSettings } = useApp();
  const [formData, setFormData] = useState({
    storeName: storeSettings.storeName,
    whatsappNumber: storeSettings.whatsappNumber,
    logoUrl: storeSettings.logoUrl || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      storeName: storeSettings.storeName,
      whatsappNumber: storeSettings.whatsappNumber,
      logoUrl: storeSettings.logoUrl || '',
    });
  }, [storeSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateStoreSettings({
      storeName: formData.storeName,
      whatsappNumber: formData.whatsappNumber.replace(/\s+/g, ''),
      logoUrl: formData.logoUrl || null,
    });
    setSaving(false);
  };

  const whatsappPreview = formData.whatsappNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-luxury text-2xl sm:text-3xl md:text-4xl font-semibold text-gradient-gold tracking-wide">
            Configuración de la Tienda
          </h1>
          <p className="text-platinum-400 text-sm mt-1 font-light tracking-wide">
            Personaliza el nombre, WhatsApp y foto de tu joyería
          </p>
        </div>

        <ScrollReveal>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Store Name */}
            <div className="luxury-card rounded-xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-gold-500/10 border border-gold-500/30">
                  <Store className="h-5 w-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-luxury text-lg font-semibold text-white">Nombre de la Tienda</h3>
                  <p className="text-xs text-platinum-400">Aparece en el encabezado, pie de página y login</p>
                </div>
              </div>
              <input
                type="text"
                value={formData.storeName}
                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                className="luxury-input w-full py-3 px-4 rounded-lg"
                placeholder="Diamante Real"
                required
              />
            </div>

            {/* WhatsApp Number */}
            <div className="luxury-card rounded-xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/30">
                  <MessageCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-luxury text-lg font-semibold text-white">Número de WhatsApp</h3>
                  <p className="text-xs text-platinum-400">Los clientes contactan a este número desde el carrito</p>
                </div>
              </div>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="luxury-input w-full py-3 px-4 rounded-lg"
                placeholder="56941228089"
                required
              />
              <p className="text-xs text-platinum-500 mt-2">
                Incluye código de país sin signos ni espacios. Ej: 56941228089
              </p>
              {whatsappPreview && (
                <div className="mt-3 flex items-center gap-2 text-xs text-platinum-400">
                  <span>Vista previa del enlace:</span>
                  <code className="px-2 py-1 bg-black/30 rounded text-green-300">
                    wa.me/{whatsappPreview}
                  </code>
                </div>
              )}
            </div>

            {/* Logo / Store Photo */}
            <div className="luxury-card rounded-xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-gold-500/10 border border-gold-500/30">
                  <Image className="h-5 w-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-luxury text-lg font-semibold text-white">Foto / Logo de la Tienda</h3>
                  <p className="text-xs text-platinum-400">URL de la imagen que identifica tu marca</p>
                </div>
              </div>

              {formData.logoUrl && (
                <div className="relative h-40 rounded-lg overflow-hidden border border-platinum-700/30 mb-3">
                  <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 to-transparent" />
                </div>
              )}

              <input
                type="url"
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                className="luxury-input w-full py-3 px-4 rounded-lg"
                placeholder="https://images.pexels.com/..."
              />
              <p className="text-xs text-platinum-500 mt-2">
                Pega la URL de una imagen. Si lo dejas vacío, se mostrará el icono de diamante por defecto.
              </p>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-4 z-10">
              <button
                type="submit"
                disabled={saving}
                className="luxury-button w-full px-6 py-3.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Guardar Configuración</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </ScrollReveal>

        {/* Preview Card */}
        <ScrollReveal delay={0.2}>
          <div className="luxury-card rounded-xl p-5 sm:p-6 mt-6">
            <h3 className="font-luxury text-lg font-semibold text-gradient-gold mb-4">Vista Previa</h3>
            <div className="flex items-center gap-4 p-4 bg-black/20 rounded-lg">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo"
                  className="h-14 w-14 rounded-lg object-cover border border-gold-500/30 flex-shrink-0"
                />
              ) : (
                <div className="p-3 rounded-lg bg-gold-500/10 border border-gold-500/30 flex-shrink-0">
                  <Diamond className="h-7 w-7 text-gold-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-luxury text-xl font-semibold text-gradient-gold truncate">
                  {formData.storeName || 'Diamante Real'}
                </p>
                <p className="text-sm text-platinum-400 flex items-center gap-1.5 mt-1">
                  <MessageCircle className="h-3.5 w-3.5 text-green-400" />
                  WhatsApp: {whatsappPreview || '—'}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </motion.div>
  );
}
