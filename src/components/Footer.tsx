import React from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Diamond } from 'lucide-react';

export function Footer() {
  const branches = [
    {
      name: 'Diamante Real Centro',
      address: 'Av. Principal 123, Ciudad Principal',
      phone: '+1 (555) 123-4567',
      hours: 'Lun-Vie: 9:00-19:00, Sáb: 10:00-20:00'
    },
    {
      name: 'Diamante Real Plaza Norte',
      address: 'Centro Comercial Plaza Norte, Local 205',
      phone: '+1 (555) 234-5678',
      hours: 'Lun-Sáb: 10:00-21:00, Dom: 12:00-20:00'
    },
    {
      name: 'Diamante Real Boutique',
      address: 'Zona Rosa, Calle Exclusiva 456',
      phone: '+1 (555) 345-6789',
      hours: 'Lun-Sáb: 11:00-20:00, Dom: Cerrado'
    }
  ];

  return (
    <footer className="bg-charcoal-900 border-t-2 border-gold-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header del Footer */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Diamond className="h-8 w-8 text-gold-500 mr-3" />
            <h2 className="font-luxury text-3xl font-bold text-gradient-gold">
              Diamante Real
            </h2>
          </div>
          <p className="text-platinum-300 text-lg max-w-2xl mx-auto">
            Más de 25 años creando momentos únicos con joyería de la más alta calidad. 
            Especialistas en anillos de compromiso y piezas personalizadas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Información de la Empresa */}
          <div className="lg:col-span-1">
            <h3 className="font-luxury text-xl font-semibold text-gold-500 mb-4">
              Nuestra Historia
            </h3>
            <p className="text-platinum-300 mb-4">
              Fundada en 1998, Diamante Real se ha consolidado como la joyería de confianza 
              para momentos especiales. Ofrecemos piezas únicas con certificación internacional.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-silver-400 hover:text-gold-500 transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-silver-400 hover:text-gold-500 transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-silver-400 hover:text-gold-500 transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Sucursales */}
          <div className="lg:col-span-3">
            <h3 className="font-luxury text-xl font-semibold text-gold-500 mb-6">
              Nuestras Sucursales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branches.map((branch, index) => (
                <div key={index} className="luxury-card p-6 rounded-lg">
                  <h4 className="font-semibold text-white mb-3">{branch.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gold-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-platinum-300">{branch.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gold-500 mr-2" />
                      <span className="text-platinum-300">{branch.phone}</span>
                    </div>
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 text-gold-500 mr-2 mt-0.5 flex-shrink-0" />
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
          <div className="luxury-card p-6 rounded-lg">
            <h3 className="font-luxury text-xl font-semibold text-gold-500 mb-4">
              Cómo Llegar
            </h3>
            <div className="aspect-video bg-charcoal-800 rounded-lg overflow-hidden border-2 border-silver-500">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.8234567890123!2d-74.0059945!3d40.7127753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQyJzQ2LjAiTiA3NMKwMDAnMjEuNiJX!5e0!3m2!1sen!2sus!4v1234567890123"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="filter grayscale hover:grayscale-0 transition-all duration-300"
              ></iframe>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="luxury-card p-6 rounded-lg">
            <h3 className="font-luxury text-xl font-semibold text-gold-500 mb-4">
              Contacto General
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gold-500 mr-3" />
                <div>
                  <p className="text-white font-medium">Email Principal</p>
                  <p className="text-platinum-300">info@diamantereal.com</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gold-500 mr-3" />
                <div>
                  <p className="text-white font-medium">Línea de Atención</p>
                  <p className="text-platinum-300">+1 (555) 000-JOYA</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gold-500 mr-3 mt-1" />
                <div>
                  <p className="text-white font-medium">Horario de Atención</p>
                  <p className="text-platinum-300">
                    Lunes a Viernes: 9:00 AM - 7:00 PM<br />
                    Sábados: 10:00 AM - 8:00 PM<br />
                    Domingos: 12:00 PM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Servicios */}
            <div className="mt-6 pt-6 border-t border-silver-600">
              <h4 className="font-semibold text-white mb-3">Servicios Especiales</h4>
              <ul className="text-platinum-300 text-sm space-y-1">
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
        <div className="luxury-card p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Diamond className="h-8 w-8 text-charcoal-900" />
              </div>
              <h4 className="font-semibold text-white mb-2">Certificación GIA</h4>
              <p className="text-platinum-300 text-sm">
                Todos nuestros diamantes cuentan con certificación internacional GIA
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-silver-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-charcoal-900" />
              </div>
              <h4 className="font-semibold text-white mb-2">Garantía de por Vida</h4>
              <p className="text-platinum-300 text-sm">
                Garantía completa en manufactura y mantenimiento gratuito
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-platinum-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-8 w-8 text-charcoal-900" />
              </div>
              <h4 className="font-semibold text-white mb-2">Envío Asegurado</h4>
              <p className="text-platinum-300 text-sm">
                Envío gratuito y asegurado a nivel nacional e internacional
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-silver-600 pt-6 text-center">
          <p className="text-platinum-400 text-sm">
            © 2024 Diamante Real. Todos los derechos reservados. | 
            <span className="text-gold-500"> Joyería de Lujo desde 1998</span>
          </p>
          <p className="text-platinum-500 text-xs mt-2">
            Diseñado con 💎 para momentos únicos e inolvidables
          </p>
        </div>
      </div>
    </footer>
  );
}