import type {Drill} from './fieldwork';

export const cadetTasks:Record<Drill,{title:string;action:string;why:string}> = {
  air:{title:'Help the crew breathe',action:'Follow the glowing marker to Life Support. Slide the blue ring into the gold slot.',why:'The crew needs oxygen to breathe. Making more uses water and electricity.'},
  plants:{title:'Grow food for the crew',action:'Go to the Greenhouse. Move the light until it shines on the middle of the tray.',why:'Plants need light and water. Bright lights also use more power.'},
  power:{title:'Catch the sunlight',action:'Go to the Solar Array. Tilt the panels toward the Sun marker.',why:'Panels turn sunlight into electricity. Hills can block the sunlight.'},
  shelter:{title:'Get both astronauts to safety',action:'Go to the Storm Shelter. Move both astronauts into the sheltered space.',why:'The shelter protects the crew from fast particles sent out by the Sun.'},
  survey:{title:'Explore three places on the Moon',action:'Go to the Science Lab. Read Scout’s scans, pick a survey spot, then walk through the glowing rings.',why:'A survey tells the crew what the ground is like before they send people or equipment.'},
  radio:{title:'Send a message to Earth',action:'Go to the Habitat. Match the waves on the radio and send a test message.',why:'Radio messages take time to travel to Earth and back.'},
};

export const cadetQuiz = [
  {topic:'Life support',question:'What does the oxygen machine help the crew do?',choices:['Make the Moon brighter','Breathe inside the habitat','Drive the rover faster'],correct:1,explanation:'The oxygen machine helps supply air for the crew. It needs water and electricity to work.'},
  {topic:'Greenhouse',question:'If you dim the grow lights to save power, what might happen?',choices:['The plants might grow more slowly','The battery will drain faster','The plants will stop needing water'],correct:0,explanation:'Dimming the lights saves electricity but can slow plant growth in the greenhouse.'},
  {topic:'Storm shelter',question:'A solar storm warning arrives. Where should the crew go?',choices:['Up the nearest hill','Beside the solar panels','Inside the storm shelter'],correct:2,explanation:'The shelter adds shielding between the crew and the fast particles from the Sun.'},
  {topic:'Rover survey',question:'Scout finds one steep path and one flatter path. Which is easier to drive on, if the ground is otherwise similar?',choices:['The flatter path','The steeper path','Both have the same slope'],correct:0,explanation:'A flatter path is generally easier to drive on. A longer detour could still use more battery.'},
  {topic:'Radio',question:'Why do you wait for a radio reply from Earth?',choices:['Space turns radio messages into light','The signal needs time to travel there and back','The Moon has to turn around first'],correct:1,explanation:'Even fast radio signals take time to cross the distance between the Moon and Earth.'},
] as const;

export function cadetScore(answers:readonly number[]) {
  return cadetQuiz.reduce((score,question,index)=>score+Number(answers[index]===question.correct),0);
}
