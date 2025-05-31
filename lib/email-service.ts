import { createServerClient } from "./supabase-server"

interface EmailNotification {
  to: string
  subject: string
  body: string
  todoId?: string
  sharedTodoId?: string
  userId: string
  scheduledFor?: Date
}

export async function scheduleEmailNotification(notification: EmailNotification) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("email_notifications").insert([
      {
        user_id: notification.userId,
        todo_id: notification.todoId || null,
        shared_todo_id: notification.sharedTodoId || null,
        email: notification.to,
        subject: notification.subject,
        body: notification.body,
        scheduled_for: notification.scheduledFor?.toISOString() || new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error scheduling email notification:", error)
    return { success: false, error }
  }
}

export async function sendEmailNotification(notificationId: string) {
  // In a real application, you would integrate with an email service like:
  // - Resend
  // - SendGrid
  // - AWS SES
  // - Nodemailer

  const supabase = createServerClient()

  try {
    // Mark as sent
    const { error } = await supabase
      .from("email_notifications")
      .update({
        sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq("id", notificationId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error sending email notification:", error)
    return { success: false, error }
  }
}

export function generateReminderEmail(taskTitle: string, dueDate: Date, userName: string) {
  const subject = `🔔 Reminder: ${taskTitle} is due soon`

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 10px; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin-bottom: 20px;">✨ Roki Reminder</h1>
        <h2 style="color: #ffffff; margin-bottom: 15px;">Hi ${userName}!</h2>
        <p style="color: #f0f0f0; font-size: 16px; margin-bottom: 20px;">
          Don't forget about your task:
        </p>
        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #ffffff; margin-bottom: 10px;">${taskTitle}</h3>
          <p style="color: #f0f0f0;">Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
        </div>
        <p style="color: #f0f0f0; margin-bottom: 30px;">
          Stay productive and keep up the great work! 🚀
        </p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
           style="background: linear-gradient(45deg, #ff006e, #8338ec); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
          Open Roki
        </a>
      </div>
    </div>
  `

  return { subject, body }
}

export function generateTeamInviteEmail(teamName: string, inviterName: string, inviteCode: string) {
  const subject = `🎉 You've been invited to join ${teamName} on Roki`

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 10px; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin-bottom: 20px;">✨ Team Invitation</h1>
        <h2 style="color: #ffffff; margin-bottom: 15px;">You're Invited!</h2>
        <p style="color: #f0f0f0; font-size: 16px; margin-bottom: 20px;">
          ${inviterName} has invited you to join the team:
        </p>
        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #ffffff; margin-bottom: 10px;">${teamName}</h3>
          <p style="color: #f0f0f0;">Invite Code: <strong>${inviteCode}</strong></p>
        </div>
        <p style="color: #f0f0f0; margin-bottom: 30px;">
          Join your team and start collaborating on Roki! 🚀
        </p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
           style="background: linear-gradient(45deg, #ff006e, #8338ec); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
          Join Team
        </a>
      </div>
    </div>
  `

  return { subject, body }
}
