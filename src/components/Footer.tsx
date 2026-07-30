import React from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Diamond } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Footer() {
  const { branches, storeSettings } = useApp();

  const footerBranches = branches.map(b => ({
    name: b.name,
    address: `${b.address}, ${b.city}`,
    phone: b.phone,
    hours: b.openingHours?.monday || '—',
  }));

  return (
    <footer className="bg-charcoal-950 border-t border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header del Footer */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center mb-4">
            {storeSettings.logoUrl ? (
              <img src={storeSettings.logoUrl} alt="logo" className="h-8 w-8 object-cover rounded-lg border border-gold-500/30 mr-3" />
            ) : (
              <Diamond className="h-8 w-8 text-gold-400 mr-3" />
            )}
            <h2 className="font-luxury text-3xl sm:text-4xl font-semibold text-gradient-gold tracking-wide">
              {storeSettings.storeName}
            </h2>
          </div>
          <div className="luxury-divider w-32 mx-auto mb-6" />
          <p className="text-platinum-300 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Más de 25 años creando momentos únicos con joyería de la más alta calidad.
            Especialistas en anillos de compromiso y piezas personalizadas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Información de la Empresa */}
          <div className="lg:col-span-1">
            <h3 className="font-luxury text-xl font-semibold text-gold-400 mb-4 tracking-wide">
              Nuestra Historia
            </h3>
            <p className="text-platinum-300 mb-4 font-light text-sm leading-relaxed">
              Fundada en 1998, {storeSettings.storeName} se ha consolidado como la joyería de confianza
              para momentos especiales. Ofrecemos piezas únicas con certificación internacional.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-silver-400 hover:text-gold-400 transition-colors duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-silver-400 hover:text-gold-400 transition-colors duration-300">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-silver-400 hover:text-gold-400 transition-colors duration-300">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Sucursales */}
          <div className="lg:col-span-3">
            <h3 className="font-luxury text-xl font-semibold text-gold-400 mb-6 tracking-wide">
              Nuestras Sucursales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {footerBranches.map((branch, index) => (
                <div key={index} className="luxury-card p-5 rounded-xl">
                  <h4 className="font-luxury text-lg font-semibold text-white mb-3">{branch.name}</h4>
                  <div className="space-y-2 text-sm font-light">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gold-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-platinum-300">{branch.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gold-400 mr-2" />
                      <span className="text-platinum-300">{branch.phone}</span>
                    </div>
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 text-gold-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-platinum-300">{branch.hours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mapa y Contacto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Mapa */}
          <div className="luxury-card p-5 rounded-xl">
            <h3 className="font-luxury text-xl font-semibold text-gold-400 mb-4 tracking-wide">
              Cómo Llegar
            </h3>
            <div className="aspect-video bg-charcoal-800 rounded-lg overflow-hidden border border-silver-500/20">
              <iframe
                src="https://www.google.com/maps/@-37.4867772,-72.3419136,14z?entry=ttu&g_ep=EgoyMDI2MDEyNi4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downlight"
                className="filter grayscale hover:grayscale-0 transition-all duration-500"
              ></iframe>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="luxury-card p-5 rounded-xl">
            <h3 className="font-luxury text-xl font-semibold text-gold-400 mb-4 tracking-wide">
              Contacto General
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gold-400 mr-3" />
                <div>
                  <p className="text-white font-medium text-sm">Email Principal</p>
                  <p className="text-platinum-300 font-light text-sm">info@diamantereal.com</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gold-400 mr-3" />
                <div>
                  <p className="text-white font-medium text-sm">Línea de Atención</p>
                  <p className="text-platinum-300 font-light text-sm"> (569) 41228089</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gold-400 mr-3 mt-1" />
                <div>
                  <p className="text-white font-medium text-sm">Horario de Atención</p>
                  <p className="text-platinum-300 font-light text-sm">
                    Lunes a Viernes: 9:00 AM - 7:00 PM<br />
                    Sábados: 10:00 AM - 8:00 PM<br />
                    Domingos: 12:00 PM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Servicios */}
            <div className="mt-6 pt-6 border-t border-platinum-700/20">
              <h4 className="font-luxury text-lg font-semibold text-white mb-3">Servicios Especiales</h4>
              <ul className="text-platinum-300 text-sm space-y-1.5 font-light">
                <li>• Diseño y fabricación personalizada</li>
                <li>• Reparación y mantenimiento</li>
                <li>• Evaluación y certificación</li>
                <li>• Grabado láser</li>
                <li>• Financiamiento disponible</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Certificaciones y Garantías */}
        <div className="luxury-card p-6 rounded-xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-3 shadow-gold">
                <Diamond className="h-8 w-8 text-charcoal-950" />
              </div>
              <h4 className="font-luxury text-lg font-semibold text-white mb-2">Certificación GIA</h4>
              <p className="text-platinum-300 text-sm font-light leading-relaxed">
                Todos nuestros diamantes cuentan con certificación internacional GIA
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-silver-gradient rounded-full flex items-center justify-center mx-auto mb-3 shadow-silver">
                <Clock className="h-8 w-8 text-charcoal-950" />
              </div>
              <h4 className="font-luxury text-lg font-semibold text-white mb-2">Garantía Asegurada</h4>
              <p className="text-platinum-300 text-sm font-light leading-relaxed">
                Garantía completa en manufactura y mantenimiento gratuito
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-platinum-gradient rounded-full flex items-center justify-center mx-auto mb-3 shadow-platinum">
                <Mail className="h-8 w-8 text-charcoal-950" />
              </div>
              <h4 className="font-luxury text-lg font-semibold text-white mb-2">Envío Asegurado</h4>
              <p className="text-platinum-300 text-sm font-light leading-relaxed">
                Envío gratuito y asegurado a nivel nacional e internacional
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-platinum-700/20 pt-6 text-center">
          <p className="text-platinum-400 text-sm font-light">
            © 2024 {storeSettings.storeName}. Todos los derechos reservados. |
            <span className="text-gold-400"> Joyería de Lujo desde 1998</span>
          </p>
          <p className="text-platinum-500 text-xs mt-2 font-light">
            BJ soluciones informaticas
          </p>
        </div>
      </div>
    </footer>
  );
}
