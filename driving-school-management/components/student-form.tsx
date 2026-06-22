"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useStudents } from "@/lib/student-context"
import { photoUrl } from "@/lib/api"
import type { Student } from "@/lib/types"

interface StudentFormProps {
  studentId?: string
  mode: "create" | "edit"
}

export function StudentForm({ studentId, mode }: StudentFormProps) {
  const router = useRouter()
  const { addStudent, updateStudent, getStudent, refreshStudent } = useStudents()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    drivingType: "car" as "car" | "motorcycle" | "commercial",
    admissionDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "completed" | "dropped",
    courseFee: 1500,
    discount: 0,
    paidAmount: 0,
    emergencyContact: "",
    notes: "",
  })

  useEffect(() => {
    if (mode === "edit" && studentId) {
      void (async () => {
        let student: Student | undefined = getStudent(studentId)
        if (!student) {
          student = (await refreshStudent(studentId)) ?? undefined
        }
        if (student) {
          setFormData({
            name: student.name,
            email: student.email,
            phone: student.phone,
            dateOfBirth: student.dateOfBirth,
            address: student.address,
            drivingType: student.drivingType,
            admissionDate: student.admissionDate,
            status: student.status,
            courseFee: student.courseFee,
            discount: student.discount || 0,
            paidAmount: student.paidAmount,
            emergencyContact: student.emergencyContact,
            notes: student.notes || "",
          })
          if (student.photoUrl) {
            setImagePreview(photoUrl(student.photoUrl) ?? null)
          }
        }
      })()
    }
  }, [mode, studentId, getStudent, refreshStudent])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Only JPG and PNG images are allowed.")
      e.target.value = ""
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = new FormData()
      // Append all text fields
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, String(value))
      })
      // Append image if selected
      if (imageFile) {
        payload.append("photo", imageFile)
      }

      if (mode === "edit" && studentId) {
        await updateStudent(studentId, payload)
      } else {
        await addStudent(payload)
      }

      router.push("/students")
      router.refresh()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Personal Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="mb-1.5 block text-sm font-medium text-foreground">
              Date of Birth *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              required
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-foreground">
              Address *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter full address"
            />
          </div>
          <div>
            <label htmlFor="emergencyContact" className="mb-1.5 block text-sm font-medium text-foreground">
              Emergency Contact *
            </label>
            <input
              type="tel"
              id="emergencyContact"
              name="emergencyContact"
              required
              value={formData.emergencyContact}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter emergency contact"
            />
          </div>

          {/* Student Photo */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Student Photo (JPG / PNG)
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-16 w-16 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted text-muted-foreground text-xs text-center">
                  No photo
                </div>
              )}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {imageFile ? "Change Photo" : "Upload Photo"}
                </button>
                {imageFile && (
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {imageFile.name}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Information */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Course Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="drivingType" className="mb-1.5 block text-sm font-medium text-foreground">
              Driving Type *
            </label>
            <select
              id="drivingType"
              name="drivingType"
              required
              value={formData.drivingType}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label htmlFor="admissionDate" className="mb-1.5 block text-sm font-medium text-foreground">
              Admission Date *
            </label>
            <input
              type="date"
              id="admissionDate"
              name="admissionDate"
              required
              value={formData.admissionDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {mode === "edit" && (
            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-foreground">
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Payment Information */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Payment Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="courseFee" className="mb-1.5 block text-sm font-medium text-foreground">
              Course Fee (tk) *
            </label>
            <input
              type="number"
              id="courseFee"
              name="courseFee"
              required
              min="0"
              value={formData.courseFee}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="discount" className="mb-1.5 block text-sm font-medium text-foreground">
              Discount (tk)
            </label>
            <input
              type="number"
              id="discount"
              name="discount"
              min="0"
              max={formData.courseFee}
              value={formData.discount}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="paidAmount" className="mb-1.5 block text-sm font-medium text-foreground">
              Amount Paid (tk) *
            </label>
            <input
              type="number"
              id="paidAmount"
              name="paidAmount"
              required
              min="0"
              value={formData.paidAmount}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Net Payable
            </label>
            <div className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm font-medium text-foreground">
              {(formData.courseFee - formData.discount).toLocaleString()} tk
            </div>
          </div>
        </div>
        {formData.discount > 0 && (
          <p className="mt-3 text-sm text-green-600">
            Discount of {formData.discount.toLocaleString()} tk applied. Balance due:{" "}
            {Math.max(0, formData.courseFee - formData.discount - formData.paidAmount).toLocaleString()} tk
          </p>
        )}
      </div>

      {/* Additional Notes */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Additional Notes</h2>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Any additional notes about the student..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Add Student" : "Update Student"}
        </button>
      </div>
    </form>
  )
}
