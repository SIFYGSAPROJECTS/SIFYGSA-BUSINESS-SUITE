'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface AlmacenComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: string;
}

interface AlmacenComboboxProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: (string | AlmacenComboboxOption)[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  leadingIcon?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AlmacenCombobox: React.FC<AlmacenComboboxProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  error,
  leadingIcon,
  allowCustom = false,
  disabled = false,
  className = '',
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalizar opciones
  const normalizedOptions: AlmacenComboboxOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Opción actualmente seleccionada
  const selectedOption = normalizedOptions.find((opt) => opt.value === value || opt.label === value);

  // Filtrado de opciones
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const labelMatch = opt.label.toLowerCase().includes(query);
    const valueMatch = opt.value.toLowerCase().includes(query);
    const sublabelMatch = opt.sublabel?.toLowerCase().includes(query);
    return labelMatch || valueMatch || sublabelMatch;
  });

  // Cerrar al hacer click afuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  };

  const handleSelect = (opt: AlmacenComboboxOption) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (allowCustom) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`alta-articulo-combobox-root ${className}`} ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {allowCustom ? (
        <div className="alta-articulo-input-wrapper">
          {leadingIcon && (
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '18px',
                pointerEvents: 'none',
              }}
            >
              {leadingIcon}
            </span>
          )}
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={handleCustomInput}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={`alta-articulo-input ${error ? 'is-invalid' : ''}`}
            style={{
              paddingLeft: leadingIcon ? '2.5rem' : '0.875rem',
              paddingRight: '2.5rem',
            }}
          />
          <button
            type="button"
            onClick={handleToggle}
            tabIndex={-1}
            disabled={disabled}
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      ) : (
        <button
          id={inputId}
          type="button"
          aria-expanded={isOpen}
          onClick={handleToggle}
          disabled={disabled}
          className={`alta-articulo-combobox-trigger ${error ? 'is-invalid' : ''}`}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <div className="alta-articulo-combobox-left">
            {leadingIcon && (
              <span className="material-symbols-outlined alta-articulo-combobox-icon">
                {leadingIcon}
              </span>
            )}
            {selectedOption?.icon && (
              <span className="material-symbols-outlined alta-articulo-combobox-icon">
                {selectedOption.icon}
              </span>
            )}
            <span className="alta-articulo-combobox-text">
              {selectedOption ? selectedOption.label : <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>}
            </span>
          </div>

          <div className="alta-articulo-combobox-right">
            {selectedOption?.badge && (
              <span className="alta-articulo-combobox-tag">
                {selectedOption.badge}
              </span>
            )}
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </button>
      )}

      {/* Menú desplegable */}
      {isOpen && !disabled && (
        <div className="alta-articulo-combobox-menu">
          {/* Buscador interno */}
          <div className="alta-articulo-combobox-search-box">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="alta-articulo-combobox-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  close
                </span>
              </button>
            )}
          </div>

          {/* Opciones filtradas */}
          <div className="alta-articulo-combobox-menu-scroll" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value || opt.label === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`alta-articulo-combobox-option ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="alta-articulo-option-content">
                      {opt.icon && (
                        <span className="material-symbols-outlined alta-articulo-combobox-icon">
                          {opt.icon}
                        </span>
                      )}
                      <div className="alta-articulo-option-details">
                        <span className="alta-articulo-option-title">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="alta-articulo-option-desc">{opt.sublabel}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {opt.badge && (
                        <span className="alta-articulo-combobox-tag">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '18px' }}>
                          check
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="alta-articulo-combobox-empty">
                {allowCustom ? 'Presione Enter para usar este valor personalizado' : 'No se encontraron resultados'}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <span className="alta-articulo-field-error">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
          {error}
        </span>
      )}
    </div>
  );
};
export default AlmacenCombobox;

