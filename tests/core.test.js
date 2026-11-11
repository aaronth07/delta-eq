const test=require('node:test');const assert=require('node:assert/strict');const D=require('../dist/core.js');const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);
test('log grid includes endpoints and equal ratios',()=>{const a=D.logGrid(20,20000,4);near(a[0],20);near(a[3],20000);near(a[1]/a[0],10);});
test('REW-like parser tolerates headers, phase and comments',()=>{const p=D.parseCurve('* REW export\nFrequency SPL Phase\n20 3.0 90\n100 2.0 0\n1000 0 -60\n');assert.equal(p.curve.length,3);assert.equal(p.skipped,1);});
test('comma CSV and scientific notation',()=>{assert.deepEqual(D.parseCurve('Frequency,Level\n2e1,3.5\n1000,-2.0').curve,[{f:20,db:3.5},{f:1000,db:-2}]);});
test('semicolon supports decimal commas',()=>{near(D.parseCurve('20,5;3,2\n1000,0;-2,4').curve[0].f,20.5);});
test('unsorted duplicates averaged, invalid rows skipped',()=>{const p=D.parseCurve('100 4\n20 1\n100 2\n0 5\n1000 NaN');assert.equal(p.duplicates,1);assert.equal(p.skipped,2);near(p.curve[1].db,3);});
test('invalid or single-point input rejected',()=>{assert.throws(()=>D.parseCurve('garbage'));assert.throws(()=>D.parseCurve('20 0\n20 1'));});
test('interpolation in logarithmic frequency without extrapolation',()=>{const c=[{f:100,db:0},{f:10000,db:20}];near(D.interpolate(c,1000),10);assert.equal(D.interpolate(c,10),null);assert.equal(D.interpolate(c,20000),null);});
test('zero gain is unity for every supported filter',()=>{for(const type of ['PK','LSC','HSC']){const r=D.response([{type,frequency:200,gain:0,q:.7}],D.logGrid(20,20000,50));r.forEach(x=>near(x,0));}});
test('peaking filter gain matches center',()=>{for(const gain of [-12,-3,3,12]){const c=D.coefficients({type:'PK',frequency:1000,gain,q:1});near(D.responseAt(c,1000),gain);}});
test('shelf DC and Nyquist endpoints, midpoint gain',()=>{for(const type of ['LSC','HSC']){const c=D.coefficients({type,frequency:1000,gain:6,q:Math.SQRT1_2});near(D.responseAt(c,0),type==='LSC'?6:0);near(D.responseAt(c,24000),type==='HSC'?6:0);near(D.responseAt(c,1000),3);}});
test('inverting a filter gain inverts its response',()=>{for(const type of ['PK','LSC','HSC']){const f={type,frequency:300,gain:8,q:1.1};const r=D.response([f,{...f,gain:-8}],D.logGrid(20,20000,100));r.forEach(x=>near(x,0,1e-5));}});
test('cascade dB equals sum and disabled filters ignored',()=>{const f={type:'PK',frequency:1000,gain:3,q:1};near(D.response([f,f],[1000])[0],6);near(D.response([{...f,enabled:false}],[1000])[0],0);});
test('coefficients stable for supported range',()=>{for(const type of ['PK','LSC','HSC'])for(const frequency of [10,1000,20000])for(const gain of [-24,24])for(const q of [.1,20]){const c=D.coefficients({type,frequency,gain,q});const[a0,a1,a2]=c.a;assert.ok(Math.abs(a2)<1+1e-12);assert.ok(1+a1+a2>0);assert.ok(1-a1+a2>0);}});
test('analysis strips scalar offset and respects overlap',()=>{const s=D.demo();s.measurement.points=[{f:100,db:60},{f:10000,db:60}];s.target.points=[{f:20,db:70},{f:20000,db:70}];s.filters=[];const a=D.analyze(s);near(a.lo,100);near(a.hi,10000);near(a.before,0);});
test('nonoverlap and out-of-range anchor fail explicitly',()=>{const s=D.demo();s.target.points=[{f:21000,db:0},{f:22000,db:0}];assert.throws(()=>D.analyze(s),/overlap/);s.target.points=[{f:1000,db:0},{f:10000,db:0}];assert.throws(()=>D.analyze(s),/Normalization/);});
test('band normalization cancels constant offset',()=>{const s=D.demo();s.normalization='band';s.filters=[];s.target.points=s.measurement.points.map(p=>({f:p.f,db:p.db+30}));near(D.analyze(s).before,0,1e-9);});
test('manual preference changes target, not measurement',()=>{const s=D.demo(),a=D.analyze(s);s.preference.bass=3;const b=D.analyze(s);near(b.measurement[0],a.measurement[0]);assert.ok(b.target[0]-a.target[0]>2.9);});
test('global preamp excluded from shape metrics',()=>{const s=D.demo(),a=D.analyze(s);s.preamp=-20;const b=D.analyze(s);assert.deepEqual(a.corrected,b.corrected);near(a.after,b.after);});
test('headroom contains full sampled combined response plus margin',()=>{const f=[{type:'PK',frequency:1000,gain:6,q:1}];const h=D.headroom(f);near(h.preamp,-7,.002);assert.ok(Math.max(...D.response(f,D.logGrid(1,24000,50000)))+h.preamp<=-.999);});
test('APO exports Q shelves and disabled rows',()=>{const s=D.demo();s.filters=[{type:'LSC',frequency:105,gain:3,q:.707,enabled:false}];const t=D.exportAPO(s);assert.match(t,/Filter 1: OFF LSC Fc 105 Hz Gain 3 dB Q 0.707/);assert.match(t,/Preamp: -1 dB/);});
test('CSV has headers and correct row count',()=>{const a=D.analyze(D.demo(),32);assert.equal(D.exportCSV(a).trim().split('\n').length,33);});
test('session roundtrip and shape validation',()=>{const s=D.demo();assert.deepEqual(D.validateState(JSON.parse(JSON.stringify(s))),s);assert.throws(()=>D.validateState({...s,version:2}));assert.throws(()=>D.validateState({...s,preamp:Infinity}));assert.throws(()=>D.validateState({...s,filters:[{type:'PK',frequency:30000,gain:0,q:1}]}));});
test('bounded fit recovers known synthetic bell',()=>{const f=D.logGrid(20,20000,256),truth=[{type:'PK',frequency:800,gain:-5,q:1.4}],d=D.response(truth,f);const fit=D.fitPeaks(f,d,48000,{count:1,min:20,max:20000});assert.ok(fit.after<.08,fit.after);assert.ok(fit.after<fit.before*.05);near(Math.log(fit.filters[0].frequency/800),0,.02);});
test('multi-filter fit improves demo and remains bounded',()=>{const a=D.analyze(D.demo(),256),fit=D.fitPeaks(a.freqs,a.desired,48000,{count:6,maxBoost:4,maxCut:8});assert.ok(fit.after<fit.before*.2,`${fit.before} to ${fit.after}`);fit.filters.forEach(f=>{assert.ok(f.gain<=4&&f.gain>=-8);assert.ok(f.q>=.3&&f.q<=6);});});
test('flat desired response yields no useless filters',()=>{const f=D.logGrid(20,20000,128),fit=D.fitPeaks(f,f.map(()=>0),48000);assert.equal(fit.filters.length,0);near(fit.after,0);});
test('fit obeys a zero-boost constraint',()=>{const f=D.logGrid(20,20000,128),fit=D.fitPeaks(f,f.map(()=>5),48000,{maxBoost:0,maxCut:12});fit.filters.forEach(x=>assert.ok(x.gain<=0));});

test('empty CSV values rejected, quoted numeric fields accepted',()=>{const p=D.parseCurve('20,\n30,2\n1000,3');assert.equal(p.curve.length,2);const q=D.parseCurve('"20","3.5"\n"1000","-2"');near(q.curve[0].db,3.5);});

test('tab data is not silently reinterpreted as comma-delimited decimals',()=>{assert.throws(()=>D.parseCurve('20,5\t3,2\n100,5\t2,3'));const p=D.parseCurve('20.5\t3.2\n100.5\t2.3');near(p.curve[0].f,20.5);});

test('headroom resolves high-Q peaks and shelf resonances near Nyquist',()=>{
 for(const type of ['PK','LSC','HSC']){
  const filters=[{type,frequency:23900,gain:24,q:20,enabled:true}];
  const h=D.headroom(filters,48000);
  const dense=D.response(filters,Array.from({length:20001},(_,i)=>23800+i*.01),48000);
  assert.ok(Math.max(...dense)+h.preamp<=-.999,`${type}: peak missed`);
  if(type==='PK')near(h.peak,24,1e-5);
 }
});
test('missing TSV level is skipped rather than replaced with phase',()=>{
 const p=D.parseCurve('20\t\t90\n100\t2\t0\n1000\t3\t-60');
 assert.equal(p.skipped,1);assert.deepEqual(p.curve,[{f:100,db:2},{f:1000,db:3}]);
});

test('session rejects numerically degenerate frequencies next to Nyquist',()=>{
 const s=D.demo();s.filters=[{type:'PK',frequency:23999.99999999999,gain:24,q:20}];
 assert.throws(()=>D.validateState(s),/1 Hz below Nyquist/);
 s.filters[0].frequency=23999;assert.ok(Number.isFinite(D.headroom(D.validateState(s).filters).peak));
});
test('session rejects null, blank, boolean and string curve levels',()=>{
 for(const db of [null,'',false,'3']){const s=D.demo();s.measurement.points[0].db=db;assert.throws(()=>D.validateState(s),/must be numbers/);}
});

test('log grid rejects fractional counts and nonfinite ranges',()=>{
 for(const count of [2.5,NaN,Infinity,1])assert.throws(()=>D.logGrid(1,10,count),/integer point count/);
 assert.throws(()=>D.logGrid(1,Infinity,3),/finite positive/);
 assert.throws(()=>D.analyze(D.demo(),2.5),/integer point count/);
});

test('missing first TSV field is not shifted into the frequency column',()=>{
 const p=D.parseCurve('\t3\t90\n100\t2\t0\n1000\t3\t-60');
 assert.equal(p.skipped,1);assert.deepEqual(p.curve,[{f:100,db:2},{f:1000,db:3}]);
});
