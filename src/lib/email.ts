/**
 * Email notification utility using Resend API.
 * Requires RESEND_API_KEY environment variable.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "notifications@nitay.ai";
const NOTIFY_EMAIL = "nitayb@gmail.com";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email notification");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend API error:", res.status, body);
    }
  } catch (err) {
    console.error("[email] Failed to send email:", err);
  }
}

export async function notifyPostApproved(params: {
  postId: string;
  postTitle: string | null;
  postContent: string;
  approverName: string;
  orgName: string;
}): Promise<void> {
  const title = params.postTitle || params.postContent.slice(0, 60) + "...";
  const postUrl = `https://municipal-social-calendar.vercel.app/posts/${params.postId}`;

  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `✅ פוסט אושר: ${title}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 20px;">✅ פוסט אושר</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 12px;"><strong>ארגון:</strong> ${params.orgName}</p>
          <p style="margin: 0 0 12px;"><strong>כותרת:</strong> ${title}</p>
          <p style="margin: 0 0 12px;"><strong>אושר על ידי:</strong> ${params.approverName}</p>
          <a href="${postUrl}" style="display: inline-block; margin-top: 8px; background: #2563eb; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">
            צפה בפוסט
          </a>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: 12px; text-align: center;">
          מערכת שיווק | by nitay.ai
        </p>
      </div>
    `,
  });
}

export async function notifyNewTask(params: {
  taskId: string;
  taskTitle: string;
  creatorName: string;
  orgName: string;
  notes?: string | null;
}): Promise<void> {
  const taskUrl = `https://municipal-social-calendar.vercel.app/open-tasks`;

  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `💡 רעיון/משימה חדש: ${params.taskTitle}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #7c3aed; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 20px;">💡 רעיון/משימה חדש</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 12px;"><strong>ארגון:</strong> ${params.orgName}</p>
          <p style="margin: 0 0 12px;"><strong>כותרת:</strong> ${params.taskTitle}</p>
          <p style="margin: 0 0 12px;"><strong>נוצר על ידי:</strong> ${params.creatorName}</p>
          ${params.notes ? `<p style="margin: 0 0 12px;"><strong>פירוט:</strong> ${params.notes}</p>` : ""}
          <a href="${taskUrl}" style="display: inline-block; margin-top: 8px; background: #7c3aed; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">
            צפה ברעיונות ומשימות
          </a>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: 12px; text-align: center;">
          מערכת שיווק | by nitay.ai
        </p>
      </div>
    `,
  });
}
