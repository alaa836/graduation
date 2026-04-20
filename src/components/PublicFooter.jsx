import { createElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { Phone, Mail, MapPin, Instagram, Twitter } from 'lucide-react';

export default function PublicFooter() {
  const { t } = useTranslation();
  const quickLinks = useMemo(() => {
    const v = t('home.footer.quickLinks', { returnObjects: true });
    return Array.isArray(v) ? v : [];
  }, [t]);
  const specLinks = useMemo(() => {
    const v = t('home.footer.specLinks', { returnObjects: true });
    return Array.isArray(v) ? v : [];
  }, [t]);
  const quickLinkRoutes = useMemo(
    () => ['/', '/doctors', '/#services', '/about', '/contact'],
    []
  );
  const specialtyLinkRoutes = useMemo(
    () => specLinks.map((_, index) => `/doctors?specialty=${index}`),
    [specLinks]
  );

  return (
    <footer className="text-white font-black pt-10 pb-6 px-4 md:px-8" style={{ backgroundColor: '#779ef2' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center">
                <BrandLogo className="h-20 w-20 object-contain" />
              </div>
              <span className="font-bold text-lg">{t('home.footer.brand')}</span>
            </div>
            <p className="text-blue-100 text-xs leading-relaxed">{t('home.footer.tagline')}</p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/30 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 hover:bg-blue-400"
                aria-label="Instagram"
              >
                <Instagram size={14} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/30 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 hover:bg-blue-400"
                aria-label="Twitter"
              >
                <Twitter size={14} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm">{t('home.footer.quickLinksTitle')}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={link}>
                  <Link
                    to={quickLinkRoutes[index] || '/'}
                    className="text-blue-100 text-xs transition-all duration-200 hover:text-white ltr:hover:translate-x-0.5 rtl:hover:-translate-x-0.5 motion-reduce:hover:translate-x-0 inline-block"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm">{t('home.footer.specialtiesTitle')}</h4>
            <ul className="space-y-2">
              {specLinks.map((link, index) => (
                <li key={link}>
                  <Link
                    to={specialtyLinkRoutes[index] || '/doctors'}
                    className="text-blue-100 text-xs transition-all duration-200 hover:text-white ltr:hover:translate-x-0.5 rtl:hover:-translate-x-0.5 motion-reduce:hover:translate-x-0 inline-block"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm">{t('home.footer.contactTitle')}</h4>
            <div className="space-y-2">
              {[{ icon: Phone, val: '01234567890' }, { icon: Mail, val: 'contact@lesahtak.com' }, { icon: MapPin, val: t('home.footer.location') }].map(({ icon, val }) => (
                <div key={val} className="flex items-center gap-2 text-blue-100 text-xs">
                  {createElement(icon, { size: 12 })}
                  <span>{val}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2">{t('home.footer.newsletter')}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/30 motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                >
                  {t('home.footer.subscribe')}
                </button>
                <input
                  type="email"
                  placeholder={t('home.footer.emailPh')}
                  className="flex-1 bg-blue-500 text-white placeholder-blue-200 text-xs px-3 py-2 rounded-lg outline-none min-w-0"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-blue-500 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-blue-200 text-xs">{t('home.footer.copyright')}</p>
          <div className="flex items-center gap-4 text-blue-200 text-xs">
            <a href="#" className="transition-all duration-200 hover:text-white hover:underline underline-offset-4">
              {t('home.footer.privacy')}
            </a>
            <a href="#" className="transition-all duration-200 hover:text-white hover:underline underline-offset-4">
              {t('home.footer.terms')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
