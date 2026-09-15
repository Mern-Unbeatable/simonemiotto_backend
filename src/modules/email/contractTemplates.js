const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'Support@TrustSurgery-ITA.com';
const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || '+39 351 6622705';
const COMPANY_LEGAL =
  process.env.COMPANY_LEGAL_INFO ||
  '[RAGIONE SOCIALE / TITOLARE - P.IVA/C.F. - SEDE LEGALE]';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://trustsurgery-ita.com';

const formatItalianDate = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('it-IT');
};

const shortId = (id = '') => String(id).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase() || 'N/A';

const emailShell = ({ title, bodyHtml }) => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1f2937;">
  <div style="max-width:720px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
    ${bodyHtml}
    <div style="background:#0b3d66;color:#ffffff;padding:18px 24px;font-size:13px;">
      <strong>ASSISTENZA TRUSTSURGERY-ITA</strong><br/>
      Email: <a href="mailto:${SUPPORT_EMAIL}" style="color:#ffffff;">${SUPPORT_EMAIL}</a><br/>
      WhatsApp: ${SUPPORT_WHATSAPP}
    </div>
    <div style="padding:14px 24px;font-size:12px;color:#6b7280;background:#f8fafc;">
      Dati del fornitore: ${COMPANY_LEGAL}<br/>
      <em>PER UNA SANITÀ PIÙ TRASPARENTE</em> ·
      <a href="${FRONTEND_URL}/terms" style="color:#0b3d66;">Termini</a> ·
      <a href="${FRONTEND_URL}/privacy" style="color:#0b3d66;">Privacy</a>
    </div>
  </div>
</body>
</html>
`;

function buildUserRegistrationContract({ name, email, userId, registeredAt }) {
  const id = shortId(userId);
  const data = formatItalianDate(registeredAt);
  const ref = `TSU-${id}-${data.replace(/\//g, '')}`;

  const bodyHtml = `
    <div style="padding:28px 28px 8px;border-bottom:3px solid #0aa5cf;">
      <div style="font-size:22px;font-weight:700;color:#0b3d66;">TrustSurgery</div>
      <div style="font-size:12px;color:#0aa5cf;letter-spacing:0.04em;margin-top:4px;">
        TRUSTSURGERY-ITA | INFORMAZIONE, TRASPARENZA E SCELTA CONSAPEVOLE
      </div>
    </div>
    <div style="padding:24px 28px;">
      <h1 style="margin:0 0 12px;font-size:18px;color:#0b3d66;text-transform:uppercase;">
        Conferma di registrazione e adesione ai servizi utente
      </h1>
      <p style="margin:0 0 16px;">Gentile <strong>${name}</strong>,</p>
      <p style="margin:0 0 16px;line-height:1.55;color:#374151;">
        la registrazione è completata. Questo documento riepiloga l'attivazione dell'account
        e le condizioni principali di utilizzo della piattaforma TrustSurgery-ITA.
      </p>
      <div style="display:inline-block;background:#e6f7fb;border-radius:8px;padding:10px 14px;margin-bottom:18px;font-size:13px;color:#0b3d66;">
        ✓ ACCOUNT REGISTRATO &nbsp; · &nbsp; ✓ EMAIL VERIFICATA &nbsp; · &nbsp; ✓ ACCESSO ATTIVO
      </div>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;background:#f0f9ff;border-radius:8px;">
        <tr>
          <td style="padding:10px 12px;font-size:13px;"><strong>Utente</strong><br/>${name}</td>
          <td style="padding:10px 12px;font-size:13px;"><strong>ID Utente</strong><br/>${id}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-size:13px;"><strong>E-mail</strong><br/>${email}</td>
          <td style="padding:10px 12px;font-size:13px;"><strong>Data registrazione</strong><br/>${data}</td>
        </tr>
      </table>
      <h2 style="font-size:15px;color:#0b3d66;margin:0 0 10px;">Condizioni principali di utilizzo</h2>
      <ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.55;color:#374151;">
        <li><strong>Oggetto del servizio.</strong> TrustSurgery-ITA è uno strumento informativo per profili professionali e non sostituisce il parere medico diretto.</li>
        <li><strong>Account personale.</strong> L'account è personale; l'utente è responsabile delle credenziali e delle attività sul profilo.</li>
        <li><strong>Profili dei professionisti.</strong> La dicitura “verificato” riguarda controlli documentali della piattaforma, non una garanzia clinica.</li>
        <li><strong>Contenuti e recensioni.</strong> Sono vietati contenuti falsi, diffamatori o promozionali indebiti.</li>
        <li><strong>Privacy e dati.</strong> I dati sono trattati secondo GDPR. Non pubblicare dati sanitari sensibili in aree pubbliche.</li>
        <li><strong>Comunicazioni e assistenza.</strong> Le comunicazioni ufficiali avvengono via e-mail associata all'account.</li>
        <li><strong>Recesso dall'account.</strong> È possibile richiedere la chiusura dell'account secondo le procedure della piattaforma.</li>
        <li><strong>Documenti applicabili.</strong> L'adesione è soggetta a Termini e Condizioni e Informativa Privacy pubblicati sul sito.</li>
      </ol>
      <div style="margin-top:18px;padding:12px;background:#f3f4f6;border-radius:8px;font-size:12px;color:#4b5563;">
        Riferimento registrazione: <strong>${ref}</strong><br/>
        Documento generato automaticamente.
      </div>
    </div>
  `;

  return {
    subject: 'Conferma di registrazione | TrustSurgery-ITA',
    text: `Gentile ${name}, la registrazione su TrustSurgery-ITA è completata. Riferimento: ${ref}. Assistenza: ${SUPPORT_EMAIL}`,
    html: emailShell({
      title: 'Conferma di registrazione',
      bodyHtml,
    }),
  };
}

function buildSurgeonSubscriptionContract({
  name,
  email,
  profileId,
  planName,
  amount,
  currency = 'EUR',
  startDate,
  endDate,
  durationLabel,
}) {
  const id = shortId(profileId);
  const activation = formatItalianDate(startDate);
  const renewal = formatItalianDate(endDate);
  const ref = `TS-${id}-${activation.replace(/\//g, '')}`;
  const amountLabel =
    amount === null || amount === undefined || amount === ''
      ? '—'
      : `€ ${Number(amount).toFixed(2)} ${currency || ''}`.trim();

  const bodyHtml = `
    <div style="padding:28px 28px 8px;border-bottom:3px solid #16a34a;">
      <div style="font-size:22px;font-weight:700;color:#0b3d66;">TrustSurgery</div>
      <div style="font-size:12px;color:#0aa5cf;margin-top:4px;">
        INSIEME PER UNA SANITÀ PIÙ TRASPARENTE
      </div>
    </div>
    <div style="padding:24px 28px;">
      <h1 style="margin:0 0 12px;font-size:17px;color:#0b3d66;text-transform:uppercase;">
        Conferma di adesione e contratto di abbonamento professionale
      </h1>
      <p style="margin:0 0 14px;">Gentile Dott./Dott.ssa <strong>${name}</strong>,</p>
      <div style="background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:12px 14px;margin-bottom:18px;color:#166534;font-size:13px;font-weight:600;">
        STATO: PROFILO VERIFICATO, PAGAMENTO RICEVUTO, ABBONAMENTO ATTIVO
      </div>
      <h2 style="font-size:15px;color:#0b3d66;margin:0 0 10px;">Dettagli abbonamento</h2>
      <table style="width:100%;border-collapse:collapse;margin:0 0 18px;font-size:13px;">
        <tr>
          <td style="padding:8px 0;width:50%;"><strong>Professionista</strong><br/>${name}</td>
          <td style="padding:8px 0;"><strong>ID Profilo</strong><br/>${id}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Piano</strong><br/>${planName || '—'}</td>
          <td style="padding:8px 0;"><strong>Importo</strong><br/>${amountLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Data attivazione</strong><br/>${activation}</td>
          <td style="padding:8px 0;"><strong>Durata</strong><br/>${durationLabel || '—'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;" colspan="2"><strong>Prossimo rinnovo</strong><br/>${renewal}</td>
        </tr>
      </table>
      <p style="font-size:12px;color:#6b7280;margin:0 0 12px;">E-mail account: ${email}</p>
      <h2 style="font-size:15px;color:#0b3d66;margin:0 0 10px;">Condizioni principali del servizio</h2>
      <ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.55;color:#374151;">
        <li><strong>Oggetto del servizio.</strong> Accesso ai servizi professionali TrustSurgery-ITA secondo il piano sottoscritto.</li>
        <li><strong>Profilo verificato.</strong> Il professionista è responsabile dell'accuratezza dei dati e dei documenti pubblicati.</li>
        <li><strong>Durata, rinnovo e cancellazione.</strong> L'abbonamento segue la durata indicata; rinnovo e disdetta secondo i Termini della piattaforma.</li>
        <li><strong>Corrispettivo e fatturazione.</strong> Il pagamento ricevuto attiva i servizi; eventuali adempimenti fiscali restano in capo alle parti secondo legge.</li>
        <li><strong>Uso della piattaforma.</strong> Uso professionale ed etico, nel rispetto degli utenti e della normativa vigente.</li>
        <li><strong>Privacy e dati.</strong> Trattamento dati conforme al GDPR e all'Informativa Privacy.</li>
        <li><strong>Termini applicabili.</strong> Si applicano Termini e Condizioni e Privacy Policy pubblicati sul sito.</li>
      </ol>
      <div style="margin-top:18px;padding:12px;background:#f3f4f6;border-radius:8px;font-size:12px;color:#4b5563;">
        Riferimento contratto: <strong>${ref}</strong><br/>
        Documento generato automaticamente.
      </div>
    </div>
  `;

  return {
    subject: 'Contratto di abbonamento professionale | TrustSurgery-ITA',
    text: `Gentile Dott./Dott.ssa ${name}, il contratto di abbonamento TrustSurgery-ITA è attivo. Piano: ${planName}. Riferimento: ${ref}.`,
    html: emailShell({
      title: 'Contratto di abbonamento',
      bodyHtml,
    }),
  };
}

module.exports = {
  buildUserRegistrationContract,
  buildSurgeonSubscriptionContract,
  formatItalianDate,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP,
};
