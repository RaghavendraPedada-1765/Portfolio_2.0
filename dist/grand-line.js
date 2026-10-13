import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Sky } from 'three/addons/objects/Sky.js';

const v = (x,y,z) => new T.Vector3(x,y,z);
const clamp = T.MathUtils.clamp;
const ease = t => t*t*(3-2*t);
export class GrandLine {
 constructor(container, callbacks) {
  this.cb=callbacks;this.container=container;this.reduced=callbacks.reduced;this.low=innerWidth<700;this.sceneIndex=0;this.projectIndex=0;this.time=0;this.flying=false;this.introTime=0;this.drag=0;this.pitch=0;this.pointer=new T.Vector2();this.crewModels=new Map();this.mixers=[];this.crewRequest=0;this.activeCrew=null;this.raycaster=new T.Raycaster();this.interactables=[];
  this.scene=new T.Scene();this.scene.fog=new T.FogExp2(0x102d36,.012);
  this.camera=new T.PerspectiveCamera(45,innerWidth/innerHeight,.1,750);this.camera.position.set(21,9,26);this.look=v(0,5,0);this.camera.lookAt(this.look);
  this.renderer=new T.WebGLRenderer({antialias:!this.low,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.low?1.15:1.5));this.renderer.setSize(innerWidth,innerHeight);this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.04;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.shadowMap.enabled=false;container.appendChild(this.renderer.domElement);
  this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.42,.65,1.15);this.bloom.enabled=!this.low;this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
  this.draco=new DRACOLoader().setDecoderPath('./vendor/draco/').setWorkerLimit(2);this.loader=new GLTFLoader().setDRACOLoader(this.draco);
  this.ship=new T.Group();this.scene.add(this.ship);this.crewStage=new T.Group();this.crewStage.position.x=70;this.scene.add(this.crewStage);this.projectStage=new T.Group();this.projectStage.position.x=140;this.scene.add(this.projectStage);this.captainStage=new T.Group();this.captainStage.position.x=210;this.scene.add(this.captainStage);this.contactStage=new T.Group();this.contactStage.position.x=280;this.scene.add(this.contactStage);
  this.makeAtmosphere();this.makeOcean();this.makePortal();this.makeStages();this.bind();this.resize();this.last=performance.now();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
 }
 material(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.65,metalness:.08,...extra});}
 mesh(geometry,material,parent,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o;}
 rod(parent,a,b,r,material){const delta=b.clone().sub(a);const o=this.mesh(new T.CylinderGeometry(r,r,delta.length(),10),material,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v(0,1,0),delta.normalize());return o;}
 makeAtmosphere(){
  const sky=new Sky();sky.scale.setScalar(600);sky.material.uniforms.turbidity.value=7;sky.material.uniforms.rayleigh.value=1.8;sky.material.uniforms.mieCoefficient.value=.008;sky.material.uniforms.mieDirectionalG.value=.86;this.sunDirection=v(-.58,.19,-.72).normalize();sky.material.uniforms.sunPosition.value.copy(this.sunDirection);this.sky=sky;
  const backdrop=new T.Mesh(new T.SphereGeometry(550,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sun:{value:this.sunDirection}},vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 direction;uniform vec3 sun;void main(){vec3 d=normalize(direction);float h=clamp(d.y,0.,1.);vec3 col=mix(vec3(.12,.22,.25),vec3(.008,.025,.065),pow(h,.45));float glow=pow(max(dot(d,sun),0.),18.);col+=vec3(.17,.09,.025)*glow;gl_FragColor=vec4(col,1.);}`}));this.scene.add(backdrop);
  const envScene=new T.Scene();const envSky=sky.clone();envScene.add(envSky);const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(envScene,.04);this.scene.environment=this.environment.texture;pmrem.dispose();
  this.scene.add(new T.HemisphereLight(0xa0cfda,0x173740,1.35));const sun=new T.DirectionalLight(0xffdbac,3.0);sun.position.copy(this.sunDirection).multiplyScalar(100);this.scene.add(sun);const rim=new T.DirectionalLight(0x87dadc,1.6);rim.position.set(12,16,25);this.scene.add(rim);
  const starGeo=new T.BufferGeometry();const stars=[];for(let i=0;i<360;i++){const a=i*2.399963;const r=15+((i*173)%180);stars.push(Math.cos(a)*r+130,2+((i*47)%65),Math.sin(a)*r-35);}starGeo.setAttribute('position',new T.Float32BufferAttribute(stars,3));this.motes=new T.Points(starGeo,new T.PointsMaterial({color:0xb9ead9,size:.06,transparent:true,opacity:.45,depthWrite:false,blending:T.AdditiveBlending}));this.scene.add(this.motes);
  const rockMat=this.material(0x1b4b50,{flatShading:true});for(let i=0;i<18;i++){const r=this.mesh(new T.IcosahedronGeometry(1,1),rockMat,this.scene,-90+i*25,-2,-95-(i%4)*13);r.scale.set(9+(i%4)*3,8+(i%3)*7,10);r.rotation.y=i;}
  this.birds=new T.Group();this.scene.add(this.birds);const birdMat=new T.LineBasicMaterial({color:0x203839,transparent:true,opacity:.65});for(let i=0;i<11;i++){const b=new T.Line(new T.BufferGeometry().setFromPoints([v(-.35,0,0),v(0,-.12,.08),v(.35,0,0)]),birdMat);b.position.set(-24+i*5,18+Math.sin(i)*3,-28-i*3);this.birds.add(b);}
 }
 makeOcean(){
  this.waterMat=new T.ShaderMaterial({uniforms:{uTime:{value:0},uSun:{value:this.sunDirection},uEye:{value:this.camera.position}},vertexShader:`uniform float uTime; varying vec3 wPos;varying float crest;
  float wave(vec2 p){return sin(p.x*.22+uTime*.56)*.22+sin(p.y*.31-uTime*.42)*.16+sin((p.x+p.y)*.65+uTime*.8)*.06;}
  void main(){vec3 p=position;p.z+=wave(p.xy);crest=p.z;vec4 w=modelMatrix*vec4(p,1.);wPos=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float uTime;uniform vec3 uSun;uniform vec3 uEye;varying vec3 wPos;varying float crest;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
  float ripple(vec2 p){return sin(p.x*2.3+sin(p.y*1.8+uTime*.5))*sin(p.y*2.8-uTime*.8)*.09+noise(p*5.+uTime*.15)*.08;}
  void main(){vec2 p=wPos.xz;float e=.06;float dx=(ripple(p+vec2(e,0))-ripple(p-vec2(e,0)))/(.12);float dz=(ripple(p+vec2(0,e))-ripple(p-vec2(0,e)))/(.12);vec3 n=normalize(vec3(-dx,.8,-dz));vec3 view=normalize(uEye-wPos);float fres=pow(1.-max(dot(view,n),0.),3.);vec3 refl=reflect(-view,n);vec3 deep=vec3(.006,.095,.125);vec3 shallow=vec3(.018,.22,.25);vec3 base=mix(deep,shallow,clamp(crest+.48,0.,1.));vec3 sky=mix(vec3(.16,.3,.32),vec3(.045,.14,.2),clamp(refl.y,0.,1.));vec3 col=mix(base,sky,fres*.72);float spec=pow(max(dot(reflect(-uSun,n),view),0.),95.);col+=vec3(1.,.75,.42)*spec*.8;float foam=smoothstep(.91,.995,noise(p*.9+uTime*.12))*smoothstep(.16,.4,crest);col+=vec3(.15,.36,.36)*foam;float fog=1.-exp(-length(uEye-wPos)*.009);col=mix(col,vec3(.065,.15,.18),fog*.82);gl_FragColor=vec4(col,1.);}`});
  this.water=this.mesh(new T.PlaneGeometry(750,500,this.low?180:260,this.low?130:190),this.waterMat,this.scene,130,-.16,0);this.water.rotation.x=-Math.PI/2;
 }
 makePortal(){
  this.portal=new T.Group();this.portal.position.set(0,8,29);this.scene.add(this.portal);
  this.portalMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{uTime:{value:0},uFade:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float uTime;uniform float uFade;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float a=atan(p.y,p.x);float twist=sin(a*11.-r*27.+uTime*2.3)*.5+.5;float band=exp(-pow((r-.72)*22.,2.));float outer=exp(-pow((r-.74)*6.,2.));float strands=pow(max(0.,sin(a*22.+uTime*2.+r*40.)),8.);float alpha=(band*(.8+twist*.7)+outer*strands*.45+outer*.06)*uFade;vec3 col=mix(vec3(.015,.55,.85),vec3(.45,1.,.84),twist);gl_FragColor=vec4(col*2.3,alpha);}`});
  this.mesh(new T.PlaneGeometry(24,24),this.portalMaterial,this.portal);
  const ringMat=this.material(0x78ead4,{emissive:0x27b49d,emissiveIntensity:3,metalness:.5,roughness:.3});this.portalRing=this.mesh(new T.TorusGeometry(8.65,.045,8,140),ringMat,this.portal);this.portalRing.rotation.z=.2;
  const light=new T.PointLight(0x4affcf,45,35,2);this.portal.add(light);
  const runeMat=new T.MeshBasicMaterial({color:0x68d4d1,transparent:true,opacity:.8});for(let i=0;i<28;i++){let a=i/28*Math.PI*2;const rune=this.mesh(new T.BoxGeometry(.07,.5,.05),runeMat,this.portal,Math.cos(a)*9.1,Math.sin(a)*9.1,0);rune.rotation.z=a;}
 }
 pedestal(parent, radius=3){
  const stone=this.material(0x1e3d41,{roughness:.85,metalness:.15});this.mesh(new T.CylinderGeometry(radius,radius*1.08,.45,64),stone,parent,0,.12,0);this.mesh(new T.CylinderGeometry(radius*.93,radius*.93,.1,64),this.material(0x24494a,{roughness:.4,metalness:.6}),parent,0,.39,0);
  const ring=this.mesh(new T.TorusGeometry(radius*.94,.025,6,96),new T.MeshBasicMaterial({color:0x77bba4,transparent:true,opacity:.55}),parent,0,.46,0);ring.rotation.x=-Math.PI/2;
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const r=this.mesh(new T.BoxGeometry(.025,.015,.16),this.material(0xc7a56a,{emissive:0x59401b,emissiveIntensity:.4}),parent,Math.sin(a)*radius*.81,.46,Math.cos(a)*radius*.81);r.rotation.y=a;}
 }
 makeStages(){
  this.pedestal(this.crewStage,3.3);this.pedestal(this.projectStage,3.1);this.pedestal(this.captainStage,3);this.pedestal(this.contactStage,3);
  for(const [i,stage] of [this.crewStage,this.projectStage,this.captainStage,this.contactStage].entries()){const light=new T.PointLight([0x93dec8,0x66afed,0xe7b86c,0xa6d4a0][i],22,18,2);light.position.set(-2,5,4);stage.add(light);const rim=new T.PointLight(0x65dbd1,25,15,2);rim.position.set(2,4,-3);stage.add(rim);}
  this.projectOrb=new T.Group();this.projectOrb.position.set(0,3.35,0);this.projectStage.add(this.projectOrb);
  this.fruitMat=this.material(0x814ca3,{emissive:0x4e2867,emissiveIntensity:.6,roughness:.3,metalness:.15});this.fruit=this.mesh(new T.SphereGeometry(1.15,48,32),this.fruitMat,this.projectOrb);this.fruit.scale.y=1.07;
  const spiralMaterial=this.material(0xc4a0dc,{emissive:0x6f4194,emissiveIntensity:.7});this.spirals=[];
  for(let i=0;i<18;i++){const y=1-(i/17)*2;const a=i*2.39996;const radius=Math.sqrt(1-y*y);const normal=v(Math.cos(a)*radius,y,Math.sin(a)*radius);const points=[];for(let j=0;j<55;j++){const t=j/54;const theta=t*Math.PI*3.8;const rad=.22*t;points.push(v(Math.cos(theta)*rad,Math.sin(theta)*rad,0));}const curve=new T.CatmullRomCurve3(points);const spiral=this.mesh(new T.TubeGeometry(curve,55,.018,5,false),spiralMaterial,this.projectOrb);spiral.position.copy(normal).multiplyScalar(1.17);spiral.quaternion.setFromUnitVectors(v(0,0,1),normal);this.spirals.push(spiral);}
  const stemPath=new T.CatmullRomCurve3([v(0,1.1,0),v(.04,1.6,0),v(.5,1.8,0),v(.65,1.5,0),v(.4,1.38,0)]);this.mesh(new T.TubeGeometry(stemPath,30,.085,8,false),this.material(0xadc57c),this.projectOrb);
  this.orbits=[];for(let i=0;i<3;i++){const ring=this.mesh(new T.TorusGeometry(1.8+i*.3,.015,6,100),new T.MeshBasicMaterial({color:0x7fadd1,transparent:true,opacity:.4}),this.projectOrb);ring.rotation.set(.65+i*.5,.4+i,.2);this.orbits.push(ring);}
  this.projectOrb.userData.interactive=true;
  this.makePoster();this.makeSnail();
 }
 makePoster(){
  const c=document.createElement('canvas');c.width=768;c.height=1024;const ctx=c.getContext('2d');const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
  const draw=photo=>{ctx.fillStyle='#c4ad79';ctx.fillRect(0,0,768,1024);const grad=ctx.createRadialGradient(384,500,120,384,500,600);grad.addColorStop(0,'#ead7aa');grad.addColorStop(1,'#9c814f');ctx.fillStyle=grad;ctx.fillRect(0,0,768,1024);ctx.fillStyle='#382e25';ctx.textAlign='center';ctx.font='bold 122px Georgia';ctx.fillText('WANTED',384,140);ctx.font='19px Georgia';ctx.fillText('FOR BUILDING THINGS THAT MATTER',384,183);if(photo){ctx.save();ctx.filter='sepia(.65) saturate(.5)';ctx.drawImage(photo,0,photo.height*.04,photo.width,photo.width*495/658,55,215,658,495);ctx.restore();}ctx.strokeStyle='#705b39';ctx.lineWidth=6;ctx.strokeRect(55,215,658,495);ctx.fillStyle='#382e25';ctx.font='bold 57px Georgia';ctx.fillText('RAGHAVENDRA',384,792);ctx.fillText('PEDADA',384,856);ctx.font='23px Georgia';ctx.fillText('FULL-STACK DEVELOPER',384,918);ctx.font='17px Georgia';ctx.fillText('ONE GREAT OPPORTUNITY',384,965);texture.needsUpdate=true;};draw();const photo=new Image();photo.onload=()=>draw(photo);photo.src='./assets/raghavendra-portrait.jpg';
  this.poster=this.mesh(new T.PlaneGeometry(3.8,5.07,16,16),new T.MeshStandardMaterial({map:texture,side:T.DoubleSide,roughness:.8}),this.captainStage,0,3.45,0);this.poster.rotation.z=-.07;this.poster.userData.interactive=true;
  const back=this.mesh(new T.PlaneGeometry(3.8,5.07),this.material(0x9a875b,{side:T.DoubleSide}),this.captainStage,.12,3.43,-.06);back.rotation.z=.04;
 }
 makeSnail(){
  const g=new T.Group();g.position.y=1.1;this.contactStage.add(g);this.snail=g;const skin=this.material(0x93b879,{roughness:.45});const shell=this.material(0xd3a65c,{roughness:.3});const dark=this.material(0x254044,{metalness:.45,roughness:.25});
  const body=this.mesh(new T.SphereGeometry(1,32,20),skin,g,0,0,0);body.scale.set(1.6,.35,.9);const sh=this.mesh(new T.SphereGeometry(1,40,28),shell,g,-.45,.8,0);sh.scale.set(1.05,1,.78);
  const spiral=[];for(let i=0;i<140;i++){const t=i/139;const r=.09+t*.74;spiral.push(v(-.45+Math.cos(t*Math.PI*5)*r,.8+Math.sin(t*Math.PI*5)*r,.77));}this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(spiral),140,.055,8,false),this.material(0x785d35),g);
  const head=this.mesh(new T.SphereGeometry(.65,32,20),skin,g,1,.55,.1);head.scale.y=1.1;
  for(const x of [.68,1.3]){this.rod(g,v(x,1,.23),v(x+.03,1.78,.28),.09,skin);this.mesh(new T.SphereGeometry(.2,20,16),this.material(0xede9cb),g,x+.03,1.83,.28);this.mesh(new T.SphereGeometry(.105,16,12),dark,g,x+.03,1.83,.435);}
  const smile=this.mesh(new T.TorusGeometry(.25,.025,6,30,Math.PI),dark,g,1,.55,.69);smile.rotation.z=Math.PI;
  const receiver=new T.Group();receiver.position.set(-.4,1.9,0);receiver.rotation.z=-.18;g.add(receiver);this.receiver=receiver;this.rod(receiver,v(-.9,0,0),v(.9,0,0),.13,dark);for(const x of [-.9,.9]){const ear=this.mesh(new T.CylinderGeometry(.27,.3,.38,20),dark,receiver,x,-.15,0);ear.rotation.z=x<0?-.3:.3;this.mesh(new T.TorusGeometry(.27,.025,8,28),shell,receiver,x,-.32,.05).rotation.x=Math.PI/2;}
  g.userData.interactive=true;
 }
 async model(id,onProgress){const file={robin:'robin-animated',brook:'brook-animated'}[id]||id;return this.loader.loadAsync(`./assets/models/${file}.glb`,onProgress);}
 normalize(object,height){object.updateMatrixWorld(true);let box=new T.Box3().setFromObject(object);const size=box.getSize(v());object.scale.multiplyScalar(height/Math.max(size.y,.001));object.updateMatrixWorld(true);box=new T.Box3().setFromObject(object);const center=box.getCenter(v());object.position.x-=center.x;object.position.z-=center.z;object.position.y-=box.min.y;object.traverse(o=>{if(o.isMesh){o.frustumCulled=false;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(m.isMeshStandardMaterial){m.envMapIntensity=.3;m.roughness=Math.max(.45,m.roughness);m.metalness=Math.min(.25,m.metalness);}if(m.map)m.map.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());}}});return object;}
 async load(){
  this.cb.onProgress(3,'Preparing ocean, light and atmosphere…');let shipLoaded=0,harborLoaded=0;const progress=()=>this.cb.onProgress(5+shipLoaded*52+harborLoaded*38,'Loading the Sunny and the island harbor…');
  const results=await Promise.all([this.model('sunny',e=>{shipLoaded=e.total?e.loaded/e.total:.5;progress();}),this.model('harbor',e=>{harborLoaded=e.total?e.loaded/e.total:.5;progress();})]);
  const model=this.normalize(results[0].scene,14);this.ship.add(model);this.ship.position.y=-2.45;this.ship.rotation.y=-.18;this.ship.userData.interactive=true;
  const harbor=this.normalize(results[1].scene,17);this.harbor=new T.Group();this.harbor.add(harbor);this.harbor.position.set(-37,-.3,-12);this.harbor.rotation.y=.25;this.scene.add(this.harbor);
  this.cb.onProgress(97,'Preparing the first frame…');await this.renderer.compileAsync(this.scene,this.camera);this.ready=true;this.cb.onProgress(100,'Ready to enter.');
 }
 setReduced(value){this.reduced=value;}
 setLow(value){this.low=value;this.bloom.enabled=!value;this.renderer.setPixelRatio(Math.min(devicePixelRatio,value?1:1.5));this.resize();}
 async showCrew(id){
  this.crewId=id;const request=++this.crewRequest;this.cb.onLoading(`BRINGING ${id.toUpperCase()} ABOARD…`);
  if(this.activeCrew)this.activeCrew.visible=false;
  try{
   let data=this.crewModels.get(id);
   if(!data){const gltf=await this.model(id);const root=new T.Group();const height={chopper:2.7,franky:6.0,brook:6.4,jinbe:5.2,luffy:5.1}[id]||5.35;const object=this.normalize(gltf.scene,height);root.add(object);root.position.y=.48;this.crewStage.add(root);root.visible=false;root.userData.interactive=true;let mixer=null;if(gltf.animations.length && id!=='luffy'){const clip=gltf.animations.find(a=>/idle_a|idle|breath/i.test(a.name))||gltf.animations[0];mixer=new T.AnimationMixer(object);mixer.clipAction(clip).play();this.mixers.push({mixer,root});}data={root,mixer};this.crewModels.set(id,data);}
   if(request!==this.crewRequest)return;
   this.activeCrew=data.root;data.root.visible=true;data.root.rotation.y=.12;this.cb.onLoading('');
  }catch(error){if(request===this.crewRequest){this.cb.onLoading('');this.cb.onError(`Could not load ${id}. Choose another crewmate or try again.`);}console.warn('Crew asset failed',id,error);}
 }
 showProject(index){this.projectIndex=index;const colors=[0x8545b0,0x257eaf,0x39946a];this.fruitMat.color.setHex(colors[index]);this.fruitMat.emissive.setHex(colors[index]);this.fruitMat.emissiveIntensity=.4;}
 go(index){this.sceneIndex=index;this.drag=0;this.pitch=0;this.portal.visible=false;this.cb.onLoading('');this.cameraTransition=1;}
 startIntro(){this.sceneIndex=0;this.flying=true;this.introTime=0;this.introStarted=performance.now();this.portal.visible=true;this.portal.scale.setScalar(1);this.portalMaterial.uniforms.uFade.value=1;this.camera.position.set(-36,5.5,22);this.look.set(-35,5,-10);this.cb.onIntroCaption('LEAVE THE FAMILIAR BEHIND.');}
 finishIntro(){this.flying=false;this.sceneIndex=0;this.portal.visible=false;this.cameraTransition=1;}
 bind(){
  this.onResize=()=>this.resize();addEventListener('resize',this.onResize);let down=false,startX=0,startY=0,moved=0;
  this.renderer.domElement.addEventListener('pointerdown',e=>{if(this.flying||!document.body.classList.contains('entered'))return;down=true;startX=e.clientX;startY=e.clientY;moved=0;this.renderer.domElement.setPointerCapture(e.pointerId);});
  this.renderer.domElement.addEventListener('pointermove',e=>{this.pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);if(down){const dx=e.clientX-startX,dy=e.clientY-startY;moved+=Math.abs(dx)+Math.abs(dy);this.drag=clamp(this.drag+dx*.003,-.65,.65);this.pitch=clamp(this.pitch+dy*.008,-1.4,1.4);startX=e.clientX;startY=e.clientY;}else{this.raycaster.setFromCamera(this.pointer,this.camera);const target=this.sceneIndex===1?this.activeCrew:this.sceneIndex===2?this.projectOrb:this.sceneIndex===3?this.poster:this.sceneIndex===4?this.snail:null;const hit=target&&this.raycaster.intersectObject(target,true).length;this.renderer.domElement.style.cursor=hit?'pointer':'grab';}});
  this.renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;down=false;if(moved<8){this.pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const target=this.sceneIndex===1?this.activeCrew:this.sceneIndex===2?this.projectOrb:this.sceneIndex===3?this.poster:this.sceneIndex===4?this.snail:null;if(target&&this.raycaster.intersectObject(target,true).length)this.cb.onObject();}});
  this.renderer.domElement.addEventListener('pointercancel',()=>{down=false;});
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.cb.onError('3D rendering paused. The Lite portfolio is available from the menu.');});
 }
 resize(){const w=innerWidth,h=innerHeight;this.camera.aspect=w/h;this.camera.fov=w<700?52:45;if(w<700)this.camera.setViewOffset(w,h,0,h*.14,w,h);else this.camera.clearViewOffset();this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.composer.setSize(w,h);}
 updateCamera(dt){
  const mobile=innerWidth<700;
  if(this.flying){this.introTime=(performance.now()-this.introStarted)/1000;const t=this.introTime;const path=[{t:0,p:v(-36,5.5,22),l:v(-35,5,-10)},{t:2.3,p:v(-20,7,35),l:v(-12,7,10)},{t:4.8,p:v(0,8,48),l:v(0,8,21)},{t:7,p:v(0,8,23),l:v(0,7,0)},{t:9.6,p:mobile?v(25,12,40):v(20,8,26),l:v(0,5,0)}];let a=path[0],b=path[1];for(let i=0;i<path.length-1;i++)if(t>=path[i].t){a=path[i];b=path[i+1];}const f=ease(clamp((t-a.t)/(b.t-a.t),0,1));this.camera.position.lerpVectors(a.p,b.p,f);this.look.lerpVectors(a.l,b.l,f);this.camera.lookAt(this.look);this.portalMaterial.uniforms.uFade.value=t>7?Math.max(0,1-(t-7)/1.2):1;this.portal.scale.setScalar(t>7?1+(t-7)*.5:1);document.getElementById('scene-flash').style.opacity=String(Math.max(0,1-Math.abs(t-6.65)/.35)*.48);if(t>2.3&&t<7.3)this.cb.onIntroCaption('FOLLOW YOUR OWN COMPASS.');if(t>=7.3)this.cb.onIntroCaption('WELCOME TO MY GRAND LINE.');if(t>=9.6){document.getElementById('scene-flash').style.opacity='0';this.cb.onIntroEnd();}return;}
  const index=this.sceneIndex;let pos,target;
  if(index===0){pos=mobile?v(25,12,39):v(20,8.8,26);target=mobile?v(-1,5,0):v(-2.5,5,0);}
  else{const x=index*70;const zoom=index===1?1:index===3?1.05:1;pos=mobile?v(x+5,6.5,16*zoom):v(x+5.5,4.5,12*zoom);target=mobile?v(x,2.9,0):v(x-1.65,2.8,0);}
  const relative=pos.clone().sub(target);relative.applyAxisAngle(v(0,1,0),this.drag);pos.copy(target).add(relative);pos.y+=this.pitch;
  if(!this.reduced){pos.y+=Math.sin(this.time*.18)*.12;pos.x+=Math.sin(this.time*.13)*.25;}
  const speed=this.reduced?1:1-Math.exp(-dt*3.2);this.camera.position.lerp(pos,speed);this.look.lerp(target,speed);this.camera.lookAt(this.look);
 }
 frame(now){this.raf=requestAnimationFrame(this.frame);const cameraDt=Math.min((now-this.last)/1000,1);const dt=Math.min(cameraDt,.08);this.last=now;if(document.hidden||this.lost)return;if(!this.reduced)this.time+=dt;
  this.updateCamera(cameraDt);this.waterMat.uniforms.uTime.value=this.time;this.portalMaterial.uniforms.uTime.value=this.time;this.portalRing.rotation.z=this.time*.08;
  this.ship.position.y=-2.45+Math.sin(this.time*.6)*.12;this.ship.rotation.z=Math.sin(this.time*.48)*.015;this.ship.rotation.x=Math.sin(this.time*.4)*.009;
  this.crewStage.visible=this.sceneIndex===1&&!this.flying;this.projectStage.visible=this.sceneIndex===2&&!this.flying;this.captainStage.visible=this.sceneIndex===3&&!this.flying;this.contactStage.visible=this.sceneIndex===4&&!this.flying;
  this.projectOrb.position.y=3.4+Math.sin(this.time*.65)*.15;this.projectOrb.rotation.y=this.time*.12;this.orbits.forEach((r,i)=>r.rotation.z=this.time*.1*(i%2?-1:1));
  this.poster.rotation.y=Math.sin(this.time*.3)*.06;this.receiver.rotation.z=-.18+Math.sin(this.time*3)*.035;this.birds.position.x=Math.sin(this.time*.05)*3;this.motes.rotation.y=Math.sin(this.time*.02)*.025;
  if(!this.reduced)for(const {mixer,root} of this.mixers)if(root===this.activeCrew&&this.sceneIndex===1)mixer.update(dt);
  this.composer.render();
 }
}
