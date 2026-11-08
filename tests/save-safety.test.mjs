import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY,freshState,readState,createSaveSession} from '../src/model.js';
const store=raw=>{const m=new Map(raw===undefined?[]:[[STORAGE_KEY,raw]]);return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('malformed and future records are protected from overwrite and reset',()=>{
 for(const raw of ['{bad',JSON.stringify({version:99}), '[]','null']){const db=store(raw),load=readState(db),session=createSaveSession(db,load);assert.equal(load.blocked,true);assert.equal(session.save(freshState()).ok,false);assert.equal(session.backup(),false);assert.equal(db.getItem(STORAGE_KEY),raw);}
});
test('two tabs cannot overwrite one another, even after a rejected write',()=>{const db=store(),a=createSaveSession(db),b=createSaveSession(db),s=freshState();s.lastRoute='map';assert.equal(a.save(s).ok,true);assert.equal(b.save(freshState()).ok,false);assert.equal(b.save(freshState()).ok,false);assert.equal(b.backup(),false);assert.equal(JSON.parse(db.getItem(STORAGE_KEY)).lastRoute,'map');});
test('same session can save repeatedly and keeps a recoverable pre-reset copy',()=>{const db=store(),a=createSaveSession(db);const s=freshState();a.save(s);s.lastRoute='map';a.save(s);assert.equal(a.backup(),true);a.save(freshState());assert.equal(JSON.parse(db.getItem(STORAGE_KEY+'-before-reset')).lastRoute,'map');});
test('storage errors remain visible and never report success',()=>{const db={getItem(){return null},setItem(){throw Error('quota')}};assert.equal(createSaveSession(db).save(freshState()).ok,false);});
