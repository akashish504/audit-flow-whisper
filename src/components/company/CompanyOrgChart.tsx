import { useState, useEffect } from 'react';
import { Building2, MapPin, Loader2 } from 'lucide-react';
import { OrgChartUpload } from './OrgChartUpload';
import { supabase } from '@/integrations/supabase/client';

interface OrgEntity {
  id: string;
  sequential_id: number;
  entity_name: string;
  geolocation: string | null;
  is_parent: boolean;
  children: number[];
}

function EntityNodeCard({ entity }: { entity: OrgEntity }) {
  return (
    <div className="relative bg-background border border-border rounded-lg shadow-sm px-4 py-3 min-w-[200px] max-w-[240px] hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-1.5">
        <Building2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground truncate">{entity.entity_name}</span>
      </div>
      {entity.geolocation && (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{entity.geolocation}</span>
        </div>
      )}
      {entity.is_parent && (
        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
          Holding Company
        </span>
      )}
    </div>
  );
}

function EntityTreeNode({ entity, allEntities }: { entity: OrgEntity; allEntities: OrgEntity[] }) {
  const childEntities = entity.children
    .map(seqId => allEntities.find(e => e.sequential_id === seqId))
    .filter(Boolean) as OrgEntity[];

  return (
    <div className="flex flex-col items-center">
      <EntityNodeCard entity={entity} />
      {childEntities.length > 0 && (
        <>
          <div className="w-0.5 h-6 bg-border" />
          <div className="flex gap-8">
            {childEntities.map((child, idx) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="w-0.5 h-6 bg-border" />
                {childEntities.length > 1 && (
                  <div
                    className="absolute top-0 h-0.5 bg-border"
                    style={{
                      left: idx === 0 ? '50%' : 0,
                      right: idx === childEntities.length - 1 ? '50%' : 0,
                    }}
                  />
                )}
                <EntityTreeNode entity={child} allEntities={allEntities} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function CompanyOrgChart({ companyId }: { companyId: string }) {
  const [orgChartFile, setOrgChartFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [uploadExpanded, setUploadExpanded] = useState(true);
  const [entities, setEntities] = useState<OrgEntity[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);

  // Load entities from Supabase
  useEffect(() => {
    loadEntities();
  }, [companyId]);

  const loadEntities = async () => {
    setEntitiesLoading(true);
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('company_id', companyId)
        .order('sequential_id');
      if (error) throw error;
      const mapped = (data || []).map(row => ({
        id: row.id,
        sequential_id: row.sequential_id,
        entity_name: row.entity_name,
        geolocation: row.geolocation,
        is_parent: row.is_parent,
        children: row.children || [],
      }));
      setEntities(mapped);
      if (mapped.length > 0) {
        setIsExtracting(false);
      }
    } catch (err) {
      console.error('Failed to load entities:', err);
    } finally {
      setEntitiesLoading(false);
    }
  };

  const startExtractionPolling = () => {
    setIsExtracting(true);
    let attempts = 0;
    const intervalId = window.setInterval(async () => {
      attempts += 1;
      try {
        const { data, error } = await supabase
          .from('entities')
          .select('*')
          .eq('company_id', companyId)
          .order('sequential_id');

        if (error) throw error;

        const mapped = (data || []).map(row => ({
          id: row.id,
          sequential_id: row.sequential_id,
          entity_name: row.entity_name,
          geolocation: row.geolocation,
          is_parent: row.is_parent,
          children: row.children || [],
        }));

        if (mapped.length > 0) {
          setEntities(mapped);
          setEntitiesLoading(false);
          setIsExtracting(false);
          window.clearInterval(intervalId);
        } else if (attempts >= 15) {
          setIsExtracting(false);
          window.clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed while polling entities:', err);
        setIsExtracting(false);
        window.clearInterval(intervalId);
      }
    }, 2000);
  };

  const handleOrgChartUploaded = (_file: File, url: string) => {
    setOrgChartFile({ name: _file.name, url, type: _file.type });
    setUploadExpanded(false);
    loadEntities();
  };

  const handleExtractionStarted = () => {
    setEntities([]);
    setEntitiesLoading(false);
    startExtractionPolling();
  };

  const handleClear = () => {
    setOrgChartFile(null);
    setUploadExpanded(true);
    setEntities([]);
    setIsExtracting(false);
  };

  const root = entities.find(e => e.is_parent);

  return (
    <div className="p-6 overflow-auto h-full space-y-6">
      {orgChartFile && !uploadExpanded ? (
        <button
          onClick={() => setUploadExpanded(true)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
        >
          <span className="truncate max-w-[200px]">📄 {orgChartFile.name}</span>
          <span className="text-primary">View / Re-upload</span>
        </button>
      ) : (
        <OrgChartUpload
          companyId={companyId}
          onFileUploaded={handleOrgChartUploaded}
          uploadedFile={orgChartFile}
          onClear={handleClear}
          onExtractionStarted={handleExtractionStarted}
        />
      )}

      {entitiesLoading || isExtracting ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm text-foreground">Extracting entity structure...</p>
            <p className="text-xs text-muted-foreground mt-1">This can take a few seconds for larger charts.</p>
          </div>
        </div>
      ) : entities.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Entity Structure</h3>
          <div className="inline-flex justify-center min-w-full">
            {root ? (
              <EntityTreeNode entity={root} allEntities={entities} />
            ) : (
              <div className="text-sm text-muted-foreground">No root entity found. Ensure one entity has is_parent: true.</div>
            )}
          </div>
        </div>
      ) : orgChartFile ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No entities were extracted automatically.</p>
          <p className="text-xs text-muted-foreground mt-1">You can still paste JSON manually below as a fallback.</p>
          <EntityJsonInput companyId={companyId} onEntitiesSaved={loadEntities} />
        </div>
      ) : null}
    </div>
  );
}

function EntityJsonInput({ companyId, onEntitiesSaved }: { companyId: string; onEntitiesSaved: () => void }) {
  const [json, setJson] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    let parsed: any[];
    try {
      parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error('Must be an array');
    } catch {
      alert('Invalid JSON. Paste the array output from ChatGPT.');
      return;
    }

    setSaving(true);
    try {
      // Delete existing entities for this company
      await supabase.from('entities').delete().eq('company_id', companyId);

      // Insert new entities
      const rows = parsed.map((e: any) => ({
        company_id: companyId,
        sequential_id: Number(e.id),
        entity_name: e.entity_name,
        geolocation: e.geolocation || null,
        is_parent: !!e.is_parent,
        children: (e.children || []).map(Number),
      }));

      const { error } = await supabase.from('entities').insert(rows);
      if (error) throw error;

      setJson('');
      onEntitiesSaved();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 max-w-xl mx-auto">
      <textarea
        value={json}
        onChange={e => setJson(e.target.value)}
        placeholder='Paste JSON array from ChatGPT here...'
        className="w-full h-48 text-xs font-mono border border-border rounded-lg p-3 bg-background text-foreground resize-y"
      />
      <button
        onClick={handleSave}
        disabled={saving || !json.trim()}
        className="px-4 py-2 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Entities'}
      </button>
    </div>
  );
}
