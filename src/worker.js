import { EmailMessage } from "cloudflare:email";

const FROM = "info@revilo-racing.co.uk";
const TO = "leeacollins24@gmail.com";

const clean = (v, n = 2000) => String(v ?? "").replace(/[\r\n]+/g, " ").slice(0, n).trim();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/enquiry") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      let d;
      try { d = await request.json(); } catch { return new Response("Bad request", { status: 400 }); }
      const name = clean(d.name, 120), email = clean(d.email, 200), company = clean(d.company, 160),
            level = clean(d.level, 60), message = String(d.message ?? "").slice(0, 5000);
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return new Response("Missing details", { status: 400 });
      const body = [
        "New sponsorship enquiry from revilo-racing.co.uk", "",
        `Name: ${name}`, `Company: ${company || "-"}`, `Email: ${email}`, `Interested in: ${level || "-"}`, "",
        "Message:", message || "-"
      ].join("\r\n");
      const raw = [
        `From: Revilo Racing website <${FROM}>`, `To: ${TO}`, `Reply-To: ${email}`,
        `Subject: Sponsorship enquiry: ${name}${company ? " (" + company + ")" : ""}`,
        `Message-ID: <${crypto.randomUUID()}@revilo-racing.co.uk>`, `Date: ${new Date().toUTCString()}`,
        "MIME-Version: 1.0", "Content-Type: text/plain; charset=utf-8", "", body
      ].join("\r\n");
      try {
        await env.ENQUIRY.send(new EmailMessage(FROM, TO, raw));
        return Response.json({ ok: true });
      } catch (e) {
        return new Response("Could not send", { status: 502 });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
