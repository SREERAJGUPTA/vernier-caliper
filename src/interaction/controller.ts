export type PointerOwner='none'|'interface'|'carriage'|'specimen'|'magnifier'|'camera';
/** One owner per gesture; camera lock and physical slider lock are unrelated. */
export class InteractionController {
  owner:PointerOwner='none';pointerId:number|null=null;
  acquire(owner:PointerOwner,pointerId:number){if(this.owner!=='none')return false;this.owner=owner;this.pointerId=pointerId;return true;}
  release(pointerId?:number){if(pointerId!==undefined&&this.pointerId!==pointerId)return false;this.owner='none';this.pointerId=null;return true;}
  get dragging(){return this.owner==='carriage'||this.owner==='specimen'||this.owner==='magnifier';}
}
export function projectedAxisDelta(dx:number,dy:number,axisX:number,axisY:number):number|null {
  const length2=axisX*axisX+axisY*axisY;
  return length2<.04?null:(dx*axisX+dy*axisY)/length2;
}
/** Exponential camera transition has the same time constant at any refresh rate. */
export const transitionFraction=(elapsedSeconds:number,timeConstant=.13)=>1-Math.exp(-Math.max(0,elapsedSeconds)/timeConstant);
