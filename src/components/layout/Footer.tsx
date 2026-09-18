import React from 'react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="official-sifygsa-footer">
      <div className="footer-content-limit">
        {/* Top 4 Columns Grid */}
        <div className="footer-columns-grid">
          {/* Columna 1: Identidad Corporativa & Redes */}
          <div className="footer-brand-col">
            <div className="brand-logo-lockup">
              <picture className="footer-brand-picture">
                <source srcSet="/SFGLogo.svg" type="image/svg+xml" />
                <img
                  src="/SFGLogo.png"
                  onError={(e) => { e.currentTarget.src = '/SFGLogo.png'; }}
                  alt="SIFYGSA"
                  className="footer-brand-logo-img"
                />
              </picture>
            </div>

            <p className="brand-mission-paragraph">
              Proveemos tecnología e ingeniería vanguardistas respaldadas por profesionales certificados,
              garantizando la finalización oportuna y de calidad en todos nuestros proyectos.
            </p>

            <div className="social-links-row">
              {/* LinkedIn */}
              <a href="#linkedin" className="social-circle-btn" title="LinkedIn" aria-label="LinkedIn">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.8v8.37h-2.8v-8.37M7.86 6.31a1.63 1.63 0 1 0 0 3.25 1.63 1.63 0 0 0 0-3.25z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#instagram" className="social-circle-btn" title="Instagram" aria-label="Instagram">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
              {/* Facebook */}
              <a href="#facebook" className="social-circle-btn" title="Facebook" aria-label="Facebook">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Columna 2: PÁGINAS */}
          <div className="footer-links-col">
            <div className="column-section-label">
              <span>—</span>
              <span>PÁGINAS</span>
            </div>
            <ul className="footer-nav-list">
              <li><a href="#inicio">Inicio</a></li>
              <li><a href="#acerca">Acerca de</a></li>
              <li><a href="#servicios">Servicios</a></li>
              <li><a href="#productos">Productos</a></li>
              <li><a href="#proyectos">Proyectos</a></li>
              <li><a href="#eventos">Eventos</a></li>
            </ul>
          </div>

          {/* Columna 3: OFICINAS */}
          <div className="footer-offices-col">
            <div className="column-section-label">
              <span>—</span>
              <span>OFICINAS</span>
            </div>
            <div className="offices-details-stack">
              <div className="office-item">
                <p className="office-city">Comalcalco, Tab.</p>
                <p className="office-address">Blvd. Leandro Rovirosa No. 508, 86357 Comalcalco, Tabasco.</p>
              </div>
              <div className="office-item">
                <p className="office-city">Minatitlán, Ver.</p>
                <p className="office-address">Mariano Matamoros No. 11, Centro, 96700 Minatitlán, Veracruz.</p>
              </div>
              <div className="office-item">
                <p className="office-city">Mapachapa, Ver.</p>
                <p className="office-address">Carretera Antigua Mina S/N, frente a planta BONAFONT, 96904 Mapachapa, Veracruz.</p>
              </div>
            </div>
          </div>

          {/* Columna 4: CONTACTO */}
          <div className="footer-contact-col">
            <div className="column-section-label">
              <span>—</span>
              <span>CONTACTO</span>
            </div>
            <div className="contact-details-stack">
              <div className="contact-block">
                <span className="contact-field-caption">EMAIL</span>
                <p className="contact-field-text">contacto@sifygsa.com.mx</p>
                <p className="contact-field-text">sifygsa@sifygsa.com.mx</p>
              </div>
              <div className="contact-block">
                <span className="contact-field-caption">TELÉFONO</span>
                <p className="contact-field-text">(+52) 922 225 1470</p>
                <p className="contact-field-text">(+52) 933 334 1128</p>
              </div>
              <div className="consult-btn-wrapper">
                <a href="#consultar" className="btn-consult-orange">
                  <span>Consultar</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-notice">© {new Date().getFullYear()} SIFYGSA. Todos los derechos reservados.</p>
          
          <div className="footer-bottom-right">
            <p className="f-g-badge">
              <span className="orange-dot-pip" />
              <span>Soluciones Integrales en Fire &amp; Gas</span>
            </p>
            
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
      </div>
    </footer>
  );
};

export default Footer;
