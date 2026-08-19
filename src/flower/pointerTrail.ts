import { Vector2, Vector4 } from 'three';
import { FLOWER_CONFIG } from './config';

export class PointerTrail {
  readonly samples = Array.from({ length: FLOWER_CONFIG.pointerSamples }, () => new Vector4(0, 0, 0, -99));
  private cursor = 0; private last = new Vector2(); private lastTime = 0; private active = false;
  add(x: number, y: number, now: number) {
    const dt = Math.max(8, now - this.lastTime), speed = this.active ? Math.min(2.5, Math.hypot(x-this.last.x,y-this.last.y)/dt) : 0;
    this.samples[this.cursor].set(x, y, speed, now / 1000); this.cursor = (this.cursor + 1) % this.samples.length;
    this.last.set(x,y); this.lastTime = now; this.active = true;
  }
  leave() { this.active = false; }
}

export function clientToLocal(clientX: number, clientY: number, rect: DOMRect) {
  const x = clientX - rect.left - rect.width / 2;
  const y = -(clientY - rect.top - rect.height / 2);
  return { x: x || 0, y: y || 0 };
}
