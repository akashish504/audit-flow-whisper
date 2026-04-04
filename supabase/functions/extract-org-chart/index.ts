import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev";

const EXTRACTION_PROMPT = `Role: You are a specialized Data Extraction Assistant focused on Corporate Governance and Entity Structures.

Task: Analyze the attached document  and extract the complete organizational hierarchy of the group.



Output Format: Return the result strictly as a JSON array of objects.
Entity Schema:
For every entity found in the document, create an object with this structure:
JSON




{
    "id": "Sequential integer starting from 1",
    "entity_name": "Full legal name of the entity",
    "geolocation": "Country or City/State of incorporation",
    "is_parent": true/false, // Set to true ONLY for the ultimate holding company
    "children": ["List of IDs of direct subsidiaries or step-down entities"]
}

Extraction Guidelines:
1.
Identify the Root: Start by identifying the "Ultimate Holding Company" or the "Parent" at the top of the chart. Mark this as is_parent: true.



2.
Trace Relationships: Map every connection (lines in diagrams or "Subsidiary of" labels in text) to populate the children array.



3. Handle Step-Downs: Ensure that "Step-Down Subsidiaries" are correctly nested as children of their immediate parent, not the ultimate parent.
4.
Clean Data: Remove any ownership percentages (e.g., "100% stake" or "66%") from the entity_name field.



5.
Identify Geolocation: Extract the country/region mentioned within the entity box or the adjacent column.



Strict Rule: Do not include any conversational text or explanations. Return only the valid JSON array.`;

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

    const { company_id, s3_key } = await req.json();
    if (!company_id || !s3_key) {
      return new Response(
        JSON.stringify({ error: "company_id and s3_key are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Get signed download URL
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

    // 2. Download the file
    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file [${fileResponse.status}]`);
    }

    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());

    // Convert to base64 in chunks to avoid call stack overflow
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < fileBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...fileBytes.subarray(i, i + chunkSize));
    }
    const base64File = btoa(binary);

    // Determine MIME type
    const ext = s3_key.split(".").pop()?.toLowerCase() || "";
    let mimeType = "application/pdf";
    if (ext === "png") mimeType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
    else if (ext === "svg") mimeType = "image/svg+xml";
    else if (ext === "webp") mimeType = "image/webp";
    else if (ext === "xlsx") mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === "xls") mimeType = "application/vnd.ms-excel";

    // 3. Send to Lovable AI
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: EXTRACTION_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${base64File}` },
                },
                {
                  type: "text",
                  text: "Extract the complete organizational hierarchy from this document.",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error [${aiResponse.status}]: ${errText}`);
    }

    const aiResult = await aiResponse.json();
    let content = aiResult.choices?.[0]?.message?.content || "";

    // Strip markdown fences
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: any[];
    try {
      parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) throw new Error("Not an array");
    } catch {
      throw new Error(`AI returned invalid JSON: ${content.substring(0, 300)}`);
    }

    // 4. Delete old entities and insert new ones
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await supabaseAdmin.from("entities").delete().eq("company_id", company_id);

    const rows = parsed.map((e: any) => ({
      company_id,
      sequential_id: Number(e.id),
      entity_name: e.entity_name,
      geolocation: e.geolocation || null,
      is_parent: !!e.is_parent,
      children: (e.children || []).map(Number),
    }));

    const { error: insertError } = await supabaseAdmin.from("entities").insert(rows);
    if (insertError) throw new Error(`Failed to save entities: ${insertError.message}`);

    return new Response(
      JSON.stringify({ success: true, count: rows.length, entities: rows }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("extract-org-chart error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
