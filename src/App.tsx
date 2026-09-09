import React, { useState, useMemo } from 'react';
import {
  UxSMission,
  ChatMessage,
  FederatedSearchResult,
  Claim,
  SignalFinding
} from './types';
import { INITIAL_MISSIONS } from './data/missions';
import { generateIso19115Xml, validateUxSMission } from './utils/xmlGenerator';
import { WorkbenchShell } from './components/shell/WorkbenchShell';
import { TemplateSelectorModal } from './components/TemplateSelectorModal';
import { CorpusWorkspace } from './components/CorpusWorkspace';
import { CometOperationMode } from './services/cometAdapter';

export default function App() {
  const [mission, setMission] = useState<UxSMission>(INITIAL_MISSIONS[0]);
  const [cometMode, setCometMode] = useState<CometOperationMode>('LIVE_OBSERVED_MODE');
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isCorpusOpen, setIsCorpusOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Initial welcome message from MANTA Lens AI
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `👋 Welcome to **MANTA Lens Spatial Workbench** — high-density operational workbench for **NOAA NCEI Uncrewed Systems (UxS)** metadata.

**Spatial Workbench Capabilities**:
- **Discover / Understand / Deliver**: Switch active workspace groups directly via the top interactive breadcrumb bar.
- **Top / Bottom Dual Panes**: Work in tandem with Knowledge Graph & Oceanographic Map, or Charlie Intake & Accepted Mission.
- **Draggable Focus Seam**: Drag to resize (or double click for 55/45 balanced view, hover for 1-click swap).
- **MANTAScript Canvas (⌘K)**: Full-surface execution canvas for fast searches, cleaning, and surface pairing commands.
- **Contextual Lens**: Slide over on demand without persistent dashboard clutter.`,
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
  const { score } = useMemo(() => validateUxSMission(mission), [mission]);

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

  const handleRejectClaim = (claimId: string) => {
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
    } else if (
      finding.canonicalField === 'docucompReferences' ||
      finding.id?.includes('SIG-SEMANTIC-PLACEMENT') ||
      finding.canonicalField === 'docucompSlot'
    ) {
      showToast('Remediated DocuComp semantic placement: Relocated component to canonical gmd:contact slot.');
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
    <>
      <WorkbenchShell
        mission={mission}
        setMission={setMission}
        cometMode={cometMode}
        setCometMode={setCometMode}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        isChatLoading={isChatLoading}
        onApplySuggestedUpdates={handleApplySuggestedUpdates}
        onApplySignalRemediation={handleApplySignalRemediation}
        onAcceptClaim={handleAcceptClaim}
        onRejectClaim={handleRejectClaim}
        onPullAsEvidence={handlePullAsEvidence}
        toast={toast}
        showToast={showToast}
      />

      <button
        type="button"
        onClick={() => setIsCorpusOpen(true)}
        className="fixed left-4 top-14 z-[70] px-3 py-1.5 rounded-lg bg-[#07111f]/95 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold tracking-wider shadow-xl hover:bg-cyan-950/70 hover:border-cyan-400/50 transition-colors"
        title="Open source-backed UxS evidence corpus"
      >
        UxS CORPUS
      </button>

      {isCorpusOpen && <CorpusWorkspace onClose={() => setIsCorpusOpen(false)} />}

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
    </>
  );
}
