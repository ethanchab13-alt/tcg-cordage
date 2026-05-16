import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = 'TCG Cordage <noreply@tcgarde.fr>'
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tcg-stringing.vercel.app'

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

/**
 * Envoie un email via Resend.
 * Retourne `true` si succès, `false` + l'erreur si échec.
 */
export async function sendEmail(
  payload: EmailPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      payload.to,
      subject: payload.subject,
      html:    payload.html,
    })

    if (error) {
      console.error('[email] Erreur Resend:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[email] Exception:', message)
    return { success: false, error: message }
  }
}

// ── Templates HTML ──────────────────────────────────────────

export function emailOrderCreated(params: {
  clientName: string
  stringType: string
  tensionMains: number
  tensionCross?: number | null
  racketBrand?: string | null
  notes?: string | null
}) {
  const tensionLabel = params.tensionCross
    ? `${params.tensionMains} / ${params.tensionCross} kg`
    : `${params.tensionMains} kg`

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr><td style="background:#006341;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">🎾 TCG Cordage</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:13px;">Tennis Club La Garde</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#111827;font-weight:600;">Bonjour,</p>
          <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
            Vous avez reçu une nouvelle demande de cordage de <strong>${params.clientName}</strong>.
          </p>
          <!-- Détails -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;width:120px;">Cordage</td>
              <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.stringType}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;">Tension</td>
              <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${tensionLabel}</td>
            </tr>
            ${params.racketBrand ? `<tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;">Raquette</td>
              <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.racketBrand}</td>
            </tr>` : ''}
            ${params.notes ? `<tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;vertical-align:top;">Notes</td>
              <td style="padding:4px 0;font-size:13px;color:#374151;">${params.notes}</td>
            </tr>` : ''}
          </table>
          <a href="${APP_URL}/cordeur/dashboard"
             style="display:inline-block;background:#006341;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
            Voir le dashboard →
          </a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Tennis Club La Garde · Ce message est automatique, ne pas répondre.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function emailOrderReady(params: {
  clientName: string
  stringType: string
  tensionMains: number
  tensionCross?: number | null
}) {
  const tensionLabel = params.tensionCross
    ? `${params.tensionMains} / ${params.tensionCross} kg`
    : `${params.tensionMains} kg`

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr><td style="background:#006341;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">🎾 TCG Cordage</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:13px;">Tennis Club La Garde</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#111827;font-weight:600;">Bonjour ${params.clientName} !</p>
          <div style="background:#e8f5ef;border-left:4px solid #006341;border-radius:4px;padding:14px 16px;margin-bottom:20px;">
            <p style="margin:0;font-size:15px;color:#006341;font-weight:700;">✅ Votre raquette est prête !</p>
            <p style="margin:4px 0 0;font-size:13px;color:#374151;">Vous pouvez la récupérer au Tennis Club La Garde.</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;width:120px;">Cordage</td>
              <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.stringType}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;">Tension</td>
              <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${tensionLabel}</td>
            </tr>
          </table>
          <a href="${APP_URL}/dashboard"
             style="display:inline-block;background:#006341;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
            Voir mes raquettes →
          </a>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Tennis Club La Garde · Ce message est automatique, ne pas répondre.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
