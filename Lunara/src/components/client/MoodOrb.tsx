/**
 * @module components/client/MoodOrb
 * Three.js-powered 3D orb that reflects the client's current mood via
 * color, distortion intensity, and particle animation.
 */
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/** Subscribes to WebGL context loss/restore so we can prevent default and allow recovery */
function WebGLContextHandler() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => e.preventDefault();
    canvas.addEventListener('webglcontextlost', onLost, false);
    return () => canvas.removeEventListener('webglcontextlost', onLost);
  }, [gl]);
  return null;
}

interface MoodOrbProps {
  color: string;
  intensity: number;
  label?: string;
}

/* ─── GLSL ─── */

const noise = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g,l.zxy);vec3 i2=max(g,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

const vertSrc = `
  uniform float uTime;
  uniform float uDistort;
  uniform float uSpeed;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vDisp;
  ${noise}
  void main(){
    float t=uTime*uSpeed;
    float n1=snoise(normal*1.6+t*.3)*uDistort;
    float n2=snoise(normal*3.2+t*.55)*uDistort*.25;
    float d=n1+n2;
    vDisp=d;
    vec3 pos=position+normal*d;
    vNormal=normalize(normalMatrix*normal);
    vWorldPos=(modelMatrix*vec4(pos,1.)).xyz;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
  }
`;

const fragSrc = `
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vDisp;
  void main(){
    vec3 V=normalize(cameraPosition-vWorldPos);
    float fresnel=pow(1.-max(dot(V,vNormal),0.),3.);

    // core color with depth
    vec3 core=uColor*(.55+uIntensity*.45);

    // inner glow — brighter at center
    float center=pow(max(dot(V,vNormal),0.),1.8);
    vec3 inner=uGlow*center*.9;

    // rim light
    vec3 rim=uGlow*fresnel*(.9+uIntensity*.7);

    // surface displacement detail
    float detail=smoothstep(-.06,.09,vDisp);
    vec3 surf=mix(core*.8,core*1.3,detail);

    // shimmer
    float shimmer=sin(vWorldPos.x*12.+uTime*2.2)*sin(vWorldPos.y*12.+uTime*1.7)*.025;

    // pulse
    float pulse=1.+sin(uTime*1.4)*.035;

    vec3 col=(surf+inner+rim+shimmer)*pulse;
    gl_FragColor=vec4(col,.93);
  }
`;

const glowVert = `
  varying vec3 vN;varying vec3 vW;
  void main(){
    vN=normalize(normalMatrix*normal);
    vW=(modelMatrix*vec4(position,1.)).xyz;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
  }
`;

const glowFrag = `
  uniform vec3 uColor;uniform float uOpacity;
  varying vec3 vN;varying vec3 vW;
  void main(){
    vec3 V=normalize(cameraPosition-vW);
    float f=pow(1.-max(dot(V,vN),0.),2.2);
    gl_FragColor=vec4(uColor,f*uOpacity);
  }
`;

/* ─── Components ─── */

function CoreOrb({ color, intensity }: MoodOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowInnerRef = useRef<THREE.Mesh>(null);
  const glowOuterRef = useRef<THREE.Mesh>(null);

  const coreUni = useRef({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uGlow: { value: new THREE.Color(color) },
    uDistort: { value: 0.06 },
    uSpeed: { value: 0.6 },
    uIntensity: { value: intensity },
  });

  const glowInnerUni = useRef({
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: 0.3 },
  });

  const glowOuterUni = useRef({
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: 0.15 },
  });

  const elapsedRef = useRef(0);
  useFrame((_state, delta) => {
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    const c = coreUni.current;

    // Direct-set every frame from current props — no stale closures
    c.uTime.value = t;
    c.uColor.value.set(color);
    const hsl = { h: 0, s: 0, l: 0 };
    c.uColor.value.getHSL(hsl);
    c.uGlow.value.setHSL(hsl.h, Math.min(hsl.s * 0.9, 1), Math.min(hsl.l + 0.28, 0.88));
    c.uDistort.value = 0.03 + (1 - intensity) * 0.12;
    c.uSpeed.value = 0.4 + (1 - intensity) * 0.9;
    c.uIntensity.value = intensity;

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.1;
      meshRef.current.rotation.x = Math.sin(t * 0.22) * 0.08;
      const breathe = 1 + Math.sin(t * 1.2) * 0.018;
      meshRef.current.scale.setScalar(breathe);
    }

    // Glow layers
    glowInnerUni.current.uColor.value.copy(c.uGlow.value);
    glowOuterUni.current.uColor.value.copy(c.uGlow.value);

    if (glowInnerRef.current) {
      glowInnerRef.current.scale.setScalar(1.18 + Math.sin(t * 1.0) * 0.04);
      glowInnerRef.current.rotation.y = t * 0.05;
    }
    if (glowOuterRef.current) {
      glowOuterRef.current.scale.setScalar(1.4 + Math.sin(t * 0.7 + 1) * 0.06);
      glowOuterRef.current.rotation.y = -t * 0.03;
    }
  });

  return (
    <group>
      {/* Outer atmospheric glow */}
      <mesh ref={glowOuterRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          uniforms={glowOuterUni.current}
          transparent side={THREE.BackSide}
          depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner fresnel glow */}
      <mesh ref={glowInnerRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          uniforms={glowInnerUni.current}
          transparent side={THREE.BackSide}
          depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Primary noise-displaced orb */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.05, 128, 128]} />
        <shaderMaterial
          vertexShader={vertSrc}
          fragmentShader={fragSrc}
          uniforms={coreUni.current}
          transparent
        />
      </mesh>
    </group>
  );
}

function Particles({ color, intensity }: MoodOrbProps) {
  const innerRef = useRef<THREE.Points>(null);
  const outerRef = useRef<THREE.Points>(null);

  const innerPos = useMemo(() => {
    const n = 220; const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 1.25 + Math.random() * 0.6;
      a[i*3] = r*Math.sin(ph)*Math.cos(th);
      a[i*3+1] = r*Math.sin(ph)*Math.sin(th);
      a[i*3+2] = r*Math.cos(ph);
    }
    return a;
  }, []);

  const outerPos = useMemo(() => {
    const n = 90; const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 1.9 + Math.random() * 0.9;
      a[i*3] = r*Math.sin(ph)*Math.cos(th);
      a[i*3+1] = r*Math.sin(ph)*Math.sin(th);
      a[i*3+2] = r*Math.cos(ph);
    }
    return a;
  }, []);

  const elapsedRef = useRef(0);
  useFrame((_state, delta) => {
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    const spd = 0.1 + (1 - intensity) * 0.25;
    if (innerRef.current) {
      innerRef.current.rotation.y = t * spd * 0.18;
      innerRef.current.rotation.x = Math.sin(t * 0.12) * 0.1;
      const m = innerRef.current.material as THREE.PointsMaterial;
      m.color.set(color);
      m.opacity = 0.55 + intensity * 0.4;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = -t * spd * 0.07;
      outerRef.current.rotation.z = Math.cos(t * 0.09) * 0.08;
      const m = outerRef.current.material as THREE.PointsMaterial;
      m.color.set(color);
      m.opacity = 0.25 + intensity * 0.3;
    }
  });

  return (
    <group>
      <points ref={innerRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={innerPos.length/3} array={innerPos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.028} transparent sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <points ref={outerRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={outerPos.length/3} array={outerPos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.018} transparent sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

/* ─── Export ─── */

/** Canvas-wrapped 3D orb with noise displacement, glow layers, and orbiting particles. */
export const MoodOrb = React.memo(function MoodOrb({ color, intensity, label }: MoodOrbProps) {
  return (
    <div className="w-full h-[240px] sm:h-[280px]" role="img" aria-label={label ?? 'Mood orb visualization'}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 50 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <WebGLContextHandler />
        <ambientLight intensity={0.25} />
        <pointLight position={[4, 4, 5]} intensity={0.6} />
        <pointLight position={[-4, -2, 4]} intensity={0.3} color="#aa9988" />
        <pointLight position={[0, 5, -3]} intensity={0.2} color="#8888bb" />
        <CoreOrb color={color} intensity={intensity} />
        <Particles color={color} intensity={intensity} />
      </Canvas>
    </div>
  );
});
