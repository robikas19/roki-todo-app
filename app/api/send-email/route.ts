import { type NextRequest, NextResponse } from "next/server"
import { scheduleEmailNotification, generateReminderEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    switch (type) {
      case "reminder":
        const { taskTitle, dueDate, userName, userEmail, userId, todoId } = data
        const { subject, body } = generateReminderEmail(taskTitle, new Date(dueDate), userName)

        const result = await scheduleEmailNotification({
          to: userEmail,
          subject,
          body,
          todoId,
          userId,
          scheduledFor: new Date(dueDate),
        })

        return NextResponse.json(result)

      default:
        return NextResponse.json({ success: false, error: "Invalid email type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
