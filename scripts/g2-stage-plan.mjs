const plans = {
  's58-unknown': {wake: false, stimulus: 'submit', requiresQQ: false},
  's58-organization': {wake: false, stimulus: 'submit', requiresQQ: false},
  's58-organization2': {wake: false, stimulus: 'submit', requiresQQ: false},
  's58-organization3': {wake: false, stimulus: 'submit', requiresQQ: false, editCore: true},
  's58-goal': {wake: false, stimulus: 'submit', requiresQQ: false, editCore: true},
  's58-recall': {wake: false, stimulus: 'submit', requiresQQ: false},
  's59-web': {wake: true, stimulus: 'none', requiresQQ: false},
  's59-web2': {wake: true, stimulus: 'none', requiresQQ: false},
  's59-userweb': {wake: false, stimulus: 'submit', requiresQQ: false},
  's59-contact': {wake: true, stimulus: 'none', requiresQQ: true},
  's59-contact2': {wake: true, stimulus: 'none', requiresQQ: true},
  's60-chain': {wake: true, stimulus: 'submit', requiresQQ: true},
  'chain-talk': {wake: false, stimulus: 'submit', requiresQQ: false},
  'chain-web': {wake: true, stimulus: 'none', requiresQQ: false},
  'chain-web2': {wake: true, stimulus: 'none', requiresQQ: false},
  'chain-web3': {wake: false, stimulus: 'submit', requiresQQ: false},
  'chain-web4': {wake: true, stimulus: 'none', requiresQQ: false, editCore: true},
  'chain-contact': {wake: true, stimulus: 'none', requiresQQ: true},
  'chain-contact2': {wake: true, stimulus: 'none', requiresQQ: true, editCore: true},
  'chain-contact3': {wake: false, stimulus: 'submit', requiresQQ: true, editCore: true},
  'chain-contact4': {wake: false, stimulus: 'submit', requiresQQ: true, contactRules: true, editCore: true},
  'chain-contact5': {wake: true, stimulus: 'none', requiresQQ: true, editCore: true},
  'chain-contact6': {wake: true, stimulus: 'none', requiresQQ: true, editCore: true},
  'a32-talk': {wake: false, stimulus: 'submit', requiresQQ: true, editCore: true},
  'a32-contact': {wake: true, stimulus: 'none', requiresQQ: true, contactRules: true, editCore: true},
  'a32-contact2': {wake: true, stimulus: 'none', requiresQQ: true, contactRules: true, editCore: true},
  'a32-contact3': {wake: true, stimulus: 'none', requiresQQ: true, contactRules: true, editCore: true},
  'a32-observe': {wake: true, stimulus: 'none', requiresQQ: true, contactRules: true},
  'a32-observe2': {wake: true, stimulus: 'none', requiresQQ: true, contactRules: true, editCore: true},
  'a32-share': {wake: true, stimulus: 'none', requiresQQ: true, contactRules: true, editCore: true},
  'a28-dual-entry': {wake: false, stimulus: 'submit', requiresQQ: true, qqInbound: true},
  'a30-recall': {wake: false, stimulus: 'submit', requiresQQ: true, qqInbound: true, qqInboundMarker: 'A30-QQ-CROSS-9T6C', extraPanelStimuli: 1, postQQStimulus: true},
  'a31-base': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-seed': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-seed-save': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-correct': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-correct-save': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-correct2': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-organize': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-after-cleanup': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-confirm': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-recall': {wake: false, stimulus: 'submit', requiresQQ: true},
  'a31-clean-seed': {wake: false, stimulus: 'submit', requiresQQ: false, extraPanelStimuli: 1},
  'a31-clean-correct': {wake: false, stimulus: 'submit', requiresQQ: false},
  'a31-clean-correct-save': {wake: false, stimulus: 'submit', requiresQQ: false},
  'a31-clean-organize': {wake: false, stimulus: 'submit', requiresQQ: false},
  'a31-clean-after-cleanup': {wake: false, stimulus: 'submit', requiresQQ: false},
  'a31-clean-confirm': {wake: false, stimulus: 'submit', requiresQQ: false, extraPanelStimuli: 1},
  'a31-clean-recall': {wake: false, stimulus: 'submit', requiresQQ: false},
  'a31-clean-status': {wake: false, stimulus: 'submit', requiresQQ: false},
  'a34-observe1': {wake: true, stimulus: 'none', requiresQQ: true},
  'a34-observe2': {wake: true, stimulus: 'none', requiresQQ: true},
  'a34-observe3': {wake: true, stimulus: 'none', requiresQQ: true},
  'a34-clean-seed': {wake: false, stimulus: 'submit', requiresQQ: false},
  'a34-clean-rest': {wake: true, stimulus: 'none', requiresQQ: false},
  'a34-clean-web1': {wake: true, stimulus: 'none', requiresQQ: false},
  'a34-clean-web2': {wake: true, stimulus: 'none', requiresQQ: false},
  'a34-clean-rest2': {wake: true, stimulus: 'none', requiresQQ: false},
  'a34-clean-rest3': {wake: true, stimulus: 'none', requiresQQ: false},
  'a34-clean-restpermission': {wake: false, stimulus: 'submit', requiresQQ: false},
  'a34-clean-rest4': {wake: true, stimulus: 'none', requiresQQ: false},
  'b-talk': {wake: false, stimulus: 'submit', requiresQQ: false, contactRules: true, editCore: true},
  'b-talk2': {wake: false, stimulus: 'submit', requiresQQ: true, editCore: true},
  'b-explore': {wake: true, stimulus: 'none', requiresQQ: false, contactRules: true},
  'b-explore2': {wake: true, stimulus: 'none', requiresQQ: true, contactRules: true, editCore: true},
  'b-explore3': {wake: true, stimulus: 'none', requiresQQ: true, contactRules: true, editCore: true},
  'chain-correct': {wake: false, stimulus: 'submit', requiresQQ: false, editCore: true},
  'chain-migrate': {wake: false, stimulus: 'submit', requiresQQ: false},
};

export const KNOWN_STAGES = Object.freeze(Object.keys(plans));

export function getStagePlan(stage) {
  const plan = plans[stage];
  if (!plan) throw new Error('KNOWN_STAGE_REQUIRED');
  return {contactRules: false, editCore: false, ...plan};
}

export function validateStageLimits(stage, limits) {
  const plan = getStagePlan(stage);
  const qqSend = Number(limits.qqSend ?? 0);
  const qqMetadata = Number(limits.qqMetadata ?? 0);
  if (!plan.requiresQQ && (qqSend > 0 || qqMetadata > 0)) {
    throw new Error('QQ_PREREQUISITE_NOT_DECLARED');
  }
  if (plan.requiresQQ && qqMetadata < 3) {
    throw new Error('QQ_METADATA_CAP_REQUIRED');
  }
  return plan;
}
