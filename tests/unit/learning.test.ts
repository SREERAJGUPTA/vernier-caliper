import { describe, expect, it } from 'vitest';
import { createLearningTask, OBJECTIVES, recordLearningResult } from '../../src/learning/tasks';
import type { PlateN } from '../../src/domain/types';

describe('seeded learning tasks', () => {
  it('reproduces an objective, plate and signed offset from a seed', () => {
    expect(createLearningTask(1631,'mixed','standard',20)).toEqual(createLearningTask(1631,'mixed','standard',20));
    const objectives=new Set(Array.from({length:100},(_,i)=>createLearningTask(i,'mixed','standard',20).objective));
    expect(objectives.size).toBe(10);
  });
  it('keeps every signed zero example on the selected plate and inside the supported range', () => {
    for(const N of [10,20,50] as PlateN[]) for(const objective of ['positive-zero','negative-zero'] as const) {
      const task=createLearningTask(1542,objective,'standard',N);
      expect(Math.abs(task.e)).toBeLessThanOrEqual(.1);
      expect(Math.abs(task.e*N-Math.round(task.e*N))).toBeLessThan(1e-12);
      expect(Math.sign(task.e)).toBe(objective==='positive-zero'?1:-1);
    }
    expect(createLearningTask(1,'positive-zero','standard',50).e).toBe(.04);
    expect(createLearningTask(1,'negative-zero','standard',50).e).toBe(-.02);
  });
  it('changes plate for standard transfer tasks without changing the requested measurement modes', () => {
    for(const N of [10,20,50] as PlateN[]) for(let seed=0;seed<30;seed++) expect(createLearningTask(seed,'transfer','standard',N).N).not.toBe(N);
    for(const mode of ['external','internal','depth','step'] as const) expect(createLearningTask(49,mode,'standard',20).mode).toBe(mode);
  });
  it('has exactly one correct option for each conceptual task and no numerical specimen size in physical prompts', () => {
    for(const objective of OBJECTIVES) {
      const task=createLearningTask(7,objective.id,'standard',50);
      if(task.question){expect(task.question.options).toHaveLength(4);expect(task.question.correctIndex).toBeGreaterThanOrEqual(0);expect(task.question.correctIndex).toBeLessThan(4);expect(new Set(task.question.options).size).toBe(4);}
      if(['external','internal','depth','step','transfer'].includes(task.objective)) expect(task.prompt).not.toMatch(/\d/);
    }
  });
  it('tracks misconceptions separately from completion without modifying previous progress', () => {
    const old=recordLearningResult({},'depth',false,'reference-unseated');
    const next=recordLearningResult(old,'depth',true);
    expect(old.depth?.completed).toBe(0);expect(next.depth?.completed).toBe(1);expect(next.depth?.attempts).toBe(2);expect(next.depth?.misconceptions['reference-unseated']).toBe(1);
  });
});
