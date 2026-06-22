/**
 * Backend API client.
 *
 * Reads the backend URL from `NEXT_PUBLIC_API_URL` (set in `.env.local`).
 * All requests automatically attach the JWT Bearer token from localStorage
 * when one is present.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

const AUTH_KEY = "driving-school-auth"
const TOKEN_KEY = "driving-school-token"

export interface AuthUser {
  email: string
  name: string
}

interface StoredAuth {
  user: AuthUser
  token: string
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    const token = localStorage.getItem(TOKEN_KEY)
    if (!raw || !token) return null
    return { user: JSON.parse(raw), token }
  } catch {
    return null
  }
}

export function setStoredAuth(user: AuthUser, token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(message: string, status: number, detail?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(
    path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`,
  )
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v))
      }
    }
  }
  return url.toString()
}

interface RequestOptions {
  method?: string
  body?: BodyInit | null
  headers?: Record<string, string>
  params?: Record<string, string | number | undefined>
  /** When true, do not attach the Bearer token. */
  skipAuth?: boolean
  /** When true, parse response as JSON; otherwise return raw Response. */
  raw?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, params, skipAuth, raw } = options

  const finalHeaders: Record<string, string> = { ...headers }
  if (!skipAuth) {
    const stored = getStoredAuth()
    if (stored?.token) {
      finalHeaders.Authorization = `Bearer ${stored.token}`
    }
  }

  const url = buildUrl(path, params)
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body,
  })

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    let detail: unknown
    try {
      detail = await res.json()
    } catch {
      detail = undefined
    }
    let message = res.statusText || "Request failed"
    if (
      detail &&
      typeof detail === "object" &&
      "detail" in detail &&
      (detail as { detail: unknown }).detail
    ) {
      message = String((detail as { detail: unknown }).detail)
    }
    throw new ApiError(message, res.status, detail)
  }

  if (raw) return res as unknown as T
  if (res.headers.get("content-type")?.includes("application/json")) {
    return (await res.json()) as T
  }
  return (await res.text()) as unknown as T
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface LoginResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
  setStoredAuth(data.user, data.access_token)
  return data
}

export function logout(): void {
  clearStoredAuth()
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
import type { Student, ClassSession, CourseClasses, ClassType } from "./types"

export interface BackendClassSession {
  id: number
  class_type: ClassType
  class_number: number
  completed: boolean
  completed_date: string | null
  note: string | null
}

export interface BackendStudent {
  id: number
  name: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  emergencyContact: string
  drivingType: "car" | "motorcycle" | "commercial"
  admissionDate: string
  status: "active" | "completed" | "dropped"
  courseFee: string | number
  discount: string | number
  paidAmount: string | number
  netPayable: string | number
  notes: string | null
  photoUrl: string | null
  classes: {
    practical: BackendClassSession[]
    engine: BackendClassSession[]
    theory: BackendClassSession[]
  }
}

export interface StudentListResponse {
  items: BackendStudent[]
  total: number
  page: number
  page_size: number
}

function adaptSession(s: BackendClassSession): ClassSession {
  return {
    id: String(s.id),
    classNumber: s.class_number,
    type: s.class_type,
    completed: !!s.completed,
    completedDate: s.completed_date ?? undefined,
    note: s.note ?? undefined,
  }
}

function adaptStudent(s: BackendStudent): Student {
  const classes: CourseClasses = {
    practical: (s.classes?.practical ?? []).map(adaptSession),
    engine: (s.classes?.engine ?? []).map(adaptSession),
    theory: (s.classes?.theory ?? []).map(adaptSession),
  }
  return {
    id: String(s.id),
    name: s.name,
    email: s.email,
    phone: s.phone,
    dateOfBirth: s.dateOfBirth,
    address: s.address,
    drivingType: s.drivingType,
    admissionDate: s.admissionDate,
    status: s.status,
    courseFee: Number(s.courseFee),
    discount: Number(s.discount),
    paidAmount: Number(s.paidAmount),
    emergencyContact: s.emergencyContact,
    notes: s.notes ?? undefined,
    photoUrl: s.photoUrl ?? undefined,
    classes,
  }
}

export interface ListStudentsParams {
  search?: string
  status?: string
  drivingType?: string
  page?: number
  page_size?: number
}

export async function listStudents(params: ListStudentsParams = {}): Promise<Student[]> {
  const data = await request<StudentListResponse>("/students/", { params: { ...params } })
  return data.items.map(adaptStudent)
}

export async function getStudent(id: string | number): Promise<Student> {
  const data = await request<BackendStudent>(`/students/${id}`)
  return adaptStudent(data)
}

export async function createStudent(
  formData: FormData,
): Promise<Student> {
  const data = await request<BackendStudent>("/students/", {
    method: "POST",
    body: formData,
  })
  return adaptStudent(data)
}

export async function updateStudent(
  id: string | number,
  formData: FormData,
): Promise<Student> {
  const data = await request<BackendStudent>(`/students/${id}`, {
    method: "PUT",
    body: formData,
  })
  return adaptStudent(data)
}

export async function deleteStudent(id: string | number): Promise<void> {
  await request<void>(`/students/${id}`, { method: "DELETE" })
}

export interface UpdateClassSessionPayload {
  completed?: boolean
  completed_date?: string
  note?: string
}

export async function updateClassSession(
  studentId: string | number,
  classId: string | number,
  payload: UpdateClassSessionPayload,
): Promise<ClassSession> {
  const data = await request<BackendClassSession>(
    `/students/${studentId}/classes/${classId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed: payload.completed,
        completed_date: payload.completed_date,
        note: payload.note,
      }),
    },
  )
  return adaptSession(data)
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export interface DashboardStats {
  total_students: number
  active_students: number
  completed_students: number
  dropped_students: number
  license_distribution: {
    license_type: string
    count: number
    percentage: number
  }[]
  financial_overview: {
    total_revenue: string | number
    pending_payments: string | number
    total_collected: string | number
    total_course_fees: string | number
  }
  recent_admissions: {
    id: number
    name: string
    email: string
    license_type: string
    admission_date: string
    status: string
  }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/dashboard/stats")
}

/** Returns a full URL for a relative photo path returned by the backend. */
export function photoUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl) return undefined
  // Already absolute URL
  if (/^https?:\/\//.test(photoUrl)) return photoUrl
  // Strip /api/v1 for static asset path
  const base = API_URL.replace(/\/api\/v\d+$/, "")
  return `${base}/${photoUrl.replace(/^\/+/, "")}`
}
