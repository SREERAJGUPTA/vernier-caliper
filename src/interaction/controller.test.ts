import {describe,it,expect} from 'vitest';
import {InteractionController,projectedAxisDelta,transitionFraction} from './controller';
import {probeWebGL2} from './context';
describe('interaction ownership and degeneracy',()=>{
  it('grants one pointer owner and rejects a second pointer',()=>{const c=new InteractionController();expect(c.acquire('carriage',1)).toBe(true);expect(c.acquire('camera',2)).toBe(false);expect(c.release(2)).toBe(false);expect(c.owner).toBe('carriage');c.release(1);expect(c.owner).toBe('none');});
  it('maps diagonal projected-axis motion without jump or side-view amplification',()=>{expect(projectedAxisDelta(30,40,3,4)).toBe(10);expect(projectedAxisDelta(100,100,.001,0)).toBeNull();expect(projectedAxisDelta(0,0,3,4)).toBe(0);});
  it.each([30,60,120])('has a frame-independent camera time constant at %i Hz',hz=>{let x=0;for(let i=0;i<hz;i++)x+=(1-x)*transitionFraction(1/hz);expect(x).toBeCloseTo(1-Math.exp(-1/.13),12);});
});
describe('graphics failure route',()=>{
  it('reports unavailable WebGL before mounting the async renderer',()=>{const result=probeWebGL2(()=>({getContext:()=>null}) as unknown as HTMLCanvasElement);expect(result.available).toBe(false);expect(result.reason).toContain('2D instrument');});
  it('disposes the capability probe before creating the rendering context',()=>{let released=0;const result=probeWebGL2(()=>({getContext:()=>({getExtension:()=>({loseContext:()=>released++})})}) as unknown as HTMLCanvasElement);expect(result.available).toBe(true);expect(released).toBe(1);});
  it('handles a driver exception through the same fallback',()=>{expect(probeWebGL2(()=>{throw new Error('driver');}).available).toBe(false);});
});
