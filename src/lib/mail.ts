/** "Roronoa <a@b.c>" or "a@b.c" -> { name?, email } */
function parseFrom(from = "") {
  const m = from.match(/^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/);
  return m ? { name: m[1]?.trim() || undefined, email: m[2] } : { email: from.trim() };
}

// No BREVO_API_KEY -> print to the server console (dev).
export async function sendMail(to: string, subject: string, text: string) {
  const { BREVO_API_KEY, MAIL_FROM } = process.env;
  if (!BREVO_API_KEY) {
    console.log(`\n--- mail to ${to} ---\n${subject}\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ sender: parseFrom(MAIL_FROM), to: [{ email: to }], subject, textContent: text }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}
