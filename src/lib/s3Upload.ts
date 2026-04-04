import { supabase } from '@/integrations/supabase/client';

export async function getSignedUrl(objectPath: string, mode: 'read' | 'write'): Promise<string> {
  const { data, error } = await supabase.functions.invoke('s3-signed-url', {
    body: { object_path: objectPath, mode },
  });

  if (error) throw new Error(`Failed to get signed URL: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  return data.url;
}

export async function uploadFileToS3(file: File, s3Key: string): Promise<void> {
  const uploadUrl = await getSignedUrl(s3Key, 'write');
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
  });
  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status}`);
  }
}

export function generateS3Key(prefix: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${prefix}/${timestamp}-${random}-${safeName}`;
}
