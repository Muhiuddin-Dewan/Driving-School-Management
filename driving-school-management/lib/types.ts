export type ClassType = "practical" | "engine" | "theory"

export interface ClassSession {
  id: string
  classNumber: number
  type: ClassType
  completed: boolean
  completedDate?: string
  note?: string
}

export interface CourseClasses {
  practical: ClassSession[]
  engine: ClassSession[]
  theory: ClassSession[]
}

// Class structure per driving type
export const CLASS_STRUCTURE = {
  car: { practical: 20, engine: 2, theory: 2, total: 24 },
  motorcycle: { practical: 15, engine: 1, theory: 2, total: 18 },
  commercial: { practical: 30, engine: 4, theory: 6, total: 40 },
} as const

export type DrivingType = "car" | "motorcycle" | "commercial"

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  /** Driving type — kept as `drivingType` to match the backend. */
  drivingType: DrivingType
  admissionDate: string
  status: "active" | "completed" | "dropped"
  courseFee: number
  discount: number
  paidAmount: number
  emergencyContact: string
  notes?: string
  photoUrl?: string
  classes?: CourseClasses
}

export interface AuthUser {
  email: string
  name: string
}
