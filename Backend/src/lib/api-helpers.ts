// ============================================================
// SFG Business Suite — Helpers para respuestas de API
// ============================================================
import { NextResponse } from "next/server";
import type { ApiResponse, PaginatedResponse } from "./types";

/**
 * Respuesta exitosa estándar
 */
export function successResponse<T>(data: T, message?: string, status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return NextResponse.json(body, { status });
}

/**
 * Respuesta de error estándar
 */
export function errorResponse(message: string, status = 400) {
  const body: ApiResponse = {
    success: false,
    error: message,
  };
  return NextResponse.json(body, { status });
}

/**
 * Respuesta paginada estándar
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  const body: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return NextResponse.json(body);
}

/**
 * Extraer parámetros de paginación de la URL
 */
export function getPaginationParams(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  return { page, limit };
}
