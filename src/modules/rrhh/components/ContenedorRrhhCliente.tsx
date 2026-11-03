'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NOMBRES_ROLES, type RolUsuario } from '@/config/types';
import { SettingsPage } from '@/modules/settings/pages/SettingsPage';
import type { DatosRrhhCliente } from '../types';

import '../suite/styles/globals.css';
import '../suite/styles/dashboard.css';

import { RrhhDashboard } from '../suite/components/dashboard/RrhhDashboard';
import { BirthdaysView } from '../suite/components/dashboard/BirthdaysView';
import { EmployeeCreateView } from '../suite/components/dashboard/EmployeeCreateView';
import { DepartmentsView } from '../suite/components/dashboard/DepartmentsView';
import { EmployeesCatalogView } from '../suite/components/dashboard/EmployeesCatalogView';
import { EmployeeDetailModal } from '../suite/components/dashboard/EmployeeDetailModal';
import { EmployeeEditModal } from '../suite/components/dashboard/EmployeeEditModal';
import { VacationsSgiView } from '../suite/components/dashboard/VacationsSgiView';
import { SgiFormatsView } from '../suite/components/dashboard/SgiFormatsView';
import { HolidaysView } from '../suite/components/dashboard/HolidaysView';
import {
  KPI_METRICS,
  AGENDA_DAYS,
  EMPLOYEES,
  INITIAL_DEPARTMENTS,
} from '../suite/data/mockData';
import type { Employee, DepartmentItem } from '../suite/types';

const STORAGE_KEY_EMPLOYEES = 'sifygsa_rrhh_employees_v1';
const STORAGE_KEY_DEPARTMENTS = 'sifygsa_rrhh_departments_v1';

export interface PropiedadesContenedorRrhh {
  datosIniciales: DatosRrhhCliente;
  rolUsuario: RolUsuario;
  nombreUsuario: string;
  emailUsuario: string;
}

export const ContenedorRrhhCliente: React.FC<PropiedadesContenedorRrhh> = ({
  rolUsuario,
  nombreUsuario,
  emailUsuario,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawSub = searchParams.get('sub') ?? 'rrhh-panel';
  const activeSubmenuId = rawSub === 'rh-directorio' ? 'rrhh-panel' : rawSub;

  const [selectedLocation] = useState<string>('Minatitlán, Ver.');
  const [employeesList, setEmployeesList] = useState<Employee[]>(EMPLOYEES);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);

  useEffect(() => {
    try {
      const savedEmp = window.localStorage.getItem(STORAGE_KEY_EMPLOYEES);
      if (savedEmp) setEmployeesList(JSON.parse(savedEmp) as Employee[]);
      const savedDept = window.localStorage.getItem(STORAGE_KEY_DEPARTMENTS);
      if (savedDept) setDepartmentsList(JSON.parse(savedDept) as DepartmentItem[]);
    } catch {
      // Ignore storage read errors
    }
  }, []);

  const updateEmployees = (updater: (prev: Employee[]) => Employee[]) => {
    setEmployeesList((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  const updateDepartments = (updater: (prev: DepartmentItem[]) => DepartmentItem[]) => {
    setDepartmentsList((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY_DEPARTMENTS, JSON.stringify(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [selectedEmployeeEdit, setSelectedEmployeeEdit] = useState<Employee | null>(null);

  const handleAddDepartment = (newDept: DepartmentItem) => {
    updateDepartments((prev) => [newDept, ...prev]);
  };

  const handleUpdateDepartment = (updatedDept: DepartmentItem) => {
    updateDepartments((prev) => prev.map((d) => (d.id === updatedDept.id ? updatedDept : d)));
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    updateEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
    setSelectedEmployeeEdit(null);
  };

  const departmentNames = departmentsList.map((d) => d.name);

  if (activeSubmenuId === 'rh-ajustes') {
    return (
      <SettingsPage
        user={{
          name: nombreUsuario,
          email: emailUsuario,
          role: NOMBRES_ROLES[rolUsuario],
        }}
      />
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {activeSubmenuId === 'rrhh-alta' ? (
        <EmployeeCreateView
          departments={departmentNames}
          onSuccess={(newEmp) => {
            updateEmployees((prev) => [newEmp, ...prev]);
            router.push('/rrhh?sub=rrhh-panel');
          }}
          onCancel={() => {
            router.push('/rrhh?sub=rrhh-panel');
          }}
        />
      ) : activeSubmenuId === 'rrhh-catalogos' ? (
        <EmployeesCatalogView
          employees={employeesList}
          onOpenNewEmployee={() => router.push('/rrhh?sub=rrhh-alta')}
          onEditEmployee={(emp) => setSelectedEmployeeEdit(emp)}
          onViewEmployee={(emp) => setSelectedEmployeeDetail(emp)}
        />
      ) : activeSubmenuId === 'rrhh-departamentos' ? (
        <DepartmentsView
          departments={departmentsList}
          onAddDepartment={handleAddDepartment}
          onUpdateDepartment={handleUpdateDepartment}
        />
      ) : activeSubmenuId === 'rrhh-vacaciones' ? (
        <VacationsSgiView employees={employeesList} />
      ) : activeSubmenuId === 'rrhh-formatos' ? (
        <SgiFormatsView employees={employeesList} />
      ) : activeSubmenuId === 'rrhh-cumpleanos' ? (
        <BirthdaysView />
      ) : activeSubmenuId === 'rrhh-festivos' ? (
        <HolidaysView />
      ) : (
        <RrhhDashboard
          kpis={KPI_METRICS}
          agendaDays={AGENDA_DAYS}
          employees={employeesList}
          selectedLocation={selectedLocation}
          departments={departmentNames}
          onOpenNewEmployee={() => router.push('/rrhh?sub=rrhh-alta')}
          onNavigateToBirthdays={() => router.push('/rrhh?sub=rrhh-cumpleanos')}
        />
      )}

      {selectedEmployeeDetail && (
        <EmployeeDetailModal
          employee={selectedEmployeeDetail}
          onClose={() => setSelectedEmployeeDetail(null)}
          onEdit={(emp) => {
            setSelectedEmployeeDetail(null);
            setSelectedEmployeeEdit(emp);
          }}
        />
      )}

      {selectedEmployeeEdit && (
        <EmployeeEditModal
          employee={selectedEmployeeEdit}
          onClose={() => setSelectedEmployeeEdit(null)}
          onSave={handleUpdateEmployee}
        />
      )}
    </div>
  );
};
