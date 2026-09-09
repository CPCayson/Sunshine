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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Welcome to **MANTA Constellation** — a visual companion for exploring UxS evidence, mission meaning, projections, and scoped assurance.

**Operating boundary**
- Sunshine is a **local visual prototype**, not the canonical Zen store.
- Search results and AI suggestions are **evidence/candidates**, not accepted truth.
- CoMET remains an external NOAA metadata authority surface.
- OISS acceptance is **NOT TESTED** unless a real scoped receipt says otherwise.

Use the workspace to inspect what is known, why it is believed, where it projects, and what has actually been checked.`,
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

  // Local prototype projection and rule readout. This is not an external authority receipt.
  const liveXml = useMemo(() => generateIso19115Xml(mission), [mission]);
  const { score } = useMemo(() => validateUxSMission(mission), [mission]);

  React.useEffect(() => {
    if (mission.conformanceScore !== score) {
      setMission((prev) => ({ ...prev, conformanceScore: score }));
    }
  }, [score]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

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

  // Pull search result as observed evidence. This does not silently accept it as Zen truth.
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

    showToast(`Pulled evidence from ${result.authority}. Canonical meaning unchanged.`);
  };

  // Human decision is the explicit gate for candidate acceptance inside this prototype mission state.
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

    showToast(`Human decision recorded in local prototype state.`);
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
      showToast('Applied local prototype remediation to geographic extent.');
    } else if (finding.canonicalField === 'platform.modelId') {
      setMission((prev) => ({
        ...prev,
        platform: {
          ...prev.platform,
          name: 'REMUS 620 Autonomous Underwater Vehicle',
          modelId: 'REMUS-620',
        },
      }));
      showToast('Applied local prototype platform normalization.');
    } else if (
      finding.canonicalField === 'docucompReferences' ||
      finding.id?.includes('SIG-SEMANTIC-PLACEMENT') ||
      finding.canonicalField === 'docucompSlot'
    ) {
      showToast('DocuComp placement suggestion recorded locally; no external write performed.');
    }
  };

  // AI suggestions are staged separately from mission truth. They never auto-mutate mission, Zen, CoMET, or OISS state.
  const handleApplySuggestedUpdates = (updates: any) => {
    if (!updates) return;
    try {
      const key = 'manta:staged-ai-suggestions';
      const existing = JSON.parse(sessionStorage.getItem(key) || '[]');
      const staged = [
        ...existing,
        {
          id: `ai-suggestion-${Date.now()}`,
          stagedAt: new Date().toISOString(),
          missionId: mission.id,
          state: 'CANDIDATE_FOR_REVIEW',
          updates,
        },
      ];
      sessionStorage.setItem(key, JSON.stringify(staged));
      showToast('AI suggestion staged for human review. Mission truth unchanged.', 'info');
    } catch {
      showToast('AI suggestion reviewed locally; mission truth unchanged.', 'info');
    }
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

      <TemplateSelectorModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectMission={(selected) => {
          setMission(selected);
          showToast(`Loaded local prototype mission snapshot: ${selected.id}`);
        }}
        currentMissionId={mission.id}
      />
    </>
  );
}
