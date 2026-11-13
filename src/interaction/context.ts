/** Capability-only probe, disposed immediately. There is only one live rendering
 * context. Detecting failure before R3F's asynchronous configure avoids a blank
 * canvas when a browser disables WebGL entirely. */
export function probeWebGL2(createCanvas:()=>HTMLCanvasElement=()=>document.createElement('canvas')):{available:boolean;reason:string}{
  try{
    const canvas=createCanvas(),context=canvas.getContext('webgl2');
    if(!context)return{available:false,reason:'3D inspection is unavailable because this browser cannot create a WebGL 2 context. Continue with the equivalent 2D instrument and precision microscope.'};
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return{available:true,reason:''};
  }catch{return{available:false,reason:'3D initialization failed. Your measurement is preserved in the 2D instrument and precision microscope.'};}
}
