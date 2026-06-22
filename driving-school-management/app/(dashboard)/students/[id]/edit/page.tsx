"use client"

import { use } from "react"
import { StudentForm } from "@/components/student-form"

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Student</h1>
        <p className="text-muted-foreground">Update student information below.</p>
      </div>
      <StudentForm mode="edit" studentId={id} />
    </div>
  )
}
