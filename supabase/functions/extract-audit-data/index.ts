import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev";

const STANDARDIZATION_PROMPT = `Role: You are a Senior Financial Auditor and Data Architect.
Task: Extract data from the attached audit report for the latest financial period and map it to the provided Fixed Schema JSON.
Mapping Strategy:

Terminology Mapping: Different auditors use different terms (e.g., "Revenue" vs "Turnover", "Property, Plant and Equipment" vs "Fixed Assets"). You must map these variations to the fixed keys in the schema below.

Empty Values: If a field in the schema does not exist in the report, use 0 for numeric fields and "" or null for strings.

Latest Period: Only extract values for the most recent year shown in the columns.

Mandatory Validation Rules:

Balance Sheet Equality: total_assets MUST equal (total_equity + total_liabilities).

Cash Flow Reconciliation: (net_cash_from_operating_activities + net_cash_from_investing_activities + net_cash_from_financing_activities) + cash_at_start_of_year MUST equal cash_at_end_of_year.

Net Profit Calculation: (profit_loss_before_tax_continuing - income_tax_expense_current + deferred_tax_credit_charge) MUST equal net_profit_loss_continuing_ops.

Fixed Schema JSON to Populate:
JSON




{
  "report_metadata": {
    "entity_name": "string",
    "uen": "string",
    "reporting_period_end": "YYYY-MM-DD",
    "currency": "string",
    "audit_firm": "string",
    "accounting_standard": "string",
    "consolidated": boolean,
    "going_concern_status": "string"
  },
  "statement_of_comprehensive_income": {
    "revenue_metrics": {
      "total_revenue": number,
      "cost_of_sales": number,
      "gross_profit": number,
      "revenue_breakdown": {
        "services_over_time": number,
        "services_point_in_time": number,
        "other_operating_revenue": number
      }
    },
    "other_income": number,
    "operating_expenses": {
      "employee_benefits": number,
      "depreciation_and_amortization": number,
      "finance_costs": number,
      "marketing_and_distribution": number,
      "administrative_expenses": number,
      "other_operating_expenses": number,
      "impairment_losses": number
    },
    "taxation": {
      "profit_loss_before_tax_continuing": number,
      "income_tax_expense_current": number,
      "deferred_tax_credit_charge": number,
      "net_profit_loss_continuing_ops": number
    },
    "discontinued_operations": {
      "profit_loss_from_discontinued_ops_net_of_tax": number
    },
    "other_comprehensive_income": {
      "foreign_currency_translation_adjustments": number,
      "remeasurement_of_defined_benefit_plans": number,
      "total_comprehensive_income": number
    }
  },
  "balance_sheet": {
    "assets": {
      "non_current_assets": {
        "property_plant_and_equipment": number,
        "intangible_assets_and_goodwill": number,
        "right_of_use_assets": number,
        "investments_in_subsidiaries": number,
        "long_term_financial_assets": number,
        "deferred_tax_assets": number,
        "other_non_current_receivables": number
      },
      "current_assets": {
        "inventories": number,
        "trade_and_other_receivables": number,
        "prepayments_and_accrued_income": number,
        "current_tax_assets": number,
        "cash_and_cash_equivalents": number,
        "assets_held_for_sale": number
      },
      "total_assets": number
    },
    "equity_and_liabilities": {
      "equity": {
        "share_capital": number,
        "preference_shares": number,
        "reserves": number,
        "retained_earnings_accumulated_losses": number,
        "non_controlling_interest": number,
        "total_equity": number
      },
      "non_current_liabilities": {
        "long_term_borrowings": number,
        "long_term_lease_liabilities": number,
        "deferred_tax_liabilities": number,
        "long_term_provisions": number
      },
      "current_liabilities": {
        "trade_and_other_payables": number,
        "short_term_borrowings": number,
        "contract_liabilities": number,
        "current_lease_liabilities": number,
        "short_term_provisions": number,
        "current_tax_liabilities": number
      },
      "total_liabilities": number
    }
  },
  "cash_flow_statement": {
    "operating_activities": {
      "net_cash_from_operating_activities": number,
      "adjustments_for_non_cash_items": {
        "depreciation_amortization": number,
        "share_based_payments": number,
        "finance_costs_accrued": number,
        "investment_income": number
      }
    },
    "investing_activities": {
      "capex_and_intangible_additions": number,
      "acquisition_of_subsidiaries_net_of_cash": number,
      "proceeds_from_disposal_of_assets": number,
      "net_cash_from_investing_activities": number
    },
    "financing_activities": {
      "proceeds_from_issue_of_shares": number,
      "repayment_of_borrowings_and_leases": number,
      "buyback_of_shares": number,
      "interest_paid": number,
      "net_cash_from_financing_activities": number
    },
    "cash_position": {
      "net_increase_decrease_in_cash": number,
      "cash_at_start_of_year": number,
      "cash_at_end_of_year": number
    }
  }
}

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

    // 2. Download the file
    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file [${fileResponse.status}]`);
    }

    const fileBytes = await fileResponse.arrayBuffer();
    const base64File = btoa(
      String.fromCharCode(...new Uint8Array(fileBytes))
    );

    // Determine MIME type from s3_key
    const ext = s3_key.split(".").pop()?.toLowerCase() || "";
    let mimeType = "application/pdf";
    if (ext === "xlsx") mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === "png") mimeType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";

    // 3. Send to Lovable AI for extraction
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
      throw new Error(`AI returned invalid JSON: ${content.substring(0, 200)}`);
    }

    // 4. Save extracted data to audit_files table
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateError } = await supabaseAdmin
      .from("audit_files")
      .update({ extracted_data: extractedData })
      .eq("id", audit_file_id);

    if (updateError) {
      throw new Error(`Failed to save extracted data: ${updateError.message}`);
    }

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
