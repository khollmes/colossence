import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { to } = await req.json();

  if (!to || !to.includes("@")) {
    return NextResponse.json({ success: false, error: "Adresse email invalide." }, { status: 400 });
  }

  if (!process.env.EMAIL_SERVER_PASSWORD) {
    return NextResponse.json(
      {
        success: false,
        error: "Variable EMAIL_SERVER_PASSWORD non définie.",
        hint: "Vérifiez votre fichier .env ou les variables d'environnement Vercel.",
      },
      { status: 500 }
    );
  }

  const sentAt = new Date().toISOString();

  try {
    await sendEmail({
      to,
      subject: "✅ Test Colossence — email fonctionnel",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#1d4ed8;">Colossence — Test email</h2>
          <p>Si vous recevez ce message, l'envoi d'emails via <strong>Resend</strong> fonctionne correctement.</p>
          <table style="border-collapse:collapse;width:100%;margin-top:24px;font-size:14px;">
            <tr>
              <td style="padding:8px 12px;background:#f1f5f9;border-radius:4px 0 0 0;color:#64748b;width:40%;">Destinataire</td>
              <td style="padding:8px 12px;background:#f8fafc;">${to}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;background:#f1f5f9;color:#64748b;">Envoyé le</td>
              <td style="padding:8px 12px;background:#f8fafc;">${sentAt}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;background:#f1f5f9;border-radius:0 0 0 4px;color:#64748b;">Service</td>
              <td style="padding:8px 12px;background:#f8fafc;">Resend via colossence.com</td>
            </tr>
          </table>
          <p style="margin-top:32px;color:#94a3b8;font-size:12px;">
            Cet email a été envoyé depuis la page /test — à supprimer après vérification.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, sentAt, to });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        hint: "Vérifiez que RESEND_API_KEY est valide et que l'adresse expéditeur est vérifiée dans le dashboard Resend.",
      },
      { status: 500 }
    );
  }
}
