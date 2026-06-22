"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, Edit, Trash2, Eye, MoreHorizontal, BookOpen, AlertCircle } from "lucide-react"
import { useStudents } from "@/lib/student-context"
import { CLASS_STRUCTURE } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function StudentsPage() {
  const { students, loading, error, deleteStudent, fetchStudents } = useStudents()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [licenseFilter, setLicenseFilter] = useState<string>("all")
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Refetch from backend when filters change (debounced search).
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchStudents({
        search: searchQuery || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        drivingType: licenseFilter === "all" ? undefined : licenseFilter,
        page_size: 500,
      })
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery, statusFilter, licenseFilter, fetchStudents])

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      await deleteStudent(id)
      setShowDeleteModal(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete student")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">Manage all student records</p>
        </div>
        <Link
          href="/students/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Student
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Licenses</option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No students found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Student</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">License</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Classes</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Payment</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => {
                  const structure = CLASS_STRUCTURE[student.drivingType]
                  const completed = student.classes
                    ? student.classes.practical.filter((c) => c.completed).length +
                      student.classes.engine.filter((c) => c.completed).length +
                      student.classes.theory.filter((c) => c.completed).length
                    : 0
                  const progress = (completed / structure.total) * 100
                  const netPayable = student.courseFee - (student.discount || 0)
                  const paymentProgress = netPayable > 0 ? (student.paidAmount / netPayable) * 100 : 100

                  return (
                    <tr key={student.id} className="group">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Admitted: {new Date(student.admissionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-foreground">{student.email}</p>
                          <p className="text-sm text-muted-foreground">{student.phone}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="capitalize text-foreground">{student.drivingType}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {completed}/{structure.total}
                            </p>
                            <div className="mt-0.5 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full transition-all ${
                                  progress >= 75 ? "bg-green-500" : progress >= 50 ? "bg-blue-500" : "bg-orange-500"
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {student.paidAmount.toLocaleString()} / {netPayable.toLocaleString()} tk
                          </p>
                          {(student.discount || 0) > 0 && (
                            <p className="text-xs text-green-600">-{student.discount} tk discount</p>
                          )}
                          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(paymentProgress, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            student.status === "active"
                              ? "bg-green-500/10 text-green-600"
                              : student.status === "completed"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-red-500/10 text-red-600"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Actions for ${student.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                onClick={() => router.push(`/students/${student.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/students/${student.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setShowDeleteModal(student.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Delete Student</h3>
            <p className="mt-2 text-muted-foreground">
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={deleting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleting}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
