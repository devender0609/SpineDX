import numpy as np, pandas as pd, json, os, zipfile, hashlib
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import roc_auc_score, balanced_accuracy_score, confusion_matrix, brier_score_loss

OUT='/mnt/data/spinedx_v19_training'
os.makedirs(OUT, exist_ok=True)
rng=np.random.default_rng(190731)
n=300_000

# Demographics / patient profile with plausible correlation structure (synthetic only)
age=np.clip(rng.normal(61,14,n),18,90).round().astype(int)
sex=rng.choice(['female','male'], n, p=[.53,.47])
bmi=np.clip(rng.normal(29,6,n),17,55).round(1)
smoking_status=np.where(rng.random(n)<.18,'current',np.where(rng.random(n)<.42,'former','never'))
pack_years=np.where(smoking_status=='never',0,np.clip(rng.gamma(2.0,8,n),0,80)).round(1)
vaping=((rng.random(n)<.07)&(smoking_status!='never')).astype(int)

# Comorbidity probabilities age/BMI dependent
sig=lambda x:1/(1+np.exp(-x))
hypertension=(rng.random(n)<sig(-3.2+.045*(age-40)+.055*(bmi-25))).astype(int)
diabetes=(rng.random(n)<sig(-3.4+.035*(age-40)+.085*(bmi-25))).astype(int)
a1c=np.where(diabetes,np.clip(rng.normal(7.1,1.25,n),4.8,13),np.clip(rng.normal(5.5,.35,n),4.5,6.4)).round(1)
insulin=((diabetes==1)&(rng.random(n)<sig(-1.1+.7*(a1c-7)))).astype(int)
coronary=(rng.random(n)<sig(-4.2+.06*(age-45)+.45*hypertension+.35*diabetes)).astype(int)
heart_failure=(rng.random(n)<sig(-5.1+.065*(age-55)+.8*coronary)).astype(int)
copd=(rng.random(n)<sig(-4.0+.035*(age-45)+.75*(smoking_status=='current')+.45*(pack_years>20))).astype(int)
sleep_apnea=(rng.random(n)<sig(-3.0+.09*(bmi-25)+.02*(age-45))).astype(int)
ckd_num=np.select([rng.random(n)<.01,rng.random(n)<.025,rng.random(n)<.08,rng.random(n)<.14],[5,4,3,2],default=0)
ckd_num=np.maximum(ckd_num, np.where((diabetes==1)&(rng.random(n)<.07),3,0))
prior_dvt_pe=(rng.random(n)<sig(-3.9+.025*(age-45)+.45*(bmi>35))).astype(int)
anticoag=((prior_dvt_pe==1)|(rng.random(n)<(.03+.09*coronary))).astype(int)

# Frailty/function
cfs=np.clip(np.rint(1.6+.035*(age-45)+.55*heart_failure+.35*copd+.3*(ckd_num>=3)+rng.normal(0,.8,n)),1,8).astype(int)
home_support=rng.choice(['adequate','limited','unknown'],n,p=[.72,.18,.10])
walking_limit=np.clip(np.exp(rng.normal(6.1-.18*(cfs-2),.85,n)),10,5000).round().astype(int)

# Nutrition / hematology / bone
albumin=np.clip(rng.normal(4.05-.12*(cfs-2)-.18*(ckd_num>=4),.35,n),2.0,5.2).round(1)
hemoglobin=np.clip(rng.normal(np.where(sex=='female',13.1,14.2)-.5*(ckd_num>=3)-.25*cfs/3,1.2,n),7,18).round(1)
recent_weight_loss=(rng.random(n)<sig(-3.2+.4*(cfs>=5)+.5*(albumin<3.5))).astype(int)
bone_health=np.where((age>=70)&(rng.random(n)<.30),'osteoporosis',np.where((age>=55)&(rng.random(n)<.35),'osteopenia','normal'))
prior_fragility=((bone_health=='osteoporosis')&(rng.random(n)<.25)).astype(int)
dex=np.where(bone_health=='normal',rng.normal(-.3,.7,n),np.where(bone_health=='osteopenia',rng.normal(-1.7,.35,n),rng.normal(-2.9,.45,n))).round(1)

# Psychosocial/opioid
phq9=np.clip(rng.poisson(5,n)+rng.binomial(1,.18,n)*5,0,27)
gad7=np.clip(rng.poisson(4,n)+rng.binomial(1,.16,n)*4,0,21)
opioid_use=(rng.random(n)<sig(-2.1+.012*np.minimum(walking_limit<500,1)+.035*(phq9-5))).astype(int)
opioid_mme=np.where(opioid_use,np.clip(rng.gamma(2.0,18,n),2,200),0).round(1)
opioid_months=np.where(opioid_use,np.clip(rng.gamma(2.0,8,n),1,120),0).round(0).astype(int)
benzo=((rng.random(n)<.08)&(phq9>=10)).astype(int)

# Spine phenotype
syndrome=rng.choice(['radicular','neurogenic_claudication','mixed','axial','uncertain'],n,p=[.34,.24,.22,.13,.07])
pathology=np.empty(n,dtype=object)
for s in np.unique(syndrome):
    ix=np.where(syndrome==s)[0]
    probs={'radicular':[.48,.08,.23,.15,.03,.03], 'neurogenic_claudication':[.08,.45,.22,.12,.07,.06], 'mixed':[.18,.25,.24,.18,.08,.07], 'axial':[.07,.12,.09,.17,.22,.33], 'uncertain':[.12,.16,.12,.14,.08,.38]}[s]
    pathology[ix]=rng.choice(['disc_herniation','central_stenosis','lateral_recess_stenosis','foraminal_stenosis','degenerative_spondylolisthesis','nonspecific'],len(ix),p=probs)
duration=np.clip(np.exp(rng.normal(3.5,1.0,n)),1,520).round().astype(int)
objective_motor=((rng.random(n)<(.08+.15*(syndrome=='radicular')+.07*(syndrome=='mixed')))).astype(int)
progressive=((objective_motor==1)&(rng.random(n)<.18)).astype(int)
hip_abnormal=(rng.random(n)<(.08+.12*(age>70))).astype(int)
vascular_abnormal=(rng.random(n)<(.04+.12*(age>75)+.08*diabetes)).astype(int)
instability=((pathology=='degenerative_spondylolisthesis')&(rng.random(n)<.25)).astype(int)
deformity=(rng.random(n)<(.03+.06*(age>70))).astype(int)
foraminal_collapse=((pathology=='foraminal_stenosis')&(rng.random(n)<.34)).astype(int)
prior_surgery=(rng.random(n)<sig(-2.3+.025*(age-45)+.18*(duration>52))).astype(int)
prior_type=np.where(prior_surgery==0,'none',rng.choice(['decompression','discectomy','fusion','instrumentation','multiple'],n,p=[.27,.22,.26,.10,.15]))
prior_infection=((prior_surgery==1)&(rng.random(n)<.035)).astype(int)
prior_pseudo=((prior_type=='fusion')|(prior_type=='multiple'))&(rng.random(n)<.09)
prior_pseudo=prior_pseudo.astype(int)
prior_dural=((prior_surgery==1)&(rng.random(n)<.06)).astype(int)

inj_response=rng.choice(['not_tried','none','temporary','sustained'],n,p=[.44,.17,.29,.10])
red_infection=((rng.random(n)<.012)&((albumin<3.2)|(diabetes==1))).astype(int)
red_cancer=(rng.random(n)<.012).astype(int)
red_fracture=((rng.random(n)<.018)&((bone_health=='osteoporosis')|(age>75))).astype(int)
ces=((rng.random(n)<.004)&((syndrome=='radicular')|(syndrome=='mixed'))).astype(int)

planned_proc=np.empty(n,dtype=object)
# synthetic decision context, not true treatment
planned_proc[:]='not_selected'
planned_proc[(syndrome=='radicular')&(pathology=='disc_herniation')&(duration>6)]='discectomy'
planned_proc[((syndrome=='neurogenic_claudication')|(syndrome=='mixed'))&(duration>12)]='decompression'
fus=((instability==1)|(foraminal_collapse==1)|(deformity==1)|((prior_surgery==1)&(prior_pseudo==1)))
planned_proc[fus&(duration>12)]='decompression_fusion'
planned_levels=np.where(planned_proc=='not_selected',0,np.where(rng.random(n)<.75,1,np.where(rng.random(n)<.75,2,rng.integers(3,7,n))))
planned_revision=((prior_surgery==1)&(planned_proc!='not_selected')&(rng.random(n)<.60)).astype(int)
planned_setting=np.where(planned_proc=='not_selected','not_selected',np.where((planned_levels<=1)&(cfs<=3)&(rng.random(n)<.45),'outpatient','inpatient'))

# Synthetic label probabilities: explicit assumptions only
clip=lambda x: np.clip(x,.01,.99)
p_exp=clip(.03+.58*progressive+.72*ces+.55*red_infection+.48*red_cancer+.42*red_fracture)
p_nonop=clip(.72-.38*(duration>12)-.42*progressive-.65*ces-.35*objective_motor+.18*(inj_response=='sustained')+.18*(syndrome=='axial')+.12*(syndrome=='uncertain'))
p_inj=clip(.08+.54*(inj_response=='not_tried')*((syndrome=='radicular')|(syndrome=='mixed'))+.20*(duration>=6)-.35*progressive-.30*ces)
p_decomp=clip(.04+.40*((syndrome=='radicular')|(syndrome=='neurogenic_claudication')|(syndrome=='mixed'))+.30*(duration>=12)+.22*objective_motor+.25*((pathology!='nonspecific'))-.28*hip_abnormal-.22*vascular_abnormal-.55*ces)
p_fusion=clip(.03+.54*instability+.48*foraminal_collapse+.42*deformity+.32*planned_revision+.30*prior_pseudo-.30*(syndrome=='axial')-.38*(planned_proc=='not_selected'))

p_opt=clip(.05+.40*(smoking_status=='current')+.18*vaping+.32*(a1c>=8)+.34*(albumin<3.5)+.25*(hemoglobin<11)+.30*(cfs>=5)+.28*(bone_health=='osteoporosis')+.24*(opioid_mme>=50))
p_med=clip(.03+.10*(age>=75)+.24*(cfs>=5)+.24*heart_failure+.18*copd+.20*(ckd_num>=4)+.12*insulin+.12*(hemoglobin<11)+.14*planned_revision+.18*(planned_levels>=3)+.15*(planned_proc=='decompression_fusion'))
p_heal=clip(.03+.35*(smoking_status=='current')+.12*vaping+.24*(bone_health=='osteoporosis')+.20*(a1c>=8)+.17*(planned_levels>=3)+.22*planned_revision+.34*prior_pseudo+.18*(albumin<3.5))
p_inf=clip(.025+.13*(smoking_status=='current')+.16*(bmi>=35)+.20*(a1c>=8)+.18*(albumin<3.5)+.18*planned_revision+.35*prior_infection+.12*(cfs>=5))
p_nonhome=clip(.04+.18*(age>=75)+.30*(cfs>=5)+.22*(home_support=='limited')+.12*(walking_limit<200)+.18*(planned_levels>=3)+.17*planned_revision+.12*heart_failure)
p_opioid=clip(.06+.42*(opioid_mme>0)+.20*(opioid_months>=6)+.18*(phq9>=10)+.10*(smoking_status=='current')+.12*benzo)

probs={
'support_expedited_review':p_exp,'support_nonoperative':p_nonop,'support_injection':p_inj,'support_decompression_consult':p_decomp,'independent_fusion_rationale':p_fusion,
'optimization_needed':p_opt,'perioperative_medical_concern':p_med,'fusion_healing_concern':p_heal,'infection_concern':p_inf,'nonhome_discharge_concern':p_nonhome,'persistent_opioid_concern':p_opioid}
labels={k:(rng.random(n)<v).astype(int) for k,v in probs.items()}

features=pd.DataFrame({
'age':age,'sex':sex,'bmi':bmi,'smoking_status':smoking_status,'pack_years':pack_years,'vaping_nicotine':vaping,
'hypertension':hypertension,'diabetes':diabetes,'a1c':a1c,'insulin_use':insulin,'coronary_disease':coronary,'heart_failure':heart_failure,'copd':copd,'sleep_apnea':sleep_apnea,'ckd_stage':ckd_num,'prior_dvt_pe':prior_dvt_pe,'anticoagulation':anticoag,
'clinical_frailty_scale':cfs,'home_support':home_support,'walking_limit_meters':walking_limit,'albumin':albumin,'hemoglobin':hemoglobin,'recent_weight_loss':recent_weight_loss,'bone_health':bone_health,'prior_fragility_fracture':prior_fragility,'dex_lowest_tscore':dex,
'phq9':phq9,'gad7':gad7,'opioid_mme_day':opioid_mme,'opioid_duration_months':opioid_months,'benzodiazepine_use':benzo,
'clinical_syndrome':syndrome,'pathology':pathology,'symptom_duration_weeks':duration,'objective_motor_deficit':objective_motor,'progressive_weakness':progressive,'hip_exam_abnormal':hip_abnormal,'vascular_exam_abnormal':vascular_abnormal,'dynamic_instability':instability,'deformity':deformity,'foraminal_collapse':foraminal_collapse,
'prior_surgery':prior_surgery,'prior_surgery_type':prior_type,'prior_infection':prior_infection,'prior_pseudarthrosis':prior_pseudo,'prior_dural_tear':prior_dural,'injection_response':inj_response,'infection_red_flag':red_infection,'cancer_red_flag':red_cancer,'fracture_red_flag':red_fracture,'cauda_equina_flag':ces,
'planned_procedure':planned_proc,'planned_levels':planned_levels,'planned_revision':planned_revision,'planned_setting':planned_setting,
**labels})

csv_gz=os.path.join(OUT,'spinedx_v19_synthetic_300000.csv.gz')
features.to_csv(csv_gz,index=False,compression='gzip')

# one-hot features for transparent shallow trees
X=pd.get_dummies(features.drop(columns=list(labels)), columns=['sex','smoking_status','home_support','bone_health','clinical_syndrome','pathology','prior_surgery_type','injection_response','planned_procedure','planned_setting'],dtype=int)
train_idx, test_idx=train_test_split(np.arange(n),test_size=.20,random_state=190731,stratify=labels['optimization_needed'])
metrics={}; trees={}

def serialize_tree(clf, names):
 t=clf.tree_; nodes=[]
 for i in range(t.node_count):
  if t.children_left[i]==t.children_right[i]:
   prob=float(t.value[i][0][1]/max(1,t.value[i][0].sum()))
   nodes.append({'feature':None,'threshold':None,'left':-1,'right':-1,'probability':prob})
  else:
   nodes.append({'feature':str(names[t.feature[i]]),'threshold':float(t.threshold[i]),'left':int(t.children_left[i]),'right':int(t.children_right[i]),'probability':None})
 return nodes

for target in labels:
 y=features[target].values
 clf=DecisionTreeClassifier(max_depth=5,min_samples_leaf=750,class_weight='balanced',random_state=42)
 clf.fit(X.iloc[train_idx],y[train_idx])
 pr=clf.predict_proba(X.iloc[test_idx])[:,1]; pred=(pr>=.5).astype(int)
 tn,fp,fn,tp=confusion_matrix(y[test_idx],pred,labels=[0,1]).ravel()
 metrics[target]={
  'prevalence':round(float(y.mean()),4),'auroc':round(float(roc_auc_score(y[test_idx],pr)),4),
  'balanced_accuracy':round(float(balanced_accuracy_score(y[test_idx],pred)),4),
  'sensitivity':round(float(tp/(tp+fn)),4),'specificity':round(float(tn/(tn+fp)),4),
  'brier':round(float(brier_score_loss(y[test_idx],pr)),4),'depth':int(clf.get_depth()),'leaves':int(clf.get_n_leaves())}
 trees[target]=serialize_tree(clf,list(X.columns))

manifest={'model_version':'Synthetic-Rule Surrogate 3.0 / v19','created_utc':'2026-07-31','random_seed':190731,'records_total':n,'training_records':len(train_idx),'holdout_records':len(test_idx),'model_type':'Independent shallow decision trees','max_depth':5,'min_samples_leaf':750,'purpose':'Reproduce explicitly defined synthetic rule labels for software research and workflow testing only.','not_for':['clinical probability estimation','patient counseling','treatment selection','regulatory clinical use'],'features':list(X.columns),'targets':list(labels.keys()),'metrics':metrics,'dataset_sha256':hashlib.sha256(open(csv_gz,'rb').read()).hexdigest()}
json.dump(manifest,open(os.path.join(OUT,'MODEL_MANIFEST.json'),'w'),indent=2)
json.dump(trees,open(os.path.join(OUT,'MODEL_TREES.json'),'w'),indent=2)
pd.DataFrame([{'target':k,**v} for k,v in metrics.items()]).to_csv(os.path.join(OUT,'MODEL_PERFORMANCE.csv'),index=False)

# data dictionary
rows=[]
for c in features.columns:
 rows.append({'variable':c,'role':'synthetic_label' if c in labels else 'input_feature','type':str(features[c].dtype),'description':'Synthetic variable; see generator source and model card.','allowed_or_range': ''})
pd.DataFrame(rows).to_csv(os.path.join(OUT,'DATA_DICTIONARY.csv'),index=False)

card=f'''# SpineDx Synthetic-Rule Surrogate 3.0 (v19)\n\n## Purpose\nThis model was trained on **300,000 entirely synthetic records** to reproduce explicitly programmed synthetic labels. It is for software testing, research workflow development, and sensitivity analysis only.\n\nIt is **not** a clinical prediction model. Its scores are not complication probabilities, treatment-benefit estimates, or validated patient-level risks.\n\n## Dataset\n- Total records: 300,000\n- Training: 240,000\n- Holdout: 60,000\n- Random seed: 190731\n- Patient, comorbidity, prior-surgery, procedure, spine phenotype, and risk-factor variables were simulated with selected correlations.\n- Labels were sampled from transparent probability formulas encoded in `generate_and_train_v19.py`.\n\n## Targets\nExisting pathway labels: expedited review, nonoperative care, injection consideration, decompression consultation, independent fusion rationale.\n\nNew research-only labels: optimization needed, perioperative medical concern, fusion-healing concern, infection concern, non-home discharge concern, and persistent-opioid concern.\n\n## Model\nEleven independent decision-tree classifiers; maximum depth 5; minimum leaf 750; balanced class weighting.\n\n## Critical limitation\nPerformance against a synthetic holdout measures agreement with the synthetic data-generating assumptions. High AUROC does not demonstrate clinical validity. Real clinical use requires prospective definition, real observed outcomes, calibration, external validation, subgroup evaluation, and governance review.\n'''
open(os.path.join(OUT,'MODEL_CARD.md'),'w').write(card)
# copy script
import shutil
shutil.copy('/mnt/data/train_v19.py',os.path.join(OUT,'generate_and_train_v19.py'))
print(json.dumps(metrics,indent=2))
