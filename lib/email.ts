import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

// Retire les guillemets entourant une valeur de variable d'environnement.
// Nécessaire car certains hébergeurs (Vercel, OVH) conservent les guillemets
// présents dans le fichier .env : "smtp.resend.com" → smtp.resend.com
function stripQuotes(value: string | undefined): string {
  return (value ?? "").replace(/^["']|["']$/g, "");
}

const transporter = nodemailer.createTransport({
  host: stripQuotes(process.env.EMAIL_SERVER_HOST),
  port: Number(stripQuotes(process.env.EMAIL_SERVER_PORT)),
  secure: false,    // port 587 = STARTTLS (upgrade après connexion), pas SSL direct
  requireTLS: true,
  auth: {
    user: stripQuotes(process.env.EMAIL_SERVER_USER),
    pass: stripQuotes(process.env.EMAIL_SERVER_PASSWORD),
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  // Accepte soit un composant React Email, soit du HTML brut.
  // Priorité au composant React s'il est fourni.
  react?: ReactElement;
  html?: string;
}

export async function sendEmail({ to, subject, react, html }: SendEmailOptions): Promise<void> {
  // Si un composant React est fourni, on le compile en HTML avec React Email.
  // render() transforme le JSX en une chaîne HTML compatible email (inline CSS, etc.)
  const htmlBody = react ? await render(react) : html;

  await transporter.sendMail({
    from: stripQuotes(process.env.EMAIL_FROM),
    to,
    subject,
    html: htmlBody,
  });
}

export function buildPaymentFailedEmail(prenom: string, montant: number, relances: number): Omit<SendEmailOptions, "react"> {
  return {
    to: "",
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
