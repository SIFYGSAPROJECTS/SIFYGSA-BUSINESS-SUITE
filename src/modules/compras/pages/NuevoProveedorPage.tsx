'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompras } from '../context/ComprasContext';
import type { Proveedor, TipoPersona, MonedaDivisa, CuentaBancariaProveedor } from '../types';
import { ModuleMenu } from '@/components/ui/ModuleMenu';
import '../compras.css';
import '../nuevo-proveedor-wizard.css';

interface DocumentoExpediente {
  id: string;
  nombre: string;
  archivoNombre: string;
  tamanoKb: number;
  tipo: string;
  fechaSubida: string;
  estatus: 'Validada' | 'Positiva' | 'Pendiente' | 'Cotejada';
  icono: string;
}

interface RegistroFiscalAdicional {
  id: string;
  pais: string;
  taxId: string;
  tipo: string;
  estatus: string;
}

interface DivisaRegistro {
  id: string;
  codigo: MonedaDivisa;
  descripcion: string;
  tipoCambio: string;
  esPrincipal: boolean;
}

export const NuevoProveedorPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { proveedores, guardarProveedor, mostrarToast } = useCompras();

  // Proveedor a consultar/editar si viene parámetro por URL
  const proveedorIdParam =
    searchParams?.get('id') ||
    searchParams?.get('proveedorId') ||
    searchParams?.get('folio') ||
    searchParams?.get('proveedor');

  const proveedorExistente = useMemo(() => {
    if (!proveedorIdParam) return null;
    const norm = proveedorIdParam.trim().toLowerCase();
    return (
      proveedores.find(
        (p) =>
          p.id.toLowerCase() === norm ||
          p.rfc.toLowerCase() === norm ||
          p.razonSocial.toLowerCase() === norm ||
          p.nombreComercial.toLowerCase() === norm
      ) || null
    );
  }, [proveedorIdParam, proveedores]);

  // Wizard state (Steps 1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const p = searchParams?.get('step') || searchParams?.get('etapa');
    if (p) {
      const num = parseInt(p, 10);
      if (num >= 1 && num <= 5) return num;
    }
    return 1;
  });
  const totalSteps = 5;

  // Step Meta Configuration
  const stepMeta = [
    {
      id: 1,
      title: 'Identificación',
      shortTitle: 'Datos de Identificación del Proveedor',
      description: 'Entidad fiscal, razón comercial, representante y clasificación operativa.',
      nextText: 'Continuar a Contacto & Domicilio',
      icon: 'badge',
    },
    {
      id: 2,
      title: 'Contacto & Domicilio',
      shortTitle: 'Canales de Contacto & Domicilio Fiscal',
      description: 'Correos ejecutivos, teléfonos, domicilio fiscal y geolocalización de entrega.',
      nextText: 'Continuar a Información Fiscal',
      icon: 'contact_phone',
    },
    {
      id: 3,
      title: 'Fiscal (CFDI 4.0)',
      shortTitle: 'Información Fiscal SAT (CFDI 4.0)',
      description: 'Extracción CSF SAT, candados RFC lista 69-B, régimen y uso de CFDI.',
      nextText: 'Continuar a Condiciones & Tesorería',
      icon: 'receipt_long',
    },
    {
      id: 4,
      title: 'Condiciones & Banco',
      shortTitle: 'Condiciones Comerciales & Cuentas Bancarias',
      description: 'Crédito, multimoneda y cuentas bancarias validadas con 18 dígitos CLABE.',
      nextText: 'Continuar a Expediente & Resumen',
      icon: 'account_balance',
    },
    {
      id: 5,
      title: 'Expediente & Resumen',
      shortTitle: 'Expediente Digital & Resumen Ejecutivo',
      description: 'Documentación obligatoria en PDF/XML y auditoría final de alta.',
      nextText: proveedorExistente ? 'Guardar Cambios del Proveedor' : 'Finalizar y Dar de Alta Proveedor',
      icon: 'folder_shared',
    },
  ];

  // Estado de autoguardado de borrador
  const [ultimoGuardado, setUltimoGuardado] = useState<string>('Guardado hace 1s');
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Escuchar evento de salida desde Home del sidebar
  React.useEffect(() => {
    const onExitRequest = (e: Event) => {
      e.preventDefault();
      setModalConfirmCancelOpen(true);
    };
    window.addEventListener('sifygsa:request-exit-compras', onExitRequest);
    return () => {
      window.removeEventListener('sifygsa:request-exit-compras', onExitRequest);
    };
  }, []);

  // Extracción por Constancia de Situación Fiscal (CSF)
  const [csfCargada, setCsfCargada] = useState(false);
  const [csfNombreArchivo, setCsfNombreArchivo] = useState('');
  const csfInputRef = useRef<HTMLInputElement | null>(null);

  // ── ETAPA 1: DATOS DE IDENTIFICACIÓN ──
  const [idProveedor] = useState(() => proveedorExistente?.id || `PRV-${Date.now().toString().slice(-4)}`);
  const [tipoEntidad, setTipoEntidad] = useState<TipoPersona>(() => proveedorExistente?.tipoPersona || 'moral');
  const [nombreComercial, setNombreComercial] = useState(() => proveedorExistente?.nombreComercial || 'Five Peaks México');
  const [tratamiento, setTratamiento] = useState('Lic.');
  const [nombreRepresentante, setNombreRepresentante] = useState(() => proveedorExistente?.contactoPrincipal || 'Pamela León Cadena');
  const [denominacionPuesto, setDenominacionPuesto] = useState(() => proveedorExistente?.puestoContacto || 'Gerente Comercial Industrial');
  const [categoriaOperativa, setCategoriaOperativa] = useState(() => proveedorExistente?.categoria || 'Servicios Especializados');
  const [giroEmpresarial, setGiroEmpresarial] = useState(() => proveedorExistente?.giro || 'Suministro y Mantenimiento a Frentes Petroleros');
  const [sitioWeb, setSitioWeb] = useState(() => proveedorExistente?.sitioWeb || 'https://www.fivepeaks.mx');
  const [comentarios, setComentarios] = useState(() => proveedorExistente?.notas || 'Proveedor homologado para frentes petroleros e industriales.');

  // ── ETAPA 2: CONTACTO Y DOMICILIO ──
  const [emailPrincipal, setEmailPrincipal] = useState(() => proveedorExistente?.email || 'contacto@fivepeaks.mx');
  const [emailSecundario, setEmailSecundario] = useState('facturacion@fivepeaks.mx');
  const [telefonoMovil, setTelefonoMovil] = useState(() => proveedorExistente?.telefono || '(55) 5600-4321');
  const [telefonoPbx, setTelefonoPbx] = useState('(55) 8900-1122');
  const [extensionTel, setExtensionTel] = useState('Ext. 104');
  const [calleNumero, setCalleNumero] = useState(() => proveedorExistente?.direccion?.calle || 'Av. Industrial 500, Nave 3');
  const [colonia, setColonia] = useState(() => proveedorExistente?.direccion?.colonia || 'Zona Industrial Logística');
  const [codigoPostal, setCodigoPostal] = useState(() => proveedorExistente?.direccion?.cp || '94290');
  const [municipio, setMunicipio] = useState(() => proveedorExistente?.direccion?.ciudad || 'Boca del Río');
  const [estado, setEstado] = useState(() => proveedorExistente?.direccion?.estado || 'Veracruz');
  const [pais] = useState('México');

  // ── ETAPA 3: FISCAL (CFDI 4.0) ──
  const [rfc, setRfc] = useState(() => proveedorExistente?.rfc || 'FPM130918MPA');
  const [razonSocial, setRazonSocial] = useState(() => proveedorExistente?.razonSocial || 'FIVE PEAKS MÉXICO SA DE CV');
  const [usoCfdi, setUsoCfdi] = useState(() => proveedorExistente?.usoCfdi || 'G03 - Gastos en general');
  const [regimenFiscal, setRegimenFiscal] = useState(() => proveedorExistente?.regimenFiscal || '601 - General de Ley Personas Morales');
  const [cpFiscal, setCpFiscal] = useState('94290');
  const [fechaEmisionCsf, setFechaEmisionCsf] = useState('2026-02-15');

  // Registros Fiscales Adicionales / Factoring
  const [registrosFiscales, setRegistrosFiscales] = useState<RegistroFiscalAdicional[]>([
    {
      id: 'tax-1',
      pais: 'México',
      taxId: 'FPM130918MPA',
      tipo: 'RFC Principal SAT (Persona Moral)',
      estatus: 'Activo Validado',
    },
    {
      id: 'tax-2',
      pais: 'Estados Unidos (W-8BEN-E)',
      taxId: 'US-982341908',
      tipo: 'Registro para Importaciones Directas',
      estatus: 'Cotejado',
    },
  ]);
  const [modalTaxOpen, setModalTaxOpen] = useState(false);
  const [nuevoTaxPais, setNuevoTaxPais] = useState('México');
  const [nuevoTaxId, setNuevoTaxId] = useState('');
  const [nuevoTaxTipo, setNuevoTaxTipo] = useState('Registro Secundario / Sucursal');

  // ── ETAPA 4: CONDICIONES, MULTIMONEDA & BANCO ──
  const [subsidiariaAsignada, setSubsidiariaAsignada] = useState('SIFYGSA Fire & Gas S.A. de C.V.');
  const [compradorResponsable, setCompradorResponsable] = useState('Lic. Pamela León - Comprador Senior');
  const [esProveedorProyecto, setEsProveedorProyecto] = useState(true);
  const [emailNotificacionPagos, setEmailNotificacionPagos] = useState('tesoreria@fivepeaks.mx');
  const [diasCredito, setDiasCredito] = useState<number>(() => proveedorExistente?.diasCredito ?? 30);
  const [limiteCredito, setLimiteCredito] = useState<number>(() => proveedorExistente?.limiteCredito ?? 350000);
  const [metodoPagoSat, setMetodoPagoSat] = useState('PPD - Pago en parcialidades o diferido');
  const [formaPagoSat, setFormaPagoSat] = useState('03 - Transferencia electrónica de fondos');
  const [cuentaContableErp] = useState('201-01-0048');

  // Multi-divisas
  const [divisas, setDivisas] = useState<DivisaRegistro[]>([
    { id: 'curr-1', codigo: 'MXN', descripcion: 'Pesos Mexicanos (Moneda Base ERP)', tipoCambio: '$1.00 MXN', esPrincipal: true },
    { id: 'curr-2', codigo: 'USD', descripcion: 'Dólares Americanos (Contratos Industriales)', tipoCambio: '$20.45 MXN', esPrincipal: false },
  ]);
  const [modalDivisaOpen, setModalDivisaOpen] = useState(false);
  const [nuevaDivisaCodigo, setNuevaDivisaCodigo] = useState<MonedaDivisa>('EUR');
  const [nuevaDivisaTc, setNuevaDivisaTc] = useState('$22.10 MXN');

  // Cuentas bancarias validadas (18 dígitos)
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancariaProveedor[]>(() => {
    if (proveedorExistente?.cuentasBancarias && proveedorExistente.cuentasBancarias.length > 0) {
      return proveedorExistente.cuentasBancarias;
    }
    return [
      {
        id: 'cta-1',
        banco: 'BBVA México',
        cuenta: '0123456789',
        clabe: '012905001234567890',
        titular: 'FIVE PEAKS MÉXICO SA DE CV',
        moneda: 'MXN',
        esPrincipal: true,
      },
      {
        id: 'cta-2',
        banco: 'Citibanamex',
        cuenta: '9876543210',
        clabe: '002180012345678901',
        titular: 'FIVE PEAKS MÉXICO SA DE CV',
        moneda: 'USD',
        esPrincipal: false,
      },
    ];
  });
  const [modalNuevaCuentaOpen, setModalNuevaCuentaOpen] = useState(false);
  const [nuevoBanco, setNuevoBanco] = useState('BBVA México');
  const [nuevaCuentaNum, setNuevaCuentaNum] = useState('');
  const [nuevaClabe, setNuevaClabe] = useState('');
  const [nuevaMonedaCta, setNuevaMonedaCta] = useState<MonedaDivisa>('MXN');
  const [errorClabe, setErrorClabe] = useState<string | null>(null);

  // ── ETAPA 5: DOCUMENTACIÓN & EXPEDIENTE DIGITAL ──
  const [documentosExpediente] = useState<DocumentoExpediente[]>([
    {
      id: 'doc-1',
      nombre: 'Constancia de Situación Fiscal SAT (CSF)',
      archivoNombre: 'CSF_OFICIAL_SAT_2026.pdf',
      tamanoKb: 142,
      tipo: 'application/pdf',
      fechaSubida: 'Validada ante el SAT (CFDI 4.0)',
      estatus: 'Validada',
      icono: 'picture_as_pdf',
    },
    {
      id: 'doc-2',
      nombre: 'Opinión de Cumplimiento SAT 32-D Positiva',
      archivoNombre: 'Opinion_32D_Positiva_Feb2026.pdf',
      tamanoKb: 210,
      tipo: 'application/pdf',
      fechaSubida: 'Emitida este mes · Favorable',
      estatus: 'Positiva',
      icono: 'verified_user',
    },
    {
      id: 'doc-3',
      nombre: 'Carátula de Estado de Cuenta Bancario',
      archivoNombre: 'Caratula_BBVA_Titular_Validada.pdf',
      tamanoKb: 185,
      tipo: 'application/pdf',
      fechaSubida: 'Cotejada con RFC y CLABE',
      estatus: 'Cotejada',
      icono: 'account_balance',
    },
    {
      id: 'doc-4',
      nombre: 'Acta Constitutiva y Poder Notarial del Representante',
      archivoNombre: 'Acta_Constitutiva_Poder_Notarial.pdf',
      tamanoKb: 4320,
      tipo: 'application/pdf',
      fechaSubida: 'Registro Público Comercio No. 49120',
      estatus: 'Validada',
      icono: 'gavel',
    },
  ]);
  const [declaracionConformidad, setDeclaracionConformidad] = useState(true);

  // Modales adicionales
  const [modalNotificarAdminOpen, setModalNotificarAdminOpen] = useState(false);
  const [modalConfirmCancelOpen, setModalConfirmCancelOpen] = useState(false);

  // Progreso porcentual
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  // Guardar borrador manual
  const handleGuardarBorrador = () => {
    setIsSavingDraft(true);
    setTimeout(() => {
      setIsSavingDraft(false);
      const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      setUltimoGuardado(`Guardado hoy a las ${hora}`);
      mostrarToast('✓ Borrador guardado localmente con éxito.', 'info');
    }, 400);
  };

  // Simular extracción automática de Constancia de Situación Fiscal (CSF)
  const handleSimularExtraccionCsf = (file?: File) => {
    const fileName = file ? file.name : 'Constancia_Situacion_Fiscal_SAT_2026.pdf';
    setCsfNombreArchivo(fileName);
    setCsfCargada(true);

    if (!proveedorExistente) {
      setRfc('FPM130918MPA');
      setRazonSocial('FIVE PEAKS MÉXICO SA DE CV');
      setNombreComercial('Five Peaks México');
      setTipoEntidad('moral');
      setRegimenFiscal('601 - General de Ley Personas Morales');
      setCodigoPostal('94290');
      setCalleNumero('Av. Industrial 500, Parque Logístico');
      setColonia('Zona Industrial Logística');
      setMunicipio('Boca del Río');
      setEstado('Veracruz');
      setCpFiscal('94290');
      setFechaEmisionCsf('2026-02-15');
    }

    mostrarToast(`✓ Datos fiscales y domicilio extraídos automáticamente de: ${fileName}`, 'success');
  };

  // Validar Código Postal (simulado)
  const handleValidarCp = () => {
    if (codigoPostal === '94290') {
      setMunicipio('Boca del Río');
      setEstado('Veracruz');
      mostrarToast('✓ CP 94290 validado: Boca del Río, Veracruz.', 'success');
    } else if (codigoPostal.length === 5) {
      mostrarToast(`✓ CP ${codigoPostal} verificado en padrón postal SEPOMEX.`, 'info');
    } else {
      mostrarToast('Introduce un Código Postal válido de 5 dígitos.', 'warning');
    }
  };

  // Agregar registro fiscal adicional
  const handleAgregarRegistroFiscal = () => {
    if (!nuevoTaxId.trim()) {
      mostrarToast('El identificador fiscal es obligatorio.', 'error');
      return;
    }
    const nuevoReg: RegistroFiscalAdicional = {
      id: `tax-${Date.now()}`,
      pais: nuevoTaxPais,
      taxId: nuevoTaxId.trim().toUpperCase(),
      tipo: nuevoTaxTipo,
      estatus: 'Registrado',
    };
    setRegistrosFiscales([...registrosFiscales, nuevoReg]);
    setModalTaxOpen(false);
    setNuevoTaxId('');
    mostrarToast('Registro fiscal adicional agregado al expediente.', 'success');
  };

  // Agregar divisa comercial
  const handleAgregarDivisa = () => {
    const desc = nuevaDivisaCodigo === 'EUR' ? 'Euros (Operaciones Unión Europea)' : `${nuevaDivisaCodigo} Comercial`;
    const nuevaDiv: DivisaRegistro = {
      id: `curr-${Date.now()}`,
      codigo: nuevaDivisaCodigo,
      descripcion: desc,
      tipoCambio: nuevaDivisaTc,
      esPrincipal: false,
    };
    setDivisas([...divisas, nuevaDiv]);
    setModalDivisaOpen(false);
    mostrarToast(`Divisa ${nuevaDivisaCodigo} agregada exitosamente.`, 'success');
  };

  // Agregar Cuenta Bancaria
  const handleAgregarCuentaBancaria = () => {
    const clabeLimpia = nuevaClabe.replace(/\s+/g, '');
    if (clabeLimpia.length !== 18 || !/^\d+$/.test(clabeLimpia)) {
      setErrorClabe('La CLABE interbancaria debe tener exactamente 18 dígitos numéricos.');
      return;
    }

    const nuevaCta: CuentaBancariaProveedor = {
      id: `cta-${Date.now()}`,
      banco: nuevoBanco,
      cuenta: nuevaCuentaNum.trim() || clabeLimpia.slice(-10),
      clabe: clabeLimpia,
      titular: razonSocial.trim(),
      moneda: nuevaMonedaCta,
      esPrincipal: cuentasBancarias.length === 0,
    };

    setCuentasBancarias([...cuentasBancarias, nuevaCta]);
    setModalNuevaCuentaOpen(false);
    setNuevaClabe('');
    setNuevaCuentaNum('');
    setErrorClabe(null);
    mostrarToast(`✓ Cuenta bancaria ${nuevoBanco} agregada para dispersión.`, 'success');
  };

  // Guardar y registrar proveedor
  const handleConfirmarGuardado = (notificarAdmin: boolean) => {
    if (!rfc.trim()) {
      mostrarToast('El RFC es estrictamente obligatorio antes de guardar.', 'error');
      setCurrentStep(3);
      return;
    }

    const nuevoProveedor: Proveedor = {
      id: idProveedor,
      rfc: rfc.trim().toUpperCase(),
      razonSocial: razonSocial.trim().toUpperCase(),
      nombreComercial: nombreComercial.trim(),
      tipoPersona: tipoEntidad,
      giro: giroEmpresarial,
      contactoPrincipal: nombreRepresentante.trim(),
      puestoContacto: denominacionPuesto.trim(),
      telefono: telefonoMovil.trim(),
      email: emailPrincipal.trim(),
      direccion: {
        calle: calleNumero.trim(),
        colonia: colonia.trim(),
        cp: codigoPostal.trim(),
        ciudad: municipio.trim(),
        estado: estado.trim(),
      },
      estatus: proveedorExistente ? proveedorExistente.estatus : 'activo',
      categoria: categoriaOperativa,
      regimenFiscal,
      usoCfdi,
      formaPago: formaPagoSat,
      metodoPago: metodoPagoSat,
      moneda: divisas[0]?.codigo || 'MXN',
      monedaPrincipal: divisas[0]?.codigo || 'MXN',
      monedasSecundarias: divisas.slice(1).map((d) => d.codigo),
      diasCredito,
      limiteCredito,
      banco: cuentasBancarias[0]?.banco || 'BBVA México',
      clabe: cuentasBancarias[0]?.clabe || '012905001234567890',
      cuenta: cuentasBancarias[0]?.cuenta || '0123456789',
      cuentasBancarias,
      opinionSat32D: 'positiva',
      fechaActualizacion32D: new Date().toISOString().split('T')[0],
      notas: comentarios.trim(),
      sitioWeb,
      subsidiariaPrimaria: subsidiariaAsignada,
      emailNotificacionPago: emailNotificacionPagos,
    };

    guardarProveedor(nuevoProveedor, 'Comprador Senior', notificarAdmin);
    setModalNotificarAdminOpen(false);

    mostrarToast('✓ Proveedor guardado en padrón institucional con éxito.', 'success');
    setTimeout(() => {
      router.push('/compras');
    }, 1200);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setModalNotificarAdminOpen(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="nuevo-proveedor-wizard-root min-h-screen bg-[var(--app-bg,#0B1120)] text-[var(--text-primary,#F9FAFB)] pb-36 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Cabecera Principal */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/proveedores/modulos" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                  Módulos de Proveedores
                </Link>
                <span>/</span>
                <span className="text-slate-400">Nuevo Proveedor</span>
              </nav>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  SIFYGSA Enterprise ERP · Compras
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {idProveedor}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {proveedorExistente ? `Expediente: ${proveedorExistente.razonSocial}` : 'Alta de Proveedores'}
              </h1>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <ModuleMenu />
              <button
                type="button"
                onClick={() => setModalConfirmCancelOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Volver al dashboard principal de Compras"
              >
                <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                <span>Volver a Compras</span>
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================================
            CREATIVE CONNECTED-NODE STEPPER (SEGUN SKETCH DE USUARIO: (1) ── (2) ── ...)
            ==================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs mb-6">
          {/* Header del Stepper */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#1D4ED8] text-xs font-black">
                  {currentStep}
                </span>
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  Etapa {currentStep} de {totalSteps}: {stepMeta[currentStep - 1].shortTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {stepMeta[currentStep - 1].description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-700">Progreso General</div>
                <div className="text-[11px] font-bold text-[#1D4ED8]">{progressPercent}% Completado</div>
              </div>
              <div className="w-24 sm:w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/80">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-blue-600 to-[#1D4ED8] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Connected Node Stepper Track */}
          <div className="relative px-2 sm:px-6 pt-2 pb-1">
            {/* Background Line */}
            <div className="absolute top-7 left-10 right-10 sm:left-16 sm:right-16 h-1 bg-slate-200 z-0 rounded-full" />

            {/* Active Filled Line */}
            <div
              className="absolute top-7 left-10 sm:left-16 h-1 bg-gradient-to-r from-emerald-500 to-[#1D4ED8] z-0 rounded-full transition-all duration-500"
              style={{
                width: `calc(${((currentStep - 1) / (totalSteps - 1)) * 100}% - 2.5rem)`,
              }}
            />

            {/* 5 Nodes Flex */}
            <div className="relative z-10 flex items-start justify-between">
              {stepMeta.map((s, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentStep(stepNum)}
                    className="group flex flex-col items-center focus:outline-none cursor-pointer transition-transform hover:scale-105"
                    style={{ width: `${100 / totalSteps}%` }}
                    title={`Ir a ${s.title}`}
                  >
                    {/* Circle Node */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 shadow-md ${
                        isActive
                          ? 'bg-[#1D4ED8] text-white ring-4 ring-blue-100 ring-offset-2 scale-110 shadow-blue-500/30'
                          : isCompleted
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-emerald-500/20'
                          : 'bg-white text-slate-400 border-2 border-slate-300 group-hover:border-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                      ) : (
                        <span>{stepNum}</span>
                      )}
                    </div>

                    {/* Step Title Below */}
                    <div className="mt-2 text-center px-1">
                      <span
                        className={`block text-[11px] sm:text-xs font-bold leading-tight transition-colors ${
                          isActive
                            ? 'text-[#1D4ED8]'
                            : isCompleted
                            ? 'text-emerald-700'
                            : 'text-slate-600 group-hover:text-slate-900'
                        }`}
                      >
                        {s.title}
                      </span>
                      <span
                        className={`inline-block mt-0.5 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {isCompleted ? 'Listo' : isActive ? 'En curso' : 'Pendiente'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ====================================================================
            CONTENEDOR ESTABLE DE PANELES (MIN-HEIGHT ESTABLE, SIN SALTOS VERTICALES)
            ==================================================================== */}
        <div className="min-h-[580px] transition-all duration-200">
          {/* ─────────────────────────────────────────────────────────────
              ETAPA 1: DATOS DE IDENTIFICACIÓN DEL PROVEEDOR
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#1D4ED8] text-[24px]">badge</span>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Datos de Identificación del Proveedor</h2>
                      <p className="text-xs text-slate-500">Parámetros corporativos y clasificación legal en ERP.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => csfInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 text-xs font-bold cursor-pointer transition-colors"
                      title="Adjuntar Constancia de Situación Fiscal SAT para autocompletar datos"
                    >
                      <span className="material-symbols-outlined text-[16px]">attach_file</span>
                      <span>{csfCargada ? '✓ CSF Vinculada' : 'Adjuntar CSF (Carga Automática)'}</span>
                    </button>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                      ID: {idProveedor}
                    </span>
                  </div>
                </div>

                {/* Tipo de Entidad Fiscal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tipo de Entidad Fiscal <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label
                      className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        tipoEntidad === 'moral'
                          ? 'border-[#1D4ED8] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo_entidad"
                        value="moral"
                        checked={tipoEntidad === 'moral'}
                        onChange={() => setTipoEntidad('moral')}
                        className="sr-only"
                      />
                      <span className={`material-symbols-outlined text-[24px] ${tipoEntidad === 'moral' ? 'text-[#1D4ED8]' : 'text-slate-400'}`}>
                        domain
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Persona Moral</div>
                        <div className="text-[11px] text-slate-500">Sociedades mercantiles / S.A. de C.V.</div>
                      </div>
                    </label>

                    <label
                      className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        tipoEntidad === 'fisica'
                          ? 'border-[#1D4ED8] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo_entidad"
                        value="fisica"
                        checked={tipoEntidad === 'fisica'}
                        onChange={() => setTipoEntidad('fisica')}
                        className="sr-only"
                      />
                      <span className={`material-symbols-outlined text-[24px] ${tipoEntidad === 'fisica' ? 'text-[#1D4ED8]' : 'text-slate-400'}`}>
                        person
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Persona Física</div>
                        <div className="text-[11px] text-slate-500">Contratista independiente / Honorarios</div>
                      </div>
                    </label>

                    <label
                      className="relative flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all opacity-80"
                      onClick={() => mostrarToast('Para entidades extranjeras se habilitará anexo fiscal W-8BEN en el paso 3.', 'info')}
                    >
                      <span className="material-symbols-outlined text-[24px] text-slate-400">public</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Entidad Extranjera</div>
                        <div className="text-[11px] text-slate-500">Sin residencia fiscal en México</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Campos Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nombre Comercial / Marca <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreComercial}
                      onChange={(e) => setNombreComercial(e.target.value)}
                      placeholder="Ej. Five Peaks México / YAK Industrial"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Categoría Operativa <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categoriaOperativa}
                      onChange={(e) => setCategoriaOperativa(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 transition-all font-semibold bg-white"
                    >
                      <option value="Servicios Especializados">Servicios Especializados (Mantenimiento, Certificaciones)</option>
                      <option value="Refacciones y Suministros Industriales">Refacciones y Suministros Industriales</option>
                      <option value="Contratista de Obra y Mantenimiento">Contratista de Obra y Mantenimiento</option>
                      <option value="Transporte y Logística">Transporte y Logística</option>
                      <option value="Consultoría y Laboratorio">Consultoría y Laboratorio de Pruebas</option>
                      <option value="Consumibles de Operación">Consumibles de Operación y Seguridad</option>
                    </select>
                  </div>
                </div>

                {/* Representante y Puesto */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Tratamiento</label>
                    <select
                      value={tratamiento}
                      onChange={(e) => setTratamiento(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] bg-white font-semibold"
                    >
                      <option value="Lic.">Lic.</option>
                      <option value="Ing.">Ing.</option>
                      <option value="Sra.">Sra.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nombre del Representante Legal / Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreRepresentante}
                      onChange={(e) => setNombreRepresentante(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Denominación del Puesto</label>
                    <input
                      type="text"
                      value={denominacionPuesto}
                      onChange={(e) => setDenominacionPuesto(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                {/* Giro y Sitio Web */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Giro Empresarial</label>
                    <input
                      type="text"
                      value={giroEmpresarial}
                      onChange={(e) => setGiroEmpresarial(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Sitio Web Corporativo</label>
                    <input
                      type="url"
                      value={sitioWeb}
                      onChange={(e) => setSitioWeb(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                {/* Comentarios */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Comentarios y Notas Operativas</label>
                  <textarea
                    rows={2}
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    placeholder="Instrucciones específicas, horarios de atención o referencias de proyectos previos..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ETAPA 2: CANALES DE CONTACTO & DOMICILIO FISCAL
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tarjeta 1: Canales de Contacto */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <span className="material-symbols-outlined text-[#1D4ED8] text-[22px]">contact_phone</span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Canales de Contacto Ejecutivo</h2>
                    <p className="text-xs text-slate-500">Mesa de compras, órdenes de compra y facturación.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico Principal <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">mail</span>
                    <input
                      type="email"
                      value={emailPrincipal}
                      onChange={(e) => setEmailPrincipal(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo para Envío de Facturas / XML</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">receipt</span>
                    <input
                      type="email"
                      value={emailSecundario}
                      onChange={(e) => setEmailSecundario(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teléfono Móvil / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">smartphone</span>
                      <input
                        type="text"
                        value={telefonoMovil}
                        onChange={(e) => setTelefonoMovil(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Conmutador PBX / Oficina</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">call</span>
                      <input
                        type="text"
                        value={telefonoPbx}
                        onChange={(e) => setTelefonoPbx(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Extensión y Horarios de Atención</label>
                  <input
                    type="text"
                    value={extensionTel}
                    onChange={(e) => setExtensionTel(e.target.value)}
                    placeholder="Ej. Ext. 104 · Lun a Vie 08:00 - 18:00 hrs"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              {/* Tarjeta 2: Domicilio Fiscal */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <span className="material-symbols-outlined text-[#1D4ED8] text-[22px]">location_on</span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Domicilio Fiscal Registrado</h2>
                    <p className="text-xs text-slate-500">Cotejado con Constancia de Situación Fiscal SAT.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Calle y Número Exterior / Interior <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={calleNumero}
                    onChange={(e) => setCalleNumero(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Colonia</label>
                    <input
                      type="text"
                      value={colonia}
                      onChange={(e) => setColonia(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Código Postal <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={5}
                        value={codigoPostal}
                        onChange={(e) => setCodigoPostal(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleValidarCp}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors border border-slate-200"
                      >
                        Validar CP
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Municipio / Ciudad</label>
                    <input
                      type="text"
                      value={municipio}
                      onChange={(e) => setMunicipio(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                    <input
                      type="text"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">País</label>
                    <input
                      type="text"
                      readOnly
                      value={pais}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ETAPA 3: INFORMACIÓN FISCAL SAT (CFDI 4.0)
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Tarjeta Principal CFDI 4.0 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#1D4ED8] text-[24px]">receipt_long</span>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Validación SAT & Candados CFDI 4.0</h2>
                      <p className="text-xs text-slate-500">Extracción automática y verificación en listas negras del art. 69-B del SAT.</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Cotejo Oficial SAT Activo
                  </span>
                </div>

                {/* Botón para Adjuntar Constancia de Situación Fiscal (Carga Automática) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      csfCargada ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-[#1D4ED8]'
                    }`}>
                      <span className="material-symbols-outlined text-[22px]">
                        {csfCargada ? 'task_alt' : 'description'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Constancia de Situación Fiscal (CSF SAT)</span>
                        {csfCargada && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Datos Cargados en Automático
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {csfCargada
                          ? `Archivo adjunto: ${csfNombreArchivo} · Datos fiscales y domicilio vinculados.`
                          : 'Adjunta el PDF oficial para cargar automáticamente RFC, Razón Social, Régimen y Domicilio.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={csfInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSimularExtraccionCsf(e.target.files[0]);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => csfInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">attach_file</span>
                      <span>{csfCargada ? 'Reemplazar Constancia (PDF)' : 'Adjuntar Constancia (PDF)'}</span>
                    </button>
                    {!csfCargada && (
                      <button
                        type="button"
                        onClick={() => handleSimularExtraccionCsf()}
                        className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                        title="Simular carga de datos automáticamente"
                      >
                        Simular Carga
                      </button>
                    )}
                  </div>
                </div>

                {/* Campos Fiscales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      RFC Oficial Registrado en el SAT <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={13}
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-mono font-black tracking-wider uppercase"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-emerald-600 text-[20px]">
                        check_circle
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      RFC Válido · NO listado en el art. 69-B del CFF (Opinión Positiva)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Razón Social Registrada ante el SAT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-bold uppercase"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Escribir exactamente como aparece en la CSF, sin incluir régimen de capital.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Régimen Fiscal (Catálogo SAT) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={regimenFiscal}
                      onChange={(e) => setRegimenFiscal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] bg-white font-semibold"
                    >
                      <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                      <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - Régimen Simplificado de Confianza (RESICO 1.25%)</option>
                      <option value="612 - Personas Físicas con Actividades Empresariales">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                      <option value="603 - Personas Morales con Fines no Lucrativos">603 - Personas Morales con Fines no Lucrativos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Uso CFDI Predeterminado
                    </label>
                    <select
                      value={usoCfdi}
                      onChange={(e) => setUsoCfdi(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] bg-white font-semibold"
                    >
                      <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                      <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                      <option value="I04 - Equipo de cómputo y accesorios">I04 - Equipo de cómputo y accesorios</option>
                      <option value="CP01 - Pagos">CP01 - Pagos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Código Postal Fiscal SAT</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cpFiscal}
                      onChange={(e) => setCpFiscal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha de Emisión de la Constancia SAT</label>
                    <input
                      type="date"
                      value={fechaEmisionCsf}
                      onChange={(e) => setFechaEmisionCsf(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla de Registros Fiscales Adicionales */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Registros Fiscales Adicionales / Factoring</h3>
                    <p className="text-xs text-slate-500">Tax IDs para contratos extranjeros o filiales.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalTaxOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition-colors border border-slate-200"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Agregar Registro</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">País</th>
                        <th className="py-2.5 px-4">Identificador Fiscal</th>
                        <th className="py-2.5 px-4">Tipo de Registro</th>
                        <th className="py-2.5 px-4">Estado</th>
                        <th className="py-2.5 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {registrosFiscales.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800">{reg.pais}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#1D4ED8]">{reg.taxId}</td>
                          <td className="py-3 px-4 text-slate-600">{reg.tipo}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              {reg.estatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setRegistrosFiscales(registrosFiscales.filter((r) => r.id !== reg.id))}
                              className="text-slate-400 hover:text-red-600 cursor-pointer p-1 transition-colors"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ETAPA 4: CONDICIONES COMERCIALES, MULTIMONEDA & CUENTAS BANCARIAS
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clasificación Interna */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[#1D4ED8] text-[22px]">corporate_fare</span>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Clasificación Interna & Control</h2>
                      <p className="text-xs text-slate-500">Asignación contable y subsidiaria responsable.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subsidiaria Asignada</label>
                    <select
                      value={subsidiariaAsignada}
                      onChange={(e) => setSubsidiariaAsignada(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] bg-white font-semibold"
                    >
                      <option value="SIFYGSA Fire & Gas S.A. de C.V.">SIFYGSA Fire & Gas S.A. de C.V.</option>
                      <option value="SIFYGSA Servicios Industriales S.A.">SIFYGSA Servicios Industriales S.A.</option>
                      <option value="YAK Adventure Sports S.A. de C.V.">YAK Adventure Sports S.A. de C.V.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Comprador Responsable</label>
                    <input
                      type="text"
                      value={compradorResponsable}
                      onChange={(e) => setCompradorResponsable(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo para Aviso de Pagos / Tesorería</label>
                    <input
                      type="email"
                      value={emailNotificacionPagos}
                      onChange={(e) => setEmailNotificacionPagos(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8]"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={esProveedorProyecto}
                        onChange={(e) => setEsProveedorProyecto(e.target.checked)}
                        className="w-4 h-4 rounded text-[#1D4ED8] focus:ring-blue-400"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Proveedor Estratégico de Proyecto / Obra Crítica (Alta Prioridad)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Condiciones Comerciales */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[#1D4ED8] text-[22px]">payments</span>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Condiciones Comerciales ERP</h2>
                      <p className="text-xs text-slate-500">Días de crédito, métodos SAT y límite financiero.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Condición de Pago</label>
                      <select
                        value={diasCredito}
                        onChange={(e) => setDiasCredito(parseInt(e.target.value, 10))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] bg-white font-bold"
                      >
                        <option value={0}>0 días (Contado inmediato)</option>
                        <option value={15}>15 días de crédito</option>
                        <option value={30}>30 días de crédito estándar</option>
                        <option value={45}>45 días de crédito</option>
                        <option value={60}>60 días de crédito</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Límite de Crédito (MXN)</label>
                      <input
                        type="number"
                        value={limiteCredito}
                        onChange={(e) => setLimiteCredito(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Método de Pago SAT</label>
                      <select
                        value={metodoPagoSat}
                        onChange={(e) => setMetodoPagoSat(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] bg-white font-semibold"
                      >
                        <option value="PPD - Pago en parcialidades o diferido">PPD - Pago en parcialidades o diferido</option>
                        <option value="PUE - Pago en una sola exhibición">PUE - Pago en una sola exhibición</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pago SAT</label>
                      <select
                        value={formaPagoSat}
                        onChange={(e) => setFormaPagoSat(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#1D4ED8] bg-white font-semibold"
                      >
                        <option value="03 - Transferencia electrónica de fondos">03 - Transferencia electrónica</option>
                        <option value="02 - Cheque nominativo">02 - Cheque nominativo</option>
                        <option value="99 - Por definir">99 - Por definir</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cuenta Contable Pasivo ERP</label>
                    <input
                      type="text"
                      readOnly
                      value={cuentaContableErp}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla Multi-Divisa */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Divisas Comerciales Habilitadas</h3>
                    <p className="text-xs text-slate-500">Monedas en las que el contratista puede cotizar o facturar.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalDivisaOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition-colors border border-slate-200"
                  >
                    <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
                    <span>Agregar Divisa</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Divisa</th>
                        <th className="py-2.5 px-4">Descripción</th>
                        <th className="py-2.5 px-4">Tipo de Cambio Sugerido</th>
                        <th className="py-2.5 px-4">Rol</th>
                        <th className="py-2.5 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {divisas.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-black font-mono text-slate-900">{d.codigo}</td>
                          <td className="py-3 px-4 text-slate-700">{d.descripcion}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-800">{d.tipoCambio}</td>
                          <td className="py-3 px-4">
                            {d.esPrincipal ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                Principal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                Secundaria
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!d.esPrincipal && (
                              <button
                                type="button"
                                onClick={() => setDivisas(divisas.filter((div) => div.id !== d.id))}
                                className="text-slate-400 hover:text-red-600 cursor-pointer p-1 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cuentas Bancarias */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Cuentas Bancarias para Dispersión de Pagos (Validadas con RFC)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cuentas a nombre exclusivo del titular fiscal con CLABE de 18 dígitos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalNuevaCuentaOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_card</span>
                    <span>Agregar Cuenta Bancaria</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cuentasBancarias.map((cta) => (
                    <div
                      key={cta.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1D4ED8] text-[20px]">account_balance</span>
                          <span className="font-bold text-slate-900 text-sm">{cta.banco}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800">
                            {cta.moneda}
                          </span>
                        </div>
                        {cta.esPrincipal ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Principal
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCuentasBancarias(cuentasBancarias.filter((c) => c.id !== cta.id))}
                            className="text-slate-400 hover:text-red-600 cursor-pointer p-0.5"
                            title="Eliminar cuenta"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-600">
                        CLABE: <code className="font-mono font-bold text-slate-900">{cta.clabe}</code> · Cuenta: {cta.cuenta}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">Titular: {cta.titular}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ETAPA 5: EXPEDIENTE DIGITAL & RESUMEN EJECUTIVO
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 5 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Expediente Digital */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#1D4ED8] text-[24px]">folder_shared</span>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Expediente Digital Documental</h2>
                      <p className="text-xs text-slate-500">Documentos oficiales en PDF requeridos por normativa y SAT.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    4 de 4 Obligatorios
                  </span>
                </div>

                {/* Dropzone de Expediente */}
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-slate-400 text-[32px] mb-1">cloud_upload</span>
                  <div className="text-xs font-bold text-slate-800">Arrastra archivos para adjuntar al expediente</div>
                  <p className="text-[11px] text-slate-500">Formatos permitidos: PDF, XML o imágenes escaneadas hasta 15 MB</p>
                </div>

                {/* Lista de Documentos */}
                <div className="space-y-3">
                  {documentosExpediente.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="material-symbols-outlined text-red-500 text-[26px] shrink-0">
                          {doc.icono}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{doc.nombre}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                            <span>{doc.archivoNombre}</span>
                            <span>·</span>
                            <span>{doc.tamanoKb} KB</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {doc.estatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Declaración de Veracidad */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declaracionConformidad}
                      onChange={(e) => setDeclaracionConformidad(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#1D4ED8] focus:ring-blue-400"
                    />
                    <span className="text-xs text-slate-800 leading-relaxed">
                      <strong>Declaración bajo protesta de decir verdad:</strong> Confirmo que los datos fiscales, domicilio registrado y cuentas bancarias han sido cotejados con la documentación oficial del contratista y cumplen con los requisitos de la política de compras de SIFYGSA.
                    </span>
                  </label>
                </div>
              </div>

              {/* Right Col: Resumen Ejecutivo y Gauge */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[#1D4ED8] text-[22px]">assignment_turned_in</span>
                    <h3 className="text-sm font-bold text-slate-900">Resumen Ejecutivo de Alta</h3>
                  </div>

                  {/* Medidor Circular de Conformidad */}
                  <div className="py-4 text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-50 shadow-inner">
                        <div className="text-center">
                          <div className="text-xl font-black text-emerald-700">100%</div>
                          <div className="text-[9px] font-bold text-emerald-600 uppercase">Conforme</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-2">Expediente Completo y Validad</div>
                    <p className="text-[11px] text-slate-500">Apto para emisión de órdenes de compra.</p>
                  </div>

                  {/* Tarjetas de Resumen Rápido con Botón Editar */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="font-bold">1. Identificación</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-[#1D4ED8] font-bold hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                      <div className="font-bold text-slate-900 truncate">{nombreComercial}</div>
                      <div className="text-[11px] text-slate-600">Representante: {nombreRepresentante}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="font-bold">2. Contacto & Domicilio</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-[#1D4ED8] font-bold hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                      <div className="font-semibold text-slate-800 truncate">{emailPrincipal}</div>
                      <div className="text-[11px] text-slate-500">{municipio}, {estado} (CP {codigoPostal})</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="font-bold">3. Fiscal (CFDI 4.0)</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-[#1D4ED8] font-bold hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                      <div className="font-mono font-bold text-[#1D4ED8]">{rfc}</div>
                      <div className="text-[11px] text-slate-600 truncate">{razonSocial}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="font-bold">4. Condiciones & Banco</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="text-[#1D4ED8] font-bold hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                      <div className="text-slate-800 font-semibold">{diasCredito} días de crédito · Límite ${limiteCredito.toLocaleString()} MXN</div>
                      <div className="text-[11px] text-slate-500">Banco: {cuentasBancarias[0]?.banco} (CLABE: {cuentasBancarias[0]?.clabe.slice(-6)})</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center text-[11px] text-slate-400">
                  SIFYGSA Security Guard · Folio Único Creado
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ====================================================================
          BARRA DE ACCIONES FIJA INFERIOR (STICKY FOOTER - SEGÚN REQUERIMIENTO)
          "noma que el boton de continuar sea fijo que no se mueva..."
          ==================================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 z-40 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Lado Izquierdo: Guardar Borrador & Estado de Autoguardado */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={handleGuardarBorrador}
              disabled={isSavingDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200 shadow-xs"
              title="Guardar borrador de la sesión"
            >
              <span className="material-symbols-outlined text-[17px]">
                {isSavingDraft ? 'sync' : 'save'}
              </span>
              <span>{isSavingDraft ? 'Guardando...' : 'Guardar Borrador'}</span>
            </button>

            <span className="text-xs text-slate-400 font-medium hidden md:inline">
              {ultimoGuardado}
            </span>
          </div>

          {/* Centro: Opción Cancelar */}
          <div className="hidden sm:block">
            <button
              type="button"
              onClick={() => setModalConfirmCancelOpen(true)}
              className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar Operación
            </button>
          </div>

          {/* Lado Derecho: Navegación de Etapas (Anterior / Continuar) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={prevStep}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-colors border shadow-xs ${
                currentStep === 1
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">arrow_back</span>
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-black transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <span>{stepMeta[currentStep - 1].nextText}</span>
              <span className="material-symbols-outlined text-[17px]">
                {currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* ====================================================================
          MODAL: AGREGAR REGISTRO FISCAL ADICIONAL (STEP 3)
          ==================================================================== */}
      {modalTaxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Agregar Registro Fiscal Adicional</h3>
              <button
                type="button"
                onClick={() => setModalTaxOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">País Emisor</label>
              <select
                value={nuevoTaxPais}
                onChange={(e) => setNuevoTaxPais(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
              >
                <option value="México">México</option>
                <option value="Estados Unidos">Estados Unidos (W-8 / EIN)</option>
                <option value="Canadá">Canadá (BN / GST)</option>
                <option value="Alemania">Alemania (USt-IdNr)</option>
                <option value="España">España (CIF / NIF)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Identificador Fiscal / Tax ID</label>
              <input
                type="text"
                value={nuevoTaxId}
                onChange={(e) => setNuevoTaxId(e.target.value)}
                placeholder="Ej. US-982341908 / RFC Secundario"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Registro</label>
              <input
                type="text"
                value={nuevoTaxTipo}
                onChange={(e) => setNuevoTaxTipo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalTaxOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAgregarRegistroFiscal}
                className="flex-1 px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
              >
                Agregar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: AGREGAR DIVISA COMERCIAL (STEP 4)
          ==================================================================== */}
      {modalDivisaOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Habilitar Divisa Comercial</h3>
              <button
                type="button"
                onClick={() => setModalDivisaOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código de Divisa</label>
              <select
                value={nuevaDivisaCodigo}
                onChange={(e) => setNuevaDivisaCodigo(e.target.value as MonedaDivisa)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-black bg-white"
              >
                <option value="EUR">EUR - Euros</option>
                <option value="USD">USD - Dólares Americanos</option>
                <option value="MXN">MXN - Pesos Mexicanos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Cambio Sugerido</label>
              <input
                type="text"
                value={nuevaDivisaTc}
                onChange={(e) => setNuevaDivisaTc(e.target.value)}
                placeholder="Ej. $22.10 MXN"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalDivisaOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAgregarDivisa}
                className="flex-1 px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
              >
                Habilitar Divisa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: AGREGAR CUENTA BANCARIA (STEP 4)
          ==================================================================== */}
      {modalNuevaCuentaOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Agregar Cuenta Bancaria para Dispersión</h3>
              <button
                type="button"
                onClick={() => setModalNuevaCuentaOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institución Bancaria</label>
              <select
                value={nuevoBanco}
                onChange={(e) => setNuevoBanco(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white"
              >
                <option value="BBVA México">BBVA México</option>
                <option value="Citibanamex">Citibanamex</option>
                <option value="Santander México">Santander México</option>
                <option value="Banorte">Banorte</option>
                <option value="Scotiabank">Scotiabank</option>
                <option value="HSBC México">HSBC México</option>
                <option value="Banco del Bajío">Banco del Bajío</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CLABE Interbancaria (18 dígitos) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={18}
                value={nuevaClabe}
                onChange={(e) => {
                  setNuevaClabe(e.target.value);
                  setErrorClabe(null);
                }}
                placeholder="012905001234567890"
                className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold tracking-wider ${
                  errorClabe ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-300 focus:border-[#1D4ED8]'
                }`}
              />
              {errorClabe ? (
                <p className="text-[11px] text-red-600 font-bold mt-1">{errorClabe}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">Estandarizado a 18 dígitos para dispersión SPEI.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número de Cuenta</label>
                <input
                  type="text"
                  value={nuevaCuentaNum}
                  onChange={(e) => setNuevaCuentaNum(e.target.value)}
                  placeholder="Ej. 0123456789"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Moneda</label>
                <select
                  value={nuevaMonedaCta}
                  onChange={(e) => setNuevaMonedaCta(e.target.value as MonedaDivisa)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalNuevaCuentaOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAgregarCuentaBancaria}
                className="flex-1 px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
              >
                Guardar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CONFIRMAR ALTA Y NOTIFICAR A ADMINISTRACIÓN (STEP 5)
          ==================================================================== */}
      {modalNotificarAdminOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">verified</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {proveedorExistente ? 'Actualizar Expediente de Proveedor' : 'Finalizar Alta de Proveedor'}
              </h3>
              <p className="text-xs text-slate-500">
                El proveedor será homologado con RFC <strong className="font-mono text-slate-900">{rfc}</strong> y quedará habilitado de inmediato para compras institucionales.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Razón Social:</span>
                <span className="font-bold text-slate-900 text-right">{razonSocial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Crédito:</span>
                <span className="font-bold text-slate-800">{diasCredito} días (${limiteCredito.toLocaleString()} MXN)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Cuentas Bancarias:</span>
                <span className="font-bold text-slate-800">{cuentasBancarias.length} registrada(s)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmarGuardado(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[17px]">send</span>
                <span>Confirmar y Notificar a Administración</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmarGuardado(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Solo Guardar en Directorio (Sin Notificar)
              </button>

              <button
                type="button"
                onClick={() => setModalNotificarAdminOpen(false)}
                className="w-full py-2 px-4 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Regresar a Revisar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CONFIRMAR CANCELACIÓN
          ==================================================================== */}
      {modalConfirmCancelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">¿Deseas cancelar la operación?</h3>
            <p className="text-xs text-slate-500">
              Se conservarán los datos respaldados en el borrador local. Podrás reanudar el alta más adelante.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmCancelOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Continuar Editando
              </button>
              <button
                type="button"
                onClick={() => router.push('/compras')}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevoProveedorPage;
