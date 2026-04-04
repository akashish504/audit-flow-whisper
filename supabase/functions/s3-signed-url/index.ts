import { corsHeaders } from '@supabase/supabase-js/cors'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const AWS_S3_API_KEY = Deno.env.get('AWS_S3_API_KEY');
  if (!AWS_S3_API_KEY) {
    return new Response(JSON.stringify({ error: 'AWS_S3_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { object_path, mode } = await req.json();

    if (!object_path || !mode) {
      return new Response(JSON.stringify({ error: 'object_path and mode are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['read', 'write'].includes(mode)) {
      return new Response(JSON.stringify({ error: 'mode must be "read" or "write"' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signResponse = await fetch(
      `${GATEWAY_URL}/api/v1/sign_storage_url?provider=aws_s3&mode=${mode}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': AWS_S3_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ object_path }),
      }
    );

    if (!signResponse.ok) {
      const errorText = await signResponse.text();
      throw new Error(`S3 sign error [${signResponse.status}]: ${errorText}`);
    }

    const data = await signResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in s3-signed-url:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
