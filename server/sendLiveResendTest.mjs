const recipient = "holstonjames6@gmail.com";
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL;

if (!apiKey || !from) throw new Error("Resend credentials are not configured.");

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to: [recipient],
    subject: "ESUT Marketplace — Resend delivery test",
    text: "This is a live transactional email test from ESUT Marketplace. If you received this message, Resend delivery is configured successfully.",
    html: "<main style=\"font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#111827\"><div style=\"height:5px;background:#00843D;border-radius:3px\"></div><h1 style=\"margin:24px 0 8px;color:#E31B23\">ESUT Marketplace</h1><p>This is a live transactional email test from ESUT Marketplace.</p><p>If you received this message, <strong>Resend delivery is configured successfully.</strong></p><p style=\"color:#64748B;font-size:13px\">Buy. Sell. Connect. Right from ESUT.</p></main>",
  }),
});
const body = await response.text();
if (!response.ok) throw new Error(`Resend delivery failed (${response.status}): ${body}`);
const result = JSON.parse(body);
console.log(`LIVE_RESEND_TEST_SENT:${result.id}`);
