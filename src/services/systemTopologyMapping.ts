import { KnowledgeEdge, KnowledgeNode, NodePosition } from '../types';
import { BuiltGraph } from './knowledgeGraphBuilder';

/**
 * System-topology vocabulary adapted from the public CPCayson/x APH-22
 * knowledge-graph prototype. Sunshine uses it only as a visualization and
 * capability-mapping layer; it never changes Zen canonical truth.
 */
export type SystemTopologyDomain =
  | 'platform'
  | 'hull_mechanics'
  | 'power_energy'
  | 'navigation_gnc'
  | 'communications_c2'
  | 'autonomy_compute'
  | 'surveillance_sensors'
  | 'hydrographic_payloads'
  | 'uas_airborne'
  | 'missions_operations'
  | 'safety_standards'
  | 'science_data'
  | 'evidence_assurance'
  | 'metadata_projection'
  | 'external_authority';

export type SystemTopologyLayoutMode =
  | 'radial'
  | 'domain_cluster'
  | 'layered_architecture';

export type SystemTopologyRelationChannel =
  | 'power'
  | 'data_telemetry'
  | 'command_control'
  | 'mechanical'
  | 'optical_acoustic'
  | 'regulatory_operational'
  | 'semantic_lineage';

export interface SystemTopologyDomainVisual {
  name: string;
  shortName: string;
  accent: string;
  fill: string;
  order: number;
  layer: number;
  description: string;
}

export interface SystemTopologyRelationVisual {
  label: string;
  accent: string;
  dash: string;
  description: string;
}

export const SYSTEM_TOPOLOGY_DOMAIN_CONFIG: Record<SystemTopologyDomain, SystemTopologyDomainVisual> = {
  platform: { name: 'Core Platform', shortName: 'Platform', accent: '#22d3ee', fill: '#071a24', order: 0, layer: 4, description: 'Vehicle model and physical asset identity.' },
  hull_mechanics: { name: 'Hull & Mechanics', shortName: 'Hull', accent: '#60a5fa', fill: '#0a1528', order: 1, layer: 4, description: 'Mechanical structure, mounting, propulsion, and payload interfaces.' },
  power_energy: { name: 'Power & Energy', shortName: 'Power', accent: '#facc15', fill: '#211804', order: 2, layer: 3, description: 'Power generation, storage, and electrical dependency.' },
  navigation_gnc: { name: 'Navigation & GNC', shortName: 'Nav/GNC', accent: '#34d399', fill: '#071c18', order: 3, layer: 2, description: 'Navigation, guidance, positioning, timing, and control.' },
  communications_c2: { name: 'Communications & C2', shortName: 'Comms/C2', accent: '#a78bfa', fill: '#171129', order: 4, layer: 2, description: 'Telemetry, communications, command, and control pathways.' },
  autonomy_compute: { name: 'Autonomy & Compute', shortName: 'Autonomy', accent: '#f472b6', fill: '#251020', order: 5, layer: 2, description: 'Autonomy, mission execution, processing, and decision support.' },
  surveillance_sensors: { name: 'Imaging & Surveillance Sensors', shortName: 'Imaging', accent: '#fb923c', fill: '#251307', order: 6, layer: 1, description: 'Optical, lidar, radar, camera, and passive sensing capabilities.' },
  hydrographic_payloads: { name: 'Hydrographic Payloads', shortName: 'Hydrography', accent: '#2dd4bf', fill: '#061d1c', order: 7, layer: 1, description: 'Sonar, CTD, ADCP, bathymetry, acoustic, and oceanographic payloads.' },
  uas_airborne: { name: 'Airborne / UAS', shortName: 'UAS', accent: '#818cf8', fill: '#11162e', order: 8, layer: 1, description: 'Airborne vehicles and cross-domain payload relationships.' },
  missions_operations: { name: 'Mission & Operations', shortName: 'Mission', accent: '#84cc16', fill: '#131d08', order: 9, layer: 0, description: 'Mission, leg, deployment, operational role, and activity context.' },
  safety_standards: { name: 'Safety & Standards', shortName: 'Safety', accent: '#f87171', fill: '#240b0b', order: 10, layer: 0, description: 'Standards, restrictions, validation boundaries, and safety rules.' },
  science_data: { name: 'Science & Data Products', shortName: 'Science/Data', accent: '#38bdf8', fill: '#071727', order: 11, layer: 1, description: 'Science domains, observed properties, datasets, and data assets.' },
  evidence_assurance: { name: 'Evidence & Assurance', shortName: 'Evidence', accent: '#94a3b8', fill: '#101827', order: 12, layer: 5, description: 'Sources, claims, decisions, canonical facts, receipts, and findings.' },
  metadata_projection: { name: 'Metadata & Projection', shortName: 'Projection', accent: '#60a5fa', fill: '#0b1630', order: 13, layer: 5, description: 'ISO, STAC, DCAT, semantic slots, and destination projections.' },
  external_authority: { name: 'External Authorities', shortName: 'Authority', accent: '#c084fc', fill: '#1b1027', order: 14, layer: 5, description: 'CoMET, OISS, DocuComp, OneStop, CMR, and other external authorities.' },
};

export const SYSTEM_TOPOLOGY_RELATION_CONFIG: Record<SystemTopologyRelationChannel, SystemTopologyRelationVisual> = {
  power: { label: 'Power', accent: '#facc15', dash: '', description: 'Power / energy dependency.' },
  data_telemetry: { label: 'Data / telemetry', accent: '#22d3ee', dash: '5 4', description: 'Data products, telemetry, observations, and digital flow.' },
  command_control: { label: 'Command / control', accent: '#f472b6', dash: '8 3', description: 'Command and control relationship.' },
  mechanical: { label: 'Mechanical / carried', accent: '#60a5fa', dash: '', description: 'Mounting, containment, carried/configured, or structural relationship.' },
  optical_acoustic: { label: 'Optical / acoustic', accent: '#2dd4bf', dash: '2 3', description: 'Optical, acoustic, sonar, lidar, or sensing relationship.' },
  regulatory_operational: { label: 'Authority / operational', accent: '#a3e635', dash: '9 4', description: 'Authority, validation, governance, or operational relationship.' },
  semantic_lineage: { label: 'Semantic / evidence', accent: '#94a3b8', dash: '4 4', description: 'Evidence, semantic, decision, projection, or other MANTAS lineage.' },
};

const nodeText = (node: KnowledgeNode) =>
  [node.kind, node.label, node.subtitle, node.canonicalRef, node.knowledgeKey, JSON.stringify(node.metadata || {})]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const hasAny = (value: string, needles: string[]) => needles.some((needle) => value.includes(needle));

export function classifySystemTopologyDomain(node: KnowledgeNode): SystemTopologyDomain {
  const text = nodeText(node);
  if (['mission', 'leg', 'deployment'].includes(node.kind)) return 'missions_operations';
  if (['platformModel', 'physicalAsset', 'platformClass'].includes(node.kind)) return 'platform';
  if (['provider', 'manufacturer', 'organization'].includes(node.kind)) return 'external_authority';
  if (['instrumentModel', 'instrumentInstance', 'sensorCapability'].includes(node.kind)) {
    if (hasAny(text, ['ctd', 'adcp', 'sonar', 'sas', 'multibeam', 'bathym', 'hydrograph', 'acoustic', 'sound speed'])) return 'hydrographic_payloads';
    if (hasAny(text, ['camera', 'optical', 'lidar', 'radar', 'eo/ir', 'imagery', 'laser'])) return 'surveillance_sensors';
    if (hasAny(text, ['gnss', 'gps', 'ins', 'dvl', 'navigation', 'position', 'heading'])) return 'navigation_gnc';
    if (hasAny(text, ['satcom', 'telemetry', 'radio', 'communications', 'command', 'control'])) return 'communications_c2';
    return 'hydrographic_payloads';
  }
  if (hasAny(text, ['battery', 'power', 'generator', 'voltage', 'energy'])) return 'power_energy';
  if (hasAny(text, ['hull', 'mechanical', 'mount', 'propulsion', 'thruster', 'keel'])) return 'hull_mechanics';
  if (hasAny(text, ['autonomy', 'compute', 'processor', 'ros2', 'moos', 'algorithm'])) return 'autonomy_compute';
  if (hasAny(text, ['uas', 'uav', 'airborne', 'drone', 'vtol'])) return 'uas_airborne';
  if (hasAny(text, ['safety', 'standard', 'restriction', 'colregs', 'policy'])) return 'safety_standards';
  if (['scienceDomain', 'observedProperty', 'dataset', 'asset'].includes(node.kind)) return 'science_data';
  if (['projection', 'stacCollection', 'stacItem', 'isoSemanticSlot'].includes(node.kind)) return 'metadata_projection';
  if (['authority', 'destinationObservation', 'docucompComponent', 'componentReference', 'resolverObservation'].includes(node.kind)) return 'external_authority';
  if (['sourceArtifact', 'observation', 'claim', 'decision', 'canonicalFact', 'receipt', 'validationResult', 'driftFinding'].includes(node.kind)) return 'evidence_assurance';
  return 'evidence_assurance';
}

export function classifySystemTopologyRelation(edge: KnowledgeEdge): SystemTopologyRelationChannel {
  const predicate = edge.predicate.toUpperCase();
  if (hasAny(predicate, ['POWER', 'ENERG'])) return 'power';
  if (hasAny(predicate, ['COMMAND', 'CONTROL'])) return 'command_control';
  if (hasAny(predicate, ['ACOUSTIC', 'OPTICAL', 'SONAR', 'LIDAR', 'SENSES_VIA'])) return 'optical_acoustic';
  if (hasAny(predicate, ['CARRIED', 'CARRY', 'CONFIGURED_WITH', 'MOUNT', 'MECHANICAL', 'HAS_PLATFORM', 'USES_PLATFORM', 'HAS_INSTRUMENT', 'IMPLEMENTED_BY'])) return 'mechanical';
  if (hasAny(predicate, ['PRODUCED', 'HAS_ASSET', 'OBSERVABLE_BY', 'OBSERVATION', 'DATA', 'TELEMETRY', 'DISCOVERABLE_AS', 'REPRESENTED_AS', 'PROJECTS_TO'])) return 'data_telemetry';
  if (hasAny(predicate, ['AUTHORITY', 'GOVERN', 'VALIDATED', 'QUEUED_FOR_DESTINATION', 'DELIVERED_TO', 'REQUIRES_OR_BENEFITS_FROM', 'EVALUATES'])) return 'regulatory_operational';
  return 'semantic_lineage';
}

export function isSystemTopologyNode(node: KnowledgeNode): boolean {
  const domain = classifySystemTopologyDomain(node);
  return !['evidence_assurance', 'metadata_projection', 'external_authority'].includes(domain);
}

const distributeAround = (
  nodes: KnowledgeNode[], centerX: number, centerY: number, radiusX: number, radiusY: number,
  positions: Map<string, NodePosition>, visible: (node: KnowledgeNode) => boolean, cluster: string, layer: number
) => {
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  sorted.forEach((node, index) => {
    if (sorted.length === 1) {
      positions.set(node.id, { x: centerX, y: centerY, cluster, layer, visible: visible(node) });
      return;
    }
    const angle = (Math.PI * 2 * index) / sorted.length - Math.PI / 2;
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      cluster,
      layer,
      visible: visible(node),
    });
  });
};

export function computeSystemTopologyLayout(
  graph: BuiltGraph,
  mode: SystemTopologyLayoutMode,
  includeAssurance = false,
  selectedNodeId?: string
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const domainGroups = new Map<SystemTopologyDomain, KnowledgeNode[]>();
  graph.nodes.forEach((node) => {
    const domain = classifySystemTopologyDomain(node);
    const group = domainGroups.get(domain) || [];
    group.push(node);
    domainGroups.set(domain, group);
  });
  const visible = (node: KnowledgeNode) => includeAssurance || isSystemTopologyNode(node) || (!!selectedNodeId && node.id === selectedNodeId);

  if (mode === 'radial') {
    const centers: Record<SystemTopologyDomain, [number, number]> = {
      platform: [480, 310], hull_mechanics: [310, 390], power_energy: [315, 220], navigation_gnc: [480, 145],
      communications_c2: [650, 205], autonomy_compute: [650, 375], surveillance_sensors: [770, 315], hydrographic_payloads: [640, 500],
      uas_airborne: [795, 145], missions_operations: [480, 535], safety_standards: [165, 150], science_data: [250, 515],
      evidence_assurance: [120, 305], metadata_projection: [830, 500], external_authority: [835, 80],
    };
    (Object.keys(SYSTEM_TOPOLOGY_DOMAIN_CONFIG) as SystemTopologyDomain[]).forEach((domain) => {
      const nodes = domainGroups.get(domain) || [];
      const [x, y] = centers[domain];
      distributeAround(nodes, x, y, domain === 'platform' ? 62 : Math.min(74, 22 + nodes.length * 5), domain === 'platform' ? 48 : Math.min(58, 18 + nodes.length * 4), positions, visible, domain, SYSTEM_TOPOLOGY_DOMAIN_CONFIG[domain].layer);
    });
  } else if (mode === 'domain_cluster') {
    const orderedDomains = (Object.keys(SYSTEM_TOPOLOGY_DOMAIN_CONFIG) as SystemTopologyDomain[])
      .sort((a, b) => SYSTEM_TOPOLOGY_DOMAIN_CONFIG[a].order - SYSTEM_TOPOLOGY_DOMAIN_CONFIG[b].order)
      .filter((domain) => (domainGroups.get(domain) || []).length > 0);
    const cols = 4;
    orderedDomains.forEach((domain, domainIndex) => {
      const col = domainIndex % cols;
      const row = Math.floor(domainIndex / cols);
      distributeAround(domainGroups.get(domain) || [], 135 + col * 235, 105 + row * 145, 64, 42, positions, visible, domain, SYSTEM_TOPOLOGY_DOMAIN_CONFIG[domain].layer);
    });
  } else {
    const layerDomains: SystemTopologyDomain[][] = [
      ['missions_operations', 'safety_standards'],
      ['science_data', 'surveillance_sensors', 'hydrographic_payloads', 'uas_airborne'],
      ['navigation_gnc', 'communications_c2', 'autonomy_compute'],
      ['platform', 'hull_mechanics', 'power_energy'],
      ['evidence_assurance', 'metadata_projection', 'external_authority'],
    ];
    layerDomains.forEach((domains, layerIndex) => {
      const sorted = domains.flatMap((domain) => domainGroups.get(domain) || []).sort((a, b) => {
        const da = classifySystemTopologyDomain(a);
        const db = classifySystemTopologyDomain(b);
        return SYSTEM_TOPOLOGY_DOMAIN_CONFIG[da].order - SYSTEM_TOPOLOGY_DOMAIN_CONFIG[db].order || a.id.localeCompare(b.id);
      });
      const y = 78 + layerIndex * 125;
      const spacing = sorted.length > 1 ? Math.min(150, 810 / (sorted.length - 1)) : 0;
      const startX = sorted.length > 1 ? 75 : 480;
      sorted.forEach((node, index) => {
        const domain = classifySystemTopologyDomain(node);
        positions.set(node.id, { x: sorted.length > 1 ? startX + index * spacing : 480, y, cluster: domain, layer: layerIndex, visible: visible(node) });
      });
    });
  }

  graph.nodes.forEach((node, index) => {
    if (!positions.has(node.id)) {
      const domain = classifySystemTopologyDomain(node);
      positions.set(node.id, { x: 80 + (index % 7) * 125, y: 570, cluster: domain, layer: SYSTEM_TOPOLOGY_DOMAIN_CONFIG[domain].layer, visible: visible(node) });
    }
  });
  return positions;
}
