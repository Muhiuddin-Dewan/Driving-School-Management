"use client"

import { useEffect, useState } from "react"
import { Users, UserCheck, UserX, GraduationCap, Car, Bike, Truck, DollarSign, AlertCircle } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { getDashboardStats, type DashboardStats } from "@/lib/api"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getDashboardStats()
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Failed to load dashboard</h2>
        <p className="mt-2 text-muted-foreground">{error ?? "Unknown error"}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  const totalStudents = stats.total_students
  const activeStudents = stats.active_students
  const completedStudents = stats.completed_students
  const droppedStudents = stats.dropped_students

  const carLicense = stats.license_distribution.find((l) => l.license_type === "car")?.count ?? 0
  const bikeLicense = stats.license_distribution.find((l) => l.license_type === "motorcycle")?.count ?? 0
  const commercialLicense = stats.license_distribution.find((l) => l.license_type === "commercial")?.count ?? 0

  const totalRevenue = Number(stats.financial_overview.total_revenue)
  const pendingPayments = Number(stats.financial_overview.pending_payments)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your driving school.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          description="All time enrollments"
        />
        <StatCard
          title="Active Students"
          value={activeStudents}
          icon={UserCheck}
          description="Currently training"
        />
        <StatCard
          title="Completed"
          value={completedStudents}
          icon={GraduationCap}
          description="Successfully graduated"
        />
        <StatCard
          title="Dropped"
          value={droppedStudents}
          icon={UserX}
          description="Discontinued training"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">License Types</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Car className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Car License</p>
                  <p className="text-sm text-muted-foreground">{carLicense} students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {totalStudents > 0 ? Math.round((carLicense / totalStudents) * 100) : 0}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Bike className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Motorcycle License</p>
                  <p className="text-sm text-muted-foreground">{bikeLicense} students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {totalStudents > 0 ? Math.round((bikeLicense / totalStudents) * 100) : 0}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Truck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Commercial License</p>
                  <p className="text-sm text-muted-foreground">{commercialLicense} students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {totalStudents > 0 ? Math.round((commercialLicense / totalStudents) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Financial Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-green-500/10 p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold text-foreground">{totalRevenue.toLocaleString()} tk</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-orange-500/10 p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-xl font-bold text-foreground">{pendingPayments.toLocaleString()} tk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Admissions</h2>
          <Link
            href="/students"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">License Type</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Admission Date</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recent_admissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    No recent admissions yet.
                  </td>
                </tr>
              ) : (
                stats.recent_admissions.map((student) => (
                  <tr key={student.id}>
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="capitalize text-foreground">{student.license_type}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(student.admission_date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
