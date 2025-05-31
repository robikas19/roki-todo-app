"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TodoForm } from "@/components/todo-form"
import { TodoList } from "@/components/todo-list"
import { CategoryManager } from "@/components/category-manager"
import { NotificationCenter } from "@/components/notification-center"
import { CalendarView } from "@/components/calendar-view"
import { TeamManager } from "@/components/team-manager"
import {
  Plus,
  Calendar,
  Bell,
  Settings,
  LogOut,
  Users,
  Target,
  Clock,
  AlertTriangle,
  Sparkles,
  Menu,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export default function Dashboard() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showTodoForm, setShowTodoForm] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showTeams, setShowTeams] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [loadingTodos, setLoadingTodos] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTodos()
      fetchCategories()
    }
  }, [user])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from("todos")
        .select(`
          *,
          categories (
            name,
            color,
            icon
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error: any) {
      toast({
        title: "Error fetching todos",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingTodos(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").eq("user_id", user?.id)

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const completedTodos = todos.filter((todo) => todo.completed).length
  const totalTodos = todos.length
  const progressPercentage = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0
  const tasksLeft = totalTodos - completedTodos

  const todayTodos = todos.filter((todo) => {
    if (!todo.due_date) return false
    const today = new Date().toDateString()
    const todoDate = new Date(todo.due_date).toDateString()
    return today === todoDate
  })

  const overdueTodos = todos.filter((todo) => {
    if (!todo.due_date || todo.completed) return false
    return new Date(todo.due_date) < new Date()
  })

  const highPriorityTodos = todos.filter((todo) => todo.priority === "high" && !todo.completed)

  if (loading || !user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 fluid-bg"></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 btn-gradient-purple rounded-full flex items-center justify-center mx-auto mb-4 fluid-pulse">
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-white text-lg">Loading your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fluid Background with darker overlay */}
      <div className="absolute inset-0 fluid-bg"></div>

      {/* Header */}
      <header className="relative z-10 glass-fluid-dark border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 btn-gradient-purple rounded-xl flex items-center justify-center fluid-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-gradient-purple">Roki</h1>
              <p className="text-sm text-gray-200">Welcome back, {user.user_metadata?.full_name || user.email}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Calendar className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTeams(!showTeams)}
              className="text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCategories(!showCategories)}
              className="text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Settings className="w-5 h-5" />
            </Button>
            {/* GitHub Star Button */}
            <a
              href="https://github.com/robikas19"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg glass-fluid border-0 text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-sm font-medium">⭐ Star on GitHub</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-gray-200 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-gray-200 hover:text-white hover:bg-white/10"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden glass-fluid-dark border-t border-white/10">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNotifications(true)
                  setShowMobileMenu(false)
                }}
                className="w-full justify-start text-gray-200 hover:text-white hover:bg-white/10"
              >
                <Bell className="w-5 h-5 mr-3" />
                Notifications
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCalendar(true)
                  setShowMobileMenu(false)
                }}
                className="w-full justify-start text-gray-200 hover:text-white hover:bg-white/10"
              >
                <Calendar className="w-5 h-5 mr-3" />
                Calendar
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowTeams(true)
                  setShowMobileMenu(false)
                }}
                className="w-full justify-start text-gray-200 hover:text-white hover:bg-white/10"
              >
                <Users className="w-5 h-5 mr-3" />
                Teams
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCategories(true)
                  setShowMobileMenu(false)
                }}
                className="w-full justify-start text-gray-200 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-5 h-5 mr-3" />
                Categories
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-gray-200 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
              <a
                href="https://github.com/robikas19"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-start px-4 py-2 text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                ⭐ Star on GitHub
              </a>
            </div>
          </div>
        )}
      </header>

      <div className="relative z-10 container mx-auto px-4 py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-fluid-dark border-0 card-fluid fluid-float">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 btn-gradient-purple rounded-xl flex items-center justify-center mx-auto mb-3 fluid-pulse">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gradient-purple">{tasksLeft}</div>
                  <div className="text-sm text-gray-300">Tasks Left</div>
                </CardContent>
              </Card>

              <Card className="glass-fluid-dark border-0 card-fluid fluid-float" style={{ animationDelay: "0.5s" }}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 btn-gradient-blue rounded-xl flex items-center justify-center mx-auto mb-3 fluid-pulse">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gradient-blue">{todayTodos.length}</div>
                  <div className="text-sm text-gray-300">Due Today</div>
                </CardContent>
              </Card>

              <Card className="glass-fluid-dark border-0 card-fluid fluid-float" style={{ animationDelay: "1s" }}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 btn-gradient-orange rounded-xl flex items-center justify-center mx-auto mb-3 fluid-pulse">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gradient-orange">{overdueTodos.length}</div>
                  <div className="text-sm text-gray-300">Overdue</div>
                </CardContent>
              </Card>

              <Card className="glass-fluid-dark border-0 card-fluid fluid-float" style={{ animationDelay: "1.5s" }}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 btn-gradient-yellow rounded-xl flex items-center justify-center mx-auto mb-3 fluid-pulse">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gradient-yellow">{highPriorityTodos.length}</div>
                  <div className="text-sm text-gray-300">High Priority</div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Card */}
            <Card className="glass-fluid-dark border-0 card-fluid">
              <CardHeader>
                <CardTitle className="text-gradient-teal flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200">Completed Tasks</span>
                    <span className="text-gradient-teal font-bold">
                      {completedTodos}/{totalTodos}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={progressPercentage} className="h-3 bg-gray-700" />
                    <div
                      className="absolute top-0 left-0 h-3 btn-gradient-teal rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-300">{progressPercentage.toFixed(0)}% of your tasks completed</div>
                </div>
              </CardContent>
            </Card>

            {/* Todo List */}
            <Card className="glass-fluid-dark border-0 card-fluid">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gradient-purple">Your Tasks</CardTitle>
                <Button
                  onClick={() => setShowTodoForm(true)}
                  className="btn-gradient-purple transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent>
                <TodoList todos={todos} categories={categories} onTodoUpdate={fetchTodos} loading={loadingTodos} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="glass-fluid-dark border-0 card-fluid">
              <CardHeader>
                <CardTitle className="text-gradient-cyan">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setShowTodoForm(true)}
                  className="w-full btn-gradient-purple transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
                <Button
                  onClick={() => setShowCalendar(true)}
                  className="w-full glass-fluid border-0 text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Calendar
                </Button>
                <Button
                  onClick={() => setShowTeams(true)}
                  className="w-full glass-fluid border-0 text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Teams
                </Button>
                <Button
                  onClick={() => setShowCategories(true)}
                  className="w-full glass-fluid border-0 text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Categories
                </Button>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="glass-fluid-dark border-0 card-fluid">
              <CardHeader>
                <CardTitle className="text-gradient-blue-purple">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const categoryTodos = todos.filter((todo) => todo.category_id === category.id)
                    const completedInCategory = categoryTodos.filter((todo) => todo.completed).length

                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 rounded-lg glass-fluid hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full fluid-pulse"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-gray-200 text-sm font-medium">{category.name}</span>
                        </div>
                        <Badge className="glass-fluid border-0 text-xs text-gray-200">
                          {completedInCategory}/{categoryTodos.length}
                        </Badge>
                      </div>
                    )
                  })}
                  {categories.length === 0 && (
                    <p className="text-gray-300 text-sm text-center py-4">
                      No categories yet. Create one to organize your tasks!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTodoForm && (
        <TodoForm
          categories={categories}
          onClose={() => setShowTodoForm(false)}
          onSuccess={() => {
            setShowTodoForm(false)
            fetchTodos()
          }}
        />
      )}

      {showCalendar && <CalendarView todos={todos} onClose={() => setShowCalendar(false)} onTodoUpdate={fetchTodos} />}

      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}

      {showCategories && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategories(false)}
          onSuccess={() => {
            setShowCategories(false)
            fetchCategories()
          }}
        />
      )}

      {showTeams && (
        <TeamManager
          onClose={() => setShowTeams(false)}
          onSuccess={() => {
            setShowTeams(false)
            fetchTodos()
          }}
        />
      )}
    </div>
  )
}
