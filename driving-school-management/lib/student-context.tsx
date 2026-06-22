"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Student, CourseClasses, ClassSession } from "./types"
import * as api from "./api"
import type { ListStudentsParams } from "./api"

interface StudentContextType {
  students: Student[]
  total: number
  loading: boolean
  error: string | null
  fetchStudents: (params?: ListStudentsParams) => Promise<void>
  addStudent: (formData: FormData) => Promise<Student>
  updateStudent: (id: string, formData: FormData) => Promise<Student>
  deleteStudent: (id: string) => Promise<void>
  getStudent: (id: string) => Student | undefined
  refreshStudent: (id: string) => Promise<Student | null>
  updateClassSession: (
    studentId: string,
    classType: keyof CourseClasses,
    classId: string,
    updates: Partial<ClassSession>,
  ) => Promise<void>
}

const StudentContext = createContext<StudentContextType | undefined>(undefined)

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async (params: ListStudentsParams = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listStudents(params)
      setStudents(data)
      setTotal(data.length)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load students"
      setError(msg)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    void fetchStudents()
  }, [fetchStudents])

  const addStudent = useCallback(
    async (formData: FormData): Promise<Student> => {
      const created = await api.createStudent(formData)
      setStudents((prev) => [created, ...prev])
      return created
    },
    [],
  )

  const updateStudent = useCallback(
    async (id: string, formData: FormData): Promise<Student> => {
      const updated = await api.updateStudent(id, formData)
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)))
      return updated
    },
    [],
  )

  const deleteStudent = useCallback(
    async (id: string): Promise<void> => {
      await api.deleteStudent(id)
      setStudents((prev) => prev.filter((s) => s.id !== id))
    },
    [],
  )

  const getStudent = useCallback(
    (id: string) => students.find((s) => s.id === id),
    [students],
  )

  const refreshStudent = useCallback(async (id: string): Promise<Student | null> => {
    try {
      const updated = await api.getStudent(id)
      setStudents((prev) => {
        const exists = prev.some((s) => s.id === id)
        return exists ? prev.map((s) => (s.id === id ? updated : s)) : [...prev, updated]
      })
      return updated
    } catch {
      return null
    }
  }, [])

  const updateClassSession = useCallback(
    async (
      studentId: string,
      _classType: keyof CourseClasses,
      classId: string,
      updates: Partial<ClassSession>,
    ) => {
      // Optimistically update local state
      setStudents((prev) =>
        prev.map((student) => {
          if (student.id !== studentId || !student.classes) return student
          return {
            ...student,
            classes: {
              practical: student.classes.practical.map((s) => (s.id === classId ? { ...s, ...updates } : s)),
              engine: student.classes.engine.map((s) => (s.id === classId ? { ...s, ...updates } : s)),
              theory: student.classes.theory.map((s) => (s.id === classId ? { ...s, ...updates } : s)),
            },
          }
        }),
      )

      try {
        const updated = await api.updateClassSession(studentId, classId, {
          completed: updates.completed,
          completed_date: updates.completedDate,
          note: updates.note,
        })
        setStudents((prev) =>
          prev.map((student) => {
            if (student.id !== studentId || !student.classes) return student
            return {
              ...student,
              classes: {
                practical: student.classes.practical.map((s) => (s.id === classId ? updated : s)),
                engine: student.classes.engine.map((s) => (s.id === classId ? updated : s)),
                theory: student.classes.theory.map((s) => (s.id === classId ? updated : s)),
              },
            }
          }),
        )
      } catch (err) {
        // Revert on error by refetching the student
        console.error("Failed to update class session:", err)
        await refreshStudent(studentId)
      }
    },
    [refreshStudent],
  )

  return (
    <StudentContext.Provider
      value={{
        students,
        total,
        loading,
        error,
        fetchStudents,
        addStudent,
        updateStudent,
        deleteStudent,
        getStudent,
        refreshStudent,
        updateClassSession,
      }}
    >
      {children}
    </StudentContext.Provider>
  )
}

export function useStudents() {
  const context = useContext(StudentContext)
  if (!context) {
    throw new Error("useStudents must be used within a StudentProvider")
  }
  return context
}
