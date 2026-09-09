import { DocuCompSlotProfile } from '../types';
import slotProfileJson from './docucomp-slot-profile.json';

export const DOCUCOMP_SLOT_PROFILE: DocuCompSlotProfile = slotProfileJson as DocuCompSlotProfile;

export function getSlotRuleForRole(role?: string) {
  if (!role) return undefined;
  return DOCUCOMP_SLOT_PROFILE.rules.find(
    (r) => (r.componentRole && r.componentRole.toLowerCase() === role.toLowerCase()) ||
           (role === 'contact' && r.componentRole === 'pointOfContact')
  );
}
