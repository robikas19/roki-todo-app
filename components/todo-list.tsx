"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { TodoForm } from "./todo-form"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Edit, Trash2, AlertTriangle, Flag, Zap, MoreHorizontal } from "lucide-react"
import { format, isToday, isPast, isTomorrow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface TodoListProps {
  todos: Todo[]
  categories: Category[]
  onTodoUpdate: () => void
  loading: boolean
}

export function TodoList({ todos, categories, onTodoUpdate, loading }: TodoListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const supabase = getSupabaseClient()

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("todos")
        .update({
          completed: !completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", todoId)
        .eq("user_id", user?.id)

      if (error) throw error

      toast({
        title: completed ? "Task marked as incomplete" : "Task completed!",
        description: completed ? "Task moved back to your active list." : "Great job! Keep up the momentum.",
      })

      onTodoUpdate()
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const deleteTodo = async (todoId: string) => {
    try {
      const { error } = await supabase.from("todos").delete().eq("id", todoId).eq("user_id", user?.id)

      if (error) throw error

      toast({
        title: "Task deleted",
        description: "The task has been removed from your list.",
      })

      onTodoUpdate()
    } catch (error: any) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "medium":
        return <Flag className="w-4 h-4 text-yellow-400" />
      case "low":
        return <Zap className="w-4 h-4 text-green-400" />
      default:
        return <Flag className="w-4 h-4 text-yellow-400" />
    }
  }

  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null

    const date = new Date(dueDate)
    const now = new Date()

    if (isToday(date)) {
      return { text: "Today", color: "text-blue-400 bg-blue-500/20" }
    } else if (isTomorrow(date)) {
      return { text: "Tomorrow", color: "text-green-400 bg-green-500/20" }
    } else if (isPast(date)) {
      return { text: "Overdue", color: "text-red-400 bg-red-500/20" }
    } else {
      return { text: format(date, "MMM d"), color: "text-slate-400 bg-slate-500/20" }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 glass rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2 holographic-text">No tasks yet</h3>
        <p className="text-gray-300 mb-4">Create your first task to get started with Roki!</p>
      </div>
    )
  }

  // Sort todos: incomplete first, then by priority, then by due date
  const sortedTodos = [...todos].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2

    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }

    // Sort by due date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (a.due_date) return -1
    if (b.due_date) return 1

    return 0
  })

  return (
    <>
      <div className="space-y-3">
        {sortedTodos.map((todo) => {
          const dueDateInfo = getDueDateDisplay(todo.due_date)

          return (
            <div
              key={todo.id}
              className={`p-4 rounded-lg border-0 transition-all duration-300 hover:scale-105 glow-effect ${
                todo.completed ? "glass opacity-60" : "glass-dark hover:bg-white/10"
              }`}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                  className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${todo.completed ? "text-gray-400 line-through" : "text-white"}`}>
                        {todo.title}
                      </h3>

                      {todo.description && (
                        <p className={`text-sm mt-1 ${todo.completed ? "text-gray-500" : "text-gray-300"}`}>
                          {todo.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-2 mt-2">
                        {/* Priority */}
                        <div className="flex items-center space-x-1">
                          {todo.priority === "high" && <AlertTriangle className="w-4 h-4 text-red-400 glow-effect" />}
                          {todo.priority === "medium" && <Flag className="w-4 h-4 text-yellow-400 glow-effect" />}
                          {todo.priority === "low" && <Zap className="w-4 h-4 text-green-400 glow-effect" />}
                        </div>

                        {/* Category */}
                        {todo.categories && (
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-600 text-gray-300"
                            style={{
                              borderColor: todo.categories.color + "40",
                              color: todo.categories.color,
                            }}
                          >
                            {todo.categories.name}
                          </Badge>
                        )}

                        {/* Due Date */}
                        {dueDateInfo && (
                          <Badge className={`text-xs ${dueDateInfo.color} text-gray-300`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {dueDateInfo.text}
                          </Badge>
                        )}

                        {/* Reminder */}
                        {todo.reminder_date && (
                          <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                            <Clock className="w-3 h-3 mr-1" />
                            Reminder
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="glass-dark border-slate-600">
                        <DropdownMenuItem
                          onClick={() => setEditingTodo(todo)}
                          className="text-gray-300 hover:bg-slate-600"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteTodo(todo.id)}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editingTodo && (
        <TodoForm
          categories={categories}
          editTodo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSuccess={() => {
            setEditingTodo(null)
            onTodoUpdate()
          }}
        />
      )}
    </>
  )
}
