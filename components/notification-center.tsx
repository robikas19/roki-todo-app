"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { X, Bell, Check, Trash2, Clock, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  scheduled_for: string | null
  sent_at: string | null
  created_at: string
  todo_id: string | null
}

interface NotificationCenterProps {
  onClose: () => void
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error: any) {
      toast({
        title: "Error fetching notifications",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user?.id)

      if (error) throw error

      setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
    } catch (error: any) {
      toast({
        title: "Error updating notification",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user?.id)
        .eq("read", false)

      if (error) throw error

      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))

      toast({
        title: "All notifications marked as read",
        description: "Your notification center has been cleared.",
      })
    } catch (error: any) {
      toast({
        title: "Error updating notifications",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", user?.id)

      if (error) throw error

      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
    } catch (error: any) {
      toast({
        title: "Error deleting notification",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.read
    if (filter === "read") return notif.read
    return true
  })

  const unreadCount = notifications.filter((notif) => !notif.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="w-4 h-4 text-blue-400" />
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Bell className="w-4 h-4 text-emerald-400" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-emerald-400 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
            {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} new</Badge>}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Filter Tabs */}
          <div className="flex border-b border-slate-700">
            {[
              { key: "all", label: "All", count: notifications.length },
              { key: "unread", label: "Unread", count: unreadCount },
              { key: "read", label: "Read", count: notifications.length - unreadCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "text-emerald-400 border-b-2 border-emerald-400 bg-slate-700/30"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/20"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="text-slate-400 mt-2">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  {filter === "unread"
                    ? "No unread notifications"
                    : filter === "read"
                      ? "No read notifications"
                      : "No notifications yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-700/30 transition-colors ${
                      !notification.read ? "bg-slate-700/20" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium ${notification.read ? "text-slate-300" : "text-slate-200"}`}>
                              {notification.title}
                            </h4>

                            {notification.message && (
                              <p className={`text-sm mt-1 ${notification.read ? "text-slate-500" : "text-slate-400"}`}>
                                {notification.message}
                              </p>
                            )}

                            <div className="flex items-center space-x-3 mt-2">
                              <span className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>

                              {notification.scheduled_for && (
                                <Badge variant="outline" className="text-xs border-slate-600">
                                  Scheduled
                                </Badge>
                              )}

                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${
                                  notification.type === "reminder"
                                    ? "border-blue-500/50 text-blue-400"
                                    : notification.type === "overdue"
                                      ? "border-red-500/50 text-red-400"
                                      : "border-slate-600"
                                }`}
                              >
                                {notification.type}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 ml-3">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 w-8 text-slate-400 hover:text-emerald-400"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 w-8 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
