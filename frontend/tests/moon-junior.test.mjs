import assert from 'node:assert/strict';
import {test} from 'node:test';
import {drillFor} from '../src/moon/fieldwork.ts';
import {cadetQuiz,cadetScore,cadetTasks} from '../src/moon/juniorGuide.ts';
import {chapter} from '../src/moon/story.ts';
import {getFrame} from '../src/outpost/model.ts';

test('every day in either mission has a cadet guide task',()=>{
  for(const seed of [0,1])for(let day=1;day<=6;day++){
    const task=cadetTasks[drillFor(chapter(day,getFrame(day,seed)).target)];
    assert.ok(task.title&&task.action&&task.why);
  }
});

test('the quiz grades full and partial attempts using the configured answers',()=>{
  const key=cadetQuiz.map(question=>question.correct);
  assert.equal(cadetScore([]),0);
  assert.equal(cadetScore(key),5);
  assert.equal(cadetScore([key[0],-1,key[2]]),2);
  for(const question of cadetQuiz)assert.ok(question.choices[question.correct]&&question.explanation);
});
