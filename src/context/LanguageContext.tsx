import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

export interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

export const translations: Translations = {
  // --- NAVEGACIÓN & SIDEBAR ---
  'nav.home': { es: 'Home', en: 'Home' },
  'nav.settings': { es: 'Ajustes', en: 'Settings' },
  'nav.crm': { es: 'CRM & VENTAS', en: 'CRM & SALES' },
  'nav.crm_opportunities': { es: 'Oportunidades', en: 'Opportunities' },
  'nav.crm_opportunity_detail': { es: 'Detalle Oportunidad', en: 'Opportunity Detail' },
  'nav.crm_activities': { es: 'Actividades (Kanban & Gantt)', en: 'Activities (Kanban & Gantt)' },
  'nav.operations': { es: 'OPERACIONES', en: 'OPERATIONS' },
  'nav.requisition': { es: 'Requisición NetSuite', en: 'NetSuite Requisition' },
  'nav.rh': { es: 'RECURSOS HUMANOS', en: 'HUMAN RESOURCES' },
  'nav.rh_directory': { es: 'Directorio de Personal', en: 'Staff Directory' },
  'nav.admin': { es: 'ADMINISTRADOR', en: 'ADMINISTRATOR' },
  'nav.general_config': { es: 'Configuración General', en: 'General Settings' },
  'nav.system_status': { es: 'System Status', en: 'System Status' },
  'nav.optimal_online': { es: 'Operativo en Línea', en: 'Optimal Online' },

  // --- HEADER & GLOBAL ---
  'header.search_placeholder': {
    es: 'Buscar telemetría, sensores, proyectos, reportes, tickets...',
    en: 'Search telemetry, sensors, projects, reports, tickets...',
  },
  'header.change_to_dark': { es: 'Cambiar a Modo Oscuro', en: 'Switch to Dark Mode' },
  'header.change_to_light': { es: 'Cambiar a Modo Claro', en: 'Switch to Light Mode' },
  'header.notifications': { es: 'Notificaciones', en: 'Notifications' },
  'header.logout': { es: 'Cerrar Sesión', en: 'Log Out' },
  'header.platform_subtitle': { es: 'Business Platform', en: 'Business Platform' },

  // --- TITULOS DE MÓDULOS EN APP ---
  'app.dashboard_title': { es: 'Panel General Ejecutivo', en: 'Executive General Dashboard' },
  'app.crm_title': { es: 'Módulo CRM & Ventas Industrial', en: 'Industrial CRM & Sales Module' },
  'app.compras_title': { es: 'Módulo de Compras — Requisición NetSuite', en: 'Purchasing Module — NetSuite Requisition' },
  'app.settings_title': { es: 'Configuración del Sistema', en: 'System Settings' },

  // --- VENTANA DE AJUSTES ---
  'settings.main_title': { es: 'Configuración de la Suite', en: 'Suite Settings' },
  'settings.main_subtitle': {
    es: 'Personaliza tu experiencia, selección de idiomas, temas visuales y parámetros corporativos',
    en: 'Customize your experience, language preferences, visual themes and corporate settings',
  },
  'settings.tab_language': { es: 'Idioma y Región', en: 'Language & Region' },
  'settings.tab_appearance': { es: 'Apariencia y Tema', en: 'Appearance & Theme' },
  'settings.tab_profile': { es: 'Perfil de Usuario', en: 'User Profile' },
  'settings.tab_system': { es: 'Seguridad y Sistema', en: 'Security & System' },

  'settings.lang_section_title': { es: 'Idioma de la Plataforma', en: 'Platform Language' },
  'settings.lang_section_desc': {
    es: 'Elige el idioma con el que se mostrarán todos los módulos, menús e indicadores de la suite.',
    en: 'Choose the language used across all modules, menus and metrics in the suite.',
  },
  'settings.lang_es_title': { es: 'Español (Predeterminado)', en: 'Spanish (Default)' },
  'settings.lang_es_desc': { es: 'Interfaz, moneda MXN y formatos de fecha en español.', en: 'Spanish UI, MXN currency and date formats.' },
  'settings.lang_en_title': { es: 'English (Inglés)', en: 'English' },
  'settings.lang_en_desc': { es: 'Full English interface, international formatting and USD metrics.', en: 'Full English interface, international formatting and USD metrics.' },
  'settings.lang_active_badge': { es: 'Activo', en: 'Active' },
  'settings.lang_select_btn': { es: 'Seleccionar', en: 'Select' },

  'settings.regional_title': { es: 'Formatos Regionales', en: 'Regional Formats' },
  'settings.timezone_label': { es: 'Zona Horaria', en: 'Timezone' },
  'settings.date_format_label': { es: 'Formato de Fecha', en: 'Date Format' },
  'settings.currency_label': { es: 'Moneda Primaria', en: 'Primary Currency' },

  'settings.theme_section_title': { es: 'Modo Visual', en: 'Visual Mode' },
  'settings.theme_section_desc': {
    es: 'Alterna entre el modo claro de alto contraste y el modo oscuro industrial SIFYGSA.',
    en: 'Switch between the clean high-contrast light mode and the SIFYGSA dark industrial mode.',
  },
  'settings.theme_light_title': { es: 'Modo Claro (Default)', en: 'Light Mode (Default)' },
  'settings.theme_light_desc': { es: 'Superficie blanca limpia con acentos y textos nítidos.', en: 'Clean white surface with crisp accents and typography.' },
  'settings.theme_dark_title': { es: 'Modo Oscuro', en: 'Dark Mode' },
  'settings.theme_dark_desc': { es: 'Tono grafito industrial (#2E2E2E) para entornos con poca luz.', en: 'Industrial graphite tone (#2E2E2E) for low-light environments.' },

  'settings.profile_section_title': { es: 'Información del Operador', en: 'Operator Information' },
  'settings.profile_section_desc': { es: 'Datos de tu cuenta corporativa y credenciales asignadas.', en: 'Your corporate account details and assigned credentials.' },
  'settings.profile_name_label': { es: 'Nombre Completo', en: 'Full Name' },
  'settings.profile_email_label': { es: 'Correo Corporativo', en: 'Corporate Email' },
  'settings.profile_role_label': { es: 'Rol / Cargo', en: 'Role / Position' },
  'settings.profile_company_label': { es: 'Empresa / División', en: 'Company / Division' },

  'settings.save_btn': { es: 'Guardar Preferencias', en: 'Save Preferences' },
  'settings.saved_toast': { es: 'Preferencias guardadas exitosamente', en: 'Preferences saved successfully' },

  // --- MÓDULO AUTH / LOGIN ---
  'auth.heading': { es: 'Iniciar Sesión', en: 'Sign In' },
  'auth.subheading': { es: 'Ingresa tus credenciales para acceder a la plataforma modular', en: 'Enter your credentials to access the modular platform' },
  'auth.brand_subtitle': { es: 'Fire & Gas Suite • ERP NetSuite', en: 'Fire & Gas Suite • ERP NetSuite' },
  'auth.username_label': { es: 'Usuario o Correo Corporativo', en: 'Username or Corporate Email' },
  'auth.username_placeholder': { es: 'ejemplo@sifygsa.com', en: 'example@sifygsa.com' },
  'auth.password_label': { es: 'Contraseña', en: 'Password' },
  'auth.password_placeholder': { es: '••••••••••••', en: '••••••••••••' },
  'auth.forgot_password': { es: '¿Olvidaste tu contraseña?', en: 'Forgot your password?' },
  'auth.show_password': { es: 'Ver contraseña', en: 'Show password' },
  'auth.hide_password': { es: 'Ocultar contraseña', en: 'Hide password' },
  'auth.remember_session': { es: 'Recordar sesión en este equipo', en: 'Remember session on this device' },
  'auth.submit_btn': { es: 'Iniciar Sesión', en: 'Sign In' },
  'auth.demo_divider': { es: 'o entra en modo demostración', en: 'or enter demo mode' },
  'auth.demo_btn': { es: 'Acceder al Dashboard / Suite Demo', en: 'Access Dashboard / Suite Demo' },
  'auth.footer': { es: 'Todos los derechos reservados.', en: 'All rights reserved.' },
  'auth.error_no_user': { es: 'Por favor ingresa tu usuario o correo corporativo.', en: 'Please enter your username or corporate email.' },
  'auth.error_no_pass': { es: 'Por favor ingresa tu contraseña.', en: 'Please enter your password.' },
  'auth.forgot_alert': { es: 'Se ha enviado un enlace de recuperación a tu correo corporativo registrado.', en: 'A recovery link has been sent to your registered corporate email.' },
  'auth.hero_badge': { es: 'SIFYGSA Enterprise v3.4.1 • SIL-3', en: 'SIFYGSA Enterprise v3.4.1 • SIL-3' },
  'auth.hero_title': { es: 'Control Total & Gestión', en: 'Full Control & Management' },
  'auth.hero_title_accent': { es: 'Industrial F&G NetSuite', en: 'Industrial F&G NetSuite' },
  'auth.hero_description': {
    es: 'Plataforma unificada para operaciones críticas de detección de fuego y gas, gestión comercial CRM, requisiciones y control de proyectos en plantas industriales.',
    en: 'Unified platform for critical fire and gas detection operations, CRM commercial management, requisitions and project control in industrial plants.',
  },
  'auth.hero_security': { es: 'Acceso empresarial seguro con encriptación de extremo a extremo', en: 'Secure enterprise access with end-to-end encryption' },

  // --- MÓDULO DASHBOARD ---
  'dashboard.kpi_opportunities': { es: 'Oportunidades', en: 'Opportunities' },
  'dashboard.kpi_total_users': { es: 'Total Usuarios', en: 'Total Users' },
  'dashboard.kpi_new_mrr': { es: 'Nuevo MRR', en: 'New MRR' },
  'dashboard.kpi_total': { es: 'Total', en: 'Total' },
  'dashboard.kpi_active_projects': { es: 'Proyectos Activos', en: 'Active Projects' },
  'dashboard.kpi_team_projects': { es: 'Proyectos de Equipo', en: 'Team Projects' },
  'dashboard.revenue_trend_title': { es: 'Tendencia de Ingresos Mensual', en: 'Monthly Revenue Trend' },
  'dashboard.completion_title': { es: 'Completado', en: 'Completion' },
  'dashboard.completion_efficiency': { es: 'Eficiencia', en: 'Efficiency' },
  'dashboard.tasks_title': { es: 'Tareas Operacionales', en: 'Operational Tasks' },
  'dashboard.tasks_active': { es: 'Activas', en: 'Active' },
  'dashboard.tasks_col_tasks': { es: 'Tareas', en: 'Tasks' },
  'dashboard.tasks_col_progress': { es: 'Progreso %', en: 'Progress %' },
  'dashboard.tasks_col_due': { es: 'Fecha Límite', en: 'Due Date' },
  'dashboard.tasks_col_status': { es: 'Estatus', en: 'Status' },
  'dashboard.status_board_title': { es: 'Tablero de Estatus', en: 'Status Board' },
  'dashboard.status_board_tag': { es: 'Sprint Actual', en: 'Sprint Current' },
  'dashboard.kanban_todo': { es: 'POR HACER', en: 'TO DO' },
  'dashboard.kanban_inprogress': { es: 'EN PROCESO', en: 'IN PROGRESS' },
  'dashboard.kanban_review': { es: 'REVISIÓN', en: 'REVIEW' },
  'dashboard.kanban_done': { es: 'COMPLETADO', en: 'DONE' },
  'dashboard.category_split_title': { es: 'División por Categoría', en: 'Category Split' },
  'dashboard.team_leaders_title': { es: 'Líderes de Equipo', en: 'Team Leaders' },
  'dashboard.top_performer': { es: 'Top 3 Rendimiento', en: 'Top 3 Performer' },
  'dashboard.leaderboard_updated': { es: 'Leaderboard actualizado hace 5 min', en: 'Leaderboard updated 5 mins ago' },
  'dashboard.tooltip_crm': { es: 'Ver Cartera de Oportunidades CRM', en: 'View CRM Opportunity Portfolio' },
  'dashboard.tooltip_kanban': { es: 'Clic para ir al módulo completo de CRM & Kanban', en: 'Click to go to the full CRM & Kanban module' },

  // --- MÓDULO CRM ---
  'crm.tab_kanban': { es: 'Kanban', en: 'Kanban' },
  'crm.tab_gantt': { es: 'Gantt', en: 'Gantt' },
  'crm.tab_calendar': { es: 'Calendario', en: 'Calendar' },
  'crm.tab_opportunities': { es: 'Oportunidades', en: 'Opportunities' },
  'crm.search_placeholder': { es: 'Buscar tarea, proyecto, cliente...', en: 'Search task, project, client...' },
  'crm.btn_new_task': { es: 'Nueva Tarea', en: 'New Task' },
  'crm.btn_new_opportunity': { es: 'Nueva Oportunidad', en: 'New Opportunity' },
  'crm.col_task': { es: 'Tarea / Proyecto', en: 'Task / Project' },
  'crm.col_assignee': { es: 'Responsable', en: 'Assignee' },
  'crm.col_client': { es: 'Cliente', en: 'Client' },
  'crm.col_priority': { es: 'Prioridad', en: 'Priority' },
  'crm.col_status': { es: 'Estatus', en: 'Status' },
  'crm.col_due': { es: 'Vencimiento', en: 'Due Date' },
  'crm.col_folio': { es: 'Folio', en: 'Folio' },
  'crm.col_opportunity': { es: 'Oportunidad', en: 'Opportunity' },
  'crm.col_stage': { es: 'Etapa', en: 'Stage' },
  'crm.col_value': { es: 'Valor', en: 'Value' },
  'crm.col_probability': { es: 'Probabilidad', en: 'Probability' },
  'crm.col_actions': { es: 'Acciones', en: 'Actions' },
  'crm.btn_view': { es: 'Ver', en: 'View' },
  'crm.btn_edit': { es: 'Editar', en: 'Edit' },
  'crm.btn_back': { es: '← Volver a Oportunidades', en: '← Back to Opportunities' },
  'crm.detail_title': { es: 'Detalle de Oportunidad', en: 'Opportunity Detail' },
  'crm.gantt_title': { es: 'Cronograma de Actividades', en: 'Activity Schedule' },
  'crm.kanban_todo': { es: 'POR HACER', en: 'TO DO' },
  'crm.kanban_progress': { es: 'EN PROCESO', en: 'IN PROGRESS' },
  'crm.kanban_review': { es: 'REVISIÓN', en: 'REVIEW' },
  'crm.kanban_done': { es: 'COMPLETADO', en: 'DONE' },
  'crm.priority_critical': { es: 'Crítica', en: 'Critical' },
  'crm.priority_high': { es: 'Alta', en: 'High' },
  'crm.priority_medium': { es: 'Media', en: 'Medium' },
  'crm.priority_low': { es: 'Baja', en: 'Low' },
  'crm.no_results': { es: 'No se encontraron resultados', en: 'No results found' },
  'crm.modal_title_new': { es: 'Nueva Tarea', en: 'New Task' },
  'crm.modal_label_name': { es: 'Nombre de la tarea', en: 'Task name' },
  'crm.modal_label_assignee': { es: 'Responsable', en: 'Assignee' },
  'crm.modal_label_client': { es: 'Cliente', en: 'Client' },
  'crm.modal_label_priority': { es: 'Prioridad', en: 'Priority' },
  'crm.modal_label_status': { es: 'Estatus', en: 'Status' },
  'crm.modal_label_due': { es: 'Fecha límite', en: 'Due date' },
  'crm.modal_label_desc': { es: 'Descripción', en: 'Description' },
  'crm.modal_btn_cancel': { es: 'Cancelar', en: 'Cancel' },
  'crm.modal_btn_save': { es: 'Guardar Tarea', en: 'Save Task' },
  'crm.modal_detail_attachments': { es: 'Archivos Adjuntos', en: 'Attachments' },
  'crm.modal_detail_checklist': { es: 'Lista de Verificación', en: 'Checklist' },
  'crm.modal_detail_close': { es: 'Cerrar', en: 'Close' },
  'crm.opp_detail_client': { es: 'Cliente / Empresa', en: 'Client / Company' },
  'crm.opp_detail_value': { es: 'Valor Estimado', en: 'Estimated Value' },
  'crm.opp_detail_stage': { es: 'Etapa', en: 'Stage' },
  'crm.opp_detail_probability': { es: 'Probabilidad', en: 'Probability' },
  'crm.opp_detail_responsible': { es: 'Responsable', en: 'Responsible' },
  'crm.opp_detail_close_date': { es: 'Fecha de Cierre', en: 'Close Date' },
  'crm.opp_detail_origin': { es: 'Origen', en: 'Origin' },
  'crm.opp_detail_description': { es: 'Descripción', en: 'Description' },
  'crm.opp_detail_activities': { es: 'Actividades Relacionadas', en: 'Related Activities' },

  // --- MÓDULO COMPRAS ---
  'compras.title': { es: 'Requisición Operativa — NetSuite', en: 'Operational Requisition — NetSuite' },
  'compras.subtitle': { es: 'Gestión de compras, órdenes y aprobaciones de suministros industriales', en: 'Management of purchases, orders and industrial supply approvals' },
  'compras.section_classification': { es: 'Clasificación del Documento', en: 'Document Classification' },
  'compras.section_primary_info': { es: 'Información Primaria', en: 'Primary Information' },
  'compras.field_contract': { es: 'N° Contrato / Proyecto', en: 'Contract / Project No.' },
  'compras.field_type': { es: 'Tipo de Compra', en: 'Purchase Type' },
  'compras.field_subsidiary': { es: 'Subsidiaria', en: 'Subsidiary' },
  'compras.field_applicant': { es: 'Solicitante', en: 'Applicant' },
  'compras.field_creation_date': { es: 'Fecha de Creación', en: 'Creation Date' },
  'compras.field_buyer': { es: 'Comprador Asignado', en: 'Assigned Buyer' },
  'compras.field_delivery_date': { es: 'Fecha de Entrega', en: 'Delivery Date' },
  'compras.field_delivery_place': { es: 'Lugar de Entrega', en: 'Delivery Location' },
  'compras.field_notes': { es: 'Notas / Justificación', en: 'Notes / Justification' },
  'compras.field_priority': { es: 'Prioridad', en: 'Priority' },
  'compras.field_status': { es: 'Estatus del Documento', en: 'Document Status' },
  'compras.tab_articles': { es: 'Artículos', en: 'Articles' },
  'compras.tab_relations': { es: 'Relaciones', en: 'Relations' },
  'compras.tab_communication': { es: 'Comunicación', en: 'Communication' },
  'compras.tab_custom': { es: 'Personalizado', en: 'Custom' },
  'compras.tab_tef': { es: 'TEF', en: 'TEF' },
  'compras.tab_edoc': { es: 'Doc. Electrónico', en: 'E-Document' },
  'compras.tab_carta_porte': { es: 'Carta Porte', en: 'Carta Porte' },
  'compras.col_article': { es: 'Artículo', en: 'Article' },
  'compras.col_vendor': { es: 'Proveedor', en: 'Vendor' },
  'compras.col_available': { es: 'Disponible', en: 'Available' },
  'compras.col_quantity': { es: 'Cantidad', en: 'Quantity' },
  'compras.col_unit': { es: 'Unidad', en: 'Unit' },
  'compras.col_description': { es: 'Descripción', en: 'Description' },
  'compras.col_unit_price': { es: 'Precio Unitario', en: 'Unit Price' },
  'compras.col_tax': { es: 'IVA', en: 'Tax' },
  'compras.col_total': { es: 'Total', en: 'Total' },
  'compras.col_client_job': { es: 'Cliente / Trabajo', en: 'Client / Job' },
  'compras.col_activity': { es: 'Actividad', en: 'Activity' },
  'compras.col_linked_order': { es: 'Orden Vinculada', en: 'Linked Order' },
  'compras.col_delivery': { es: 'Entrega', en: 'Delivery' },
  'compras.col_closed': { es: 'Cerrado', en: 'Closed' },
  'compras.col_billable': { es: 'Facturable', en: 'Billable' },
  'compras.btn_add_article': { es: '+ Agregar Artículo', en: '+ Add Article' },
  'compras.btn_delete': { es: 'Eliminar', en: 'Delete' },
  'compras.btn_save': { es: 'Guardar Requisición', en: 'Save Requisition' },
  'compras.btn_approve': { es: 'Enviar para Aprobación', en: 'Send for Approval' },
  'compras.btn_cancel': { es: 'Cancelar', en: 'Cancel' },
  'compras.summary_subtotal': { es: 'Subtotal', en: 'Subtotal' },
  'compras.summary_tax': { es: 'IVA (16%)', en: 'Tax (16%)' },
  'compras.summary_total': { es: 'Total General', en: 'Grand Total' },
  'compras.select_buyer': { es: '— Seleccionar Comprador Asignado —', en: '— Select Assigned Buyer —' },

  // --- MÓDULO RH ---
  'rh.module_title': { es: 'Módulo Recursos Humanos & Talento', en: 'Human Resources & Talent Module' },
  'rh.module_subtitle': { es: 'Administración de colaboradores, control de asistencia, nómina y expedientes digitales.', en: 'Employee management, attendance control, payroll and digital records.' },
  'rh.btn_incidents': { es: 'Incidencias del Día', en: "Today's Incidents" },
  'rh.btn_register': { es: '+ Registrar Colaborador', en: '+ Register Employee' },
  'rh.metric_active_staff': { es: 'Plantilla Activa', en: 'Active Headcount' },
  'rh.metric_active_staff_footer': { es: 'nuevas altas', en: 'new hires' },
  'rh.metric_active_staff_quarter': { es: 'este trimestre', en: 'this quarter' },
  'rh.metric_attendance': { es: 'Asistencia Hoy', en: "Today's Attendance" },
  'rh.metric_attendance_footer': { es: 'presentes', en: 'present' },
  'rh.metric_attendance_of': { es: 'de', en: 'of' },
  'rh.metric_pending': { es: 'Solicitudes Pendientes', en: 'Pending Requests' },
  'rh.metric_pending_vacations': { es: 'vacaciones', en: 'vacation' },
  'rh.metric_pending_permits': { es: 'permisos', en: 'permits' },
  'rh.directory_title': { es: 'Directorio de Colaboradores Clave', en: 'Key Employee Directory' },
  'rh.directory_sub': { es: 'Expedientes actualizados y estatus laboral en la suite', en: 'Updated records and employment status in the suite' },
  'rh.badge_records': { es: 'Expedientes Digitales', en: 'Digital Records' },
  'rh.col_employee': { es: 'Colaborador', en: 'Employee' },
  'rh.col_department': { es: 'Departamento', en: 'Department' },
  'rh.col_position': { es: 'Puesto', en: 'Position' },
  'rh.col_contract': { es: 'Tipo de Contrato', en: 'Contract Type' },
  'rh.col_status': { es: 'Estatus', en: 'Status' },
  'rh.col_action': { es: 'Acción', en: 'Action' },
  'rh.contract_indefinite': { es: 'Indefinido', en: 'Indefinite' },
  'rh.status_active': { es: 'Activo', en: 'Active' },
  'rh.status_vacation': { es: 'Vacaciones', en: 'On Vacation' },
  'rh.status_leave': { es: 'Permiso', en: 'On Leave' },
  'rh.btn_record': { es: 'Expediente', en: 'Record' },
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('sfg_language');
    return saved === 'en' ? 'en' : 'es'; // Por defecto Español
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sfg_language', lang);
    document.documentElement.setAttribute('lang', lang);
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (!entry) {
      return fallback || key;
    }
    return entry[language] || fallback || entry.es || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe ser usado dentro de un LanguageProvider');
  }
  return context;
};
