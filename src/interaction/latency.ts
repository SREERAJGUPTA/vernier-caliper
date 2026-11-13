/** Q6 software proxy only. No GPU completion or input-to-photon measurement.
 * Several accepted pointer events may precede one render. We retain the latest
 * event whose constrained state is submitted, and separately retain the oldest
 * event's latency to make coalescing visible rather than hiding it. */
export interface InputRenderSample {
  inputTime:number;submissionTime:number;latencyMs:number;
  oldestPendingLatencyMs:number;eventCount:number;
}
export interface InputRenderMetrics {
  sampleCount:number;acceptedEventCount:number;coalescedEventCount:number;
  rejectedTimestampCount:number;cancelledPendingEventCount:number;
  firstSubmissionTime:number|null;lastSubmissionTime:number|null;
  lastMs:number|null;p50Ms?:number;p95Ms?:number;p99Ms?:number;maxMs?:number;
  oldestPendingP95Ms?:number;
}
export function normalizeEventTimestamp(timestamp:number,receiptTime:number,timeOrigin:number):number|null {
  if(!Number.isFinite(timestamp)||!Number.isFinite(receiptTime))return null;
  // Modern Event.timeStamp is relative to the document's performance origin.
  // Some older engines use epoch milliseconds; normalize only that explicit case.
  const value=timestamp>1e12?timestamp-timeOrigin:timestamp;
  if(!Number.isFinite(value)||value<0||value>receiptTime)return null;
  return value;
}
export class InputRenderLatency {
  private pending:{first:number;last:number;count:number}|null=null;
  private samples:InputRenderSample[]=[];
  private rejected=0;private cancelled=0;
  constructor(private readonly capacity=240){if(!Number.isInteger(capacity)||capacity<1)throw new RangeError('A positive sample capacity is required.');}
  recordInput(timestamp:number,receiptTime:number,timeOrigin:number):boolean {
    const normalized=normalizeEventTimestamp(timestamp,receiptTime,timeOrigin);
    if(normalized===null){this.rejected++;return false;}
    if(this.pending){this.pending.first=Math.min(this.pending.first,normalized);this.pending.last=normalized;this.pending.count++;}
    else this.pending={first:normalized,last:normalized,count:1};
    return true;
  }
  submitted(submissionTime:number):InputRenderSample|null {
    const pending=this.pending;if(!pending)return null;this.pending=null;
    if(!Number.isFinite(submissionTime)||submissionTime<Math.max(pending.first,pending.last)){this.rejected+=pending.count;return null;}
    const sample={inputTime:pending.last,submissionTime,latencyMs:submissionTime-pending.last,oldestPendingLatencyMs:submissionTime-pending.first,eventCount:pending.count};
    this.samples.push(sample);if(this.samples.length>this.capacity)this.samples.shift();return sample;
  }
  clearPending(){if(this.pending)this.cancelled+=this.pending.count;this.pending=null;}
  metrics(minimumSamples=20):InputRenderMetrics {
    const length=this.samples.length;
    const result:InputRenderMetrics={sampleCount:length,acceptedEventCount:this.samples.reduce((n,s)=>n+s.eventCount,0),coalescedEventCount:this.samples.reduce((n,s)=>n+s.eventCount-1,0),rejectedTimestampCount:this.rejected,cancelledPendingEventCount:this.cancelled,firstSubmissionTime:this.samples[0]?.submissionTime??null,lastSubmissionTime:this.samples.at(-1)?.submissionTime??null,lastMs:this.samples.at(-1)?.latencyMs??null};
    if(length<minimumSamples)return result;
    const values=this.samples.map(s=>s.latencyMs).sort((a,b)=>a-b),oldest=this.samples.map(s=>s.oldestPendingLatencyMs).sort((a,b)=>a-b);
    const rank=(p:number)=>Math.min(length-1,Math.ceil(length*p)-1);
    return{...result,p50Ms:values[rank(.5)],p95Ms:values[rank(.95)],p99Ms:values[rank(.99)],maxMs:values[length-1],oldestPendingP95Ms:oldest[rank(.95)]};
  }
}
