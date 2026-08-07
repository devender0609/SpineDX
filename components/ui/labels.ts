import type { ClinicalStatus, LumbarLevel, MotorGrade } from "@/lib/schema";

/** Shared display labels and option lists used by every view. */
/** Display-label map shared by every view so wording cannot diverge between screens. */
export const labels:Record<string,string>={
  "not-assessed":"Not assessed","not-applicable":"Not applicable","not-measured":"Not measured","not-graded":"Not graded","not-tested":"Not tested",
  present:"Yes",absent:"No",unknown:"Unknown",lumbar:"Lumbar / lumbosacral",cervical:"Cervical",thoracic:"Thoracic",multiple:"Multiple spine regions",
  "nonspinal-uncertain":"Nonspinal or uncertain","open-to-surgery":"Open to surgery","type-1":"Type 1","type-2":"Type 2","decompression-fusion":"Decompression with fusion",
  "meaningful-temporary":"Meaningful temporary benefit","not-tried":"No injection performed","brief":"Brief benefit","sustained":"Sustained benefit","true":"Objective and reproducible","serial-objective":"Serial objective examinations","clinician-concern":"Clinician concern","patient-reported":"Patient reported",
  "right-recess":"Right lateral recess","left-recess":"Left lateral recess","right-foramen":"Right foramen","left-foramen":"Left foramen",
  "L3-4":"L3–4","L4-5":"L4–5","L5-S1":"L5–S1","not-established":"Not established","unable-to-assess":"Unable to assess","routine-reasonable":"Routine specialist review reasonable","additional-assessment":"Additional assessment needed","localization-unresolved":"Candidate localization unresolved",expedited:"Expedited specialist assessment",emergency:"Emergency pathway","factors-documented":"Fusion-rationale factors documented","incompletely-assessed":"Fusion rationale incompletely assessed","no-independent-factor":"No independent fusion factor documented","spine-surgery":"Spine surgery","consensus-meeting":"Consensus meeting",
};
export const label=(value:string)=>labels[value]??value.replaceAll("-"," ").replace(/\b\w/g,c=>c.toUpperCase());

export const clinicalStatuses:ClinicalStatus[]=["not-assessed","present","absent","unknown","not-applicable"];
export const levels:LumbarLevel[]=["L3-4","L4-5","L5-S1"];
export const grades:MotorGrade[]=["not-tested","5","4+","4","3","2","1","0"];
