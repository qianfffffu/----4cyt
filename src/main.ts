import './styles.css';
import { FlowerParticleScene } from './flower/FlowerParticleScene';

const app=document.querySelector<HTMLElement>('#app')!;
const loading=document.querySelector<HTMLElement>('.loading')!;
const controls=document.querySelector<HTMLElement>('.controls')!;
const fallback=document.querySelector<HTMLElement>('.fallback')!;
let flower: FlowerParticleScene | undefined;
const showFallback=(error: unknown)=>{console.warn('Flower particle initialization failed:',error);loading.hidden=true;controls.hidden=true;fallback.hidden=false;};
try {
  const canvas=document.createElement('canvas'); if(!canvas.getContext('webgl2')&&!canvas.getContext('webgl')) throw new Error('WebGL unavailable');
  flower=new FlowerParticleScene(app,()=>{loading.hidden=true;controls.hidden=false;},showFallback);
  document.querySelector<HTMLButtonElement>('.replay')!.addEventListener('click',()=>flower?.replay());
} catch(error) { showFallback(error); }
