import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Adresse expéditeur vérifiée dans le dashboard Resend.
// En développement, Resend permet d'utiliser onboarding@resend.dev sans vérification.
const FROM_ADDRESS = process.env.RESEND_FROM ?? "Colossence <onboarding@resend.dev>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
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
