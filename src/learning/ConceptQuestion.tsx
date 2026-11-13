import { useEffect, useId, useState } from 'react';
import type { LearningTask } from './tasks';
import './learning.css';

export function ConceptQuestion({ task, onResult }: { task: LearningTask; onResult?: (correct: boolean, misconception: string) => void }) {
  const group = useId();
  const [choice, setChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { setChoice(null); setSubmitted(false); }, [task.id]);
  const q = task.question;
  if (!q) return null;
  const correct = choice === q.correctIndex;
  return <section className="learning-card concept-question" aria-labelledby={`${group}-title`}>
    <p className="learning-eyebrow">Think before you measure</p>
    <h2 id={`${group}-title`}>{q.prompt}</h2>
    <fieldset><legend className="learning-sr-only">Choose an explanation</legend>{q.options.map((text, index) => <label className={`learning-option ${choice === index ? 'selected' : ''}`} key={text}>
      <input type="radio" name={group} checked={choice === index} onChange={() => { setChoice(index); setSubmitted(false); }} /><span>{text}</span>
    </label>)}</fieldset>
    <button type="button" className="learning-primary" disabled={choice === null} onClick={() => { setSubmitted(true); onResult?.(correct, q.misconception); }}>Check my reasoning</button>
    {submitted && <div className={`learning-feedback ${correct ? 'correct' : ''}`} role="status"><strong>{correct ? 'That reasoning works.' : 'Let’s examine the first assumption.'}</strong><p>{q.explanation}</p></div>}
  </section>;
}
