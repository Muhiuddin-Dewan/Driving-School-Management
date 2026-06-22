"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, CreditCard, User, AlertCircle } from "lucide-react"
import { useStudents } from "@/lib/student-context"
import { ClassTracker } from "@/components/class-tracker"
import { photoUrl } from "@/lib/api"
import type { Student } from "@/lib/types"

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { getStudent, refreshStudent } = useStudents()
  const router = useRouter()
  const [student, setStudent] = useState<Student | undefined>(getStudent(id))
  const [loading, setLoading] = useState(!student)

  useEffect(() => {
    if (!student) {
      void (async () => {
        const fresh = await refreshStudent(id)
        if (fresh) setStudent(fresh)
        setLoading(false)
      })()
    }
  }, [id, student, refreshStudent])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Student Not Found</h2>
        <p className="mt-2 text-muted-foreground">The student you&apos;re looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push("/students")}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to Students
        </button>
      </div>
    )
  }

  const netPayable = student.courseFee - (student.discount || 0)
  const paymentProgress = netPayable > 0 ? (student.paidAmount / netPayable) * 100 : 100
  const remainingBalance = Math.max(0, netPayable - student.paidAmount)
  const avatar = photoUrl(student.photoUrl)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt={student.name}
                className="h-12 w-12 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
              <p className="text-muted-foreground">Student Profile</p>
            </div>
          </div>
        </div>
        <Link
          href={`/students/${student.id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Edit className="h-4 w-4" />
          Edit Student
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{student.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{student.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{student.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium text-foreground">
                    {new Date(student.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium text-foreground">{student.emergencyContact}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Course Details</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">License Type</p>
                <p className="mt-1 text-lg font-semibold capitalize text-foreground">{student.drivingType}</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Admission Date</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {new Date(student.admissionDate).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                    student.status === "active"
                      ? "bg-green-500/10 text-green-600"
                      : student.status === "completed"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {student.status}
                </span>
              </div>
            </div>
          </div>

          {student.notes && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Notes</h2>
              <p className="text-muted-foreground">{student.notes}</p>
            </div>
          )}

          {/* Class Tracker Section */}
          <ClassTracker student={student} />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="text-lg font-semibold text-foreground">
                  {paymentProgress >= 100 ? "Paid in Full" : "Partial Payment"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{Math.round(paymentProgress)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course Fee</span>
                  <span className="font-medium text-foreground">{student.courseFee.toLocaleString()} tk</span>
                </div>
                {(student.discount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">-{student.discount.toLocaleString()} tk</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Payable</span>
                  <span className="font-medium text-foreground">{netPayable.toLocaleString()} tk</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-green-600">{student.paidAmount.toLocaleString()} tk</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Balance Due</span>
                    <span className={`font-bold ${remainingBalance > 0 ? "text-orange-500" : "text-green-600"}`}>
                      {remainingBalance.toLocaleString()} tk
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
