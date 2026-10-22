// ============================================================
// /api/v1/rh/employees — CRUD Directorio de Colaboradores
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_EMPLOYEES } from "@/lib/data/rh";

/**
 * GET — Listar empleados con paginación y filtros
 * Query params: ?page=1&limit=10&department=Tecnología&status=Activo&search=mariana
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_EMPLOYEES];

  const department = searchParams.get("department");
  if (department) {
    filtered = filtered.filter((e) =>
      e.department.toLowerCase().includes(department.toLowerCase())
    );
  }

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((e) => e.status === status);
  }

  const location = searchParams.get("location");
  if (location) {
    filtered = filtered.filter((e) =>
      e.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  const search = searchParams.get("search");
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Registrar nuevo empleado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.department || !body.position) {
      return errorResponse(
        "Campos requeridos: name, email, department, position",
        400
      );
    }

    const newEmployee = {
      id: `emp_${Date.now()}`,
      employeeNumber: `SFG-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      department: body.department,
      position: body.position,
      hireDate: body.hireDate || new Date().toISOString().split("T")[0],
      status: "Activo" as const,
      salary: body.salary || 0,
      currency: body.currency || "MXN",
      manager: body.manager || "",
      location: body.location || "Monterrey HQ",
      birthDate: body.birthDate || "",
      emergencyContact: body.emergencyContact || "",
      emergencyPhone: body.emergencyPhone || "",
    };

    return successResponse(newEmployee, "Empleado registrado exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
