export const vertexShader = `
attribute vec3 aBasePosition; attribute vec3 aColor; attribute float aReveal; attribute float aSeed; attribute float aEdgeAlpha;
uniform float uTime; uniform float uGrowthStart; uniform float uGrowthDuration; uniform float uPixelSize; uniform float uPointScale;
uniform float uPointerRadius; uniform float uPointerForce; uniform float uPointerLifetime; uniform float uMotionStrength; uniform vec4 uPointers[16];
varying vec3 vColor; varying float vAlpha;
float ease(float x){ return x*x*(3.0-2.0*x); }
void main(){
  float age = max(0.0, uTime-uGrowthStart); float reveal = ease(clamp((age/uGrowthDuration-aReveal)*8.0,0.0,1.0));
  vec2 offset=vec2(0.0); float influence=0.0;
  for(int i=0;i<16;i++){ vec4 s=uPointers[i]; float sa=uTime-s.w; if(sa>=0.0&&sa<uPointerLifetime){ vec2 d=aBasePosition.xy-s.xy; float len=length(d); float fall=pow(max(0.0,1.0-len/uPointerRadius),2.0); float decay=1.0-ease(sa/uPointerLifetime); vec2 dir=len>.01?d/len:vec2(cos(aSeed*31.0),sin(aSeed*31.0)); float force=uPointerForce*(1.0+s.z*6.0)*fall*decay*uMotionStrength; vec2 tangent=vec2(-dir.y,dir.x)*(aSeed-.5)*.45; offset+=(dir+tangent)*force; influence+=fall*decay; }}
  float maxMove=uPointerForce*1.35; if(length(offset)>maxMove) offset=normalize(offset)*maxMove;
  vec3 pos=aBasePosition; pos.xy+=offset; pos.xy+=(1.0-reveal)*vec2((aSeed-.5)*2.0,-2.0);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0); gl_PointSize=max(0.0,uPixelSize*uPointScale*reveal);
  vColor=aColor; vAlpha=aEdgeAlpha*reveal;
}`;

export const fragmentShader = `
precision highp float; varying vec3 vColor; varying float vAlpha;
void main(){ vec2 p=abs(gl_PointCoord-.5); float edge=1.0-smoothstep(.44,.5,max(p.x,p.y)); if(edge<=0.0) discard; gl_FragColor=vec4(vColor,vAlpha*edge); }
`;
