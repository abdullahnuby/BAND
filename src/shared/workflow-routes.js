/**
 * Central route policy for BAND's three user journeys.
 * A persisted old `home` route must never strand users on an intro-only screen.
 */
export const WORKFLOW_MODULES = Object.freeze({
  welcome: Object.freeze(['home']),
  engineering: Object.freeze(['home', 'concrete', 'earthworks', 'masonry', 'insulation', 'plaster', 'paint', 'floors', 'doorsWindows', 'sanitary', 'stairs', 'facades', 'report']),
  contractor: Object.freeze(['materials', 'concrete', 'earthworks', 'masonry', 'insulation', 'plaster', 'paint', 'floors', 'doorsWindows', 'sanitary', 'stairs', 'facades', 'report']),
  estimate: Object.freeze(['apartmentEstimate', 'materials', 'report']),
});

export const WORKFLOW_START_MODULE = Object.freeze({
  welcome: 'home',
  engineering: 'home',
  contractor: 'materials',
  estimate: 'apartmentEstimate',
});

export function resolveWorkspaceRoute(mode, activeModule) {
  const normalizedMode = Object.hasOwn(WORKFLOW_MODULES, mode) ? mode : 'welcome';
  const allowed = WORKFLOW_MODULES[normalizedMode];
  if (!allowed.includes(activeModule)) return WORKFLOW_START_MODULE[normalizedMode];
  return activeModule;
}

export function startModuleForWorkflow(mode) {
  return WORKFLOW_START_MODULE[Object.hasOwn(WORKFLOW_START_MODULE, mode) ? mode : 'welcome'];
}
