/* REAL CAR SIMULATOR INDONESIA - Three.js r128 */
(function(){
'use strict';
var S=80,HALF=31,LIM=4.5*S+6,TOUCH=matchMedia('(pointer:coarse)').matches;
var $=function(i){return document.getElementById(i)},rnd=Math.random;
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var DEFS=[
 {n:'Garuda GT',t:'Mobil sport',c:0xd62828,top:260,acc:15,L:4.5,W:1.9,H:.5,cab:.42,cabL:1.7,spoil:1,wr:.34},
 {n:'Komodo RS',t:'Mobil sport',c:0xffb703,top:240,acc:13.5,L:4.3,W:1.85,H:.52,cab:.45,cabL:1.8,spoil:1,wr:.34},
 {n:'Bromo Hyper',t:'Supercar',c:0x1d6fe0,top:310,acc:18,L:4.7,W:2,H:.46,cab:.38,cabL:1.6,spoil:1,wr:.35},
 {n:'Sedan Nusantara',t:'Mobil biasa',c:0xb8c0c8,top:185,acc:8.5,L:4.6,W:1.8,H:.7,cab:.55,cabL:2.3,wr:.34},
 {n:'SUV Rimba',t:'Mobil biasa',c:0x2a7f4f,top:170,acc:8,L:4.5,W:1.9,H:.95,cab:.6,cabL:2.5,wr:.42},
 {n:'City Mungil',t:'Mobil biasa',c:0xf28c28,top:150,acc:7.5,L:3.6,W:1.65,H:.8,cab:.6,cabL:1.9,wr:.3}];
var COLORS=[0xd62828,0xffb703,0x1d6fe0,0xe9ecef,0x22252b,0x2a7f4f,0x8e44ad,0xf28c28];

/* ---------- renderer / scene ---------- */
var renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:!TOUCH,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,TOUCH?1.5:2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;
var scene=new THREE.Scene(),sky=new THREE.Color(0x8fcbff);
scene.background=sky;scene.fog=new THREE.Fog(sky,90,TOUCH?420:560);
var camera=new THREE.PerspectiveCamera(62,1,.15,900);
var hemi=new THREE.HemisphereLight(0xcfe6ff,0x445533,.9);scene.add(hemi);
var sun=new THREE.DirectionalLight(0xfff1d6,1.6);
var sm=TOUCH?1024:2048;sun.castShadow=true;sun.shadow.mapSize.set(sm,sm);
var sc=sun.shadow.camera;sc.left=sc.bottom=-70;sc.right=sc.top=70;sc.near=1;sc.far=320;sun.shadow.bias=-.0006;
scene.add(sun,sun.target);
function resize(){var w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

/* ---------- textures ---------- */
function mkTex(cv,rep){var t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.encoding=THREE.sRGBEncoding;return t;}
function roadTex(vert){var w=vert?64:128,h=vert?128:64,cv=document.createElement('canvas');cv.width=w;cv.height=h;var x=cv.getContext('2d');
 x.fillStyle='#34373c';x.fillRect(0,0,w,h);
 for(var i=0;i<500;i++){x.fillStyle=i%2?'rgba(255,255,255,.04)':'rgba(0,0,0,.06)';x.fillRect(rnd()*w,rnd()*h,2,2);}
 x.fillStyle='#e8e8e8';
 if(vert){x.fillRect(2,0,2,h);x.fillRect(w-4,0,2,h);x.fillStyle='#ffd23f';x.fillRect(w/2-1,0,2,h*.5);}
 else{x.fillRect(0,2,w,2);x.fillRect(0,h-4,w,2);x.fillStyle='#ffd23f';x.fillRect(0,h/2-1,w*.5,2);}
 return mkTex(cv);}
function facade(emis){var cv=document.createElement('canvas');cv.width=cv.height=128;var x=cv.getContext('2d'),seed=7;
 function r(){seed=(seed*16807)%2147483647;return seed/2147483647;}
 x.fillStyle=emis?'#000':'#c9ced4';x.fillRect(0,0,128,128);
 for(var i=0;i<4;i++)for(var j=0;j<4;j++){var lit=r()<.45;x.fillStyle=emis?(lit?'#ffd98a':'#000'):'#27394d';x.fillRect(i*32+6,j*32+7,20,18);}
 return mkTex(cv);}

/* ---------- world ---------- */
function inst(geo,mat,list){var m=new THREE.InstancedMesh(geo,mat,list.length),o=new THREE.Object3D(),c=new THREE.Color();
 list.forEach(function(a,i){o.position.set(a.x,a.y,a.z);o.scale.set(a.sx||1,a.sy||1,a.sz||1);o.rotation.set(0,a.ry||0,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);if(a.col!=null){c.setHex(a.col);m.setColorAt(i,c);}});
 m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
 m.frustumCulled=false;m.castShadow=m.receiveShadow=true;scene.add(m);return m;}
var winMat,lampMat;
function buildWorld(){
 var g=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshStandardMaterial({color:0x4d7a3a,roughness:1}));
 g.rotation.x=-Math.PI/2;g.position.y=-.03;g.receiveShadow=true;scene.add(g);
 var RL=10*S,rmat=function(v){return new THREE.MeshStandardMaterial({map:roadTex(v),roughness:.9})};
 var mv=rmat(true),mh=rmat(false);mv.map.repeat.set(1,RL/36);mh.map.repeat.set(RL/36,1);
 var gv=new THREE.PlaneGeometry(18,RL),gh=new THREE.PlaneGeometry(RL,18),ints=[];
 for(var k=-5;k<=4;k++){var c=(k+.5)*S;
  var a=new THREE.Mesh(gv,mv);a.rotation.x=-Math.PI/2;a.position.set(c,.02,0);a.receiveShadow=true;scene.add(a);
  var b=new THREE.Mesh(gh,mh);b.rotation.x=-Math.PI/2;b.position.set(0,.03,c);b.receiveShadow=true;scene.add(b);
  for(var l=-5;l<=4;l++)ints.push({x:c,y:.045,z:(l+.5)*S});}
 var im=inst(new THREE.PlaneGeometry(18,18).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0x303338,roughness:.95}),ints);im.castShadow=false;
 var tex=facade(false),em=facade(true);winMat=new THREE.MeshStandardMaterial({map:tex,emissiveMap:em,emissive:0xffffff,emissiveIntensity:0,roughness:.6});
 var walk=[],bl={22:[],34:[],48:[],66:[]},houses=[],roofs=[],trees=[],trunks=[],poles=[],lamps=[];
 var pastel=[0xe8e2d6,0xd6dde8,0xe8d6d6,0xd9e8d6,0xf0eadb,0xc8ccd2],hc=[0xf2e3c6,0xe9c9a8,0xd8e4ee,0xf0d7d7,0xe4eed8],rc=[0x8b3a2f,0x5c4033,0x6b2d2d,0x3f4a57];
 for(var i=-4;i<=4;i++)for(var j=-4;j<=4;j++){
  var cx=i*S,cz=j*S,d=Math.abs(i)+Math.abs(j);
  walk.push({x:cx,y:.15,z:cz});
  var park=rnd()<.08&&d>3;
  for(var sx=-1;sx<=1;sx+=2)for(var sz=-1;sz<=1;sz+=2){
   var px=cx+sx*15,pz=cz+sz*15;
   if(park)continue;
   if(d<=4){var hs=d<=2?[48,66]:[22,34,48];var h=hs[Math.floor(rnd()*hs.length)];bl[h].push({x:px,y:.3+h/2,z:pz,col:pastel[Math.floor(rnd()*pastel.length)]});}
   else{var jx=px+(rnd()-.5)*3,jz=pz+(rnd()-.5)*3;houses.push({x:jx,y:3.3,z:jz,col:hc[Math.floor(rnd()*hc.length)]});roofs.push({x:jx,y:8.3,z:jz,ry:Math.PI/4,col:rc[Math.floor(rnd()*rc.length)]});}
  }
  for(var s=-22;s<=22;s+=14){[[s,29],[s,-29],[29,s],[-29,s]].forEach(function(p){if(rnd()<.8){var tx=cx+p[0],tz=cz+p[1],th=.8+rnd()*.7;
    trunks.push({x:tx,y:.3+1.6*th,z:tz,sy:th});trees.push({x:tx,y:.3+(3.2+2.6)*th,z:tz,sx:th,sy:th,sz:th,col:[0x2f6b2f,0x3b7d34,0x4c8a3a,0x28592e][Math.floor(rnd()*4)]});}});}
  if(park)for(var q=0;q<10;q++){var tx=cx+(rnd()-.5)*50,tz=cz+(rnd()-.5)*50;trunks.push({x:tx,y:1.9,z:tz});trees.push({x:tx,y:6,z:tz,col:0x3b7d34});}
  [[-30,-30],[30,-30],[-30,30],[30,30]].forEach(function(p){poles.push({x:cx+p[0],y:3.8,z:cz+p[1]});lamps.push({x:cx+p[0],y:7.4,z:cz+p[1]});});
 }
 inst(new THREE.BoxGeometry(62,.3,62),new THREE.MeshStandardMaterial({color:0x8b8f94,roughness:.95}),walk);
 Object.keys(bl).forEach(function(h){h=+h;if(!bl[h].length)return;var geo=new THREE.BoxGeometry(24,h,24),uv=geo.attributes.uv;
  for(var u=0;u<uv.count;u++)uv.setXY(u,uv.getX(u)*2,uv.getY(u)*h/14);inst(geo,winMat,bl[h]);});
 var sm=new THREE.MeshStandardMaterial({roughness:.85});
 inst(new THREE.BoxGeometry(13,6,13),sm,houses);inst(new THREE.ConeGeometry(10.2,4,4),sm,roofs);
 inst(new THREE.CylinderGeometry(.25,.35,3.2,6),new THREE.MeshStandardMaterial({color:0x5b3d24}),trunks);
 inst(new THREE.ConeGeometry(2.4,5.5,7),new THREE.MeshStandardMaterial({roughness:1}),trees);
 inst(new THREE.CylinderGeometry(.12,.14,7.2,6),new THREE.MeshStandardMaterial({color:0x44484f}),poles);
 lampMat=new THREE.MeshBasicMaterial({color:0x666666});
 var lm=inst(new THREE.SphereGeometry(.5,8,6),lampMat,lamps);lm.castShadow=lm.receiveShadow=false;
}

/* ---------- cars ---------- */
var matGlass=new THREE.MeshStandardMaterial({color:0x10161d,metalness:.9,roughness:.1}),
 matTire=new THREE.MeshStandardMaterial({color:0x141414,roughness:.9}),matRim=new THREE.MeshStandardMaterial({color:0xd0d0d0,metalness:.9,roughness:.3});
function lightMats(){return{head:new THREE.MeshStandardMaterial({color:0xffffee,emissive:0xffffcc,emissiveIntensity:.2}),tail:new THREE.MeshStandardMaterial({color:0x550000,emissive:0xff0000,emissiveIntensity:.3})};}
function bx(w,h,d,m,x,y,z,cast){var o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!!cast;return o;}
function buildCar(d,color,lm,spot){
 var g=new THREE.Group(),wr=d.wr,by=wr+d.H/2,bm=new THREE.MeshStandardMaterial({color:color,metalness:.55,roughness:.28});
 g.add(bx(d.W,d.H,d.L,bm,0,by,0,true));
 g.add(bx(d.W*.86,d.cab,d.cabL,matGlass,0,wr+d.H+d.cab/2-.02,-d.L*.06));
 g.add(bx(d.W*.84,.06,d.cabL*.92,bm,0,wr+d.H+d.cab+.01,-d.L*.06));
 if(d.spoil){g.add(bx(d.W*.92,.06,.36,bm,0,wr+d.H+.32,-d.L/2+.2));g.add(bx(.06,.3,.1,bm,d.W*.3,wr+d.H+.17,-d.L/2+.25));g.add(bx(.06,.3,.1,bm,-d.W*.3,wr+d.H+.17,-d.L/2+.25));}
 [-1,1].forEach(function(s){g.add(bx(.38,.14,.08,lm.head,s*d.W*.33,by+.05,d.L/2+.01));g.add(bx(.42,.12,.08,lm.tail,s*d.W*.34,by+.08,-d.L/2-.01));});
 var wheels=[],fronts=[];
 [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(function(p){
  var piv=new THREE.Group(),sp=new THREE.Group(),cy=new THREE.Mesh(new THREE.CylinderGeometry(wr,wr,.26,16),matTire),rim=new THREE.Mesh(new THREE.CylinderGeometry(wr*.62,wr*.62,.28,8),matRim);
  cy.rotation.z=rim.rotation.z=Math.PI/2;cy.castShadow=true;sp.add(cy,rim);piv.add(sp);
  piv.position.set(p[0]*(d.W/2-.1),wr,p[1]*d.L*.32);g.add(piv);wheels.push(sp);if(p[1]>0)fronts.push(piv);});
 g.userData={wheels:wheels,fronts:fronts,lm:lm,d:d};
 if(spot){var sl=new THREE.SpotLight(0xfff2cc,0,70,.55,.5,1);sl.position.set(0,by+.1,d.L/2);var tg=new THREE.Object3D();tg.position.set(0,0,d.L/2+25);g.add(sl,tg);sl.target=tg;g.userData.spot=sl;}
 g.rotation.order='YXZ';scene.add(g);return g;}

/* ---------- state ---------- */
var P={x:36.5,z:0,h:Math.PI,v:0,steer:0,sel:0,color:DEFS[0].c,car:null,rpm:1000,gear:1,lights:false,cam:0,pa:0,spin:0,brk:false},
 mode='menu',tod=11,autoT=true,orbit=0,kb={},tc={},npcs=[],npcLM=lightMats(),shake=0;
var CAMS=['Kamera belakang','Kamera dalam mobil','Kamera jauh'];
function setCar(i,col){if(P.car)scene.remove(P.car);P.sel=i;if(col!=null)P.color=col;P.car=buildCar(DEFS[i],P.color,lightMats(),true);}
function resetPlayer(){P.x=36.5;P.z=0;P.h=Math.PI;P.v=0;P.steer=0;}

function buildNPCs(){var n=TOUCH?16:24;
 for(var i=0;i<n;i++){var d=DEFS[Math.floor(rnd()*DEFS.length)],col=[0xe9ecef,0x22252b,0x9aa0a6,0x7a1f1f,0x1f3d7a,0xd8c34a,0x2f6b4a][Math.floor(rnd()*7)];
  var m=buildCar(d,col,npcLM,false);
  var o={m:m,axis:rnd()<.5?0:1,rc:(Math.floor(rnd()*10)-5+.5)*S,dir:rnd()<.5?1:-1,t:(rnd()*2-1)*LIM*.9,sp:0,max:8+rnd()*6,stuck:0,ignore:0,cool:0,h:0};
  o.m.position.set(o.axis?o.rc:o.t,0,o.axis?o.t:o.rc);npcs.push(o);}}
function npcUpdate(n,dt){
 var dx=n.axis===0?n.dir:0,dz=n.axis===1?n.dir:0,p=n.m.position,want=n.max;
 if(n.ignore>0)n.ignore-=dt;else for(var k=-1;k<npcs.length;k++){var ox,oz;
  if(k<0){ox=P.x;oz=P.z;}else{var o=npcs[k];if(o===n)continue;ox=o.m.position.x;oz=o.m.position.z;}
  var rx=ox-p.x,rz=oz-p.z,f=rx*dx+rz*dz,l=Math.abs(rx*dz-rz*dx);
  if(f>0&&f<16&&l<2.8)want=Math.min(want,Math.max(0,(f-5.5)*1.5));}
 if(n.sp<.4&&want<.5)n.stuck+=dt;else n.stuck=0;
 if(n.stuck>3){n.ignore=2.5;n.stuck=0;}
 n.sp+=(want-n.sp)*Math.min(1,dt*(want<n.sp?4:1.2));
 var t0=n.t;n.t+=n.dir*n.sp*dt;n.cool-=dt;
 var q0=Math.floor(t0/S-.5),q1=Math.floor(n.t/S-.5);
 if(q0!==q1&&n.cool<=0){var c=((n.dir>0?q1:q0)+.5)*S;
  if(rnd()<.35&&Math.abs(c)<LIM){n.t=n.axis?p.z:p.x;n.axis=1-n.axis;n.rc=c;n.dir=rnd()<.5?1:-1;n.cool=1.2;}}
 if(Math.abs(n.t)>LIM-8){var sg=n.t>0?1:-1;n.t=sg*(LIM-8);n.dir=-sg;}
 var tx=n.axis===0?n.t:n.rc+n.dir*3.5*(n.axis?1:0),tz=n.axis===0?n.rc-n.dir*3.5:n.t,a=Math.min(1,dt*5);
 if(n.axis===0)p.z+=(tz-p.z)*a,p.x=n.t;else p.x+=(tx-p.x)*a,p.z=n.t;
 var th=Math.atan2(n.axis===0?n.dir:0,n.axis===1?n.dir:0),df=((th-n.h+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
 n.h+=df*Math.min(1,dt*5);n.m.rotation.y=n.h;
 var w=n.m.userData.wheels;for(var i=0;i<4;i++)w[i].rotation.x+=n.sp*dt/.34;}

/* ---------- audio ---------- */
var AC,eo1,eo2,eg,ef,hg;
function initAudio(){if(AC){AC.resume&&AC.resume();return;}
 try{AC=new(window.AudioContext||window.webkitAudioContext)();
  eo1=AC.createOscillator();eo2=AC.createOscillator();eo1.type='sawtooth';eo2.type='triangle';
  ef=AC.createBiquadFilter();ef.type='lowpass';ef.frequency.value=700;eg=AC.createGain();eg.gain.value=0;
  eo1.connect(ef);eo2.connect(ef);ef.connect(eg);eg.connect(AC.destination);eo1.start();eo2.start();
  hg=AC.createGain();hg.gain.value=0;hg.connect(AC.destination);
  [420,530].forEach(function(f){var o=AC.createOscillator();o.type='square';o.frequency.value=f;o.connect(hg);o.start();});
 }catch(e){AC=null;}}
function audioUpdate(g){if(!AC)return;var f=P.rpm/60*1.6,t=AC.currentTime;
 eo1.frequency.setTargetAtTime(f,t,.05);eo2.frequency.setTargetAtTime(f*2,t,.05);ef.frequency.setTargetAtTime(500+P.rpm*.35,t,.08);
 eg.gain.setTargetAtTime(mode==='play'?.05+g*.06:0,t,.08);hg.gain.setTargetAtTime(mode==='play'&&inp('horn')?.12:0,t,.02);}

/* ---------- input ---------- */
var KM={ArrowUp:'gas',KeyW:'gas',ArrowDown:'rev',KeyS:'rev',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'brake',KeyH:'horn'};
function inp(k){return !!(kb[k]||tc[k]);}
addEventListener('keydown',function(e){if(KM[e.code]){kb[KM[e.code]]=true;e.preventDefault();}
 if(e.repeat)return;if(e.code==='KeyC')camNext();if(e.code==='KeyL')toggleLights();if(e.code==='KeyN')toggleDay();if(e.code==='Escape'&&mode==='play')showMenu();});
addEventListener('keyup',function(e){if(KM[e.code])kb[KM[e.code]]=false;});
function hold(id,key){var el=$(id);function dn(e){e.preventDefault();tc[key]=true;el.classList.add('down');initAudio();}function up(e){tc[key]=false;el.classList.remove('down');}
 el.addEventListener('pointerdown',dn);['pointerup','pointercancel','pointerleave'].forEach(function(n){el.addEventListener(n,up);});}
hold('bGas','gas');hold('bBrake','brake');hold('bRev','rev');hold('bL','left');hold('bR','right');hold('bHorn','horn');
function camNext(){P.cam=(P.cam+1)%3;$('camname').textContent=CAMS[P.cam];}
function toggleLights(){P.lights=!P.lights;$('bLight').classList.toggle('on',P.lights);$('lamp').classList.toggle('on',P.lights);}
function toggleDay(){autoT=false;tod=(tod>=6&&tod<18)?21.5:11;var night=tod>=18||tod<6;if(night!==P.lights)toggleLights();}
$('bCam').onclick=camNext;$('bLight').onclick=toggleLights;$('bDay').onclick=toggleDay;$('bMenu').onclick=showMenu;
function fs(){var e=document.documentElement;try{(e.requestFullscreen||e.webkitRequestFullscreen).call(e);screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(function(){});}catch(x){}}
$('mFs').onclick=fs;

/* ---------- screens ---------- */
function show(id){['menu','garage','hud'].forEach(function(s){$(s).classList.toggle('hidden',s!==id);});}
function showMenu(){mode='menu';show('menu');}
function play(){initAudio();resetPlayer();mode='play';show('hud');}
$('mPlay').onclick=play;$('gGo').onclick=play;
$('mGarage').onclick=function(){mode='garage';show('garage');refreshGarage();};
$('gBack').onclick=showMenu;
$('gPrev').onclick=function(){P.color=DEFS[(P.sel+5)%6].c;setCar((P.sel+5)%6);refreshGarage();};
$('gNext').onclick=function(){P.color=DEFS[(P.sel+1)%6].c;setCar((P.sel+1)%6);refreshGarage();};
function refreshGarage(){var d=DEFS[P.sel];$('gName').textContent=d.n;$('gType').textContent=d.t;$('sSpd').style.width=d.top/320*100+'%';$('sAcc').style.width=d.acc/18*100+'%';
 var s=$('swatches');s.innerHTML='';COLORS.forEach(function(c){var e=document.createElement('span');e.style.background='#'+('000000'+c.toString(16)).slice(-6);if(c===P.color)e.className='on';
  e.onclick=function(){setCar(P.sel,c);refreshGarage();};s.appendChild(e);});}

/* ---------- physics ---------- */
function collide(){var hit=false;
 [1.3,-1.3].forEach(function(o){var x=P.x+Math.sin(P.h)*o,z=P.z+Math.cos(P.h)*o,i=Math.round(x/S),j=Math.round(z/S);
  if(Math.abs(i)>4||Math.abs(j)>4)return;var lx=x-i*S,lz=z-j*S,R=HALF+1,ax=Math.abs(lx),az=Math.abs(lz);
  if(ax<R&&az<R){var px=R-ax,pz=R-az;if(px<pz)P.x+=(lx<0?-1:1)*px;else P.z+=(lz<0?-1:1)*pz;hit=true;}});
 npcs.forEach(function(n){var dx=P.x-n.m.position.x,dz=P.z-n.m.position.z,d=Math.hypot(dx,dz);
  if(d<3.4&&d>.01){P.x+=dx/d*(3.4-d);P.z+=dz/d*(3.4-d);hit=true;}});
 return hit;}
var prevV=0,pitch=0,roll=0;
function drive(dt){var d=DEFS[P.sel],vmax=d.top/3.6,g=inp('gas')?1:0,r=inp('rev'),b=inp('brake');
 if(g)P.v+=d.acc*(1-Math.max(0,P.v)/vmax)*dt*(P.v<0?2.5:1);
 else if(r){if(P.v>1)P.v-=22*dt;else P.v=Math.max(-8,P.v-5*dt);}
 if(b)P.v-=Math.sign(P.v)*Math.min(Math.abs(P.v),28*dt);
 P.brk=b||(r&&P.v>1);
 if(!g)P.v-=Math.sign(P.v)*Math.min(Math.abs(P.v),(1.2+Math.abs(P.v)*.03)*dt);
 var st=(inp('left')?1:0)-(inp('right')?1:0);P.steer+=(st-P.steer)*Math.min(1,dt*(st?6:9));
 var lim=.55/(1+Math.abs(P.v)/16);P.h+=P.v*Math.tan(P.steer*lim)/(d.L*.62)*dt;
 P.x+=Math.sin(P.h)*P.v*dt;P.z+=Math.cos(P.h)*P.v*dt;
 if(collide()){P.v*=1-Math.min(.5,dt*8);}
 P.x=clamp(P.x,-LIM,LIM);P.z=clamp(P.z,-LIM,LIM);
 var ratio=Math.abs(P.v)/vmax,gv=ratio*6,gr=Math.min(5,Math.floor(gv)),rt=1100+(gv-gr)*5200+(g?600:0);
 rt=Math.max(rt,900+g*2600*Math.max(0,1-Math.abs(P.v)/6));P.gear=gr+1;P.rpm+=(rt-P.rpm)*Math.min(1,dt*8);
 var a=(P.v-prevV)/Math.max(dt,.001);prevV=P.v;pitch+=(clamp(-a*.004,-.04,.04)-pitch)*Math.min(1,dt*6);roll+=(clamp(P.steer*P.v*.0012,-.05,.05)-roll)*Math.min(1,dt*6);
 P.lim=lim;return g;}

function placeCar(){var c=P.car,u=c.userData;c.position.set(P.x,0,P.z);c.rotation.set(pitch,P.h,roll);
 P.spin+=P.v*.016/DEFS[P.sel].wr;u.wheels.forEach(function(w){w.rotation.x+=P.v*(P._dt||.016)/DEFS[P.sel].wr;});
 u.fronts.forEach(function(f){f.rotation.y=P.steer*(P.lim||.4);});
 var on=P.lights,lm=u.lm;lm.head.emissiveIntensity=on?2.6:.2;lm.tail.emissiveIntensity=P.brk?4:(on?1.6:.3);if(u.spot)u.spot.intensity=on?2.2:0;}

function updCam(dt){var fx=Math.sin(P.h),fz=Math.cos(P.h),k=1-Math.exp(-dt*6);
 if(mode!=='play'){orbit+=dt*.35;var cx=P.x,cz=P.z;
  if(mode==='garage'){camera.position.set(cx+Math.sin(orbit)*8.5,2.4,cz+Math.cos(orbit)*8.5);}
  else camera.position.set(cx+Math.sin(orbit)*11,3.4,cz+Math.cos(orbit)*11);
  camera.lookAt(cx,.8,cz);camera.fov=50;camera.updateProjectionMatrix();return;}
 var fov=60+Math.min(18,Math.abs(P.v)*.22);
 if(P.cam===1){P.car.updateMatrixWorld(true);var w=P.car.localToWorld(new THREE.Vector3(-.4,DEFS[P.sel].wr+DEFS[P.sel].H+.28,-.1));
  camera.position.copy(w);camera.lookAt(w.x+fx*10,w.y-.12,w.z+fz*10);fov+=8;}
 else{var dist=P.cam===0?8.2:15,hh=P.cam===0?3.1:6.5,tx=P.x-fx*dist,tz=P.z-fz*dist;
  camera.position.x+=(tx-camera.position.x)*k;camera.position.z+=(tz-camera.position.z)*k;camera.position.y+=(hh-camera.position.y)*k;
  camera.lookAt(P.x+fx*4,1.1,P.z+fz*4);}
 if(Math.abs(camera.fov-fov)>.2){camera.fov=fov;camera.updateProjectionMatrix();}}

var cN=new THREE.Color(0x070b1a),cK=new THREE.Color(0xe2784a),cD=new THREE.Color(0x8fcbff),cSN=new THREE.Color(0x9fb4ff),cSD=new THREE.Color(0xfff1d6),cL0=new THREE.Color(0x555555),cL1=new THREE.Color(0xffe9a8);
function applyTime(){var a=(tod-6)/12*Math.PI,el=Math.sin(a),f=clamp(el*2.5+.5,0,1);
 if(f<.5)sky.copy(cN).lerp(cK,f*2);else sky.copy(cK).lerp(cD,(f-.5)*2);
 scene.fog.color.copy(sky);hemi.intensity=.22+.7*f;hemi.color.copy(sky).lerp(new THREE.Color(1,1,1),.4);
 sun.intensity=.12+1.5*f;sun.color.copy(cSN).lerp(cSD,f);
 var dir=new THREE.Vector3(Math.cos(a)*.9,Math.max(.35,Math.abs(el)+.2),.45).normalize();
 sun.target.position.set(P.x,0,P.z);sun.position.copy(sun.target.position).addScaledVector(dir,130);
 winMat.emissiveIntensity=(1-f)*1.1;lampMat.color.copy(cL0).lerp(cL1,1-f);renderer.toneMappingExposure=.85+.3*f;
 var hh=Math.floor(tod)%24,mm=Math.floor((tod%1)*60);$('clock').textContent=(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;
 npcLM.head.emissiveIntensity=f<.5?2.2:.2;npcLM.tail.emissiveIntensity=f<.5?1.2:.3;}

/* ---------- loop ---------- */
var last=0,hudT=0;
function frame(t){requestAnimationFrame(frame);var dt=Math.min(.05,(t-last)/1000||.016);last=t;P._dt=dt;
 if(autoT)tod=(tod+dt*.05)%24;
 var g=0;if(mode==='play')g=drive(dt);else{P.v=0;P.steer=0;P.rpm=1000;}
 placeCar();npcs.forEach(function(n){npcUpdate(n,dt);});updCam(dt);applyTime();audioUpdate(g);
 if(mode==='play'&&(hudT-=dt)<=0){hudT=.05;var kmh=Math.abs(P.v)*3.6;$('spd').textContent=Math.round(kmh);
  $('rpmfill').style.width=clamp((P.rpm-800)/6200*100,3,100)+'%';$('rpmtxt').textContent=Math.round(P.rpm/10)*10+' rpm';
  $('gear').textContent=P.v<-.5?'R':(kmh<1&&!inp('gas')?'N':P.gear);
  $('wheel').style.transform='rotate('+(-P.steer*200)+'deg)';}
 renderer.render(scene,camera);}

buildWorld();setCar(0);buildNPCs();resetPlayer();
$('loading').style.display='none';showMenu();requestAnimationFrame(frame);
})();
