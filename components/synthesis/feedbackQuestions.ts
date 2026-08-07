/** Post-synthesis usability instrument. Categorical only — no clinical values or free text. */
export const FEEDBACK_QUESTIONS=[
 {key:"clinicianAgreed" as const,label:"Clinical agreement with the synthesis",options:[["agree","Agree"],["partly","Partly agree"],["disagree","Disagree"],["unable","Unable to assess"]] as const},
 {key:"timeBurden" as const,label:"Effect on time",options:[["saved-time","Saved time"],["no-difference","No meaningful difference"],["added-time","Added time"],["unable","Unable to assess"]] as const},
 {key:"clinicalUsefulness" as const,label:"Clinical usefulness",options:[["identified-useful-issue","Identified a useful issue"],["confirmed-known","Confirmed what I knew"],["irrelevant-alert","Produced an irrelevant alert"],["no-contribution","No useful contribution"],["unable","Unable to assess"]] as const},
 {key:"communication" as const,label:"Handoff usefulness",options:[["handoff-useful","Useful"],["handoff-partly-useful","Partly useful"],["handoff-not-useful","Not useful"],["not-used","Did not use it"]] as const},
 {key:"impact" as const,label:"Did it change your assessment?",options:[["changed-urgency","Changed urgency"],["changed-localization","Changed localization"],["changed-requested-information","Changed what I requested"],["changed-treatment-discussion","Changed treatment discussion"],["no-change","No change"]] as const},
];
