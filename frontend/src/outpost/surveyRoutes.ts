export const surveyRoutes={
  rise:{title:'Western rise',power:2,oxygen:.6,detail:'The crew climbs on foot. Save battery power and keep more oxygen ready.'},
  relay:{title:'Relay approach',power:3,oxygen:.2,detail:'Scout carries the tools on the gentler ground. Spend an extra power unit and save oxygen.'},
} as const;
export type SurveyRoute=keyof typeof surveyRoutes;

export function getSurveyRoute(value:unknown) {
  return value==='rise'||value==='relay'?surveyRoutes[value]:undefined;
}
