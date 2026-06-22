import { StudentForm } from "@/components/student-form"

export default function NewStudentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Student Admission</h1>
        <p className="text-muted-foreground">Fill in the details to register a new student.</p>
      </div>
      <StudentForm mode="create" />
    </div>
  )
}
