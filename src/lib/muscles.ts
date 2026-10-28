// Muscle Group Inference with Word Boundaries for SWITCH

export function inferMusclesFromText(exName = '', sessionName = ''): string[] {
  const combined = `${exName} ${sessionName}`.toLowerCase();
  const hits: string[] = [];
  if (/\b(bench|chest|pushup|push-up|fly|flys|flye|flyes|dip|dips|incline|pec|pecs)\b/i.test(combined)) hits.push('Chest');
  if (/\b(shoulder|shoulders|ohp|overhead|lateral|delt|delts|military)\b/i.test(combined)) hits.push('Shoulders');
  if (/\b(back|pullup|pull-up|row|rows|lat|lats|deadlift|chinup|chin-up)\b/i.test(combined)) hits.push('Back');
  if (/\b(tricep|triceps|pushdown|pushdowns|skullcrusher|skullcrushers|kickback|kickbacks|close-grip)\b/i.test(combined)) hits.push('Triceps');
  if (/\b(bicep|biceps|curl|curls|preacher|hammer)\b/i.test(combined)) hits.push('Biceps');

  const hasGluteExplicit = /\b(glute|glutes|hip thrust|thrust|abductor)\b/i.test(combined);
  if (/\b(squat|squats|quad|quads|leg press|lunge|lunges|extension|extensions|hack squat)\b/i.test(combined)) {
    if (hasGluteExplicit) {
      hits.push('Glutes');
    } else {
      hits.push('Quads');
    }
  } else if (hasGluteExplicit) {
    hits.push('Glutes');
  }

  if (/\b(rdl|hamstring|hamstrings|leg curl|leg curls|hinge|good morning)\b/i.test(combined)) hits.push('Hamstrings');
  if (/\b(core|plank|planks|abs?|crunch|crunches|situp|situps|abdominals?)\b/i.test(combined)) hits.push('Core');

  return hits.length > 0 ? hits : ['Other'];
}
