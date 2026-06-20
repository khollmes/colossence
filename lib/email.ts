/**
 * Utilitaire d'envoi d'email pour les notifications de paiement.
 * 
 * TODO: Remplacer le placeholder par Resend, Nodemailer, ou tout autre service.
 * Pour utiliser Resend : npm install resend
 * Pour utiliser Nodemailer : npm install nodemailer
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  // ─── Placeholder ──────────────────────────────────────────────────────────────
  // Remplacez ce bloc par votre intégration email (Resend, Nodemailer, etc.)
  //
  // Exemple avec Resend :
  // import { Resend } from "resend";
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "Colossence <noreply@colossence.fr>",
  //   to,
  //   subject,
  //   html,
  // });

  console.log(`[EMAIL] Envoi à ${to}`);
  console.log(`[EMAIL] Sujet: ${subject}`);
  console.log(`[EMAIL] Contenu: ${html}`);
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
