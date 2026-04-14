import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(config: EmailRequest): Promise<boolean> {
  const smtpHost = Deno.iii.get("SMTP_HOST");
  const smtpPort = Deno.iii.get("SMTP_PORT");
  const smtpUser = Deno.iii.get("SMTP_USER");
  const smtpPass = Deno.iii.get("SMTP_PASS");
  const smtpFrom = Deno.iii.get("SMTP_FROM");

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error("SMTP configuration missing");
  }

  const boundary = `----=_Part_${Date.now()}`;

  const emailBody = [
    `From: ${smtpFrom}`,
    `To: ${config.to}`,
    `Subject: ${config.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    config.text || config.html.replace(/<[^>]*>/g, ''),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    config.html,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  try {
    const useTLS = smtpPort === "587";
    const useSSL = smtpPort === "465";

    const conn = await Deno.connect({
      hostname: smtpHost,
      port: parseInt(smtpPort),
      transport: useSSL ? "tcp" : "tcp",
    });

    let socket: Deno.Conn = conn;

    if (useSSL) {
      socket = await Deno.startTls(conn, { hostname: smtpHost });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    async function readResponse(): Promise<string> {
      const buffer = new Uint8Array(1024);
      const n = await socket.read(buffer);
      return decoder.decode(buffer.subarray(0, n || 0));
    }

    async function sendCommand(command: string): Promise<string> {
      await socket.write(encoder.encode(command + '\r\n'));
      return await readResponse();
    }

    await readResponse();

    await sendCommand(`EHLO ${smtpHost}`);

    if (useTLS) {
      await sendCommand('STARTTLS');
      socket = await Deno.startTls(socket, { hostname: smtpHost });
      await sendCommand(`EHLO ${smtpHost}`);
    }

    await sendCommand('AUTH LOGIN');
    await sendCommand(btoa(smtpUser));
    await sendCommand(btoa(smtpPass));

    await sendCommand(`MAIL FROM:<${smtpFrom}>`);
    await sendCommand(`RCPT TO:<${config.to}>`);
    await sendCommand('DATA');
    await socket.write(encoder.encode(emailBody + '\r\n.\r\n'));
    await readResponse();

    await sendCommand('QUIT');
    socket.close();

    return true;
  } catch (error) {
    console.error('SMTP Error:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    await sendEmail({ to, subject, html, text });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
