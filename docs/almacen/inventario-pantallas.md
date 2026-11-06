# Inventario de Pantallas – Proyecto Stitch "Sistema Integral de Almacén"
**Proyecto Stitch ID:** `projects/7644114841353054201`  
**Total de Elementos en Canvas:** 292  
**Fecha de Generación:** 2026-10-27  
**Estado de la Fase:** Fase 0 – Inventario y Asignación de Módulos (Detenido para Confirmación)

---

## 1. Resumen Ejecutivo de la Auditoría

El análisis detallado del proyecto en Stitch reveló **292 elementos** registrados en el canvas de diseño, distribuidos entre interfaces funcionales interactivas, documentación de requerimientos (PRD), tokens del sistema de diseño e insumos/referencias gráficas subidas como prompts:

| Tipo de Elemento | Cantidad | Descripción |
| :--- | :---: | :--- |
| **Pantallas de Interfaz (con HTML generado)** | **220** | Vistas operativas completas con código HTML descargable desde Stitch. |
| **Documentación de Producto (PRD/Brief con HTML)** | **2** | Especificaciones técnicas ejecutivas en HTML generadas en Stitch. |
| **Imágenes de Referencia (sin HTML)** | **66** | Capturas, logos y mockups de referencia subidos al canvas (`image.png`, `SIFYGSA.png`). |
| **Instancias de Sistema de Diseño** | **4** | Bloques de tokens de color, tipografía y escala de espaciado aplicados al canvas. |
| **Total General** | **292** | Total auditado directamente mediante la API MCP de Stitch. |

### Distribución por Módulo Propuesto

| Módulo | Cantidad | Rutas Propuestas | Estado Inicial |
| :--- | :---: | :--- | :--- |
| **almacen** | 98 | `/almacen/recepcion-ir03`, `/almacen/alta-servicio`, `/almacen/entradas`, `/almacen/gestion-integral`, etc. | 6 hechas / 92 pendientes |
| **inventario** | 66 | `/inventario/catalogo`, `/inventario/alta-articulo`, `/inventario/alta-articulo-wizard`, etc. | 4 hechas / 62 pendientes |
| **dashboard** | 49 | `/dashboard/general`, `/dashboard/general-dark`, `/dashboard/general-tokens`, etc. | 4 hechas / 45 pendientes |
| **compras** | 5 | `/compras/po51` | 0 hechas / 5 pendientes (en proyecto existe `/compras/po51`) |
| **sin módulo (propuesto: docs)** | 2 | `/docs/prd-sga-web`, `/docs/prd-ejecutivo` | 2 pendientes |
| **sin módulo (propuesto: assets/referencias)** | 66 | `-` (no aplica ruta / capturas de referencia del canvas) | 66 con observaciones |
| **sin módulo (propuesto: design-system)** | 6 | `/settings/design-system` o tokens en `tokens.css` | 6 con observaciones |
| **Total** | **292** | | **14 hechas / 206 pendientes / 72 con observaciones** |

> [!NOTE]
> Las 14 pantallas marcadas como **"hecha"** corresponden a las interfaces prioritarias que ya se encuentran activas en el proyecto (Dashboard, Catálogo, Alta Artículo, Recepción IR03, Alta Servicio) con paridad de diseño y tokens oficiales. Las 206 interfaces con HTML restantes en Stitch representan iteraciones, variantes funcionales (Wizards, matrices operativas rápidas, modos de contraste y vistas dedicadas) generadas durante el diseño.

---

## 2. Matriz Completa de Pantallas (292 Elementos)

| # | id Stitch | título | módulo | ruta propuesta | estado |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `0028bd54461a4ff9b5fd91e6e35cbb90` | Alta de Servicio / Artículo no Inventariable - SGA Web | almacen | `/almacen/alta-servicio` | hecha |
| 2 | `01be614b6aa94da494e01494b557baf9` | SGA Almacén Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 3 | `15245748879347354834` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 4 | `03653e7e68144842876d44979e795084` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 5 | `04d250e13b404a27b1e0a40e938fb6a7` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 6 | `0546231397f24c668f15555398c8685b` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 7 | `055ca1bc038e45ff9715e5489cfe926d` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 8 | `06939248fa6c4779b8be328edf008c7b` | Inventario de Artículos - SGA Web | inventario | `/inventario/catalogo` | pendiente |
| 9 | `17072029950867802168` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 10 | `0a4b620217a147cea921c4871cd83fd4` | Alta de Artículo en Catálogo Maestro - Finalizada | inventario | `/inventario/alta-articulo` | pendiente |
| 11 | `0ab34189e76a4e8092f82cedb7445482` | Alta de Artículos | inventario | `/inventario/alta-articulo` | pendiente |
| 12 | `16119549599383256704` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 13 | `0b93494bcb5d4844915be24b925cf0cd` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 14 | `0c160b38279c46a78600f91223e7cda2` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 15 | `0c8d81b67e3b44d88b35073e1b4fdcf8` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 16 | `0cff374e59854ff7b3886c58841eafb2` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 17 | `0d17403ebb224201a1bade9592c2d0b2` | SIFYGSA SGA Almacén - Gestión Integral | almacen | `/almacen/gestion-integral` | pendiente |
| 18 | `0dbf0a45951e4802b7e95cd895277ec5` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 19 | `0e02f04faac844aca372621be3e04f02` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 20 | `0ebe3a61c34c47158645d5e524acebbf` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 21 | `8026311400084217834` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 22 | `9851441826937844406` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 23 | `11366ba82c1240cfae59f3288c55c29c` | Alta de Artículos - SGA Web | inventario | `/inventario/alta-articulo` | pendiente |
| 24 | `11557cba929d463f85d9767152164e89` | Catálogo de Artículos - SGA Web | inventario | `/inventario/catalogo` | pendiente |
| 25 | `12db2b5cba2b4b65a5bfe2931fc535bc` | SGA Almacén ERP System | almacen | `/almacen/operaciones` | pendiente |
| 26 | `13f2ddbaa92b4666bf2cb157b273055a` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 27 | `145cf9961c294443a77cadfe589eae27` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 28 | `16951a5582184b3786f2dd35cdb95756` | Alta de Artículo en Catálogo Maestro - Finalizada | inventario | `/inventario/alta-articulo` | pendiente |
| 29 | `16e3ddbbaf8e46319e7eca49418347d9` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 30 | `12222928812225289237` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 31 | `1734d247bc474a74b047df495e8869eb` | Warehouse Management System (SGA) | almacen | `/almacen/operaciones` | pendiente |
| 32 | `17eef5d842204565bbc443d8facff612` | Warehouse Management System (SGA Almacén) | almacen | `/almacen/operaciones` | pendiente |
| 33 | `18e2e70df5434c0990675a764cea8cc7` | Alta de Artículo - Variante 1: Wizard Progresivo | inventario | `/inventario/alta-articulo-wizard` | pendiente |
| 34 | `19e3fdc75e0e47fc9c492c4b7bb5d465` | Dashboard General - SGA Web (Modo Oscuro Dedicado) | dashboard | `/dashboard/general-dark` | pendiente |
| 35 | `1a7eecc63c3448b9a18ece93044a0380` | Dashboard General - SGA Web (Modo Oscuro Final) | dashboard | `/dashboard/general-dark` | hecha |
| 36 | `1e60f9d125c048ff98c8390f05b1d8a9` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 37 | `1f7cf7a60c6542aa8a640deb16c4734b` | Dashboard General - SGA Web (Modo Oscuro Corporativo) | dashboard | `/dashboard/general-dark` | hecha |
| 38 | `1f9d65f61c8c43fe9369516e54fb3ca0` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 39 | `200f1471d907424e85959c4eb016b2e3` | Alta de Artículo - Variante 3: Split Ficha & Etiqueta en Vivo | inventario | `/inventario/alta-articulo-split` | pendiente |
| 40 | `878857795164336058` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 41 | `15935965446621868536` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 42 | `22063f3cbd674270a755f23341ad6aed` | SGA Almacén - Recepción de Artículo | almacen | `/almacen/recepcion-ir03` | pendiente |
| 43 | `22a3ae5d4fed40d1a30d2fb8874c40c1` | Dashboard General - SGA Web (Modo Oscuro Final) | dashboard | `/dashboard/general-dark` | pendiente |
| 44 | `23404bc73d224a02974afc28ddb600f0` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 45 | `25ce644f336b4e95b3568b3c27db10ac` | Catálogo Maestro - Modo Claro y Oscuro | inventario | `/inventario/catalogo-dark` | pendiente |
| 46 | `264958d704bc431ea4f73132d75aa115` | Warehouse Management System (SGA Almacén) | almacen | `/almacen/operaciones` | pendiente |
| 47 | `269014c1a97e4800ab3aa2c48701035d` | Dashboard General - SGA Web (Modo Oscuro Oficial) | dashboard | `/dashboard/general-dark` | pendiente |
| 48 | `2760797891cd44afbeff05772a30961c` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 49 | `276aaa0f790a4d59895b5fec687c2eca` | Alta de Artículo en Catálogo Maestro - SGA Web | inventario | `/inventario/alta-articulo` | pendiente |
| 50 | `2791a7ae05f5449a8263ff17d1497e05` | SIFYGSA Warehouse Reception Flow | almacen | `/almacen/flujo-operativo` | pendiente |
| 51 | `28976e6cc6b54cafa9fb010af11d1454` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 52 | `2a4ebfc0017d44869a11a5281ca093ad` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 53 | `2d912d5ea9564fed8a119777c8587436` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 54 | `2ddd18ee0df84cc69f1cc733951737af` | Catálogo de Artículos | inventario | `/inventario/catalogo` | pendiente |
| 55 | `1077317917857136894` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 56 | `2e244eb548204ba0a95416a935dfa8b1` | Alta de Artículo en Catálogo Maestro - SGA Web | inventario | `/inventario/alta-articulo` | pendiente |
| 57 | `2e6efed0fae34945b6fd4f570b713b4a` | Alta de Artículo en Catálogo Maestro - SGA Almacén | inventario | `/inventario/alta-articulo` | pendiente |
| 58 | `2ebfed42cfe44f7c85d662b6e1c9aa28` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 59 | `2f602df0ab3a49b18fc19ae0d2f21090` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 60 | `15261065993619413102` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 61 | `18209631538166876959` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 62 | `3200b887c3e843ca8af847d67e959fbe` | Warehouse Management Dashboard (SGA Almacén) | dashboard | `/dashboard/warehouse-dashboard` | pendiente |
| 63 | `1901817406838471030` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 64 | `32c61829e6324c728cdcebd4d57abf7f` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 65 | `3316001be25344988f66e8d24b0fdac9` | Dashboard General - SGA Web (Modo Oscuro) | dashboard | `/dashboard/general-dark` | pendiente |
| 66 | `15176990801813777881` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 67 | `17002612723068415370` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 68 | `12367847573425276136` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 69 | `362753485343843250` | Orden de Compra - PO51 (SIFYGSA Almacén ERP) | compras | `/compras/po51` | pendiente |
| 70 | `3637b6edee544b1ea2a879462ed7b35e` | Alta de Artículo - SGA Almacén | inventario | `/inventario/alta-articulo` | pendiente |
| 71 | `368909c9b70c441e9acf8d98b9e21b84` | Entradas de Almacén - SGA Web | almacen | `/almacen/entradas` | pendiente |
| 72 | `383faad478bf4baab1dbdd37049866bc` | Alta de Artículo - Catálogo Maestro SIFYGSA (Modo Oscuro) | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 73 | `3920d4706a594c8b919c5e7f9ba66719` | SGA Almacén - Sistema de Gestión Integral | almacen | `/almacen/gestion-integral` | pendiente |
| 74 | `8026311400084215340` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 75 | `3a1d3e8645c942409579aaea2414a005` | Alta de Artículo - Catálogo Maestro SIFYGSA (Modo Oscuro) | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 76 | `3a5566f6de2944a6878ce350bb45edf2` | SGA Warehouse Inventory & Item Registration Flow | inventario | `/inventario/catalogo` | pendiente |
| 77 | `17142117294421058055` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 78 | `3d84e79b795a412db7d4cb62b3990021` | Alta de Artículo - Catálogo Maestro (Modo Oscuro) | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 79 | `3e6a7215496d42bb8fbd357df15c2b30` | Almacén Recepción de Artículos | almacen | `/almacen/recepcion-ir03` | pendiente |
| 80 | `10803152847838514232` | SIFYGSA.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 81 | `3f50b942105842d780f008119097cbdc` | Dashboard General - SGA Web (Modo Claro) | dashboard | `/dashboard/general` | pendiente |
| 82 | `3f5d58ecc5464428a639e9107aed117d` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 83 | `41011f14914840d3960592e5aa3806da` | Warehouse Management Dashboard | dashboard | `/dashboard/warehouse-dashboard` | pendiente |
| 84 | `12380026654501060983` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 85 | `417d7324ad5240a5b2621e5ee0af70bd` | Alta de Artículo en Catálogo Maestro - Modo Claro Oficial | inventario | `/inventario/alta-articulo` | hecha |
| 86 | `41c625828c9c49948080e91058ebe398` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 87 | `4229496d603546c8b59ac8c3cde78873` | SGA Almacén - Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 88 | `11470783481359168187` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 89 | `434d3af4086c4fe59a20d77a6feb77fe` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 90 | `4397de61d7f34cb8b56e7230dd640bdf` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 91 | `44841bf586ad481abb3c3b9a29e34238` | SGA Almacén - Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 92 | `45299de3bfa744d8bd946566717ee1bd` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | hecha |
| 93 | `45afa95ca94c4c9cb5767467fdc980fa` | SGA Warehouse Management Flow | almacen | `/almacen/flujo-operativo` | pendiente |
| 94 | `46470774041848628925bc83630f9458` | Dashboard General - SGA Web (Alternador Modo Oscuro) | dashboard | `/dashboard/general-dark` | pendiente |
| 95 | `47174825289c48d2994cbbc6849f2da8` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 96 | `47a7d4d35ecb48478551f4526136995f` | SGA Almacén - Alta de Artículo | inventario | `/inventario/alta-articulo` | pendiente |
| 97 | `4883ddfbc2fd4cedac796f9e71f82be7` | Alta de Artículo - Variante 2: Matriz Operativa Rápida | inventario | `/inventario/alta-articulo-matriz` | pendiente |
| 98 | `493504232d6a4ecdb97f0a17ca02c8cb` | Warehouse Management System (SGA) | almacen | `/almacen/operaciones` | pendiente |
| 99 | `49b7f1118e624712b2e745556916eb1e` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 100 | `49e10412e5054926bc723aec0ecb97c3` | Alta de Servicio / Artículo no Inventariable - SGA Web | almacen | `/almacen/alta-servicio` | pendiente |
| 101 | `4434867489887755462` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 102 | `14431925044881405349` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 103 | `4ef5a9d8f6234b2ea4de0eb5b775465b` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 104 | `50d87bd1d7924c418b741ea718458233` | SGA Warehouse Management Flow | almacen | `/almacen/flujo-operativo` | pendiente |
| 105 | `2039017740179241651` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 106 | `54084a32b6d849fcbdd1f4bb39e2020f` | SGA Almacén - Alta de Artículo | inventario | `/inventario/alta-articulo` | pendiente |
| 107 | `543a52d57ace4cf193263187b4a23e79` | Catálogo de Artículos - SGA Web (Modo Oscuro) | inventario | `/inventario/catalogo-dark` | hecha |
| 108 | `54729864a51f48bda0c184901609aa1d` | Dashboard General - SGA Web (Modo Oscuro Oficial) | dashboard | `/dashboard/general-dark` | pendiente |
| 109 | `55b4e6e532b04b2e8180fd4a6f7c1b29` | Dashboard Principal | dashboard | `/dashboard/general` | pendiente |
| 110 | `2249667941673526722` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 111 | `56b72d5462444b8f8bbb51412fc3c678` | Alta de Artículo en Catálogo Maestro - SGA Web | inventario | `/inventario/alta-articulo` | pendiente |
| 112 | `574d7be20fa941cfaa5911e350db9de8` | Dashboard General - SGA Web (Tokens Oficiales) | dashboard | `/dashboard/general-tokens` | hecha |
| 113 | `5b8c73d71b8c4a97934d8067629bd13a` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 114 | `5bc267e733e74800b28f8df8fa295939` | Alta de Servicio - SGA Almacén | almacen | `/almacen/alta-servicio` | pendiente |
| 115 | `7469321804316304672` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 116 | `5bee1af68ed24d89919dcd9c7729fe1f` | Entradas de Almacén | almacen | `/almacen/entradas` | pendiente |
| 117 | `15508117681948790189` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 118 | `5cdb6879359c4208aaae495ef131a962` | Warehouse Management System (SGA Almacén) | almacen | `/almacen/operaciones` | pendiente |
| 119 | `5d2e72452e4449519cc8c12bd867d252` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 120 | `5e8e1befe996447b9c8357209d48b456` | SIFYGSA Warehouse Article Reception | almacen | `/almacen/operaciones` | pendiente |
| 121 | `5efc065218054f98bbc482b8d59cc650` | Alta de Artículo - Catálogo Maestro SIFYGSA (Modo Oscuro) | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 122 | `60c1a860009d4909a348a7cc776514fc` | Nueva Recepción de Artículo - IR03 (Modo Claro Oficial) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 123 | `60f3a61db6fa421bb671b04c4343240c` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 124 | `61229338e51c420ea8625cbd8c101b6a` | Dashboard General - SGA Web (Modo Oscuro Final) | dashboard | `/dashboard/general-dark` | pendiente |
| 125 | `13641776027579949949` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 126 | `618404b7efb541848dc778497280e9c2` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 127 | `1655167047594024982` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 128 | `6312466b2e8f468c991f6dea442b15b1` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 129 | `10042590521676197229` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 130 | `63e05b60f9a542b689f7d3cd36107212` | SGA Warehouse Reception Flow | almacen | `/almacen/flujo-operativo` | pendiente |
| 131 | `6480b14e48c0421d9d474115061e5c69` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 132 | `9227697490482133848` | SIFYGSA.jpg | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 133 | `665dc43548d8451bb4760f83e9c1f715` | SGA Almacén - Sistema de Gestión Integral | almacen | `/almacen/gestion-integral` | pendiente |
| 134 | `6684b6905f894995a7e10de75341e160` | Catálogo de Artículos - SGA Web | inventario | `/inventario/catalogo` | hecha |
| 135 | `6718dc1ea743452581715cde67af74c9` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 136 | `10163470831091094880` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 137 | `680d1ea474ed409ea295790a90c27743` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 138 | `6a6878cb6f6f4f18aa195afdd75e7d66` | Nueva Recepción de Artículo - IR03 (Modo Claro Corporativo) | almacen | `/almacen/recepcion-ir03` | hecha |
| 139 | `6ad2c431ae3b483a9d8dade97ff090f9` | SGA Almacén - Sistema de Gestión Integral | almacen | `/almacen/gestion-integral` | pendiente |
| 140 | `17850504428404383539` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 141 | `5610827940613258555` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 142 | `8104063349015736975` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 143 | `6e0e5ba78f3841e0bbcce39708e605d8` | Dashboard General - SGA Web (Tokens Oficiales) | dashboard | `/dashboard/general-tokens` | pendiente |
| 144 | `6e153f6eb8df483a967abaa1071af653` | Nueva Recepción de Artículo - IR03 (Modo Oscuro Ejecutivo) | almacen | `/almacen/recepcion-ir03-dark` | pendiente |
| 145 | `9227697490482133558` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 146 | `70126d120144454385782f52115f07b1` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 147 | `715354cd823d465a881efa73f7ab45da` | Alta de Artículo en Catálogo Maestro - SGA Almacén | inventario | `/inventario/alta-articulo` | pendiente |
| 148 | `73e6a87f6003433da7b6aeaa739bc447` | Dashboard General - SGA Web (Modo Oscuro) | dashboard | `/dashboard/general-dark` | pendiente |
| 149 | `75f273e76afe4105b667efe44b36de80` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 150 | `76e24325207b4572a17b18586d596a72` | Alta de Artículo en Catálogo Maestro - SGA Almacén | inventario | `/inventario/alta-articulo` | pendiente |
| 151 | `7746231303435266413` | Orden de Compra - PO51 (SIFYGSA Almacén ERP) | compras | `/compras/po51` | pendiente |
| 152 | `798ff5ee6e4e4c9384e1d45c226b13d9` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 153 | `7afd01ab272e485e991ce33e73e44d94` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 154 | `7c9bfd618a3048e8b537c9b2b8c334a6` | Alta de Artículo en Catálogo Maestro - Finalizada y Completa | inventario | `/inventario/alta-articulo` | pendiente |
| 155 | `7cd44d06a487437583627271fe3cb9d8` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 156 | `7e5d73e5f38b425da69a8cc8af897574` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 157 | `7f168b73d3174335bc4fcc2f35514caa` | Almacén - Recepción de Artículos (Light & Dark) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 158 | `7f6d84bda93542508cbe8ad52460fbb2` | Alta de Servicio / Artículo no Inventariable - SGA Web | almacen | `/almacen/alta-servicio` | pendiente |
| 159 | `7fbb86c9895d4613b49d1f1d6fb54c61` | Warehouse Management System (SGA Almacén) | almacen | `/almacen/operaciones` | pendiente |
| 160 | `809bc63c6fee4cc18985b391c0cae2b9` | SGA Warehouse Management Dashboard | dashboard | `/dashboard/warehouse-dashboard` | pendiente |
| 161 | `80cf89a5b18e4009969b48b0e058693b` | Warehouse Management System (SGA) | almacen | `/almacen/operaciones` | pendiente |
| 162 | `8163086bf5834c529ec693790e74ee34` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 163 | `824b9ba1f8ac4b948d3964b8bc4b5fc9` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 164 | `13560329112545781972` | SIFYGSA.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 165 | `17572428344779987218` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 166 | `87ad9ed4180e4909b382ea97cc81d370` | Dashboard General - SGA Web (Modo Oscuro) | dashboard | `/dashboard/general-dark` | pendiente |
| 167 | `87e7724f76814ecca90915a3ec302d6c` | Nueva Recepción de Artículo - IR03 (Modo Oscuro Oficial) | almacen | `/almacen/recepcion-ir03-dark` | pendiente |
| 168 | `10922765253921881603` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 169 | `89c14d02fa074a2a9062928c6c238514` | Alta de Artículo en Catálogo Maestro - SGA Web | inventario | `/inventario/alta-articulo` | pendiente |
| 170 | `8cecd1f9dbfb46b284f8adbd28a31977` | PRD Ejecutivo & Product Brief - SGA Web SIFYGSA v2.0 | sin módulo (propuesto: docs) | `/docs/prd-ejecutivo` | pendiente |
| 171 | `16119549599383254166` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 172 | `1330564644751952214` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 173 | `8f9eb9e28c634fd686eb326ff1721f97` | Dashboard General - SGA Web (Modo Oscuro) | dashboard | `/dashboard/general-dark` | pendiente |
| 174 | `90d8ac45cf4543b4bc078541bf0d398f` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 175 | `90e7dcc306c044a8a65383247ceba655` | Warehouse Management System (SGA Almacén) | almacen | `/almacen/operaciones` | pendiente |
| 176 | `6981396383781588499` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 177 | `928feb493194481ea080d5e147689bd6` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 178 | `9474bf91c6ea443880140b3dd95f479c` | Orden de Compra - PO51 (SIFYGSA Almacén ERP) | compras | `/compras/po51` | pendiente |
| 179 | `95d2f4a9f6684b288bf989ffaeb9a766` | Nueva Recepción de Artículo - IR03 (Modo Oscuro Oficial) | almacen | `/almacen/recepcion-ir03-dark` | pendiente |
| 180 | `965e432c4578488e861e2162592e116b` | Dashboard General - SGA Web (Modo Oscuro Oficial) | dashboard | `/dashboard/general-dark` | pendiente |
| 181 | `9667dbac5e4c431dbc38346d2f77ce44` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 182 | `16962475873070986558` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 183 | `1591348935844829049` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 184 | `7860789694220710480` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 185 | `9c67a73b16924c80b84b691544184308` | Warehouse Management System (SGA Almacén) | almacen | `/almacen/operaciones` | pendiente |
| 186 | `9d40de605fb24a618bc2b46af415d40f` | Alta de Artículo en Catálogo Maestro - Modo Oscuro | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 187 | `1077317917857137476` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 188 | `a2c9a62a7c1b49cd843e6e4521b47f91` | SGA Almacén - Alta de Artículo | inventario | `/inventario/alta-articulo` | pendiente |
| 189 | `a3145feaf4664107928053dd62c1d6fd` | Alta de Artículo - Variante 1: Wizard Progresivo | inventario | `/inventario/alta-articulo-wizard` | pendiente |
| 190 | `762097580121245294` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 191 | `18034690707753069188` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 192 | `14106573051080798824` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 193 | `a6bd7bfe568d4f82bf80e9555990d2cf` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 194 | `a72dc45f41a2477ba506322b66d000ad` | Alta de Artículo en Catálogo Maestro - Finalizada y Completa | inventario | `/inventario/alta-articulo` | pendiente |
| 195 | `a76e9f37bd874a5ab8a5eb964b0a6420` | Alta de Servicio / Artículo no Inventariable - SGA Web | almacen | `/almacen/alta-servicio` | pendiente |
| 196 | `a7b119ea8b5241eaac5d32113a0f79dd` | Nueva Recepción de Artículo - IR03 (Modo Oscuro Oficial) | almacen | `/almacen/recepcion-ir03-dark` | hecha |
| 197 | `a8d1e2668238425383ff2c58fb85cc2d` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 198 | `2207505364952610122` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 199 | `8385722608358497182` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 200 | `aa6706edc6d14f738a5e2ca585686247` | Alta de Artículo en Catálogo Maestro - Finalizada y Completa | inventario | `/inventario/alta-articulo` | pendiente |
| 201 | `17142117294421058773` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 202 | `acc6517e20ee44f79aec349d6dccfda0` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 203 | `4346275154175388763` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 204 | `ad4314c72ca3462d8566f9f75a3abb7a` | Catálogo de Artículos - SGA Web | inventario | `/inventario/catalogo` | pendiente |
| 205 | `ad4ff3573eca4770bb6f91d05a31454a` | Orden de Compra - PO51 (SIFYGSA Almacén ERP) | compras | `/compras/po51` | pendiente |
| 206 | `ae8eb8ab968340a79ef80416501a5f03` | Orden de Compra - PO51 (SIFYGSA Almacén ERP) | compras | `/compras/po51` | pendiente |
| 207 | `af09cbcaef8a494892aebb3bc874fee1` | Dashboard General - SGA Web (Modo Oscuro) | dashboard | `/dashboard/general-dark` | pendiente |
| 208 | `assets_05f5e8a6c37d4a4384e3762f0148ffa4` | Tokens de Sistema de Diseño (Design System) | sin módulo (propuesto: design-system) | `/settings/design-system` | con observaciones (tokens de diseño) |
| 209 | `assets_0ffcc0f544944a50b9cb037891439da7` | Tokens de Sistema de Diseño (Design System) | sin módulo (propuesto: design-system) | `/settings/design-system` | con observaciones (tokens de diseño) |
| 210 | `assets_58fc7c9ce7924369862d15efe5df403f` | Tokens de Sistema de Diseño (Design System) | sin módulo (propuesto: design-system) | `/settings/design-system` | con observaciones (tokens de diseño) |
| 211 | `assets_7701303422a1400388057c517c94e06c` | Tokens de Sistema de Diseño (Design System) | sin módulo (propuesto: design-system) | `/settings/design-system` | con observaciones (tokens de diseño) |
| 212 | `assets_bb730ef0d11e42698ce2c0c4903716a0` | Tokens de Sistema de Diseño (Design System) | sin módulo (propuesto: design-system) | `/settings/design-system` | con observaciones (tokens de diseño) |
| 213 | `assets_d9b3327f9efe4dcb97f7dd2bfc7bf026` | Tokens de Sistema de Diseño (Design System) | sin módulo (propuesto: design-system) | `/settings/design-system` | con observaciones (tokens de diseño) |
| 214 | `6457088951410477814` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 215 | `b277c26033fa4cf5984da161058915be` | Dashboard General - SGA Web (Modo Claro Corporativo) | dashboard | `/dashboard/general` | hecha |
| 216 | `b6146f8f2a7d40bda9b39c456f78f969` | Entradas de Almacén - SGA Web | almacen | `/almacen/entradas` | pendiente |
| 217 | `b66d9014447f46d0bbdd50a238ea3f67` | Alta de Artículo - Catálogo Maestro (Modo Claro / Alternador Oscuro) | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 218 | `b6d4ac6ebde54dfebcae32d3b709abcd` | Alta de Servicio / Artículo no Inventariable - SGA Web (Modo Oscuro) | almacen | `/almacen/alta-servicio-dark` | hecha |
| 219 | `b7a37d588f014914b52724201834c83e` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 220 | `b7fdf512ad234db68a60a6d3cd63904d` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 221 | `ba129a5ef0234365843ef9669ae141b4` | Warehouse Catalog Item Creation Flow | inventario | `/inventario/catalogo` | pendiente |
| 222 | `ba37a531118244d3b70fa3be555b7ccd` | Dashboard General - SGA Web (Modo Oscuro Oficial) | dashboard | `/dashboard/general-dark` | pendiente |
| 223 | `ba8809b8054946e8a78aca71b3a30394` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 224 | `baf8a7d11455446290b69dd5b112b662` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 225 | `bbbdf3d5b0984139a150e78badac705c` | Nueva Recepción de Artículo - IR03 (Modo Claro Oficial) | almacen | `/almacen/recepcion-ir03` | hecha |
| 226 | `bbf0988baf6f4fc6b22b9971d682cdb4` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 227 | `5396533917435923384` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 228 | `bdcbce6187364993b9ccf1914c6ce884` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 229 | `8759076485734137331` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 230 | `bf650760a7e740129a0eb8be220c93d7` | SGA Almacén - Alta de Artículo | inventario | `/inventario/alta-articulo` | pendiente |
| 231 | `2234367268021641962` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 232 | `bfbe1a89154948a598999b4e8bd1f410` | Nueva Recepción de Artículo - IR03 (Modo Oscuro Corporativo) | almacen | `/almacen/recepcion-ir03-dark` | hecha |
| 233 | `1705562359407356538` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 234 | `c22589b79eda4ff099cac8000e42cbc4` | Alta de Servicio / Artículo no Inventariable - SGA Web | almacen | `/almacen/alta-servicio` | pendiente |
| 235 | `2831606008289404972` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 236 | `c5dd2809819145008c9491787cbfe3e3` | Alta de Artículo en Catálogo Maestro - SGA Web | inventario | `/inventario/alta-articulo` | pendiente |
| 237 | `c7f7f1a03ab2409d8bc621389e5a631c` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 238 | `c8384240b22648eb94f510948fd409af` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 239 | `c89f882267b34a998b6e69aa3e26ea0a` | Alta de Artículo en Catálogo Maestro - Finalizada y Completa | inventario | `/inventario/alta-articulo` | pendiente |
| 240 | `11256689409899823794` | Alta de Artículo en Catálogo Maestro - Finalizada y Completa | inventario | `/inventario/alta-articulo` | pendiente |
| 241 | `c9078891916d44e9b3df195ba6b53857` | Dashboard General - SGA Web (Modo Oscuro Tokens Oficiales) | dashboard | `/dashboard/general-dark` | pendiente |
| 242 | `c9f40e4276b74aebad2cf3a8dfdb6712` | Almacén - Recepción de Artículos (Claro / Oscuro) | almacen | `/almacen/recepcion-ir03-dark` | pendiente |
| 243 | `d076cb02a2384d2fb67d7438662da1d3` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 244 | `d380be8eb99c4f889539b1bebd7063bc` | SIFYGSA Almacén ERP Management | almacen | `/almacen/operaciones` | pendiente |
| 245 | `d58be3f84daa4e2297735830c8f0a1c4` | SGA Warehouse Master Item Creation | inventario | `/inventario/catalogo` | pendiente |
| 246 | `d5af4b0f43a14647a9436915cb3ff9f9` | Dashboard General - SGA Web | dashboard | `/dashboard/general` | pendiente |
| 247 | `d713948ffc714a2a90afc20723510585` | SGA Almacén - Sistema de Gestión Integral | almacen | `/almacen/gestion-integral` | pendiente |
| 248 | `d830ea7d83ab4723bd019dedd6bffa95` | Warehouse Management Dashboard | dashboard | `/dashboard/warehouse-dashboard` | pendiente |
| 249 | `d8b0b20dac1f45ef9f4a9f86c1281234` | Nueva Recepción de Artículo - IR03 (Modo Oscuro Oficial) | almacen | `/almacen/recepcion-ir03-dark` | pendiente |
| 250 | `d99e08845b584e75b798a9c95b7b5417` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 251 | `12328852742297068116` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 252 | `d9d65efc93784eb9af830394a407d6e1` | Alta de Artículo en Catálogo Maestro - SGA Web | inventario | `/inventario/alta-articulo` | pendiente |
| 253 | `dcbbe38ff7de4b10b995cb5e7d9ee03a` | Alta de Artículo en Catálogo Maestro - SGA Web | inventario | `/inventario/alta-articulo` | pendiente |
| 254 | `ddc8dc431f8a40d5b1f3264405f130a2` | Alta de Artículo en Catálogo Maestro - Modo Oscuro Final | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 255 | `5219439615545543767` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 256 | `13386802648339358032` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 257 | `e22ad3b54cbb45968153c908ec4c6545` | Alta de Artículo - Catálogo Maestro (Modo Oscuro) | inventario | `/inventario/alta-articulo-dark` | pendiente |
| 258 | `e2b56f404e854e878e0567581e48287b` | SGA Warehouse Dashboard | dashboard | `/dashboard/warehouse-dashboard` | pendiente |
| 259 | `e319b65a64a7406f82de42caf2a2b278` | SGA Almacén - Warehouse & Inventory Management System | almacen | `/almacen/operaciones` | pendiente |
| 260 | `e3200370cf2a41509dc9de9ed47fe358` | SGA Almacén - Sistema de Gestión Integral | almacen | `/almacen/gestion-integral` | pendiente |
| 261 | `e55e233567884b38abaf192280eacc58` | Alta de Artículo en Catálogo Maestro - Finalizada | inventario | `/inventario/alta-articulo` | pendiente |
| 262 | `16233646883408205109` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 263 | `e77ef6bd41ed4775bb31a507ad56ced9` | Warehouse Management Dashboard & Item Registration | dashboard | `/dashboard/warehouse-dashboard` | pendiente |
| 264 | `e9df14c1673f44ecb6b767f74feb860e` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 265 | `ea2a4f9436a8479692c89856b560d965` | SGA Almacén Management Dashboard | dashboard | `/dashboard/general` | pendiente |
| 266 | `14654121642413724779` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 267 | `eaec0bf5cb5d4626a0f14410816b6c11` | PRD - Sistema Integral de Gestión de Almacén (SGA Web) SIFYGSA | sin módulo (propuesto: docs) | `/docs/prd-sga-web` | pendiente |
| 268 | `eaf8d9220c05487fa42d4c8c77ec5cfe` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 269 | `eb75e4aa0b224937bbd7e4d98535fa22` | Dashboard General - SGA Web (Modo Oscuro Dedicado) | dashboard | `/dashboard/general-dark` | pendiente |
| 270 | `ebbfa700bb1b4ef49d2e4ea4d8132dd9` | Dashboard General - SGA Web (Alternador Modo Oscuro) | dashboard | `/dashboard/general-dark` | pendiente |
| 271 | `ec39573bfeb24d2e9f63042c708874b2` | Dashboard General - SGA Web (Modo Oscuro Final) | dashboard | `/dashboard/general-dark` | pendiente |
| 272 | `888942251376703407` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 273 | `8440584952152894393` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 274 | `ecaeefb840574a68b91addf792db42af` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 275 | `ecfcfca386194fd79787df8008728b21` | Catálogo de Artículos - SGA Web | inventario | `/inventario/catalogo` | pendiente |
| 276 | `ed54691e416f4beda75dfb03d3dccd0e` | Warehouse Management Catalog Light/Dark Mode | inventario | `/inventario/catalogo` | pendiente |
| 277 | `edc288a0246c4816935f5005a105b78a` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 278 | `ee5903928e3e4018988cefee2d33ec4d` | Warehouse Management System (SGA Almacén) | almacen | `/almacen/operaciones` | pendiente |
| 279 | `400243630446064015` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 280 | `f0bf4136a2b84ecd95e45a5e8a260df4` | Alta de Artículo en Catálogo Maestro - SGA Almacén | inventario | `/inventario/alta-articulo` | pendiente |
| 281 | `f1258174ce604eb68774ed8be7ef5795` | SGA Almacén Management System | almacen | `/almacen/operaciones` | pendiente |
| 282 | `f56f04fc7e8e4534a47326282ddf68fd` | Catálogo de Artículos - SGA Web | inventario | `/inventario/catalogo` | pendiente |
| 283 | `10689992566955465380` | image.png | sin módulo (propuesto: assets/referencias) | `-` | con observaciones (imagen de referencia en canvas) |
| 284 | `f59b77ac9e5041a58dbde1498634e2a7` | SGA Almacén - Warehouse Management Prototype | almacen | `/almacen/operaciones` | pendiente |
| 285 | `f73bec936eb94c90ae3524ef316665f1` | SGA Almacén Dashboard & Theme System | dashboard | `/dashboard/general` | pendiente |
| 286 | `f78d504bbb314263aaa5b7322bf24abd` | Alta de Artículo en Catálogo Maestro - Finalizada | inventario | `/inventario/alta-articulo` | pendiente |
| 287 | `f921f6d956574109a36a882cd88d8718` | Alta de Artículo en Catálogo Maestro - Finalizada y Completa | inventario | `/inventario/alta-articulo` | pendiente |
| 288 | `f983896ab25c45f5a9893b7d772f111c` | SGA Warehouse Management System | almacen | `/almacen/operaciones` | pendiente |
| 289 | `fb601c9e2fbe4d609ef4202161864003` | SGA Warehouse Management Flow | almacen | `/almacen/flujo-operativo` | pendiente |
| 290 | `fb69768b746246f1af4782f3d34ebd57` | SGA Almacén Dashboard | dashboard | `/dashboard/general` | pendiente |
| 291 | `fd91b0b87486491ea97d18418f7bab3a` | Nueva Recepción de Artículo - IR03 (Cfix Almacén ERP) | almacen | `/almacen/recepcion-ir03` | pendiente |
| 292 | `ff60e918298440e897095eb1262d92b3` | SGA Almacén Dashboard | dashboard | `/dashboard/general` | pendiente |

---

## 3. Notas Técnicas y Próximos Pasos (Fase 1)

1. **Orden de procesamiento de Fase 1:**
   - `auth` (Validación del módulo existente `LoginPage.tsx`).
   - `dashboard` (Integración de variantes de dashboard general, terminales nocturnas y vistas de supervisión).
   - `almacen` (Procesamiento por lotes de 15–25 pantallas: Recepciones IR03, Entradas, Altas de Servicio y Flujos Operativos).
   - `inventario` (Catálogos maestros, formularios wizard, matrices operativas y fichas técnicas).
   - `compras` (Orden de compra PO51 y variantes).
   - `settings` / `docs` (Visor de pantallas Stitch y especificaciones PRD).
2. **Imágenes de Referencia y Assets:**
   - Las 66 entradas de tipo `image.png` no cuentan con HTML descargable ya que fueron imágenes subidas manualmente por el usuario al canvas de Stitch. Se mantienen registradas en el inventario con estado `con observaciones` según la instrucción estricta de no inventar descargas.
