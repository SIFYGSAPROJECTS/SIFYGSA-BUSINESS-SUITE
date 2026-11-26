import type { Proveedor, OrdenCompra, FacturaProveedor } from '../types';

export const PROVEEDORES_INICIALES: Proveedor[] = [
  {
    id: 'PRV-00105',
    rfc: 'FPM130918MPA',
    razonSocial: 'FIVE PEAKS MÉXICO SA DE CV',
    nombreComercial: 'Five Peaks México',
    tipoPersona: 'moral',
    giro: 'Servicios de Saneamiento y Baños Portátiles para Obra',
    contactoPrincipal: 'Lic. Sergio Salinas Galván',
    puestoContacto: 'Gerente de Contratos y Cuentas Industriales',
    telefono: '(55) 5600-4321',
    email: 'contacto@fivepeaks.mx',
    direccion: {
      calle: 'Av. Industrial 500, Parque Logístico',
      colonia: 'Zona Industrial',
      cp: '94290',
      ciudad: 'Boca del Río',
      estado: 'Veracruz',
    },
    estatus: 'activo',
    categoria: 'Servicios Especializados',
    regimenFiscal: '601 - General de Ley Personas Morales',
    usoCfdi: 'G03 - Gastos en general',
    formaPago: '03 - Transferencia electrónica de fondos',
    metodoPago: 'PPD - Pago en parcialidades o diferido',
    moneda: 'MXN',
    diasCredito: 30,
    limiteCredito: 300000,
    banco: 'BBVA México',
    clabe: '012905001234567890',
    cuenta: '0123456789',
    opinionSat32D: 'positiva',
    fechaActualizacion32D: '2026-03-01',
  },
  {
    id: 'PRV-00109',
    rfc: 'YAD140828TY2',
    razonSocial: 'YAK ADVENTURE S.A. DE C.V.',
    nombreComercial: 'YAK Adventure',
    tipoPersona: 'moral',
    giro: 'Materiales y Equipos de Seguridad Contra Incendio',
    contactoPrincipal: 'Lic. Roberto González Garza',
    puestoContacto: 'Gerente Comercial Industrial',
    telefono: '(55) 5543-9821',
    email: 'ventas@yakadventure.mx',
    direccion: {
      calle: 'Av. Insurgentes Sur 1450, Piso 5',
      colonia: 'Actipan, Benito Juárez',
      cp: '03230',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
    },
    estatus: 'activo',
    categoria: 'Bienes / Materiales',
    regimenFiscal: '601 - General de Ley Personas Morales',
    usoCfdi: 'G01 - Adquisición de mercancías',
    formaPago: '03 - Transferencia electrónica de fondos',
    metodoPago: 'PPD - Pago en parcialidades o diferido',
    moneda: 'MXN',
    diasCredito: 30,
    limiteCredito: 1500000,
    banco: 'BBVA México',
    clabe: '012180001234567890',
    cuenta: '0123456789',
    opinionSat32D: 'positiva',
    fechaActualizacion32D: '2026-03-01',
  },
  {
    id: 'PRV-00108',
    rfc: 'GMX060322AB1',
    razonSocial: 'GRUPO MEXICANO DE SEGUROS S.A. DE C.V.',
    nombreComercial: 'GMX Seguros',
    tipoPersona: 'moral',
    giro: 'Pólizas de Seguros y Fianzas Industriales',
    contactoPrincipal: 'Act. Patricia Morales Ruiz',
    puestoContacto: 'Subdirectora de Cuentas Corporativas',
    telefono: '(55) 5200-7000',
    email: 'corporativo@gmx.com.mx',
    direccion: {
      calle: 'Blvd. Adolfo López Mateos 261',
      colonia: 'Los Alpes, Álvaro Obregón',
      cp: '01010',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
    },
    estatus: 'activo',
    categoria: 'Seguros / Fianzas',
    regimenFiscal: '601 - General de Ley Personas Morales',
    usoCfdi: 'G03 - Gastos en general',
    formaPago: '03 - Transferencia electrónica de fondos',
    metodoPago: 'PUE - Pago en una sola exhibición',
    moneda: 'MXN',
    diasCredito: 15,
    limiteCredito: 850000,
    banco: 'Banorte',
    clabe: '072180009876543210',
    cuenta: '0987654321',
    opinionSat32D: 'positiva',
    fechaActualizacion32D: '2026-02-28',
  },
  {
    id: 'PRV-00107',
    rfc: 'BME920514KL8',
    razonSocial: 'BELDEN DE MÉXICO S.A. DE C.V.',
    nombreComercial: 'Belden',
    tipoPersona: 'moral',
    giro: 'Cables Instrumentados, Redes y Señalización Industrial',
    contactoPrincipal: 'Ing. Fernando Lozano',
    puestoContacto: 'Ingeniero de Aplicaciones & Ventas',
    telefono: '(81) 8356-4200',
    email: 'pedidos@belden.com.mx',
    direccion: {
      calle: 'Carretera Miguel Alemán Km 14.5',
      colonia: 'Parque Industrial Monterrey',
      cp: '66600',
      ciudad: 'Apodaca',
      estado: 'Nuevo León',
    },
    estatus: 'activo',
    categoria: 'Telecomunicaciones & Cableado',
    regimenFiscal: '601 - General de Ley Personas Morales',
    usoCfdi: 'G01 - Adquisición de mercancías',
    formaPago: '03 - Transferencia electrónica de fondos',
    metodoPago: 'PPD - Pago en parcialidades o diferido',
    moneda: 'USD',
    diasCredito: 45,
    limiteCredito: 2500000,
    banco: 'Citibanamex',
    clabe: '002180012398745612',
    cuenta: '7001239874',
    opinionSat32D: 'positiva',
    fechaActualizacion32D: '2026-03-05',
  },
  {
    id: 'PRV-00106',
    rfc: 'DTI110419XX3',
    razonSocial: 'DET-TRONICS INTEGRACIÓN S.A.P.I. DE C.V.',
    nombreComercial: 'Det-Tronics México',
    tipoPersona: 'moral',
    giro: 'Sistemas Ópticos de Detección de Flama y Gas',
    contactoPrincipal: 'Ing. Carlos Sandoval E.',
    puestoContacto: 'Líder Técnico de Soporte',
    telefono: '(55) 5395-6010',
    email: 'contacto@dettronics.mx',
    direccion: {
      calle: 'Av. Ej ejército Nacional 418, Polanco',
      colonia: 'Chapultepec Morales',
      cp: '11570',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
    },
    estatus: 'activo',
    categoria: 'Sistemas Contra Incendio',
    regimenFiscal: '601 - General de Ley Personas Morales',
    usoCfdi: 'G01 - Adquisición de mercancías',
    formaPago: '03 - Transferencia electrónica de fondos',
    metodoPago: 'PPD - Pago en parcialidades o diferido',
    moneda: 'USD',
    diasCredito: 30,
    limiteCredito: 3000000,
    banco: 'Santander México',
    clabe: '014180004561237890',
    cuenta: '4561237890',
    opinionSat32D: 'positiva',
    fechaActualizacion32D: '2026-03-02',
  },
  {
    id: 'PRV-00110',
    rfc: 'FPS180905M82',
    razonSocial: 'FIVE PEAKS SEGURIDAD INDUSTRIAL S.A. DE C.V.',
    nombreComercial: 'Five Peaks',
    tipoPersona: 'moral',
    giro: 'Equipo de Protección Personal y Rescate en Alturas',
    contactoPrincipal: 'Lic. Laura Treviño',
    puestoContacto: 'Atención a Contratistas Industriales',
    telefono: '(55) 5688-9122',
    email: 'atencion@fivepeaks.com.mx',
    direccion: {
      calle: 'Calzada de Tlalpan 2148',
      colonia: 'Campestre Churubusco',
      cp: '04200',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
    },
    estatus: 'inactivo',
    categoria: 'Seguridad Industrial & EPP',
    regimenFiscal: '601 - General de Ley Personas Morales',
    usoCfdi: 'G03 - Gastos en general',
    formaPago: '03 - Transferencia electrónica de fondos',
    metodoPago: 'PUE - Pago en una sola exhibición',
    moneda: 'MXN',
    diasCredito: 0,
    limiteCredito: 200000,
    banco: 'Scotiabank',
    clabe: '044180007894561230',
    cuenta: '7894561230',
    opinionSat32D: 'revision',
    fechaActualizacion32D: '2026-01-15',
  },
  {
    id: 'PRV-00104',
    rfc: 'MIN090211QT9',
    razonSocial: 'MANGUERAS E INSTRUMENTACIÓN DEL NORTE S.A. DE C.V.',
    nombreComercial: 'MINorsa',
    tipoPersona: 'moral',
    giro: 'Conexiones, Tubería Flexible y Niplería Especializada',
    contactoPrincipal: 'Ing. David Salinas',
    puestoContacto: 'Gerente de Ventas Técnicas',
    telefono: '(899) 922-1088',
    email: 'ventas@minorsa.com',
    direccion: {
      calle: 'Libramiento Monterrey-Matamoros 100',
      colonia: 'Reynosa Centro',
      cp: '88500',
      ciudad: 'Reynosa',
      estado: 'Tamaulipas',
    },
    estatus: 'activo',
    categoria: 'Tubería y Conexiones',
    regimenFiscal: '601 - General de Ley Personas Morales',
    usoCfdi: 'G01 - Adquisición de mercancías',
    formaPago: '03 - Transferencia electrónica de fondos',
    metodoPago: 'PPD - Pago en parcialidades o diferido',
    moneda: 'MXN',
    diasCredito: 30,
    limiteCredito: 600000,
    banco: 'Banorte',
    clabe: '072180002233445566',
    cuenta: '0223344556',
    opinionSat32D: 'positiva',
    fechaActualizacion32D: '2026-03-04',
  },
];

export const ORDENES_COMPRA_INICIALES: OrdenCompra[] = [
  {
    id: 'PO-2026-0173',
    folio: 'PO-2026-0173',
    proveedorId: 'PRV-00105',
    proveedorNombre: 'Five Peaks México SA de CV',
    proveedorRfc: 'FPM130918MPA',
    fechaEmision: '2026-11-10',
    fechaEntrega: '2026-11-25',
    solicitante: 'Carlos Mendoza',
    departamento: 'Operaciones & Frentes de Obra',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyectoId: 'SFG-C259',
    estatus: 'abierta',
    moneda: 'MXN',
    tipoCambio: 18.45,
    condicionPago: 'Crédito 30 días',
    subtotal: 3550.0,
    descuento: 0,
    iva: 568.0,
    total: 4118.0,
    notas: 'Servicio de baño portátil para Tenaris Tamsa. Aclaración / Nota de partida: CC: SFG-C259 - Ref: SFG-C259-LVT-RQ-127/26. Tope Requisición: 1.00.',
    tieneFactura: false,
    items: [
      {
        id: 'it-po0173-1',
        partida: 1,
        codigo: 'SRV-SAN-001',
        descripcion: 'Servicio de baño portátil para Tenaris Tamsa - Ref: SFG-C259-LVT-RQ-127/26',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitario: 2700.0,
        descuentoPorcentaje: 0,
        subtotal: 2700.0,
      },
      {
        id: 'it-po0173-2',
        partida: 2,
        codigo: 'SRV-EMB-001',
        descripcion: 'Flete y Servicio de Envío / Embarque Especializado en sitio Tenaris Tamsa',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitario: 850.0,
        descuentoPorcentaje: 0,
        subtotal: 850.0,
      },
    ],
  },
  {
    id: 'PO-2026-0174',
    folio: 'PO-2026-0174',
    proveedorId: 'PRV-00105',
    proveedorNombre: 'Five Peaks México SA de CV',
    proveedorRfc: 'FPM130918MPA',
    fechaEmision: '2026-02-27',
    fechaEntrega: '2026-03-15',
    solicitante: 'Carlos Mendoza',
    departamento: 'Operaciones & Frentes de Obra',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyectoId: 'SFG-C259',
    estatus: 'abierta',
    moneda: 'MXN',
    condicionPago: 'Crédito 30 días',
    subtotal: 3550.0,
    descuento: 0,
    iva: 568.0,
    total: 4118.0,
    notas: 'Servicio de baño portátil para Tenaris Tamsa. Aclaración / Nota de partida: CC: SFG-C259 • Ref: SFG-C259-LVT-RQ-127/26. Tope Requisición: 1.00.',
    tieneFactura: false,
    items: [
      {
        id: 'it-po0174-1',
        partida: 1,
        codigo: 'SRV-SAN-001',
        descripcion: 'Servicio de baño portátil para Tenaris Tamsa - Ref: SFG-C259-LVT-RQ-127/26',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitario: 2700.0,
        descuentoPorcentaje: 0,
        subtotal: 2700.0,
      },
      {
        id: 'it-po0174-2',
        partida: 2,
        codigo: 'SRV-EMB-001',
        descripcion: 'Flete y Servicio de Envío / Embarque Especializado en sitio Tenaris Tamsa',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitario: 850.0,
        descuentoPorcentaje: 0,
        subtotal: 850.0,
      },
    ],
  },
  {
    id: 'PO10926',
    folio: 'PO10926',
    proveedorId: 'PRV-00105',
    proveedorNombre: 'Five Peaks México SA de CV',
    proveedorRfc: 'FPM130918MPA',
    fechaEmision: '2026-02-27',
    fechaEntrega: '2026-03-15',
    solicitante: 'Carlos Mendoza',
    departamento: 'Operaciones & Frentes de Obra',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyectoId: 'SFG-C259',
    estatus: 'abierta',
    moneda: 'MXN',
    condicionPago: 'Crédito 30 días',
    subtotal: 2700.0,
    descuento: 0,
    iva: 432.0,
    total: 3132.0,
    notas: 'Servicio de baño portátil para Tenaris Tamsa. Aclaración / Nota de partida: CC: SFG-C259 • Ref: SFG-C259-LVT-RQ-127/26. Tope Requisición: 1.00.',
    facturaId: 'FAC-2026-8910',
    facturaFolio: 'FAC-2026-8910',
    tieneFactura: true,
    facturaUuid: '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0',
    items: [
      {
        id: 'it-po10926-1',
        partida: 1,
        codigo: 'SRV-SAN-001',
        descripcion: 'Servicio de baño portátil para Tenaris Tamsa - Ref: SFG-C259-LVT-RQ-127/26',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitario: 2700.0,
        descuentoPorcentaje: 0,
        subtotal: 2700.0,
      },
      {
        id: 'it-po10926-2',
        partida: 2,
        codigo: 'SRV-EMB-001',
        descripcion: 'Flete y Servicio de Envío / Embarque Especializado en sitio Tenaris Tamsa',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitario: 850.0,
        descuentoPorcentaje: 0,
        subtotal: 850.0,
      },
    ],
  },
  {
    id: 'PO-2024-0051',
    folio: 'PO-2024-0051',
    proveedorId: 'PRV-00109',
    proveedorNombre: 'YAK ADVENTURE S.A. DE C.V.',
    proveedorRfc: 'YAD140828TY2',
    fechaEmision: '2026-02-18',
    fechaEntrega: '2026-03-10',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    departamento: 'Operaciones & Frentes de Obra',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyectoId: 'SA-2026-0047',
    estatus: 'abierta',
    moneda: 'MXN',
    condicionPago: 'Crédito 30 días',
    subtotal: 84000.0,
    descuento: 0,
    iva: 13440.0,
    total: 97440.0,
    notas: 'Entrega en andén 2 de almacén central con certificado de calidad y hoja de seguridad.',
    items: [
      {
        id: 'item-1',
        partida: 1,
        codigo: 'TUB-CONDUIT-ALUM-1',
        descripcion: 'Tubo Conduit de Aluminio Cédula 40 de 1 pulgada x 3m tipo pesado para área clasificada',
        cantidad: 150,
        unidad: 'Tramo 3m',
        precioUnitario: 320.0,
        descuentoPorcentaje: 0,
        subtotal: 48000.0,
      },
      {
        id: 'item-2',
        partida: 2,
        codigo: 'CON-ALUM-HERM-1',
        descripcion: 'Conector hermético a prueba de explosión de 1 pulgada NPT aluminio libre de cobre',
        cantidad: 120,
        unidad: 'Pieza',
        precioUnitario: 300.0,
        descuentoPorcentaje: 0,
        subtotal: 36000.0,
      },
    ],
  },
  {
    id: 'PO-2024-0089',
    folio: 'PO-2024-0089',
    proveedorId: 'PRV-00106',
    proveedorNombre: 'DET-TRONICS INTEGRACIÓN S.A.P.I.',
    proveedorRfc: 'DTI110419XX3',
    fechaEmision: '2026-02-22',
    fechaEntrega: '2026-03-25',
    solicitante: 'Ing. Javier Solís',
    departamento: 'Ingeniería & Procura Especial',
    almacenDestino: 'Almacen Principal : Merida',
    proyectoId: 'SA-2026-0048',
    estatus: 'transito',
    moneda: 'USD',
    condicionPago: 'Crédito 30 días',
    subtotal: 18500.0,
    descuento: 500.0,
    iva: 2880.0,
    total: 20880.0,
    notas: 'Detectores ópticos multiespectro IR3 con certificación ATEX/FM y soporte de montaje en acero 316.',
    items: [
      {
        id: 'item-3',
        partida: 1,
        codigo: 'DET-FLAM-X3301',
        descripcion: 'Detector Multispectrum IR Flame Detector X3301 Det-Tronics Stainless Steel Housing',
        cantidad: 5,
        unidad: 'Pieza',
        precioUnitario: 3700.0,
        descuentoPorcentaje: 2.7,
        subtotal: 18000.0,
      },
    ],
  },
  {
    id: 'PO-2024-0074',
    folio: 'PO-2024-0074',
    proveedorId: 'PRV-00107',
    proveedorNombre: 'BELDEN DE MÉXICO S.A. DE C.V.',
    proveedorRfc: 'BME920514KL8',
    fechaEmision: '2026-02-15',
    fechaEntrega: '2026-02-28',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    departamento: 'Operaciones & Procura',
    almacenDestino: 'Almacen Principal   SENSIA',
    proyectoId: 'SA-2026-0049',
    estatus: 'cerrada',
    moneda: 'MXN',
    condicionPago: 'Crédito 45 días',
    subtotal: 125000.0,
    descuento: 2500.0,
    iva: 19600.0,
    total: 142100.0,
    notas: 'Carretes de cable para instrumentación apantallado calibre 16 AWG 2 pares con charola.',
    items: [
      {
        id: 'item-4',
        partida: 1,
        codigo: 'CAB-INST-16AWG-2P',
        descripcion: 'Cable de Instrumentación 2 Pares 16 AWG Blindado 100% Belden 300V UL PLTC',
        cantidad: 2500,
        unidad: 'Metro',
        precioUnitario: 49.0,
        descuentoPorcentaje: 0,
        subtotal: 122500.0,
      },
    ],
  },
  {
    id: 'PO-2024-0062',
    folio: 'PO-2024-0062',
    proveedorId: 'PRV-00108',
    proveedorNombre: 'GRUPO MEXICANO DE SEGUROS S.A.',
    proveedorRfc: 'GMX060322AB1',
    fechaEmision: '2026-03-01',
    fechaEntrega: '2026-03-15',
    solicitante: 'Lic. Mariana Garza',
    departamento: 'Administración & Finanzas',
    almacenDestino: 'SFG-ADM-ADMON',
    proyectoId: 'SA-2026-0047',
    estatus: 'pendiente',
    moneda: 'MXN',
    condicionPago: 'Contado 15 días',
    subtotal: 45000.0,
    descuento: 0,
    iva: 7200.0,
    total: 52200.0,
    notas: 'Endoso de fianza de cumplimiento y vicios ocultos para contrato de obra marina.',
    items: [
      {
        id: 'item-5',
        partida: 1,
        codigo: 'SRV-FIANZA-CUMP-01',
        descripcion: 'Emisión de Póliza y Fianza de Fiel Cumplimiento frente a cliente Pemex Exploración',
        cantidad: 1,
        unidad: 'Servicio',
        precioUnitario: 45000.0,
        descuentoPorcentaje: 0,
        subtotal: 45000.0,
      },
    ],
  },
  {
    id: 'PO-2026-0192',
    folio: 'PO-2026-0192',
    proveedorId: 'PRV-00104',
    proveedorNombre: 'MANGUERAS E INSTRUMENTACIÓN DEL NORTE',
    proveedorRfc: 'MIN090211QT9',
    fechaEmision: '2026-03-03',
    fechaEntrega: '2026-03-18',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    departamento: 'Operaciones de Campo',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyectoId: 'SA-2026-0047',
    estatus: 'abierta',
    moneda: 'MXN',
    condicionPago: 'Crédito 30 días',
    subtotal: 62400.0,
    descuento: 1200.0,
    iva: 9792.0,
    total: 70992.0,
    notas: 'Válvulas de esfera acero inoxidable 316 600# y mangueras flexibles de alta presión.',
    items: [
      {
        id: 'item-6',
        partida: 1,
        codigo: 'VAL-ESF-INOX-2',
        descripcion: 'Válvula de Esfera Acero Inox 316 de 2 pulgadas Clase 600 Paso Completo',
        cantidad: 8,
        unidad: 'Pieza',
        precioUnitario: 7650.0,
        descuentoPorcentaje: 0,
        subtotal: 61200.0,
      },
    ],
  },
  // TODO: Conectar con endpoint GET /api/compras/ordenes (esquema PostgreSQL "compras") para series históricas adicionales
  {
    id: 'PO-2026-0018',
    folio: 'PO-2026-0018',
    proveedorId: 'PRV-00107',
    proveedorNombre: 'BELDEN DE MÉXICO S.A. DE C.V.',
    proveedorRfc: 'BME920514KL8',
    fechaEmision: '2026-01-14',
    fechaEntrega: '2026-01-29',
    solicitante: 'Ing. Javier Solís',
    departamento: 'Ingeniería & Procura Especial',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyectoId: 'SFG-C259',
    estatus: 'cerrada',
    moneda: 'MXN',
    condicionPago: 'Crédito 45 días',
    subtotal: 98000.0,
    descuento: 0,
    iva: 15680.0,
    total: 113680.0,
    notas: 'Lote inicial de cableado de control e instrumentación para frente de obra Tenaris Tamsa.',
    tieneFactura: true,
    facturaFolio: 'FAC-2026-1104',
    items: [
      {
        id: 'item-7',
        partida: 1,
        codigo: 'CAB-INST-16AWG-2P',
        descripcion: 'Cable de Instrumentación 2 Pares 16 AWG Blindado 100% Belden 300V UL PLTC',
        cantidad: 2000,
        unidad: 'Metro',
        precioUnitario: 49.0,
        descuentoPorcentaje: 0,
        subtotal: 98000.0,
      },
    ],
  },
  {
    id: 'PO-2026-0115',
    folio: 'PO-2026-0115',
    proveedorId: 'PRV-00109',
    proveedorNombre: 'YAK ADVENTURE S.A. DE C.V.',
    proveedorRfc: 'YAD140828TY2',
    fechaEmision: '2026-04-08',
    fechaEntrega: '2026-04-22',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    departamento: 'Operaciones & Frentes de Obra',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyectoId: 'SA-2026-0047',
    estatus: 'cerrada',
    moneda: 'MXN',
    condicionPago: 'Crédito 30 días',
    subtotal: 64000.0,
    descuento: 0,
    iva: 10240.0,
    total: 74240.0,
    notas: 'Suministro de tubería conduit y cajas condulet serie GUA a prueba de explosión.',
    tieneFactura: true,
    facturaFolio: 'FAC-2026-4412',
    items: [
      {
        id: 'item-8',
        partida: 1,
        codigo: 'TUB-CONDUIT-ALUM-1',
        descripcion: 'Tubo Conduit de Aluminio Cédula 40 de 1 pulgada x 3m tipo pesado para área clasificada',
        cantidad: 200,
        unidad: 'Tramo 3m',
        precioUnitario: 320.0,
        descuentoPorcentaje: 0,
        subtotal: 64000.0,
      },
    ],
  },
  {
    id: 'PO-2026-0148',
    folio: 'PO-2026-0148',
    proveedorId: 'PRV-00110',
    proveedorNombre: 'FIVE PEAKS SEGURIDAD INDUSTRIAL S.A. DE C.V.',
    proveedorRfc: 'FPS180905M82',
    fechaEmision: '2026-05-19',
    fechaEntrega: '2026-06-02',
    solicitante: 'Lic. Mariana Garza',
    departamento: 'Seguridad Industrial & HSE',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyectoId: 'SFG-C259',
    estatus: 'cancelada',
    moneda: 'MXN',
    condicionPago: 'Contado',
    subtotal: 18500.0,
    descuento: 0,
    iva: 2960.0,
    total: 21460.0,
    notas: 'Cancelada por actualización de requerimiento técnico de arneses dieléctricos.',
    items: [
      {
        id: 'item-9',
        partida: 1,
        codigo: 'EPP-ARN-DIEL-01',
        descripcion: 'Arnés de cuerpo completo dieléctrico 4 anillos certificación ANSI Z359.11',
        cantidad: 10,
        unidad: 'Pieza',
        precioUnitario: 1850.0,
        descuentoPorcentaje: 0,
        subtotal: 18500.0,
      },
    ],
  },
];

// Almacenamiento local para permitir persistencia en memoria/sesión del navegador
const STORAGE_KEY_PROVEEDORES = 'sifygsa_compras_proveedores_v1';
const STORAGE_KEY_ORDENES = 'sifygsa_compras_ordenes_v1';

export function obtenerProveedores(): Proveedor[] {
  if (typeof window === 'undefined') return PROVEEDORES_INICIALES;
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROVEEDORES);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Fallback a iniciales
  }
  return PROVEEDORES_INICIALES;
}

export function guardarNuevoProveedor(proveedor: Proveedor): Proveedor[] {
  const actuales = obtenerProveedores();
  const existe = actuales.some((p) => p.id === proveedor.id);
  const actualizados = existe
    ? actuales.map((p) => (p.id === proveedor.id ? proveedor : p))
    : [proveedor, ...actuales];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_PROVEEDORES, JSON.stringify(actualizados));
    } catch {
      // Ignorar si localStorage está deshabilitado
    }
  }
  return actualizados;
}

export function obtenerOrdenesCompra(): OrdenCompra[] {
  if (typeof window === 'undefined') return ORDENES_COMPRA_INICIALES;
  try {
    const data = localStorage.getItem(STORAGE_KEY_ORDENES);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Fallback a iniciales
  }
  return ORDENES_COMPRA_INICIALES;
}

export function guardarNuevaOrdenCompra(orden: OrdenCompra): OrdenCompra[] {
  const actuales = obtenerOrdenesCompra();
  const existe = actuales.some(
    (o) =>
      o.id.toLowerCase() === orden.id.toLowerCase() ||
      o.folio.toLowerCase() === orden.folio.toLowerCase()
  );
  const actualizados = existe
    ? actuales.map((o) =>
        o.id.toLowerCase() === orden.id.toLowerCase() ||
        o.folio.toLowerCase() === orden.folio.toLowerCase()
          ? orden
          : o
      )
    : [orden, ...actuales];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_ORDENES, JSON.stringify(actualizados));
    } catch {
      // Ignorar si localStorage está deshabilitado
    }
  }
  return actualizados;
}

// ============================================================================
// FACTURAS DE PROVEEDOR (CFDI 4.0 TIMBRADAS)
// ============================================================================

const STORAGE_KEY_FACTURAS = 'sifygsa_compras_facturas_v1';

export const FACTURAS_PROVEEDOR_INICIALES: FacturaProveedor[] = [
  {
    id: 'FAC-2026-8910',
    folio: 'FAC-2026-8910',
    uuidFiscal: '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0',
    ordenCompraId: 'PO10926',
    ordenCompraFolio: 'PO10926',
    proveedorId: 'PRV-00105',
    proveedorNombre: 'Five Peaks México SA de CV',
    proveedorRfc: 'FPM130918MPA',
    fechaEmision: '2026-02-27',
    fechaVencimiento: '2026-03-29',
    moneda: 'MXN',
    subtotal: 2700.0,
    iva: 432.0,
    total: 3132.0,
    estatus: 'abierta',
    tipoOperacion: 'Prestación de Servicios Operativos',
    usoCfdi: 'G03 - Gastos en general',
    cuentaGasto: '6010-0010-0000 GASTOS GENERALES : SERVICIOS EN SITIO',
    xmlArchivo: 'FPM130918MPA_FP89412.xml',
    pdfArchivo: 'Representacion_Impresa_FP89412.pdf',
    documentoPrincipal: {
      id: 'doc-fac-8910',
      nombre: 'FPM130918MPA_Factura_FP89412.pdf',
      tamano: 145920,
      tipo: 'application/pdf',
      fechaSubida: '2026-02-27T11:30:00Z',
    },
    observaciones: 'Factura vinculada a PO10926 para servicio de sanitización en frente de obra Tenaris Tamsa.',
  },
];

export function obtenerFacturasProveedor(): FacturaProveedor[] {
  if (typeof window === 'undefined') return FACTURAS_PROVEEDOR_INICIALES;
  try {
    const data = localStorage.getItem(STORAGE_KEY_FACTURAS);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Fallback
  }
  return FACTURAS_PROVEEDOR_INICIALES;
}

export function obtenerFacturasPorOrden(folioOrId: string): FacturaProveedor[] {
  const facturas = obtenerFacturasProveedor();
  const normalizado = (folioOrId || '').trim().toLowerCase();
  return facturas.filter(
    (f) =>
      (f.ordenCompraId && f.ordenCompraId.trim().toLowerCase() === normalizado) ||
      (f.ordenCompraFolio && f.ordenCompraFolio.trim().toLowerCase() === normalizado)
  );
}

export function guardarFacturaProveedor(factura: FacturaProveedor): { facturas: FacturaProveedor[]; ordenes: OrdenCompra[] } {
  const actualesFacturas = obtenerFacturasProveedor();
  // Evitar duplicados por id o UUID
  const filtradas = actualesFacturas.filter(f => f.id !== factura.id && f.uuidFiscal !== factura.uuidFiscal);
  const actualizadasFacturas = [factura, ...filtradas];

  // También actualizar la Orden de Compra para reflejar que tiene factura asociada
  const actualesOrdenes = obtenerOrdenesCompra();
  const actualizadasOrdenes = actualesOrdenes.map(oc => {
    if (oc.id === factura.ordenCompraId || oc.folio === factura.ordenCompraFolio) {
      return {
        ...oc,
        facturaId: factura.id,
        facturaFolio: factura.folio,
        facturaUuid: factura.uuidFiscal,
        tieneFactura: true,
      };
    }
    return oc;
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_FACTURAS, JSON.stringify(actualizadasFacturas));
      localStorage.setItem(STORAGE_KEY_ORDENES, JSON.stringify(actualizadasOrdenes));
    } catch {
      // Ignorar si localStorage falla
    }
  }

  return { facturas: actualizadasFacturas, ordenes: actualizadasOrdenes };
}

export function obtenerFacturaPorOrdenId(ordenId: string): FacturaProveedor | undefined {
  const facturas = obtenerFacturasProveedor();
  return facturas.find(f => f.ordenCompraId === ordenId || f.ordenCompraFolio === ordenId);
}

// ── CONTADORES MOCK PARA ACCESOS RÁPIDOS Y FILTROS DE COMPRAS ──
export interface OrdenPorActualizar {
  id: string;
  folio: string;
  proveedorNombre: string;
  proveedorRfc: string;
  fechaEmision: string;
  fechaEntrega: string;
  total: number;
  moneda: string;
  estatus: 'abierta' | 'transito' | 'pendiente_aprobacion' | 'en_revision';
  diasSinActualizar: number;
  almacenDestino?: string;
  proyecto?: string;
  notas?: string;
}

export interface OrdenPendiente {
  id: string;
  folio: string;
  proveedorNombre: string;
  proveedorRfc: string;
  solicitante: string;
  proyecto: string;
  fechaEmision: string;
  total: number;
  moneda: string;
  estatus: 'pendiente' | 'pendiente_aprobacion' | 'por_autorizar';
  almacenDestino?: string;
  notas?: string;
}

export const MOCK_ORDENES_POR_ACTUALIZAR: OrdenPorActualizar[] = [
  {
    id: 'oc-act-001',
    folio: 'PO-2026-0173',
    proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
    proveedorRfc: 'FPM130918MPA',
    fechaEmision: '2026-11-10',
    fechaEntrega: '2026-11-25',
    total: 4118.00,
    moneda: 'MXN',
    estatus: 'abierta',
    diasSinActualizar: 8,
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyecto: 'SFG-C259',
    notas: 'Requiere actualización de fecha estimada por demora del transportista.',
  },
  {
    id: 'oc-act-002',
    folio: 'PO-2026-0174',
    proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
    proveedorRfc: 'FPM130918MPA',
    fechaEmision: '2026-11-18',
    fechaEntrega: '2026-12-03',
    total: 14088.21,
    moneda: 'MXN',
    estatus: 'abierta',
    diasSinActualizar: 6,
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyecto: 'SFG-C259',
    notas: 'Pendiente confirmación de lote de válvulas.',
  },
  {
    id: 'oc-act-003',
    folio: 'PO10926',
    proveedorNombre: 'MANGUERAS E INSTRUMENTACIÓN DEL NORTE',
    proveedorRfc: 'MIN090211QT9',
    fechaEmision: '2026-03-03',
    fechaEntrega: '2026-03-18',
    total: 70992.00,
    moneda: 'MXN',
    estatus: 'abierta',
    diasSinActualizar: 7,
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyecto: 'SA-2026-0047',
    notas: 'Aviso de embarque parcial pendiente.',
  },
  {
    id: 'oc-act-004',
    folio: 'PO-2024-0051',
    proveedorNombre: 'YAK ADVENTURE S.A. DE C.V.',
    proveedorRfc: 'YAD140828TY2',
    fechaEmision: '2026-04-02',
    fechaEntrega: '2026-04-18',
    total: 97440.00,
    moneda: 'MXN',
    estatus: 'transito',
    diasSinActualizar: 3,
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyecto: 'SA-2026-0047',
    notas: 'En tránsito con guía 88129-FEDEX.',
  },
  {
    id: 'oc-act-005',
    folio: 'PO-2024-0089',
    proveedorNombre: 'DET-TRONICS INTEGRACIÓN S.A.P.I.',
    proveedorRfc: 'DIN120405H81',
    fechaEmision: '2026-04-10',
    fechaEntrega: '2026-04-25',
    total: 20880.00,
    moneda: 'MXN',
    estatus: 'transito',
    diasSinActualizar: 9,
    almacenDestino: 'Bodega de Proyectos Coatzacoalcos',
    proyecto: 'SFG-C260',
    notas: 'Revisión en aduana concluida, reprogramar entrega.',
  },
  {
    id: 'oc-act-006',
    folio: 'PO-2026-0192',
    proveedorNombre: 'MANGUERAS E INSTRUMENTACIÓN DEL NORTE',
    proveedorRfc: 'MIN090211QT9',
    fechaEmision: '2026-03-03',
    fechaEntrega: '2026-03-18',
    total: 70992.00,
    moneda: 'MXN',
    estatus: 'en_revision',
    diasSinActualizar: 6,
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyecto: 'SA-2026-0047',
    notas: 'Cotización sujeta a revisión por ajuste de tipo de cambio.',
  },
  {
    id: 'oc-act-007',
    folio: 'PO-2026-0205',
    proveedorNombre: 'INFRA S.A. DE C.V.',
    proveedorRfc: 'INF650320AB1',
    fechaEmision: '2026-11-12',
    fechaEntrega: '2026-11-28',
    total: 38500.00,
    moneda: 'MXN',
    estatus: 'abierta',
    diasSinActualizar: 2,
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    proyecto: 'SFG-OBRA-09',
    notas: 'Gases industriales solicitados para pruebas hidrostáticas.',
  },
  {
    id: 'oc-act-008',
    folio: 'PO-2026-0210',
    proveedorNombre: 'ABB MÉXICO S.A. DE C.V.',
    proveedorRfc: 'ABB920814M89',
    fechaEmision: '2026-11-05',
    fechaEntrega: '2026-11-20',
    total: 185400.00,
    moneda: 'MXN',
    estatus: 'pendiente_aprobacion',
    diasSinActualizar: 11,
    almacenDestino: 'Bodega de Proyectos Coatzacoalcos',
    proyecto: 'SFG-ELEC-44',
    notas: 'Requiere actualización urgente de cotización y plazo de fabricación.',
  },
];

export const MOCK_ORDENES_PENDIENTES: OrdenPendiente[] = [
  {
    id: 'oc-pen-001',
    folio: 'PO-2026-0173',
    proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
    proveedorRfc: 'FPM130918MPA',
    solicitante: 'Carlos Mendoza',
    proyecto: 'SFG-C259 (Planta Refinería Dos Bocas)',
    fechaEmision: '2026-11-10',
    total: 4118.00,
    moneda: 'MXN',
    estatus: 'por_autorizar',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Refacciones y consumibles de campo de alta prioridad.',
  },
  {
    id: 'oc-pen-002',
    folio: 'PO-2026-0174',
    proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
    proveedorRfc: 'FPM130918MPA',
    solicitante: 'Carlos Mendoza',
    proyecto: 'SFG-C259 (Mantenimiento Válvulas)',
    fechaEmision: '2026-11-18',
    total: 14088.21,
    moneda: 'MXN',
    estatus: 'por_autorizar',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Partida adicional autorizada por jefatura de frente.',
  },
  {
    id: 'oc-pen-003',
    folio: 'PO-2024-0062',
    proveedorNombre: 'GRUPO MEXICANO DE SEGUROS S.A.',
    proveedorRfc: 'GMS880115LK2',
    solicitante: 'Lic. Mariana Garza',
    proyecto: 'SFG-ADM-ADMON (Pólizas Anuales)',
    fechaEmision: '2026-03-01',
    total: 52200.00,
    moneda: 'MXN',
    estatus: 'pendiente',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Seguro de transporte y responsabilidad civil industrial.',
  },
  {
    id: 'oc-pen-004',
    folio: 'PO10926',
    proveedorNombre: 'MANGUERAS E INSTRUMENTACIÓN DEL NORTE',
    proveedorRfc: 'MIN090211QT9',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    proyecto: 'SA-2026-0047 (Línea de Conducción)',
    fechaEmision: '2026-03-03',
    total: 70992.00,
    moneda: 'MXN',
    estatus: 'pendiente_aprobacion',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Mangueras flexibles para alta presión.',
  },
  {
    id: 'oc-pen-005',
    folio: 'PO-2024-0051',
    proveedorNombre: 'YAK ADVENTURE S.A. DE C.V.',
    proveedorRfc: 'YAD140828TY2',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    proyecto: 'SA-2026-0047 (Sistemas Contra Incendio)',
    fechaEmision: '2026-04-02',
    total: 97440.00,
    moneda: 'MXN',
    estatus: 'por_autorizar',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Detectores UV/IR y paneles de monitoreo.',
  },
  {
    id: 'oc-pen-006',
    folio: 'PO-2024-0089',
    proveedorNombre: 'DET-TRONICS INTEGRACIÓN S.A.P.I.',
    proveedorRfc: 'DIN120405H81',
    solicitante: 'Ing. Fernando Treviño',
    proyecto: 'SFG-C260 (Terminal Marítima Tuxpan)',
    fechaEmision: '2026-04-10',
    total: 20880.00,
    moneda: 'MXN',
    estatus: 'por_autorizar',
    almacenDestino: 'Bodega de Proyectos Coatzacoalcos',
    notas: 'Servicio de calibración y prueba de sensores térmicos.',
  },
  {
    id: 'oc-pen-007',
    folio: 'PO-2026-0192',
    proveedorNombre: 'MANGUERAS E INSTRUMENTACIÓN DEL NORTE',
    proveedorRfc: 'MIN090211QT9',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    proyecto: 'SA-2026-0047 (Lote Manómetros)',
    fechaEmision: '2026-03-03',
    total: 70992.00,
    moneda: 'MXN',
    estatus: 'pendiente',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Manómetros de glicerina calibrados bajo norma oficial.',
  },
  {
    id: 'oc-pen-008',
    folio: 'PO-2026-0205',
    proveedorNombre: 'INFRA S.A. DE C.V.',
    proveedorRfc: 'INF650320AB1',
    solicitante: 'Ing. Roberto Fuentes',
    proyecto: 'SFG-OBRA-09 (Taller de Soldadura)',
    fechaEmision: '2026-11-12',
    total: 38500.00,
    moneda: 'MXN',
    estatus: 'por_autorizar',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Suministro de argón y mezclas especiales.',
  },
  {
    id: 'oc-pen-009',
    folio: 'PO-2026-0210',
    proveedorNombre: 'ABB MÉXICO S.A. DE C.V.',
    proveedorRfc: 'ABB920814M89',
    solicitante: 'Ing. Fernando Treviño',
    proyecto: 'SFG-ELEC-44 (Subestación Principal)',
    fechaEmision: '2026-11-05',
    total: 185400.00,
    moneda: 'MXN',
    estatus: 'pendiente_aprobacion',
    almacenDestino: 'Bodega de Proyectos Coatzacoalcos',
    notas: 'Interruptores de potencia y relevadores de protección.',
  },
  {
    id: 'oc-pen-010',
    folio: 'PO-2026-0215',
    proveedorNombre: 'SIEMENS ENERGY SERVICES',
    proveedorRfc: 'SES990101XYZ',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    proyecto: 'SFG-TURBO-01 (Turbogenerador 2)',
    fechaEmision: '2026-11-14',
    total: 320000.00,
    moneda: 'MXN',
    estatus: 'por_autorizar',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Kit de mantenimiento mayor para turbina de gas.',
  },
  {
    id: 'oc-pen-011',
    folio: 'PO-2026-0220',
    proveedorNombre: 'CONTROL Y AUTOMATIZACIÓN DEL GOLFO',
    proveedorRfc: 'CAG150608KL0',
    solicitante: 'Lic. Mariana Garza',
    proyecto: 'SFG-SCADA-03 (Modernización RTU)',
    fechaEmision: '2026-11-15',
    total: 64500.00,
    moneda: 'MXN',
    estatus: 'pendiente',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Tarjetas de comunicación Ethernet y módulos de E/S.',
  },
  {
    id: 'oc-pen-012',
    folio: 'PO-2026-0225',
    proveedorNombre: 'SUMINISTROS PETROLEROS DE ORIENTE',
    proveedorRfc: 'SPO1107129A3',
    solicitante: 'Ing. Roberto Fuentes',
    proyecto: 'SFG-OBRA-09 (Tuberías de Proceso)',
    fechaEmision: '2026-11-16',
    total: 89750.00,
    moneda: 'MXN',
    estatus: 'por_autorizar',
    almacenDestino: 'Bodega de Proyectos Coatzacoalcos',
    notas: 'Bridas de acero al carbón clase 600 y empaques espirometálicos.',
  },
  {
    id: 'oc-pen-013',
    folio: 'PO-2026-0230',
    proveedorNombre: 'INSTRUMENTOS Y SENSORES INDUSTRIALES',
    proveedorRfc: 'ISI170325RT4',
    solicitante: 'Ing. Carlos Mendoza Estrada',
    proyecto: 'SA-2026-0047 (Transmisores de Presión)',
    fechaEmision: '2026-11-17',
    total: 47800.00,
    moneda: 'MXN',
    estatus: 'pendiente_aprobacion',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Transmisores de presión diferencial con protocolo HART.',
  },
  {
    id: 'oc-pen-014',
    folio: 'PO-2026-0148',
    proveedorNombre: 'FIVE PEAKS SEGURIDAD INDUSTRIAL S.A. DE C.V.',
    proveedorRfc: 'FPS180905M82',
    solicitante: 'Lic. Mariana Garza',
    proyecto: 'SFC-C259 (Seguridad Industrial & HSE)',
    fechaEmision: '2026-05-19',
    total: 21460.00,
    moneda: 'MXN',
    estatus: 'por_autorizar',
    almacenDestino: 'Almacén Principal (Sede CDMX)',
    notas: 'Arneses de seguridad dieléctricos y líneas de vida retráctiles.',
  },
];

export const MOCK_COMPRAS_FILTROS = {
  ordenesPorActualizarCount: MOCK_ORDENES_POR_ACTUALIZAR.length,
  ordenesPendientesCount: MOCK_ORDENES_PENDIENTES.length,
};

export function obtenerOrdenesPorActualizar(): OrdenPorActualizar[] {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('sifygsa_compras_ordenes_por_actualizar');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return [...MOCK_ORDENES_POR_ACTUALIZAR];
}

export function guardarOrdenesPorActualizar(ordenes: OrdenPorActualizar[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sifygsa_compras_ordenes_por_actualizar', JSON.stringify(ordenes));
  }
}

export function obtenerOrdenesPendientes(): OrdenPendiente[] {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('sifygsa_compras_ordenes_pendientes');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return [...MOCK_ORDENES_PENDIENTES];
}

export function guardarOrdenesPendientes(ordenes: OrdenPendiente[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sifygsa_compras_ordenes_pendientes', JSON.stringify(ordenes));
  }
}




