'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ModalUniversal } from '@/components/ui/ModalUniversal';
import {
  CERTIFICACIONES_SEGURIDAD,
  SEDES_RRHH,
  type CertificacionSeguridad,
  type SedeRrhh,
} from '../constants';
import type { EmpleadoSeguroCliente, EntradaCrearEmpleadoRrhh } from '../types';

export interface PropiedadesExpedienteEmpleadosRrhh {
  empleados: EmpleadoSeguroCliente[];
  incluyeDatosSensibles: boolean;
  puedeCrear: boolean;
  alCrearEmpleado: (datos: EntradaCrearEmpleadoRrhh) => Promise<void>;
}

export const ExpedienteEmpleadosRrhh: React.FC<PropiedadesExpedienteEmpleadosRrhh> = ({
  empleados,
  incluyeDatosSensibles,
  puedeCrear,
  alCrearEmpleado,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [sedeFiltro, setSedeFiltro] = useState<SedeRrhh | 'todas'>('todas');
  const [modalAbierto, setModalAbierto] = useState(false);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [area, setArea] = useState('Instrumentación & Fire/Gas');
  const [puesto, setPuesto] = useState('');
  const [sede, setSede] = useState<SedeRrhh>('Refinería Minatitlán');
  const [certificacionStps, setCertificacionStps] = useState<CertificacionSeguridad>('DC-3 Vigente SIL-3');
  const [salarioMensual, setSalarioMensual] = useState(36000);
  const [rfc, setRfc] = useState('');
  const [nss, setNss] = useState('');
  const [cuentaClabe, setCuentaClabe] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [cargando, setCargando] = useState(false);

  const filtrados = empleados.filter((e) => {
    if (sedeFiltro !== 'todas' && e.sede !== sedeFiltro) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        e.nombre.toLowerCase().includes(q) ||
        e.numeroEmpleado.toLowerCase().includes(q) ||
        e.puesto.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const manejarGuardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setCargando(true);
    try {
      await alCrearEmpleado({
        nombre,
        email,
        telefono,
        area,
        puesto,
        sede,
        fechaIngreso: new Date().toISOString().slice(0, 10),
        estado: 'activo',
        certificacionStps,
        salarioMensual: Number(salarioMensual),
        rfc,
        nss,
        cuentaClabe,
        contactoEmergencia,
      });
      setModalAbierto(false);
    } finally {
      setCargando(false);
    }
  };

  const estiloCampo: React.CSSProperties = {
    width: '100%',
    padding: '0.45rem 0.65rem',
    borderRadius: 'var(--radius-control)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.15rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por nombre, No. empleado o puesto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ ...estiloCampo, width: '260px' }}
          />
          <select value={sedeFiltro} onChange={(e) => setSedeFiltro(e.target.value as SedeRrhh | 'todas')} style={{ ...estiloCampo, width: '200px' }}>
            <option value="todas">Todas las Sedes</option>
            {SEDES_RRHH.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Badge variant={incluyeDatosSensibles ? 'success' : 'warning'}>
            {incluyeDatosSensibles ? '🔓 Datos Confidenciales Visibles' : '🔒 Datos Sensibles Redactados en Servidor'}
          </Badge>
          {puedeCrear && (
            <Button tamano="sm" variante="primario" onClick={() => setModalAbierto(true)}>
              + Alta Colaborador
            </Button>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.6rem' }}>No. / Colaborador</th>
              <th style={{ padding: '0.6rem' }}>Puesto / Área</th>
              <th style={{ padding: '0.6rem' }}>Sede</th>
              <th style={{ padding: '0.6rem' }}>Certificación STPS</th>
              {incluyeDatosSensibles && (
                <>
                  <th style={{ padding: '0.6rem' }}>RFC / NSS</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Salario Mensual</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{emp.numeroEmpleado}</span>
                  <div style={{ fontWeight: 700 }}>{emp.nombre}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <strong>{emp.puesto}</strong>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{emp.area}</div>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>{emp.sede}</td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <Badge variant={emp.certificacionStps.includes('Renovar') ? 'warning' : 'success'}>
                    {emp.certificacionStps}
                  </Badge>
                </td>
                {incluyeDatosSensibles && (
                  <>
                    <td style={{ padding: '0.65rem 0.6rem', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                      <div>RFC: {emp.rfc}</div>
                      <div>NSS: {emp.nss}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.6rem', textAlign: 'right', fontWeight: 800 }}>
                      ${emp.salarioMensual?.toLocaleString('es-MX')} MXN
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalUniversal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Alta de Colaborador en Expediente RRHH">
        <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <input type="text" required placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} style={estiloCampo} />
            <input type="email" required placeholder="Correo corporativo" value={email} onChange={(e) => setEmail(e.target.value)} style={estiloCampo} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <input type="text" required placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={estiloCampo} />
            <input type="text" required placeholder="Puesto" value={puesto} onChange={(e) => setPuesto(e.target.value)} style={estiloCampo} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
            <input type="text" required placeholder="Área" value={area} onChange={(e) => setArea(e.target.value)} style={estiloCampo} />
            <select value={sede} onChange={(e) => setSede(e.target.value as SedeRrhh)} style={estiloCampo}>
              {SEDES_RRHH.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={certificacionStps} onChange={(e) => setCertificacionStps(e.target.value as CertificacionSeguridad)} style={estiloCampo}>
              {CERTIFICACIONES_SEGURIDAD.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
            <input type="number" required min={1000} placeholder="Salario mensual" value={salarioMensual} onChange={(e) => setSalarioMensual(Number(e.target.value))} style={estiloCampo} />
            <input type="text" required minLength={10} placeholder="RFC (13 caracteres)" value={rfc} onChange={(e) => setRfc(e.target.value)} style={estiloCampo} />
            <input type="text" required minLength={8} placeholder="NSS IMSS" value={nss} onChange={(e) => setNss(e.target.value)} style={estiloCampo} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <input type="text" required minLength={10} placeholder="Cuenta CLABE" value={cuentaClabe} onChange={(e) => setCuentaClabe(e.target.value)} style={estiloCampo} />
            <input type="text" required placeholder="Contacto de emergencia" value={contactoEmergencia} onChange={(e) => setContactoEmergencia(e.target.value)} style={estiloCampo} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.4rem' }}>
            <Button variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Button>
            <Button type="submit" variante="primario" cargando={cargando}>Guardar Expediente</Button>
          </div>
        </form>
      </ModalUniversal>
    </div>
  );
};
