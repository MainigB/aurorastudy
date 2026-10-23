import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const accountSource=readFileSync(new URL('../public/account.js',import.meta.url),'utf8');
function harness(){
 const elements=new Map(),requests=[];
 const node=()=>({open:false,isConnected:true,innerHTML:'',textContent:'',classList:{toggle(){}},append(){},after(){},addEventListener(type,fn){this[type]=fn},showModal(){this.open=true;this.shows=(this.shows||0)+1},close(){this.open=false;this.closeEvent?.()},querySelector(){return node()}});
 const dialog=node();let html='';dialog.writes=0;Object.defineProperty(dialog,'innerHTML',{get:()=>html,set:value=>{html=value;dialog.writes++}});dialog.addEventListener=(type,fn)=>{if(type==='close')dialog.closeEvent=fn};
 const document={querySelectorAll:()=>[],body:node(),createElement:tag=>tag==='dialog'?dialog:node(),querySelector:selector=>{if(!elements.has(selector))elements.set(selector,node());return elements.get(selector)}};
 const window={addEventListener(){}};
 const context={window,document,AuroraDialogs:{prepare(){}},AbortController,setTimeout,clearTimeout,fetch:()=>new Promise(resolve=>requests.push(data=>resolve({ok:true,json:async()=>data}))),console};
 vm.runInNewContext(accountSource,context);
 return {api:window.AuroraAccount,dialog,requests,elements};
}

async function loginHarness(h,id,isAdmin,reload=false){
 const pending=reload?h.api.reload():h.api.init(()=>{},()=>({}));
 h.requests.shift()({user:{id,name:'Teste',email:'teste@example.test'}});
 await new Promise(setImmediate);h.requests.shift()({state:{},version:0});
 await new Promise(setImmediate);h.requests.shift()({isAdmin});await pending;
}
test('free navigation is opt-in for an authenticated admin and resets on account change or revocation',async()=>{
 const h=harness();assert.equal(h.api.setFreeNavigation(true),false);
 await loginHarness(h,'admin',true);assert.equal(h.api.freeNavigation(),false);
 assert.equal(h.api.setFreeNavigation(true),true);assert.equal(h.api.freeNavigation(),true);
 h.api.setFreeNavigation(false);assert.equal(h.api.freeNavigation(),false);
 h.api.setFreeNavigation(true);await loginHarness(h,'other-admin',true,true);assert.equal(h.api.freeNavigation(),false);
 h.api.setFreeNavigation(true);await loginHarness(h,'other-admin',false,true);assert.equal(h.api.freeNavigation(),false);assert.equal(h.api.setFreeNavigation(true),false);
});
test('anonymous startup leaves the landing page without forcing a login popup',async()=>{
 const h=harness(),init=h.api.init(()=>{},()=>({}));h.requests.shift()(null);await init;
 assert.equal(h.dialog.open,false);assert.equal(h.api.isReady(),false);assert.equal(h.dialog.writes,0);
});
test('late initial session response does not rebuild an already opened login form',async()=>{
 const h=harness(),init=h.api.init(()=>{},()=>({}));
 h.api.open();h.elements.get('#account-form').draft='typed credentials';const markup=h.dialog.innerHTML;
 h.requests.shift()(null);await init;
 assert.equal(h.dialog.open,true);assert.equal(h.dialog.shows,1);assert.equal(h.dialog.writes,1);assert.equal(h.dialog.innerHTML,markup);assert.equal(h.elements.get('#account-form').draft,'typed credentials');
});
test('late anonymous session does not reopen a login dialog explicitly dismissed by user',async()=>{
 const h=harness(),init=h.api.init(()=>{},()=>({}));h.api.open();h.dialog.close();h.requests.shift()(null);await init;assert.equal(h.dialog.open,false);assert.equal(h.dialog.shows,1);
});
test('application keeps study dialog and draft intact on state hydration but closes on explicit account reset',()=>{
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const registration=app.split('\n').find(line=>line.includes('window.AuroraAccount.init('));
 let callback,renderCount=0;const dialog={open:true,answer:'unsaved working text',close(){this.open=false}};
 const context={document:{querySelector:()=>null},state:{},window:{AuroraAccount:{init(fn){callback=fn}}},$:()=>dialog,render(){renderCount++}};
 vm.runInNewContext(registration,context);
 callback({bookPage:36},{resetStudy:false});assert.equal(dialog.open,true);assert.equal(dialog.answer,'unsaved working text');assert.equal(renderCount,1);
 callback({bookPage:37});assert.equal(dialog.open,true);
 callback({},{resetStudy:true});assert.equal(dialog.open,false);
});
