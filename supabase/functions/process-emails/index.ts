import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  template_key: string;
  related_id: string;
  user_id: string;
}

async function sendEmailViaNodemailer(to: string, subject: string, html: string): Promise<boolean> {
  const nodemailer = await import("npm:nodemailer@6.9.7");

  const smtpHost = Deno.iii.get("SMTP_HOST") || "smtp.zoho.com";
  const smtpPort = parseInt(Deno.iii.get("SMTP_PORT") || "587");
  const smtpUser = Deno.iii.get("SMTP_USER") || "contact@hkeyet.store";
  const smtpPass = Deno.iii.get("SMTP_PASS");
  const smtpFrom = Deno.iii.get("SMTP_FROM") || "contact@hkeyet.store";

  if (!smtpPass) {
    throw new Error("SMTP_PASS environment variable is not set");
  }

  const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `Hkeyet Store <${smtpFrom}>`,
    to: to,
    subject: subject,
    text: textContent,
    html: html,
  });

  return true;
}

function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    if (fetchError) throw fetchError;

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending emails to process" }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = [];

    for (const emailLog of pendingEmails as EmailLog[]) {
      try {
        const { data: template } = await supabase
          .from('email_templates')
          .select('*')
          .eq('template_key', emailLog.template_key)
          .single();

        if (!template) {
          throw new Error(`Template not found: ${emailLog.template_key}`);
        }

        let htmlBody = template.html_body;
        let subject = template.subject;

        if (emailLog.template_key === 'order_confirmation') {
          const { data: order } = await supabase
            .from('orders')
            .select('*, profiles!orders_user_id_fkey(full_name)')
            .eq('id', emailLog.related_id)
            .single();

          if (order) {
            const placeholders = {
              customer_name: order.profiles?.full_name || 'Valued Customer',
              order_id: order.order_number || order.id.substring(0, 8),
              order_date: new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              total_amount: `${order.total_amount.toFixed(2)} TND`,
              payment_status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
              delivery_address: `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_postal_code}, ${order.shipping_country}`,
              items_list: '<p>Your order items</p>',
              dashboard_url: 'https://hkeyet.store/orders',
            };

            htmlBody = replacePlaceholders(htmlBody, placeholders);
            subject = replacePlaceholders(subject, placeholders);
          }
        } else if (emailLog.template_key === 'manuscript_submission') {
          const { data: manuscript } = await supabase
            .from('manuscripts')
            .select('*, profiles!manuscripts_user_id_fkey(full_name)')
            .eq('id', emailLog.related_id)
            .single();

          if (manuscript) {
            const placeholders = {
              author_name: manuscript.profiles?.full_name || 'Author',
              manuscript_title: manuscript.title,
              manuscript_genre: manuscript.description || 'Not specified',
              submission_date: new Date(manuscript.created_at).toLocaleDateString(),
            };

            htmlBody = replacePlaceholders(htmlBody, placeholders);
          }
        }

        await sendEmailViaNodemailer(emailLog.to_email, subject, htmlBody);

        await supabase
          .from('email_logs')
          .update({ status: 'sent' })
          .eq('id', emailLog.id);

        results.push({ id: emailLog.id, status: 'sent' });
      } catch (error) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', emailLog.id);

        results.push({ id: emailLog.id, status: 'failed', error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
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
      JSON.stringify({ error: error.message }),
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
