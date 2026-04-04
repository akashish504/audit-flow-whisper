import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev";

const STANDARDIZATION_PROMPT = `Role: You are a Senior Financial Auditor and Data Extraction Specialist.

Task: Extract ALL financial data from the attached audit report exactly as it appears in the document. Do NOT map to a predefined schema. Instead, preserve the original structure, labels, and hierarchy of the document.

Rules:

1. Key Naming: Convert each line item label from the document into snake_case (lowercase, spaces replaced with underscores). For example:
   - "Property, Plant and Equipment" → "property_plant_and_equipment"
   - "Trade and Other Receivables" → "trade_and_other_receivables"
   - "Profit Before Tax" → "profit_before_tax"

2. Structure: Preserve the natural grouping and hierarchy as presented in the document. Use nested JSON objects for sections and sub-sections (e.g., "non_current_assets", "current_assets" nested under "assets").

3. Values: Extract numeric values as numbers (not strings). Use 0 for dashes or blanks. Negative values should be represented as negative numbers.

4. Completeness: Extract EVERY line item that appears in the financial statements. Do not skip or merge items. If a line item exists in the document, it must appear in the output.

5. Sections: Organize the output into top-level sections matching the document structure. Common sections include:
   - "report_metadata" (entity name, UEN, reporting period, currency, audit firm, etc.)
   - "statement_of_comprehensive_income" or "profit_and_loss" (as labeled in document)
   - "balance_sheet" or "statement_of_financial_position" (as labeled in document)
   - "cash_flow_statement" (if present)
   - "statement_of_changes_in_equity" (if present)
   - Any other statements present in the document

6. Latest Period: Only extract values for the most recent financial period/year shown.

7. Notes: Do not extract notes to the financial statements, only the primary financial statement figures.

Output Rule: Return ONLY the JSON object. Do not provide conversational text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const AWS_S3_API_KEY = Deno.env.get("AWS_S3_API_KEY");
    if (!AWS_S3_API_KEY) throw new Error("AWS_S3_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { audit_file_id, s3_key } = await req.json();
    if (!audit_file_id || !s3_key) {
      return new Response(
        JSON.stringify({ error: "audit_file_id and s3_key are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[extract] Starting extraction for file ${audit_file_id}, key: ${s3_key}`);

    // 1. Get signed download URL from S3
    const signResponse = await fetch(
      `${GATEWAY_URL}/api/v1/sign_storage_url?provider=aws_s3&mode=read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": AWS_S3_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ object_path: s3_key }),
      }
    );

    if (!signResponse.ok) {
      const errText = await signResponse.text();
      throw new Error(`S3 sign error [${signResponse.status}]: ${errText}`);
    }

    const { url: downloadUrl } = await signResponse.json();
    console.log("[extract] Got signed URL, downloading file...");

    // 2. Download the file
    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file [${fileResponse.status}]`);
    }

    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
    console.log(`[extract] Downloaded ${fileBytes.length} bytes, converting to base64...`);

    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < fileBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...fileBytes.subarray(i, i + chunkSize));
    }
    const base64File = btoa(binary);

    // Determine MIME type from s3_key
    const ext = s3_key.split(".").pop()?.toLowerCase() || "";
    let mimeType = "application/pdf";
    if (ext === "xlsx") mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === "png") mimeType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";

    console.log(`[extract] Sending to AI (mime: ${mimeType}, base64 length: ${base64File.length})...`);

    // 3. Send to Lovable AI for extraction using a faster model
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: STANDARDIZATION_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64File}`,
                  },
                },
                {
                  type: "text",
                  text: "Extract the financial data from this audit report and return the JSON as specified.",
                },
              ],
            },
          ],
        }),
      }
    );

    console.log(`[extract] AI response status: ${aiResponse.status}`);

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error [${aiResponse.status}]: ${errText}`);
    }

    const aiResult = await aiResponse.json();
    let content = aiResult.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let extractedData: unknown;
    try {
      extractedData = JSON.parse(content);
    } catch {
      console.error("[extract] Invalid JSON from AI:", content.substring(0, 500));
      throw new Error(`AI returned invalid JSON`);
    }

    console.log("[extract] Successfully parsed AI response, saving to DB...");

    // 4. Save extracted data to audit_files table
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateError } = await supabaseAdmin
      .from("audit_files")
      .update({ extracted_data: extractedData })
      .eq("id", audit_file_id);

    if (updateError) {
      throw new Error(`Failed to save extracted data: ${updateError.message}`);
    }

    console.log("[extract] Done!");

    return new Response(
      JSON.stringify({ success: true, extracted_data: extractedData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("extract-audit-data error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
