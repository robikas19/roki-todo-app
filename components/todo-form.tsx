"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Clock, X, AlertTriangle, Flag, Zap } from "lucide-react"
import { format } from "date-fns"

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface TodoFormProps {
  categories: Category[]
  onClose: () => void
  onSuccess: () => void
  editTodo?: any
}

export function TodoForm({ categories, onClose, onSuccess, editTodo }: TodoFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(editTodo?.title || "")
  const [description, setDescription] = useState(editTodo?.description || "")
  const [priority, setPriority] = useState(editTodo?.priority || "medium")
  const [categoryId, setCategoryId] = useState(editTodo?.category_id || "")
  const [dueDate, setDueDate] = useState<Date | undefined>(editTodo?.due_date ? new Date(editTodo.due_date) : undefined)
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    editTodo?.reminder_date ? new Date(editTodo.reminder_date) : undefined,
  )
  const [reminderTime, setReminderTime] = useState("")

  const supabase = getSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const todoData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        category_id: categoryId || null,
        due_date: dueDate?.toISOString() || null,
        reminder_date: reminderDate?.toISOString() || null,
        user_id: user?.id,
        updated_at: new Date().toISOString(),
      }

      let result
      if (editTodo) {
        result = await supabase.from("todos").update(todoData).eq("id", editTodo.id).eq("user_id", user?.id)
      } else {
        result = await supabase.from("todos").insert([{ ...todoData, created_at: new Date().toISOString() }])
      }

      if (result.error) throw result.error

      // Create notification if reminder is set
      if (reminderDate && !editTodo) {
        await supabase.from("notifications").insert([
          {
            user_id: user?.id,
            title: `Reminder: ${title}`,
            message: description || "You have a task due soon!",
            type: "reminder",
            scheduled_for: reminderDate.toISOString(),
            created_at: new Date().toISOString(),
          },
        ])
      }

      // After the todo is created successfully, add this code:
      if (reminderDate && !editTodo) {
        // Schedule email notification
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "reminder",
              data: {
                taskTitle: title,
                dueDate: reminderDate.toISOString(),
                userName: user?.user_metadata?.full_name || user?.email,
                userEmail: user?.email,
                userId: user?.id,
                todoId: result.data?.[0]?.id,
              },
            }),
          })
        } catch (emailError) {
          console.error("Failed to schedule email notification:", emailError)
          // Don't fail the todo creation if email fails
        }
      }

      toast({
        title: editTodo ? "Task updated!" : "Task created!",
        description: editTodo
          ? "Your task has been updated successfully."
          : "Your new task has been added to your list.",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      case "medium":
        return <Flag className="w-4 h-4" />
      case "low":
        return <Zap className="w-4 h-4" />
      default:
        return <Flag className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-500/20"
      case "medium":
        return "text-yellow-400 bg-yellow-500/20"
      case "low":
        return "text-green-400 bg-green-500/20"
      default:
        return "text-yellow-400 bg-yellow-500/20"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-emerald-400">{editTodo ? "Edit Task" : "Create New Task"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">
                Task Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
              />
            </div>

            {/* Priority and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-slate-300">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="low">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span>Low Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center space-x-2">
                        <Flag className="w-4 h-4 text-yellow-400" />
                        <span>Medium Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>High Priority</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-slate-300">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label className="text-slate-300">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="bg-slate-700"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Reminder Date */}
            <div className="space-y-2">
              <Label className="text-slate-300">Reminder</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {reminderDate ? format(reminderDate, "PPP") : "Set reminder"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600">
                  <Calendar
                    mode="single"
                    selected={reminderDate}
                    onSelect={setReminderDate}
                    initialFocus
                    className="bg-slate-700"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Priority Display */}
            <div className="flex items-center space-x-2">
              <Badge className={getPriorityColor(priority)}>
                {getPriorityIcon(priority)}
                <span className="ml-1 capitalize">{priority} Priority</span>
              </Badge>
              {categoryId && (
                <Badge variant="outline" className="border-slate-600">
                  {categories.find((c) => c.id === categoryId)?.name}
                </Badge>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? "Saving..." : editTodo ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
