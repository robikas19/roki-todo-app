"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { X, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { format, isSameDay, isToday } from "date-fns"

interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: "low" | "medium" | "high"
  due_date: string | null
  reminder_date: string | null
  category_id: string | null
  created_at: string
  categories?: {
    name: string
    color: string
    icon: string
  }
}

interface CalendarViewProps {
  todos: Todo[]
  onClose: () => void
  onTodoUpdate: () => void
}

export function CalendarView({ todos, onClose, onTodoUpdate }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month")

  // Get todos for selected date
  const todosForSelectedDate = useMemo(() => {
    return todos.filter((todo) => {
      if (!todo.due_date) return false
      return isSameDay(new Date(todo.due_date), selectedDate)
    })
  }, [todos, selectedDate])

  // Get all dates with todos for the calendar
  const datesWithTodos = useMemo(() => {
    const dates = new Set<string>()
    todos.forEach((todo) => {
      if (todo.due_date) {
        dates.add(format(new Date(todo.due_date), "yyyy-MM-dd"))
      }
    })
    return dates
  }, [todos])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-emerald-400 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Calendar View
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                className={viewMode === "month" ? "bg-emerald-600" : "border-slate-600"}
              >
                Month
              </Button>
              <Button
                variant={viewMode === "agenda" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("agenda")}
                className={viewMode === "agenda" ? "bg-emerald-600" : "border-slate-600"}
              >
                Agenda
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(90vh-120px)]">
            {/* Calendar Section */}
            <div className="lg:col-span-2 p-6 border-r border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-200">{format(selectedDate, "MMMM yyyy")}</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(new Date())}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full"
                modifiers={{
                  hasTodos: (date) => datesWithTodos.has(format(date, "yyyy-MM-dd")),
                  today: (date) => isToday(date),
                }}
                modifiersStyles={{
                  hasTodos: {
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid rgba(16, 185, 129, 0.5)",
                  },
                  today: {
                    backgroundColor: "rgba(16, 185, 129, 0.3)",
                    fontWeight: "bold",
                  },
                }}
              />

              <div className="mt-6 flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                  <span>Has tasks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Tasks for Selected Date */}
            <div className="p-6 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-200">{format(selectedDate, "EEEE, MMMM d")}</h3>
                <p className="text-sm text-slate-400">
                  {todosForSelectedDate.length} task{todosForSelectedDate.length !== 1 ? "s" : ""} due
                </p>
              </div>

              <div className="space-y-3">
                {todosForSelectedDate.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No tasks due on this date</p>
                  </div>
                ) : (
                  todosForSelectedDate.map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-3 rounded-lg border transition-all ${
                        todo.completed
                          ? "bg-slate-700/30 border-slate-600/50 opacity-60"
                          : "bg-slate-700/50 border-slate-600"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-2 ${getPriorityColor(todo.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-medium ${
                              todo.completed ? "text-slate-400 line-through" : "text-slate-200"
                            }`}
                          >
                            {todo.title}
                          </h4>

                          {todo.description && (
                            <p className={`text-sm mt-1 ${todo.completed ? "text-slate-500" : "text-slate-400"}`}>
                              {todo.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-2 mt-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                todo.priority === "high"
                                  ? "border-red-500/50 text-red-400"
                                  : todo.priority === "medium"
                                    ? "border-yellow-500/50 text-yellow-400"
                                    : "border-green-500/50 text-green-400"
                              }`}
                            >
                              {todo.priority} priority
                            </Badge>

                            {todo.categories && (
                              <Badge
                                variant="outline"
                                className="text-xs border-slate-600"
                                style={{
                                  borderColor: todo.categories.color + "40",
                                  color: todo.categories.color,
                                }}
                              >
                                {todo.categories.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Upcoming Tasks */}
              <div className="mt-8">
                <h4 className="text-md font-semibold text-slate-300 mb-3">Upcoming Tasks</h4>
                <div className="space-y-2">
                  {todos
                    .filter((todo) => {
                      if (!todo.due_date || todo.completed) return false
                      const dueDate = new Date(todo.due_date)
                      return dueDate > selectedDate
                    })
                    .slice(0, 5)
                    .map((todo) => (
                      <div key={todo.id} className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(todo.priority)}`} />
                          <span className="text-sm text-slate-300 truncate">{todo.title}</span>
                        </div>
                        <span className="text-xs text-slate-400">{format(new Date(todo.due_date!), "MMM d")}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
