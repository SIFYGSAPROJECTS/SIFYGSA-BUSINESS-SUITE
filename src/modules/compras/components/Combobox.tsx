'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface ComboboxOption {
  label: string;
  value: string;
  sublabel?: string;
  payload?: any;
}

interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string, option?: ComboboxOption) => void;
  options: (string | ComboboxOption)[];
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  dropdownClassName?: string;
  autoFocus?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Escribe para buscar...',
  readOnly = false,
  className = '',
  dropdownClassName = '',
  autoFocus = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Normalizar opciones
  const normalizedOptions: ComboboxOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  });

  // Filtrado
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Si no seleccionó y dejó texto, mantener el texto actual
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (readOnly) return;
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    onChange(newVal);
    setIsOpen(true);
  };

  const handleSelect = (opt: ComboboxOption) => {
    setSearchTerm(opt.label);
    onChange(opt.label, opt);
    setIsOpen(false);
  };

  return (
    <div className="oc-combobox-root" ref={containerRef}>
      <div className="oc-input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          readOnly={readOnly}
          autoComplete="off"
          autoFocus={autoFocus}
          className={`oc-input ${readOnly ? 'readonly' : ''} ${className}`}
        />
        {!readOnly && (
          <span
            className="material-symbols-outlined oc-input-icon cursor-pointer"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
          >
            expand_more
          </span>
        )}
      </div>

      {isOpen && !readOnly && (
        <ul className={`oc-combobox-dropdown ${dropdownClassName}`}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.label === value;
              return (
                <li
                  key={`${opt.value}-${idx}`}
                  className={`oc-combobox-item ${isSelected ? 'selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Evita que se dispare blur antes
                    handleSelect(opt);
                  }}
                >
                  <span className="font-body-sm">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-[11px] opacity-75">{opt.sublabel}</span>
                  )}
                </li>
              );
            })
          ) : (
            <li className="oc-combobox-empty">Sin coincidencias</li>
          )}
        </ul>
      )}
    </div>
  );
};

