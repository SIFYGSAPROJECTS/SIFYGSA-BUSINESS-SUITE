import React from 'react';
import { SfgLogoSymbol } from '../ui/Logo';

interface FooterProps {
  portal?: 'crm' | 'rh';
}

export const Footer: React.FC<FooterProps> = ({ portal = 'crm' }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={`official-sifygsa-footer ${portal === 'rh' ? 'footer-rh' : ''}`}>
      {/* Bottom Bar */}
      <div className="footer-bottom-bar">
        <p className="copyright-notice">© {new Date().getFullYear()} SIFYGSA. Todos los derechos reservados.</p>

        <div className="footer-bottom-right">
          {portal === 'rh' ? (
            <p className="f-g-badge rh-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2DD4BF' }}>
              <SfgLogoSymbol size={18} />
              <span>SIFYGSA • Capital Humano &amp; Talento</span>
            </p>
          ) : (
            <p className="f-g-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <SfgLogoSymbol size={18} />
              <span>Soluciones Integrales en Fire &amp; Gas</span>
            </p>
          )}

          <button
            type="button"
            className="scroll-top-round-btn"
            onClick={scrollToTop}
            title="Subir al inicio"
            aria-label="Subir al inicio"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
              <path d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
