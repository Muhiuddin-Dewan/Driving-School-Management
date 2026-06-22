"use client"

import { useState } from "react"
import { Check, BookOpen, Car, Wrench, GraduationCap, ChevronDown, ChevronUp, Calendar, FileText } from "lucide-react"
import type { Student, ClassSession, CourseClasses, ClassType } from "@/lib/types"
import { CLASS_STRUCTURE } from "@/lib/types"
import { useStudents } from "@/lib/student-context"

interface ClassTrackerProps {
  student: Student
}

const CLASS_TYPE_CONFIG: Record<ClassType, { label: string; icon: typeof Car; color: string; bgColor: string }> = {
  practical: {
    label: "Practical Driving",
    icon: Car,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  engine: {
    label: "Engine & Maintenance",
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  theory: {
    label: "Theory Classes",
    icon: GraduationCap,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
}

export function ClassTracker({ student }: ClassTrackerProps) {
  const { updateClassSession } = useStudents()
  const [expandedType, setExpandedType] = useState<ClassType | null>("practical")
  const [editingClass, setEditingClass] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")

  const structure = CLASS_STRUCTURE[student.drivingType]

  // Classes are always initialized server-side when a student is created.
  if (!student.classes) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Class Progress</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No classes initialized yet</p>
        </div>
      </div>
    )
  }

  const classes = student.classes

  const getCompletedCount = (sessions: ClassSession[]) =>
    sessions.filter((s) => s.completed).length

  const totalCompleted =
    getCompletedCount(classes.practical) +
    getCompletedCount(classes.engine) +
    getCompletedCount(classes.theory)

  const overallProgress = (totalCompleted / structure.total) * 100

  const handleToggleComplete = async (classType: keyof CourseClasses, session: ClassSession) => {
    const newCompleted = !session.completed
    await updateClassSession(student.id, classType, session.id, {
      completed: newCompleted,
      completedDate: newCompleted ? new Date().toISOString().split("T")[0] : undefined,
    })
  }

  const handleSaveNote = async (classType: keyof CourseClasses, sessionId: string) => {
    await updateClassSession(student.id, classType, sessionId, { note: noteText })
    setEditingClass(null)
    setNoteText("")
  }

  const startEditingNote = (session: ClassSession) => {
    setEditingClass(session.id)
    setNoteText(session.note || "")
  }

  const renderClassSection = (type: ClassType, sessions: ClassSession[]) => {
    const config = CLASS_TYPE_CONFIG[type]
    const Icon = config.icon
    const completed = getCompletedCount(sessions)
    const total = sessions.length
    const isExpanded = expandedType === type

    return (
      <div key={type} className="border-b border-border last:border-0">
        <button
          type="button"
          onClick={() => setExpandedType(isExpanded ? null : type)}
          className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{config.label}</p>
              <p className="text-sm text-muted-foreground">
                {completed} of {total} completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-24">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all ${
                    completed === total ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-border bg-muted/30 p-4">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    session.completed
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(type, session)}
                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                          session.completed
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-muted-foreground/30 hover:border-primary"
                        }`}
                      >
                        {session.completed && <Check className="h-4 w-4" />}
                      </button>
                      <div>
                        <p
                          className={`font-medium ${
                            session.completed ? "text-green-700 dark:text-green-400" : "text-foreground"
                          }`}
                        >
                          Class {session.classNumber}
                        </p>
                        {session.completedDate && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(session.completedDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startEditingNote(session)}
                      className={`rounded-lg p-2 text-sm hover:bg-muted transition-colors ${
                        session.note ? "text-primary" : "text-muted-foreground"
                      }`}
                      title={session.note ? "Edit note" : "Add note"}
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>

                  {editingClass === session.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="What was learned in this class..."
                        className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveNote(type, session.id)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Save Note
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClass(null)
                            setNoteText("")
                          }}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : session.note ? (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">{session.note}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Class Progress</h2>
          <span
            className={`text-2xl font-bold ${
              overallProgress >= 100 ? "text-green-600" : "text-primary"
            }`}
          >
            {Math.round(overallProgress)}%
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-medium text-foreground">
                {totalCompleted} / {structure.total} classes
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  overallProgress >= 100 ? "bg-green-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {getCompletedCount(classes.practical)}/{structure.practical}
              </p>
              <p className="text-xs text-muted-foreground">Practical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {getCompletedCount(classes.engine)}/{structure.engine}
              </p>
              <p className="text-xs text-muted-foreground">Engine</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {getCompletedCount(classes.theory)}/{structure.theory}
              </p>
              <p className="text-xs text-muted-foreground">Theory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Sections */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {renderClassSection("practical", classes.practical)}
        {renderClassSection("engine", classes.engine)}
        {renderClassSection("theory", classes.theory)}
      </div>
    </div>
  )
}
