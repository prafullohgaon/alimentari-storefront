import { NextResponse } from "next/server";

// In-memory rate limiting store (max 5 requests per IP every 10 mins)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= 5) {
    return false;
  }

  record.count += 1;
  return true;
}

// HTML Escaping Helper to prevent XSS / HTML Injection in email templates
function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Troppe richieste. Riprova tra qualche minuto." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      nome,
      cognome,
      email,
      telefono,
      oggetto,
      messaggio,
      privacyConsent,
      website, // Honeypot field
    } = body;

    // Honeypot check for spam bots
    if (website && typeof website === "string" && website.trim().length > 0) {
      console.warn("[CONTACT API] Spam detected via honeypot field.");
      return NextResponse.json({ success: true, message: "Richiesta ricevuta." });
    }

    // Server-Side Validation
    const errors: Record<string, string> = {};

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      errors.nome = "Il nome è obbligatorio.";
    }
    if (!cognome || typeof cognome !== "string" || !cognome.trim()) {
      errors.cognome = "Il cognome è obbligatorio.";
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      errors.email = "L'email è obbligatoria.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = "Inserisci un indirizzo email valido.";
      }
    }
    if (!oggetto || typeof oggetto !== "string" || !oggetto.trim()) {
      errors.oggetto = "L'oggetto è obbligatorio.";
    }
    if (!messaggio || typeof messaggio !== "string" || !messaggio.trim()) {
      errors.messaggio = "Il messaggio è obbligatorio.";
    }
    if (privacyConsent !== true && privacyConsent !== "true") {
      errors.privacyConsent = "È necessario accettare la Privacy Policy.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Campi non validi.", details: errors },
        { status: 400 }
      );
    }

    // Check Resend environment configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!resendApiKey || !recipientEmail || !fromEmail) {
      console.error(
        "[CONTACT API] Resend configuration missing. Required: RESEND_API_KEY, CONTACT_RECIPIENT_EMAIL, CONTACT_FROM_EMAIL."
      );
      return NextResponse.json(
        { error: "Il servizio di invio email non è al momento configurato." },
        { status: 500 }
      );
    }

    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleString("it-IT", {
      timeZone: "Europe/Rome",
      dateStyle: "full",
      timeStyle: "medium",
    });

    // Escape all user-provided strings safely
    const safeNome = escapeHtml(nome.trim());
    const safeCognome = escapeHtml(cognome.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeTelefono = telefono ? escapeHtml(telefono.trim()) : "Non fornito";
    const safeOggetto = escapeHtml(oggetto.trim());
    const safeMessaggio = escapeHtml(messaggio.trim());

    // 1. Send Business Notification Email
    const businessEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipientEmail,
        reply_to: safeEmail,
        subject: `Nuova richiesta di contatto — ${safeOggetto}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FAF7F2; color: #1C3B2B; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #EFECE6; }
                .header { border-b: 2px solid #1C3B2B; padding-bottom: 15px; margin-bottom: 20px; }
                .header h2 { margin: 0; color: #1C3B2B; font-size: 20px; }
                .field { margin-bottom: 12px; font-size: 14px; }
                .label { font-weight: bold; color: #1C3B2B; display: inline-block; width: 100px; }
                .message-box { background: #FAF7F2; padding: 15px; border-radius: 8px; font-size: 14px; border: 1px solid #EFECE6; white-space: pre-wrap; margin-top: 15px; }
                .footer { margin-top: 25px; pt: 15px; border-t: 1px solid #EFECE6; font-size: 12px; color: #888888; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Alimentari — Nuova Richiesta di Contatto</h2>
                </div>
                <div class="field"><span class="label">Data & Ora:</span> ${formattedDate}</div>
                <div class="field"><span class="label">Nome:</span> ${safeNome} ${safeCognome}</div>
                <div class="field"><span class="label">Email:</span> ${safeEmail}</div>
                <div class="field"><span class="label">Telefono:</span> ${safeTelefono}</div>
                <div class="field"><span class="label">Oggetto:</span> ${safeOggetto}</div>
                <div class="field"><span class="label">Messaggio:</span></div>
                <div class="message-box">${safeMessaggio.replace(/\n/g, "<br>")}</div>
                <div class="footer">
                  Consenso Privacy: Accettato in data ${formattedDate}<br>
                  ID Richiesta: ${timestamp}
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!businessEmailRes.ok) {
      const errText = await businessEmailRes.text();
      console.error("[CONTACT API] Business email dispatch failed:", errText);
      return NextResponse.json(
        { error: "Impossibile inviare l'email di contatto. Riprova più tardi." },
        { status: 500 }
      );
    }

    const businessData = await businessEmailRes.json().catch(() => ({}));
    const resendEmailId = businessData?.id || "";
    console.log(`[CONTACT API] Business notification email delivered to ${recipientEmail} (ID: ${resendEmailId})`);

    // 2. Send Customer Confirmation Email (Auto-Reply)
    try {
      const confirmationRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: safeEmail,
          subject: "Abbiamo ricevuto la tua richiesta — Alimentari",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FAF7F2; color: #1C3B2B; padding: 20px; }
                  .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #EFECE6; }
                  .header { border-b: 2px solid #1C3B2B; padding-bottom: 15px; margin-bottom: 20px; }
                  .header h2 { margin: 0; color: #1C3B2B; font-size: 20px; }
                  .message-box { background: #FAF7F2; padding: 15px; border-radius: 8px; font-size: 14px; border: 1px solid #EFECE6; white-space: pre-wrap; margin-top: 15px; }
                  .footer { margin-top: 25px; border-top: 1px solid #EFECE6; padding-top: 15px; font-size: 12px; color: #666666; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>Alimentari Gourmet Market</h2>
                  </div>
                  <p>Ciao <strong>${safeNome}</strong>,</p>
                  <p>grazie per aver contattato Alimentari.</p>
                  <p>Abbiamo ricevuto la tua richiesta e il nostro team la esaminerà il prima possibile.</p>
                  <p><strong>Oggetto:</strong> ${safeOggetto}</p>
                  <div class="message-box"><strong>Messaggio inviato:</strong><br>${safeMessaggio.replace(/\n/g, "<br>")}</div>
                  <p style="margin-top: 20px;">Ti risponderemo a questo indirizzo email.</p>
                  <div class="footer">
                    Grazie,<br>
                    <strong>Alimentari Gourmet Market</strong><br>
                    <small>Via Montenapoleone 8, 20121 Milano (MI)</small>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      });

      if (confirmationRes.ok) {
        console.log(`[CONTACT API] Customer confirmation email sent to ${safeEmail}`);
      } else {
        console.warn("[CONTACT API] Customer confirmation email response error:", await confirmationRes.text());
      }
    } catch (confError) {
      console.error("[CONTACT API] Customer confirmation email dispatch failed:", confError);
      // Do NOT fail the main request if confirmation email fails after business email succeeded
    }

    return NextResponse.json({
      success: true,
      message: "Abbiamo ricevuto la tua richiesta. Ti risponderemo al più presto.",
      timestamp,
      emailId: resendEmailId,
    });
  } catch (err) {
    console.error("[CONTACT API] Internal Server Error:", err);
    return NextResponse.json(
      { error: "Si è verificato un errore interno. Riprova più tardi." },
      { status: 500 }
    );
  }
}
