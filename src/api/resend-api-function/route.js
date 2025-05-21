async function handler({ to, from, subject, html, text }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from || "onboarding@resend.dev",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || undefined,
      text: text || undefined,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.message || "Failed to send email" };
  }

  return { id: data.id };
}
export async function POST(request) {
  return handler(await request.json());
}