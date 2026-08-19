export interface SampledParticle { x: number; y: number; pixelIndex: number }

export function calculateGrowth(particles: SampledParticle[], imageWidth: number, step: number): Float32Array {
  const n = particles.length, lookup = new Map<number, number>();
  for (let i = 0; i < n; i++) lookup.set(particles[i].y * imageWidth + particles[i].x, i);
  let seed = 0;
  for (let i = 1; i < n; i++) {
    const a = particles[i], b = particles[seed];
    if (a.y > b.y || (a.y === b.y && Math.abs(a.x - imageWidth / 2) < Math.abs(b.x - imageWidth / 2))) seed = i;
  }
  const dist = new Float32Array(n); dist.fill(Infinity); dist[seed] = 0;
  const visited = new Uint8Array(n), heapI = new Int32Array(Math.max(n * 6, 1)), heapD = new Float32Array(Math.max(n * 6, 1));
  let hs = 0;
  const push = (idx: number, d: number) => { let p = hs++; heapI[p] = idx; heapD[p] = d; while (p) { const q = (p - 1) >> 1; if (heapD[q] <= d) break; heapI[p] = heapI[q]; heapD[p] = heapD[q]; p = q; heapI[p] = idx; heapD[p] = d; } };
  const pop = () => { const out = heapI[0], li = heapI[--hs], ld = heapD[hs]; let p = 0; while (true) { let c = p * 2 + 1; if (c >= hs) break; if (c + 1 < hs && heapD[c + 1] < heapD[c]) c++; if (heapD[c] >= ld) break; heapI[p] = heapI[c]; heapD[p] = heapD[c]; p = c; } if (hs) { heapI[p] = li; heapD[p] = ld; } return out; };
  push(seed, 0);
  const dirs = [-1,0, 1,0, 0,-1, 0,1, -1,-1, 1,-1, -1,1, 1,1];
  let max = 1, connected = 0;
  while (hs) { const u = pop(); if (visited[u]) continue; visited[u] = 1; connected++; const p = particles[u];
    for (let k = 0; k < dirs.length; k += 2) { const v = lookup.get((p.y + dirs[k+1] * step) * imageWidth + p.x + dirs[k] * step); if (v === undefined || visited[v]) continue; const nd = dist[u] + (dirs[k] && dirs[k+1] ? 1.414 : 1); if (nd < dist[v]) { dist[v] = nd; push(v, nd); max = Math.max(max, nd); } }
  }
  // Link detached pollen/details through a spatial index instead of an O(n²) scan.
  if (connected < n) {
    const cellSize=step*16, columns=Math.ceil(imageWidth/cellSize)+2;
    const buckets=new Map<number,number[]>();
    for(let i=0;i<n;i++) if(Number.isFinite(dist[i])) {
      const p=particles[i], key=((p.y/cellSize)|0)*columns+((p.x/cellSize)|0);
      const bucket=buckets.get(key); if(bucket) bucket.push(i); else buckets.set(key,[i]);
    }
    for(let i=0;i<n;i++) if(!Number.isFinite(dist[i])) {
      const p=particles[i], cx=(p.x/cellSize)|0, cy=(p.y/cellSize)|0;
      let best=seed, bestSq=Infinity;
      for(let ring=0;ring<32&&bestSq===Infinity;ring++) {
        for(let yy=cy-ring;yy<=cy+ring;yy++) for(let xx=cx-ring;xx<=cx+ring;xx++) {
          if(ring&&xx>cx-ring&&xx<cx+ring&&yy>cy-ring&&yy<cy+ring) continue;
          const bucket=buckets.get(yy*columns+xx); if(!bucket) continue;
          for(const j of bucket) { const q=particles[j], dx=p.x-q.x, dy=p.y-q.y, ds=dx*dx+dy*dy; if(ds<bestSq){bestSq=ds;best=j;} }
        }
      }
      const bridge=Math.sqrt(bestSq)/step;
      dist[i]=dist[best]+bridge+6; max=Math.max(max,dist[i]);
    }
  }
  const result = new Float32Array(n);
  for (let i = 0; i < n; i++) { const seedNoise = ((Math.imul(i + 17, 2654435761) >>> 0) / 4294967295 - .5) * .018; result[i] = Math.max(0, Math.min(1, dist[i] / max + seedNoise)); }
  return result;
}
