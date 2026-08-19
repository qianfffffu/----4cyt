import { describe, expect, it } from 'vitest';
import { buildForegroundMask } from './imageMask';
import { calculateGrowth } from './growthMap';
import { clientToLocal } from './pointerTrail';

describe('flower core',()=>{
  it('flood fills only edge-connected white background',()=>{const d=new Uint8ClampedArray(5*5*4).fill(255);for(let y=1;y<4;y++)for(let x=1;x<4;x++){const i=(y*5+x)*4;d[i]=245;d[i+1]=225;d[i+2]=220;}const m=buildForegroundMask(d,5,5);expect(m.alpha[0]).toBe(0);expect(m.alpha[12]).toBe(1)});
  it('normalizes geodesic growth from bottom seed',()=>{const p=[{x:1,y:2,pixelIndex:7},{x:1,y:1,pixelIndex:4},{x:1,y:0,pixelIndex:1}];const g=calculateGrowth(p,3,1);expect(g[0]).toBeLessThan(g[2]);expect(Math.max(...g)).toBeLessThanOrEqual(1)});
  it('maps client coordinates around the canvas center',()=>{const r={left:10,top:20,width:200,height:100} as DOMRect;expect(clientToLocal(110,70,r)).toEqual({x:0,y:0})});
});
