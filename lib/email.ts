import nodemailer from "nodemailer";

// Transporter SMTP configuré via les variables d'environnement existantes.
// Resend accepte les connexions SMTP sur smtp.resend.com:587 avec "resend" comme user
// et la clé API comme mot de passe — pas besoin du SDK Resend.
// Strip surrounding quotes that some .env parsers leave in place
// e.g. EMAIL_SERVER_HOST="smtp.resend.com" → "smtp.resend.com" → smtp.resend.com
function stripQuotes(value: string | undefined): string {
  return (value ?? "").replace(/^["']|["']$/g, "");
}

const transporter = nodemailer.createTransport({
  host: stripQuotes(process.env.EMAIL_SERVER_HOST),
  port: Number(stripQuotes(process.env.EMAIL_SERVER_PORT)),
  secure: false,   // port 587 = STARTTLS, not SSL from the start (that's 465)
  requireTLS: true,
  auth: {
    user: stripQuotes(process.env.EMAIL_SERVER_USER),
    pass: stripQuotes(process.env.EMAIL_SERVER_PASSWORD),
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export function buildPaymentFailedEmail(prenom: string, montant: number, relances: number): SendEmailOptions {
  return {
    to: "", // sera rempli par l'appelant
    subject: `[Colossence] Échec de paiement - Action requise`,
    html: `
      <h2>Bonjour ${prenom},</h2>
      <p>Nous n'avons pas pu prélever votre paiement de <strong>${montant.toFixed(2)}€</strong>.</p>
      <p>Tentative ${relances}/3. Veuillez mettre à jour votre moyen de paiement dans votre espace client.</p>
      ${relances >= 3 ? "<p><strong>⚠️ Votre secrétariat IA a été désactivé suite à 3 échecs consécutifs.</strong></p>" : ""}
      <p>Cordialement,<br/>L'équipe Colossence</p>
    `,
  };
}
