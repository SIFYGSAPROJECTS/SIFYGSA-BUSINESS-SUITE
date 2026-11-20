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
import { ExtensionsCatalogView } from '../suite/components/dashboard/ExtensionsCatalogView';
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
import type { CvImportDraft } from '../suite/utils/cvParser';
import {
  bootstrapLocalJsonDb,
  useSyncedEmployees,
  useSyncedDepartments,
  savePersistedEmployees,
  savePersistedDepartments,
} from '../suite/utils/formShield';

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
  const employeesList = useSyncedEmployees(EMPLOYEES);
  const departmentsList = useSyncedDepartments(INITIAL_DEPARTMENTS);

  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [selectedEmployeeEdit, setSelectedEmployeeEdit] = useState<Employee | null>(null);
  const [pendingCvDraft, setPendingCvDraft] = useState<CvImportDraft | null>(null);

  useEffect(() => {
    void bootstrapLocalJsonDb({
      employees: EMPLOYEES,
      departments: INITIAL_DEPARTMENTS,
    });
  }, []);

  const handleAddDepartment = (newDept: DepartmentItem) => {
    savePersistedDepartments([newDept, ...departmentsList]);
  };

  const handleUpdateDepartment = (updatedDept: DepartmentItem) => {
    savePersistedDepartments(
      departmentsList.map((d) => (d.id === updatedDept.id ? updatedDept : d))
    );
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    savePersistedEmployees(
      employeesList.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
    );
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
          initialCvDraft={pendingCvDraft}
          onConsumeCvDraft={() => setPendingCvDraft(null)}
          onSuccess={(newEmp) => {
            savePersistedEmployees([newEmp, ...employeesList]);
            setPendingCvDraft(null);
            router.push('/rrhh?sub=rrhh-catalogos');
          }}
          onCancel={() => {
            setPendingCvDraft(null);
            router.push('/rrhh?sub=rrhh-catalogos');
          }}
        />
      ) : activeSubmenuId === 'rrhh-catalogos' ? (
        <EmployeesCatalogView
          employees={employeesList}
          onOpenNewEmployee={() => {
            setPendingCvDraft(null);
            router.push('/rrhh?sub=rrhh-alta');
          }}
          onImportCv={(draft) => {
            setPendingCvDraft(draft);
            router.push('/rrhh?sub=rrhh-alta');
          }}
          onEditEmployee={(emp) => setSelectedEmployeeEdit(emp)}
          onViewEmployee={(emp) => setSelectedEmployeeDetail(emp)}
        />
      ) : activeSubmenuId === 'rrhh-departamentos' ? (
        <DepartmentsView
          departments={departmentsList}
          onAddDepartment={handleAddDepartment}
          onUpdateDepartment={handleUpdateDepartment}
        />
      ) : activeSubmenuId === 'rrhh-extensiones' ? (
        <ExtensionsCatalogView departments={departmentNames} />
      ) : activeSubmenuId === 'rrhh-vacaciones' ? (
        <VacationsSgiView employees={employeesList} />
      ) : activeSubmenuId === 'rrhh-formatos' ? (
        <SgiFormatsView
          employees={employeesList}
          onOpenNewEmployee={() => {
            setPendingCvDraft(null);
            router.push('/rrhh?sub=rrhh-alta');
          }}
        />
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
          onOpenNewEmployee={() => {
            setPendingCvDraft(null);
            router.push('/rrhh?sub=rrhh-alta');
          }}
          onNavigateToBirthdays={() => router.push('/rrhh?sub=rrhh-cumpleanos')}
          onNavigateSubmenu={(submenuId) => router.push(`/rrhh?sub=${submenuId}`)}
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
