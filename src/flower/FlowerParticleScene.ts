import * as THREE from 'three';
import { FLOWER_CONFIG } from './config';
import { loadAndMask } from './imageMask';
import { calculateGrowth, type SampledParticle } from './growthMap';
import { PointerTrail, clientToLocal } from './pointerTrail';
import { vertexShader, fragmentShader } from './shaders';

export class FlowerParticleScene {
  private renderer: THREE.WebGLRenderer; private scene = new THREE.Scene(); private camera = new THREE.OrthographicCamera();
  private points!: THREE.Points; private material!: THREE.ShaderMaterial; private trail = new PointerTrail();
  private sourceWidth=1; private sourceHeight=1; private raf=0; private start=0; private visible=true; private ro: ResizeObserver;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; private onReady: () => void; private onError: (error: unknown) => void;
  constructor(private host: HTMLElement, onReady: () => void, onError: (error: unknown) => void) {
    this.onReady=onReady;
    this.onError=onError;
    this.renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace; this.renderer.setClearColor(0xf7f4ef,1); this.renderer.domElement.setAttribute('aria-label','可互动的百合花像素粒子画面');
    host.prepend(this.renderer.domElement); this.ro=new ResizeObserver(()=>this.resize()); this.ro.observe(host);
    this.bind(); void this.init().catch(this.onError);
  }
  private async init(){
    const flowerUrl=new URL(`${import.meta.env.BASE_URL}assets/flower.jpg`,window.location.href).href;
    const mask=await loadAndMask(flowerUrl); this.sourceWidth=mask.width; this.sourceHeight=mask.height;
    const target=innerWidth<700?FLOWER_CONFIG.particleTargetMobile:FLOWER_CONFIG.particleTargetDesktop;
    let foregroundPixels=0; for(let i=0;i<mask.alpha.length;i++) if(mask.alpha[i]>.12) foregroundPixels++;
    let step=Math.max(1,Math.round(Math.sqrt(foregroundPixels/target)));
    const sampled: SampledParticle[]=[];
    for(let y=0;y<mask.height;y+=step) for(let x=0;x<mask.width;x+=step){ const i=y*mask.width+x; if(mask.alpha[i]>.12) sampled.push({x,y,pixelIndex:i}); }
    const growth=calculateGrowth(sampled,mask.width,step), n=sampled.length;
    const pos=new Float32Array(n*3), color=new Float32Array(n*3), edge=new Float32Array(n), seed=new Float32Array(n);
    for(let i=0;i<n;i++){ const p=sampled[i], c=p.pixelIndex*4; pos[i*3]=p.x-mask.width/2; pos[i*3+1]=mask.height/2-p.y; color[i*3]=mask.rgba[c]/255; color[i*3+1]=mask.rgba[c+1]/255; color[i*3+2]=mask.rgba[c+2]/255; edge[i]=mask.alpha[p.pixelIndex]; seed[i]=((Math.imul(i+11,1597334677)>>>0)/4294967295); }
    const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.BufferAttribute(pos,3)); geometry.setAttribute('aBasePosition',new THREE.BufferAttribute(pos,3)); geometry.setAttribute('aColor',new THREE.BufferAttribute(color,3)); geometry.setAttribute('aReveal',new THREE.BufferAttribute(growth,1)); geometry.setAttribute('aSeed',new THREE.BufferAttribute(seed,1)); geometry.setAttribute('aEdgeAlpha',new THREE.BufferAttribute(edge,1));
    this.material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthTest:false,blending:THREE.NormalBlending,uniforms:{uTime:{value:0},uGrowthStart:{value:0},uGrowthDuration:{value:this.reduced?.3:FLOWER_CONFIG.growthDuration},uPixelSize:{value:step*FLOWER_CONFIG.pixelSize},uPointScale:{value:1},uPointerRadius:{value:FLOWER_CONFIG.pointerRadius},uPointerForce:{value:FLOWER_CONFIG.pointerForce},uPointerLifetime:{value:FLOWER_CONFIG.pointerSampleLifetime},uMotionStrength:{value:this.reduced?.15:1},uPointers:{value:this.trail.samples}}});
    this.points=new THREE.Points(geometry,this.material); this.scene.add(this.points); this.resize();
    // A one-pixel buffer nudge makes restored high-DPI tabs commit a fresh WebGL viewport.
    this.renderer.setSize(Math.max(1,this.host.clientWidth-1),this.host.clientHeight,false);
    requestAnimationFrame(()=>{this.resize();this.onReady();}); this.replay(); this.animate();
  }
  replay(){ if(!this.material)return; this.start=performance.now()/1000; this.material.uniforms.uGrowthStart.value=this.start; }
  private bind(){ const c=this.renderer.domElement; c.addEventListener('pointermove',e=>{const p=clientToLocal(e.clientX,e.clientY,c.getBoundingClientRect()); const scale=this.points?.scale.x||1; this.trail.add(p.x/scale,p.y/scale,performance.now());},{passive:true}); c.addEventListener('pointerleave',()=>this.trail.leave()); c.addEventListener('pointercancel',()=>this.trail.leave()); c.addEventListener('webglcontextlost',e=>{e.preventDefault(); this.visible=false; document.querySelector<HTMLElement>('.fallback')!.hidden=false;}); document.addEventListener('visibilitychange',()=>{this.visible=!document.hidden;if(this.visible)this.animate();}); }
  private resize(){ const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return; const dpr=Math.min(devicePixelRatio,FLOWER_CONFIG.maxDpr);this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h,false);this.camera.left=-w/2;this.camera.right=w/2;this.camera.top=h/2;this.camera.bottom=-h/2;this.camera.near=-10;this.camera.far=10;this.camera.updateProjectionMatrix();if(this.points){const s=Math.min(w*.82/this.sourceWidth,h*.82/this.sourceHeight);this.points.scale.setScalar(s);this.material.uniforms.uPointScale.value=s*dpr;this.material.uniforms.uPointerRadius.value=FLOWER_CONFIG.pointerRadius/s*(innerWidth<700?1.18:1);this.material.uniforms.uPointerForce.value=FLOWER_CONFIG.pointerForce/s;}}
  private animate=()=>{if(!this.visible||this.raf)return;const loop=(ms:number)=>{this.raf=0;if(!this.visible)return;if(this.material)this.material.uniforms.uTime.value=ms/1000;this.renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(loop)};this.raf=requestAnimationFrame(loop)};
}
