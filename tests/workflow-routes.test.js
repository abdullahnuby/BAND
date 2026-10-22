import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkspaceRoute, startModuleForWorkflow, resolveWorkflowSelection, WORKFLOW_MODULES } from '../src/shared/workflow-routes.js';
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

test('apartment estimate accepts high-level inputs and creates a material estimate', () => {
  assert.match(html, /<form id="quickEstimateForm"/);
  assert.match(html, /if\(id==='quickEstimateForm'\)/);
  assert.match(html, /QuickEstimate\.estimateQuickApartment\(input,S\.materialRates\|\|\{\}\)/);
  assert.match(html, /S\.quickEstimate=input/);
  assert.match(html, /function renderQuickEstimateResults\(result\)/);
  assert.match(html, /function renderApartmentEstimate\(\)/);
});


test('read-only material summary tables do not require an editable module record', () => {
  assert.match(html, /function tableHtml\(headers,rows,mod\)\{[\s\S]*?const withActions=typeof mod==='string'&&Array\.isArray\(S\[mod\]\)/);
  assert.match(html, /const actions=record\?`<td class=\"td-actions\">/);
  assert.match(html, /function materialTable\(heads,rows\)\{return rows\.length\?tableHtml\(heads,rows\):empty\(/);
});


test('mobile picker and navigation explicitly switch to the relevant working flow', () => {
  assert.deepEqual(resolveWorkflowSelection('welcome', 'materials'), { mode: 'contractor', active: 'materials' });
  assert.deepEqual(resolveWorkflowSelection('welcome', 'apartmentEstimate'), { mode: 'estimate', active: 'apartmentEstimate' });
  assert.deepEqual(resolveWorkflowSelection('estimate', 'materials'), { mode: 'contractor', active: 'materials' });
  assert.deepEqual(resolveWorkflowSelection('contractor', 'concrete'), { mode: 'contractor', active: 'concrete' });
  assert.deepEqual(resolveWorkflowSelection('welcome', 'earthworks'), { mode: 'engineering', active: 'earthworks' });
});

test('rendering errors replace stale content with a visible recovery panel', () => {
  assert.match(html, /catch\(error\)\s*\{[\s\S]*تعذر فتح مساحة العمل/);
  assert.match(html, /data-action=\"retry-render\"/);
  assert.match(html, /case'retry-render':render\(\);break/);
});
