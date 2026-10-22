// ============================================================
// /api/v1/rh/employees/[id] — Detalle / Editar / Eliminar empleado
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { MOCK_EMPLOYEES } from "@/lib/data/rh";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const employee = MOCK_EMPLOYEES.find((e) => e.id === id);

  if (!employee) {
    return errorResponse(`Empleado con ID "${id}" no encontrado.`, 404);
  }

  return successResponse(employee);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const employee = MOCK_EMPLOYEES.find((e) => e.id === id);

  if (!employee) {
    return errorResponse(`Empleado con ID "${id}" no encontrado.`, 404);
  }

  try {
    const body = await request.json();
    const updated = {
      ...employee,
      ...body,
      id: employee.id,
      employeeNumber: employee.employeeNumber, // No cambiar número de empleado
    };

    return successResponse(updated, "Empleado actualizado exitosamente");
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const employee = MOCK_EMPLOYEES.find((e) => e.id === id);

  if (!employee) {
    return errorResponse(`Empleado con ID "${id}" no encontrado.`, 404);
  }

  return successResponse({ id }, "Empleado dado de baja exitosamente");
}
