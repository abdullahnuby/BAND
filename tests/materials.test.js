import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MATERIAL_RATES, BRICK_CATALOG, mortarMaterials, concreteMaterials,
  masonryMaterials, paintMaterials, floorMaterials, insulationMaterials,
  timberDoorMaterials, facadePanelMaterials, facadeFinishMaterials, apartmentSpaceQuantities,
  apartmentFloorMaterialGroups, buildMaterialDemand,
} from '../src/shared/material-rules.js';

const near=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

test('material defaults are explicit and editable rates do not mutate defaults',()=>{
  const demand=buildMaterialDemand({state:{},rates:{...DEFAULT_MATERIAL_RATES,floorWastePct:10}});
  assert.equal(demand.rates.floorWastePct,10);
  assert.equal(DEFAULT_MATERIAL_RATES.floorWastePct,7);
  assert.equal(DEFAULT_MATERIAL_RATES.waterproofUpturnPct,10);
});

test('concrete ingredient estimate applies dry-volume factor and editable proportions',()=>{
  const q=concreteMaterials({concreteM3:1,mix:'rcc',cementParts:1,sandParts:2,aggregateParts:4,dryVolumeFactor:1.54,wastePct:0});
  near(q.dryIngredientsM3,1.54); near(q.cementKg,316.8); near(q.sandM3,0.44); near(q.aggregateM3,0.88); assert.equal(q.cementBags,7);
});

test('plaster mortar converts area and thickness to ingredients',()=>{
  const q=mortarMaterials({areaM2:100,thicknessMm:15,cementParts:1,sandParts:4,dryVolumeFactor:1.33,wastePct:0});
  near(q.wetVolumeM3,1.5); near(q.dryVolumeM3,1.995); near(q.sandM3,1.596); near(q.cementBagsExact,1.995/5*1440/50);
});

test('masonry procurement includes wastage and accepts custom brick sizes/rates',()=>{
  const q=masonryMaterials({netAreaM2:10,thicknessCm:12,brickId:BRICK_CATALOG[0].id,wastePct:5});
  assert.equal(q.piecesBeforeWaste,666); assert.equal(q.piecesToOrder,700);
  const custom=masonryMaterials({netAreaM2:10,thicknessCm:25,customBrick:{label:'طوب تجريبي 24×11×7 سم',lengthCm:24,widthCm:11,heightCm:7,pcsPerM2_12cm:62,pcsPerM2_25cm:124},wastePct:0});
  assert.equal(custom.brick.label,'طوب تجريبي 24×11×7 سم'); assert.equal(custom.piecesToOrder,1240);
});

test('paint and tile procurement include explicit waste and pack rounding',()=>{
  const paint=paintMaterials({areaM2:100,sealerCoverageM2L:10,puttyKgM2:1,puttyBagKg:20,paintCoverageM2L:10,paintCoats:2,paintPailL:18,wastePct:0});
  near(paint.sealerLitres,10); near(paint.puttyKg,100); near(paint.paintLitres,20); assert.equal(paint.paintPails,2); assert.equal(paint.puttyBags,5);
  assert.equal(paintMaterials({areaM2:100,sealerCoverageM2L:10,sealerPailL:18,wastePct:0}).sealerPails,1);
  const floor=floorMaterials({areaM2:10,tileLengthCm:50,tileWidthCm:50,wastePct:10,method:'adhesive',adhesiveKgM2:4,groutKgM2:.2});
  assert.equal(floor.tilePieces,44); near(floor.adhesiveKg,44); near(floor.groutKg,2.2); assert.equal(floor.adhesiveBags25Kg,2);
});

test('insulation and facade panels calculate preliminary purchase packs',()=>{
  const i=insulationMaterials({areaM2:20,rateKgM2:3,wastePct:10,packageKg:20}); near(i.requiredKg,66); assert.equal(i.packageCount,4);
  const f=facadePanelMaterials({areaM2:10,panelWidthCm:100,panelHeightCm:200,wastePct:10}); near(f.orderAreaM2,11); assert.equal(f.panelCount,6);
});

test('apartment estimate derives face finishes, not masonry quantity from room perimeter',()=>{
  const q=apartmentSpaceQuantities({length:4,width:3,height:3,doorOpeningsM2:1.8,windowOpeningsM2:1.2});
  near(q.floorAreaM2,12); near(q.grossWallAreaM2,42); near(q.netWallAreaM2,39); assert.equal(q.openingsFit,true);
  const demand=buildMaterialDemand({state:{rooms:[{length:4,width:3,height:3,walls:[{width:4,height:3,openings:[]}]}],masonryWalls:[]}});
  near(demand.totals.masonryM2,0); near(demand.totals.masonryM3,0); near(demand.totals.plasterM2,24);
});

test('contractor materials use the physical wall register and editable masonry mortar rate',()=>{
  const wall={id:'w1',wallRef:'W-1',location:'الدور الأرضي / محور A-B',length:4,height:3,thicknessCm:12,qty:1,measurementUnit:'m2',brickId:'red-solid-25x12x6',openings:[{width:1,height:2,qty:1}]};
  const demand=buildMaterialDemand({state:{masonryWalls:[wall],rooms:[{length:4,width:3,height:3,walls:[{width:4,height:3,openings:[]}]}]},rates:{...DEFAULT_MATERIAL_RATES,masonryMortarM3PerM2_12cm:0.02,brickWastePct:5}});
  near(demand.totals.masonryM2,10); near(demand.totals.masonryM3,0); assert.equal(demand.masonry.groups.length,1); assert.equal(demand.masonry.groups[0].piecesToOrder,700); near(demand.masonry.groups[0].mortarM3,10*0.02*1.05);
});

test('wood volume and hardware are grouped by species',()=>{
  const q=timberDoorMaterials({items:[{material:'خشب',woodSpecies:'زان',width:0.9,height:2.1,qty:2},{material:'خشب',woodSpecies:'سويدي',width:1,height:2.1,qty:1}],wastePct:0,hingesPerDoor:3,locksPerDoor:1,handlesPerDoor:1});
  assert.equal(q.doorsCount,3); assert.equal(q.speciesGroups.length,2); assert.equal(q.hinges,9); assert.equal(q.locks,3); assert.equal(q.handles,3); assert.ok(q.woodGrossM3>0);
});

test('different insulation products are kept in separate procurement groups',()=>{
  const demand=buildMaterialDemand({state:{insulation:[
    {kind:'عزل مائي',material:'منتج أ',measurementUnit:'m2',length:5,width:4,qty:1,rateKgM2:2},
    {kind:'عزل حراري',material:'منتج ب',measurementUnit:'m2',length:2,width:3,qty:1,rateKgM2:4},
    {kind:'شريط عزل',material:'رول',measurementUnit:'lm',length:12,qty:1},
  ]}});
  near(demand.totals.insulationM2,26); assert.equal(demand.insulation.groups.length,2); assert.deepEqual(demand.insulation.groups.map(x=>x.kind).sort(),['عزل حراري','عزل مائي']);
  near(demand.insulation.groups.find(x=>x.material==='منتج أ').requiredKg,5*4*2*1.08);
  near(demand.insulation.groups.find(x=>x.material==='منتج ب').requiredKg,2*3*4*1.08);
});


test('apartment estimate keeps finishes and tile formats in separate order groups',()=>{
  const groups=apartmentFloorMaterialGroups({spaces:[
    {name:'غرفة 1',length:4,width:3,floorFinish:'سيراميك',tileLengthCm:60,tileWidthCm:60},
    {name:'غرفة 2',length:3,width:3,floorFinish:'سيراميك',tileLengthCm:60,tileWidthCm:60},
    {name:'حمام',length:2,width:2,floorFinish:'سيراميك',tileLengthCm:30,tileWidthCm:30},
    {name:'ريسبشن',length:5,width:4,floorFinish:'بورسلين',tileLengthCm:120,tileWidthCm:60},
  ],rates:{...DEFAULT_MATERIAL_RATES,floorWastePct:10}});
  assert.equal(groups.length,3);
  const standard=groups.find(g=>g.tileLengthCm===60);
  near(standard.areaM2,21);
  assert.equal(standard.demand.tilePieces,65);
  const bathroom=groups.find(g=>g.tileLengthCm===30);
  near(bathroom.areaM2,4);
  assert.equal(bathroom.demand.tilePieces,49);
  const porcelain=groups.find(g=>g.material==='بورسلين');
  near(porcelain.areaM2,20);
  assert.equal(porcelain.demand.tilePieces,31);
});

test('modern facade estimate separates glass from panelized cladding',()=>{
  const groups=facadeFinishMaterials({facades:[{width:10,height:4,openings:[{width:2,height:1.5,qty:2}],finishes:[
    {type:'زجاج واجهات',method:'net'},
    {type:'كلادينج ألواح',method:'percent',value:50},
  ]}],panelWidthCm:100,panelHeightCm:200,wastePct:10});
  assert.equal(groups.length,2);
  const glass=groups.find(g=>g.type==='زجاج واجهات');
  near(glass.netAreaM2,34); near(glass.orderAreaM2,37.4); assert.equal(glass.panelCount,null);
  const cladding=groups.find(g=>g.type==='كلادينج ألواح');
  near(cladding.netAreaM2,17); near(cladding.orderAreaM2,18.7); assert.equal(cladding.panelCount,10);
});
