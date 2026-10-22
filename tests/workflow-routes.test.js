import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkspaceRoute, startModuleForWorkflow, WORKFLOW_MODULES } from '../src/shared/workflow-routes.js';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('contractor always opens the real materials workspace, including stale persisted home state', () => {
  assert.equal(startModuleForWorkflow('contractor'), 'materials');
  assert.equal(resolveWorkspaceRoute('contractor', 'home'), 'materials');
  assert.equal(resolveWorkspaceRoute('contractor', ''), 'materials');
  assert.equal(resolveWorkspaceRoute('contractor', 'materials'), 'materials');
  assert.ok(!WORKFLOW_MODULES.contractor.includes('home'));
});

test('apartment estimate always opens the real estimate form, including stale persisted home state', () => {
  assert.equal(startModuleForWorkflow('estimate'), 'apartmentEstimate');
  assert.equal(resolveWorkspaceRoute('estimate', 'home'), 'apartmentEstimate');
  assert.equal(resolveWorkspaceRoute('estimate', ''), 'apartmentEstimate');
  assert.equal(resolveWorkspaceRoute('estimate', 'apartmentEstimate'), 'apartmentEstimate');
  assert.ok(!WORKFLOW_MODULES.estimate.includes('home'));
});

test('mode landing pages cannot trap a user on intro-only cards', () => {
  assert.match(html, /if\(S\.ui\.mode==='contractor'\)return renderMaterials\(\);/);
  assert.match(html, /if\(S\.ui\.mode==='estimate'\)return renderApartmentEstimate\(\);/);
  assert.match(html, /S\.ui\.active=resolveWorkspaceRoute\(S\.ui\.mode,S\.ui\.active\)/);
  assert.match(html, /S\.ui\.active=startModuleForWorkflow\(S\.ui\.mode\)/);
});

test('contractor entry form is connected to a submit handler and results table', () => {
  assert.match(html, /<form id="contractorEntryForm">/);
  assert.match(html, /document\.addEventListener\('submit',e=>\{if\(e\.target\.matches\('#contractorEntryForm'\)\)\{e\.preventDefault\(\);submitContractorEntry\(e\.target\);return\}/);
  assert.match(html, /S\.contractorEntries\.push\(entry\);persist\(\);render\(\);showToast\('تم حساب احتياج الخامات وإضافته إلى القائمة\.'/);
  assert.match(html, /function contractorEntriesTable\(\)/);
});

test('apartment estimate form adds spaces, validates openings, and renders results', () => {
  assert.match(html, /<form id="estimateSpaceForm">/);
  assert.match(html, /if\(id==='estimateSpaceForm'\)/);
  assert.match(html, /S\.apartmentSpaces\.push\(space\)/);
  assert.match(html, /function renderApartmentEstimate\(\)/);
  assert.match(html, /function estimateTotal\(\)/);
});
