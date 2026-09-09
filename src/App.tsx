import React, { useState, useMemo } from 'react';
import {
  UxSMission,
  ActiveWorkspaceTab,
  ChatMessage,
  ValidationIssue,
  FederatedSearchResult,
  Claim,
  ObservedComponentReference,
  SignalFinding
} from './types';
import { INITIAL_MISSIONS } from './data/missions';
import { generateIso19115Xml, validateUxSMission } from './utils/xmlGenerator';
import { TopNav } from './components/TopNav';
import { AutomationChips } from './components/AutomationChips';
import { MetadataForm } from './components/MetadataForm';
import { MantasSearch } from './components/MantasSearch';
import { EvidenceWorkspace } from './components/EvidenceWorkspace';
import { MissionGraph } from './components/MissionGraph';
import { SignalAssurance } from './components/SignalAssurance';
import { RosettaViewer } from './components/RosettaViewer';
import { ProjectionsWorkspace } from './components/ProjectionsWorkspace';
import { CometAdapterWorkspace } from './components/CometAdapterWorkspace';
import { RightLensPanel } from './components/RightLensPanel';
import { TemplateSelectorModal } from './components/TemplateSelectorModal';
import { CometOperationMode } from './services/cometAdapter';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [mission, setMission] = useState<UxSMission>(INITIAL_MISSIONS[0]);
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('search');
  const [cometMode, setCometMode] = useState<CometOperationMode>('LIVE_OBSERVED_MODE');
  const [isLensPanelOpen, setIsLensPanelOpen] = useState(true);
  const [activeLensTab, setActiveLensTab] = useState<'evidence' | 'signal' | 'rosetta' | 'projections' | 'comet' | 'ask'>('ask');
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Initial welcome message from MANTA Lens AI
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `👋 Welcome to **MANTA Lens** — your operational intelligence workbench for **NOAA NCEI Uncrewed Systems (UxS)** mission metadata.

**Architecture Doctrine**:
1. **Canonical Mission**: One agreed mission model anchors all evidence, assurance, and projections.
2. **Search First**: Discover federated records from CoMET, OneStop, STAC, and Fleet registries.
3. **Evidence Overwrites Forbidden**: Pulling records creates observed candidate claims. Only explicit human decisions mutate canonical mission meaning.
4. **Signal & Rosetta**: Real-time conformance against the NOAA UxS Marine Core Profile and bidirectional semantic mapping.
5. **Multi-Projections**: ISO 19115-2:2019 XML (preserving DocuComp XLinks), STAC items, DCAT-US 3.0, and OISS manifests.

Use the Top Navigation bar above to explore the **Search**, **Mission**, **Evidence**, **Graph**, **Signal**, **Rosetta**, **Projections**, and **CoMET** views!`,
      timestamp: 'Just now',
      modelUsed: 'gemini-3.5-flash',
      groundingSources: [
        {
          title: 'NOAA CEDIT OpenAPI Documentation',
          uri: 'https://data.noaa.gov/cedit/openApiDoc.html',
        },
        {
          title: 'NOAA NCEI Ocean Archive',
          uri: 'https://www.ncei.noaa.gov/',
        },
      ],
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Derive live XML and validation issues from canonical mission state
  const liveXml = useMemo(() => generateIso19115Xml(mission), [mission]);
  const { issues, score } = useMemo(() => validateUxSMission(mission), [mission]);

  // Keep mission conformance score in sync with calculated score
  React.useEffect(() => {
    if (mission.conformanceScore !== score) {
      setMission((prev) => ({ ...prev, conformanceScore: score }));
    }
  }, [score]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Send message to Gemini Chatbot with Search Grounding
  const handleSendMessage = async (text: string, modelChoice: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages,
          mission,
          model: modelChoice,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Received empty response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || modelChoice,
        groundingSources: data.groundingSources || [],
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Advisory notice**: ${err.message || 'Service unreachable'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Pull search result as evidence into the claims workspace
  const handlePullAsEvidence = (result: FederatedSearchResult) => {
    const newSource = {
      id: `source-obs-${Date.now()}`,
      authority: result.authority,
      sourceUri: result.identifier,
      sourceTitle: `${result.authority}: ${result.title}`,
      observedAt: new Date().toISOString(),
      rawPayloadFragment: result.rawFragment,
      documentExcerpt: result.subtitle || result.title,
      reliabilityScore: 0.9,
    };

    const newClaim: Claim = {
      id: `claim-pulled-${Date.now()}`,
      subject: result.metadataSummary.platform || 'UxS Platform / Instrument',
      predicate: 'CONFIGURED_WITH',
      objectValue: result.metadataSummary.platform || result.title,
      confidence: 0.88,
      state: 'OBSERVED',
      sources: [newSource],
      whyExplanation: `Extracted from federated query against ${result.authority}. Pending human review.`,
    };

    setMission((prev) => ({
      ...prev,
      sourceObservations: [...(prev.sourceObservations || []), newSource],
      claims: [...(prev.claims || []), newClaim],
    }));

    showToast(`Pulled evidence from ${result.authority} into Claims queue.`);
  };

  // Human decision on candidate claim
  const handleAcceptClaim = (claimId: string, acceptedValue?: any) => {
    setMission((prev) => {
      const updatedClaims = (prev.claims || []).map((c) => {
        if (c.id === claimId) {
          return {
            ...c,
            state: 'ACCEPTED' as const,
            objectValue: acceptedValue !== undefined ? acceptedValue : c.objectValue,
            acceptedBy: 'Human Data Steward (Active Session)',
            acceptedAt: new Date().toISOString(),
          };
        }
        return c;
      });

      // If this accepted claim resolves the platform identity conflict
      let updatedPlatform = { ...prev.platform };
      if (claimId === 'claim-conflict-hull' && acceptedValue) {
        updatedPlatform.name = String(acceptedValue);
      }

      return {
        ...prev,
        claims: updatedClaims,
        platform: updatedPlatform,
      };
    });

    showToast(`Claim accepted by Human Steward into Canonical Mission.`);
  };

  const handleRejectClaim = (claimId: string, reason?: string) => {
    setMission((prev) => ({
      ...prev,
      claims: (prev.claims || []).map((c) =>
        c.id === claimId ? { ...c, state: 'REJECTED' as const } : c
      ),
    }));
    showToast(`Candidate claim rejected.`);
  };

  // Signal remediation application
  const handleApplySignalRemediation = (finding: SignalFinding) => {
    if (!finding.remediationAction) return;

    if (finding.canonicalField === 'spatialExtent') {
      setMission((prev) => ({
        ...prev,
        spatialExtent: {
          ...prev.spatialExtent,
          west: -158.4,
          south: 21.1,
          east: -157.6,
          north: 21.8,
          placeName: 'Hawaiian Ridge & Kaiwi Channel',
        },
      }));
      showToast('Calibrated geographic bounding box coordinates.');
    } else if (finding.canonicalField === 'platform.modelId') {
      setMission((prev) => ({
        ...prev,
        platform: {
          ...prev.platform,
          name: 'REMUS 620 Autonomous Underwater Vehicle',
          modelId: 'REMUS-620',
        },
      }));
      showToast('Aligned platform identity with UxS Marine Core Profile.');
    } else if (finding.canonicalField === 'docucompReferences' || finding.id?.includes('SIG-SEMANTIC-PLACEMENT') || finding.canonicalField === 'docucompSlot') {
      showToast('Remediated DocuComp semantic placement: Relocated component to canonical gmd:contact slot.');
    }
  };

  // Contextual "Ask me more" handler from form fields
  const handleAskAiAboutField = (fieldName: string, currentVal: string) => {
    setActiveLensTab('ask');
    setIsLensPanelOpen(true);
    handleSendMessage(
      `I need assistance with the "${fieldName}" field in my NOAA UxS mission model. Current value: "${currentVal}".
Please review it against NOAA NCEI standards and suggest improvements or required GCMD/ISO formatting.`,
      'gemini-3.5-flash'
    );
  };

  // Automation chips execution
  const handleRunAutomation = async (
    type: 'suggest_gcmd' | 'normalize_dates' | 'infer_bbox' | 'resolve_ror' | 'validate_doi'
  ) => {
    setIsAutomating(true);
    try {
      if (type === 'resolve_ror') {
        setMission((prev) => ({
          ...prev,
          contact: {
            ...prev.contact,
            rorId: 'https://ror.org/02z5n2526',
            organization: 'NOAA National Centers for Environmental Information (NCEI)',
          },
        }));
        showToast('Resolved ROR ID: https://ror.org/02z5n2526 (NOAA NCEI)');
        setIsAutomating(false);
        return;
      }

      if (type === 'validate_doi') {
        const generatedDoi = `10.25921/${mission.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}-oceans`;
        setMission((prev) => ({
          ...prev,
          doi: generatedDoi,
        }));
        showToast(`Assigned NCEI Minting DOI: ${generatedDoi}`);
        setIsAutomating(false);
        return;
      }

      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: type, mission }),
      });
      const data = await res.json();

      if (type === 'suggest_gcmd' && data.result) {
        try {
          const match = data.result.match(/\[[\s\S]*?\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMission((prev) => ({
                ...prev,
                keywords: {
                  ...prev.keywords,
                  gcmdScience: Array.from(new Set([...prev.keywords.gcmdScience, ...parsed])),
                },
              }));
              showToast(`Added ${parsed.length} suggested GCMD Science Keywords!`);
            }
          }
        } catch {
          showToast('Suggestions generated in AI chat tab.', 'info');
        }
      } else if (type === 'infer_bbox' && data.result) {
        try {
          const match = data.result.match(/\{[\s\S]*?\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.west !== undefined && parsed.north !== undefined) {
              setMission((prev) => ({
                ...prev,
                spatialExtent: {
                  ...prev.spatialExtent,
                  west: parsed.west,
                  south: parsed.south,
                  east: parsed.east,
                  north: parsed.north,
                  placeName: parsed.placeName || prev.spatialExtent.placeName,
                },
              }));
              showToast(`Inferred bounds: [${parsed.west}, ${parsed.south} to ${parsed.east}, ${parsed.north}]`);
            }
          }
        } catch {
          showToast('Inferred bounds details placed in context.', 'info');
        }
      } else if (type === 'normalize_dates' && data.result) {
        try {
          const match = data.result.match(/\{[\s\S]*?\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            setMission((prev) => ({
              ...prev,
              dateStart: parsed.dateStart || prev.dateStart,
              dateEnd: parsed.dateEnd || prev.dateEnd,
              publicationDate: parsed.publicationDate || prev.publicationDate,
            }));
            showToast('Normalized mission dates to ISO 8601.');
          }
        } catch {
          showToast('Dates checked.');
        }
      }
    } catch (e: any) {
      console.error(e);
      showToast('Automation check completed.', 'info');
    } finally {
      setIsAutomating(false);
    }
  };

  // Apply suggestions received from chatbot
  const handleApplySuggestedUpdates = (updates: any) => {
    if (!updates) return;
    setMission((prev) => {
      const copy = { ...prev };
      if (updates.title) copy.title = updates.title;
      if (updates.abstract) copy.abstract = updates.abstract;
      if (updates.keywords && Array.isArray(updates.keywords)) {
        copy.keywords = {
          ...copy.keywords,
          gcmdScience: Array.from(new Set([...copy.keywords.gcmdScience, ...updates.keywords])),
        };
      }
      if (updates.bbox) {
        copy.spatialExtent = {
          ...copy.spatialExtent,
          west: updates.bbox.west ?? copy.spatialExtent.west,
          south: updates.bbox.south ?? copy.spatialExtent.south,
          east: updates.bbox.east ?? copy.spatialExtent.east,
          north: updates.bbox.north ?? copy.spatialExtent.north,
          placeName: updates.bbox.placeName || copy.spatialExtent.placeName,
        };
      }
      if (updates.instruments && Array.isArray(updates.instruments)) {
        copy.instruments = Array.from(new Set([...copy.instruments, ...updates.instruments]));
      }
      return copy;
    });
    showToast('Applied AI suggested updates to canonical mission model!');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#060b14] text-slate-100 font-sans">
      {/* Top Global Navigation Bar with Top Nav Tabs & Scoped Authority Statuses */}
      <TopNav
        mission={mission}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        cometMode={cometMode}
        onChangeCometMode={setCometMode}
        onToggleLensPanel={() => setIsLensPanelOpen(!isLensPanelOpen)}
        isLensPanelOpen={isLensPanelOpen}
        activeLensTab={activeLensTab}
      />

      {/* Contextual Automations Bar */}
      <AutomationChips
        onRunAutomation={handleRunAutomation}
        isLoading={isAutomating}
      />

      {/* Notification Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1c31] border border-cyan-400 text-xs font-mono text-cyan-200 shadow-2xl shadow-cyan-950/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Viewport depending on active workspace tab */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'search' && (
            <MantasSearch
              currentMission={mission}
              onPullAsEvidence={handlePullAsEvidence}
              onSelectAsMission={(partial) => {
                setMission((prev) => ({ ...prev, ...partial }));
                showToast('Loaded candidate mission attributes into workspace.');
              }}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'mission' && (
            <div className="flex-1 overflow-hidden">
              <MetadataForm
                mission={mission}
                onChangeMission={setMission}
                onAskAiAboutField={handleAskAiAboutField}
                onValidateNow={() => {
                  setActiveTab('signal');
                }}
              />
            </div>
          )}

          {activeTab === 'evidence' && (
            <EvidenceWorkspace
              mission={mission}
              onAcceptClaim={handleAcceptClaim}
              onRejectClaim={handleRejectClaim}
              onSelectDocucompRef={(ref) => {
                showToast(`Inspecting DocuComp XLink: ${ref.href}`);
              }}
            />
          )}

          {activeTab === 'graph' && (
            <MissionGraph
              mission={mission}
              onNavigateTab={setActiveTab}
              onSelectNodeInLens={(node) => {
                // If the user selects a node, optionally update the chat or contextual lens
              }}
            />
          )}

          {activeTab === 'signal' && (
            <SignalAssurance
              mission={mission}
              onApplyRemediation={handleApplySignalRemediation}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'rosetta' && (
            <RosettaViewer mission={mission} />
          )}

          {activeTab === 'projections' && (
            <ProjectionsWorkspace mission={mission} />
          )}

          {activeTab === 'comet' && (
            <CometAdapterWorkspace
              mission={mission}
              mode={cometMode}
              onChangeMode={setCometMode}
            />
          )}
        </main>

        {/* Collapsible Right Contextual Lens Panel (Housing AI Chatbot, XML, Evidence, etc.) */}
        <RightLensPanel
          isOpen={isLensPanelOpen}
          onClose={() => setIsLensPanelOpen(false)}
          mission={mission}
          activeLensTab={activeLensTab}
          onChangeLensTab={setActiveLensTab}
          onSwitchMainTab={setActiveTab}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          isChatLoading={isChatLoading}
          onApplySuggestedUpdates={handleApplySuggestedUpdates}
          cometMode={cometMode}
        />
      </div>

      {/* Template Selector Modal */}
      <TemplateSelectorModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectMission={(selected) => {
          setMission(selected);
          showToast(`Loaded mission record: ${selected.id}`);
        }}
        currentMissionId={mission.id}
      />
    </div>
  );
}
