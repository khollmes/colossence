/**
 * Template d'email de vérification d'adresse email.
 *
 * Rendu par React Email : les styles sont automatiquement convertis en
 * attributs style inline, car la plupart des clients email (Gmail, Outlook…)
 * ignorent les balises <style> et les classes CSS externes.
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VerificationEmailProps {
  prenom: string;
  verificationUrl: string; // URL complète avec le token, ex: https://colossence.com/verify-email?token=abc
}

export default function VerificationEmail({ prenom, verificationUrl }: VerificationEmailProps) {
  return (
    <Html lang="fr">
      <Head />

      {/* Preview : texte affiché dans la liste d'emails avant ouverture */}
      <Preview>Confirmez votre adresse email Colossence</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* En-tête */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Colossence</Text>
          </Section>

          {/* Corps */}
          <Section style={styles.content}>
            <Heading style={styles.h1}>Confirmez votre adresse email</Heading>

            <Text style={styles.text}>
              Bonjour {prenom},
            </Text>

            <Text style={styles.text}>
              Merci de vous être inscrit sur Colossence. Pour activer votre compte
              et commencer à utiliser votre secrétariat IA, cliquez sur le bouton ci-dessous.
            </Text>

            {/* Bouton principal — React Email le transforme en <a> avec styles inline */}
            <Section style={styles.btnContainer}>
              <Button href={verificationUrl} style={styles.button}>
                Confirmer mon adresse email
              </Button>
            </Section>

            <Text style={styles.text}>
              Ce lien est valable <strong>24 heures</strong>. Passé ce délai,
              vous devrez demander un nouvel email de confirmation depuis la page de connexion.
            </Text>

            {/* Lien en texte brut pour les clients qui bloquent les boutons */}
            <Text style={styles.fallbackText}>
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
            </Text>
            <Text style={styles.link}>{verificationUrl}</Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Pied de page */}
          <Section>
            <Text style={styles.footer}>
              Vous recevez cet email car vous venez de créer un compte sur colossence.com.
              Si vous n&apos;êtes pas à l&apos;origine de cette inscription, ignorez simplement ce message.
            </Text>
            <Text style={styles.footer}>© {new Date().getFullYear()} Colossence</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Tous les styles sont en objets inline — React Email les applique directement
// sur les balises HTML pour une compatibilité maximale avec les clients email.

const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: 0,
    padding: "40px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "520px",
    padding: "0 0 32px",
    overflow: "hidden" as const,
  },
  header: {
    backgroundColor: "#0f172a",
    padding: "24px 32px",
  },
  logo: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  content: {
    padding: "32px 32px 0",
  },
  h1: {
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 20px",
  },
  text: {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  },
  btnContainer: {
    margin: "28px 0",
    textAlign: "center" as const,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "600",
    padding: "14px 32px",
    textDecoration: "none",
  },
  fallbackText: {
    color: "#6b7280",
    fontSize: "13px",
    margin: "24px 0 4px",
  },
  link: {
    color: "#2563eb",
    fontSize: "13px",
    wordBreak: "break-all" as const,
    margin: 0,
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: "32px 32px 24px",
  },
  footer: {
    color: "#9ca3af",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 32px 8px",
    textAlign: "center" as const,
  },
};
