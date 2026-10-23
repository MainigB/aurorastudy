import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import journey from '../public/journey-engine.js';
test('free reading advances without awarding pages and normal mode still confirms the pending page',()=>{
 let free=true,opened=null,saves=0;const nodes=new Map();const $=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:'',before(){},remove(){},close(){}});return nodes.get(s)};
 const state={readPages:[],done:{}};
 const context={AuroraAccount:{isReady:()=>true,freeNavigation:()=>free},AuroraJourney:journey,state,all:[],$,document:{querySelector:$,querySelectorAll:()=>[],createElement:()=>({})},openCompletePage:p=>opened=p,save:()=>saves++,toast(){}};
 vm.createContext(context);vm.runInContext(readFileSync(new URL('../public/journey.js',import.meta.url),'utf8'),context);
 context.mountJourneyPage(1);$('#journey-page-next').onclick();assert.equal(opened,29);assert.equal(state.readPages.length,0);assert.equal(saves,0);
 free=false;context.mountJourneyPage(1);$('#journey-page-next').onclick();assert.deepEqual(state.readPages,[1]);assert.equal(saves,1);assert.equal(opened,29);
});
test('stage browser rejects access when free navigation is disabled',()=>{
 const context={AuroraAccount:{isReady:()=>true,freeNavigation:()=>false},show:()=>{throw Error('should not open')}};
 vm.createContext(context);vm.runInContext(readFileSync(new URL('../public/journey.js',import.meta.url),'utf8'),context);context.openJourneyStage(369,396,'IaC');
});
