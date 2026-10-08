const DEFAULT_TRANSLATION="UnderscoreEscapingWithSuffixes";
const TRANSLATION_OPTIONS=[
  ["UnderscoreEscapingWithSuffixes","UnderscoreEscapingWithSuffixes"],
  ["NoTranslation","NoTranslation"]
];
const collector=(exporter,settings={})=>({type:"collector",exporter,honorLabels:false,translationStrategy:DEFAULT_TRANSLATION,...settings});
const destination=settings=>({honorLabels:true,keepIdentifying:false,translationStrategy:DEFAULT_TRANSLATION,...settings});
const PROTOCOL={otlp:"OTLP",prom:"Prometheus exposition",rw2:"Remote Write 2.0",storage:"stored series"};
const EXPORTER={otlp:"OTLP exporter",prom:"Prometheus exporter",rw2:"Remote Write 2.0 exporter"};
const INGEST={otlp:"native OTLP receiver",prom:"scrape",rw2:"Remote Write 2.0 receiver"};
const RECEIVER={otlp:"OTLP receiver",prom:"Prometheus receiver",rw2:"Remote Write 2.0 receiver"};
const ALTERNATIVES_URL="experiments/complete-36/predicted/alternative-variants.json";
const VARIANT_OPTIONS=[
  ["current","Current · measured"],
  ["B","Option B · scrape pair first"],
  ["C","Option C · declared service first"],
  ["C1","Option C.1 · no underscore recognition"],
  ["E","Option E · resource ID (symbolic)"]
];

// Exact route tuples from the Lab's original 36-case coverage manifest. The
// Lab's 22 dotted-source twins are derived below from their recorded pairs.
// Routes with more than one Collector remain out of scope.
const BASE_COVERAGE_CASES=[
  {id:"E01",source:"prom",collector:false,final:"scrape",final_honor:false},
  {id:"E02",source:"prom",collector:false,final:"scrape",final_honor:true},
  {id:"E03",source:"prom",collector:true,receiver_honor:false,exporter:"prom",strategy:DEFAULT_TRANSLATION,final:"scrape",final_honor:true},
  {id:"E04",source:"otlp",collector:true,exporter:"prom",strategy:DEFAULT_TRANSLATION,final:"scrape",final_honor:true},
  {id:"E05",source:"otlp",collector:true,exporter:"prom",strategy:DEFAULT_TRANSLATION,final:"scrape",final_honor:false},
  {id:"E06",source:"otlp",collector:true,exporter:"prom",strategy:"NoTranslation",final:"scrape",final_honor:false},
  {id:"E07",source:"otlp",collector:true,exporter:"rw2",strategy:DEFAULT_TRANSLATION,final:"rw2"},
  {id:"E08",source:"otlp",collector:true,exporter:"otlp",strategy:DEFAULT_TRANSLATION,final:"otlp",keep:false},
  {id:"E09",source:"otlp",collector:true,exporter:"otlp",strategy:DEFAULT_TRANSLATION,final:"otlp",keep:true},
  {id:"U01",source:"otlp",collector:false,final:"otlp",strategy:DEFAULT_TRANSLATION,keep:false},
  {id:"U02",source:"otlp",collector:false,final:"otlp",strategy:DEFAULT_TRANSLATION,keep:true},
  {id:"U03",source:"otlp",collector:false,final:"otlp",strategy:"NoTranslation",keep:false},
  {id:"U04",source:"otlp",collector:false,final:"otlp",strategy:"NoTranslation",keep:true},
  {id:"U05",source:"prom",collector:true,receiver_honor:false,exporter:"otlp",strategy:DEFAULT_TRANSLATION,final:"otlp",keep:false},
  {id:"U06",source:"prom",collector:true,receiver_honor:false,exporter:"otlp",strategy:DEFAULT_TRANSLATION,final:"otlp",keep:true},
  {id:"U07",source:"prom",collector:true,receiver_honor:false,exporter:"otlp",strategy:"NoTranslation",final:"otlp",keep:false},
  {id:"U08",source:"prom",collector:true,receiver_honor:false,exporter:"otlp",strategy:"NoTranslation",final:"otlp",keep:true},
  {id:"U09",source:"prom",collector:true,receiver_honor:true,exporter:"otlp",strategy:DEFAULT_TRANSLATION,final:"otlp",keep:false},
  {id:"U10",source:"prom",collector:true,receiver_honor:true,exporter:"otlp",strategy:DEFAULT_TRANSLATION,final:"otlp",keep:true},
  {id:"U11",source:"prom",collector:true,receiver_honor:true,exporter:"otlp",strategy:"NoTranslation",final:"otlp",keep:false},
  {id:"U12",source:"prom",collector:true,receiver_honor:true,exporter:"otlp",strategy:"NoTranslation",final:"otlp",keep:true},
  {id:"U13",source:"prom",collector:true,receiver_honor:false,exporter:"prom",strategy:DEFAULT_TRANSLATION,final:"scrape",final_honor:false},
  {id:"U14",source:"prom",collector:true,receiver_honor:false,exporter:"prom",strategy:"NoTranslation",final:"scrape",final_honor:false},
  {id:"U15",source:"prom",collector:true,receiver_honor:false,exporter:"prom",strategy:"NoTranslation",final:"scrape",final_honor:true},
  {id:"U16",source:"prom",collector:true,receiver_honor:true,exporter:"prom",strategy:DEFAULT_TRANSLATION,final:"scrape",final_honor:false},
  {id:"U17",source:"prom",collector:true,receiver_honor:true,exporter:"prom",strategy:DEFAULT_TRANSLATION,final:"scrape",final_honor:true},
  {id:"U18",source:"prom",collector:true,receiver_honor:true,exporter:"prom",strategy:"NoTranslation",final:"scrape",final_honor:false},
  {id:"U19",source:"prom",collector:true,receiver_honor:true,exporter:"prom",strategy:"NoTranslation",final:"scrape",final_honor:true},
  {id:"U20",source:"prom",collector:true,receiver_honor:false,exporter:"rw2",strategy:DEFAULT_TRANSLATION,final:"rw2"},
  {id:"U21",source:"prom",collector:true,receiver_honor:false,exporter:"rw2",strategy:"NoTranslation",final:"rw2"},
  {id:"U22",source:"prom",collector:true,receiver_honor:true,exporter:"rw2",strategy:DEFAULT_TRANSLATION,final:"rw2"},
  {id:"U23",source:"prom",collector:true,receiver_honor:true,exporter:"rw2",strategy:"NoTranslation",final:"rw2"},
  {id:"U24",source:"otlp",collector:true,exporter:"prom",strategy:"NoTranslation",final:"scrape",final_honor:true},
  {id:"U25",source:"otlp",collector:true,exporter:"rw2",strategy:"NoTranslation",final:"rw2"},
  {id:"U26",source:"otlp",collector:true,exporter:"otlp",strategy:"NoTranslation",final:"otlp",keep:false},
  {id:"U27",source:"otlp",collector:true,exporter:"otlp",strategy:"NoTranslation",final:"otlp",keep:true}
];
const DOTTED_SOURCE_PAIRS={E01:"D01",E02:"D02",E03:"D03",U05:"D04",U06:"D05",U07:"D06",U08:"D07",U09:"D08",U10:"D09",U11:"D10",U12:"D11",U13:"D12",U14:"D13",U15:"D14",U16:"D15",U17:"D16",U18:"D17",U19:"D18",U20:"D19",U21:"D20",U22:"D21",U23:"D22"};
const UNDERSCORE_CASES=BASE_COVERAGE_CASES.map(item=>item.source==="prom"?{...item,source_strategy:DEFAULT_TRANSLATION}:item);
const COVERAGE_CASES=[...UNDERSCORE_CASES,...Object.entries(DOTTED_SOURCE_PAIRS).map(([sourceCase,id])=>({...UNDERSCORE_CASES.find(item=>item.id===sourceCase),id,source_strategy:"NoTranslation",source_case:sourceCase}))];

let model={source:"otlp",sourceStrategy:DEFAULT_TRANSLATION,stages:[collector("prom")],final:destination({honorLabels:true})};
let comparisonMode=false;
let compareModel=null;
let selectedRange={start:0,end:0};
let compareSelections={a:0,b:0};
let activeConnections=[];
let connectionMode="trace";
let fieldFocus=null;
let alternatives=null;
let alternativesIndex=new Map();
let variantOptions={a:"current",b:"current"};
let variantDerivations={a:"default-derive",b:"default-derive"};
const clone=value=>JSON.parse(JSON.stringify(value));
function usingModel(target,callback){const previous=model;model=target;try{return callback()}finally{model=previous}}
function evidenceFor(target){return usingModel(target,()=>matchedCoverageCase())}
function computeFor(target,lane="a"){return usingModel(target,()=>computeVariant(lane))}
function outputOfStage(stage){return stage.exporter}
function inputProtocolAt(stageIndex){let p=model.source;for(let i=0;i<stageIndex;i++)p=outputOfStage(model.stages[i]);return p}
function finalInputProtocol(){return model.stages.length?outputOfStage(model.stages.at(-1)):model.source}
function strategyKey(v){return v.startsWith("Underscore")?"underscore":v.startsWith("NoUTF8")?"utf8-suffixes":"no-translation"}
function strategyPort(v){return v.startsWith("Underscore")?"9471":v.startsWith("NoUTF8")?"9472":"9473"}

function currentCoverageTuple(){
  if(model.stages.length>1||model.stages.some(stage=>stage.type!=="collector"))return null;
  const stage=model.stages[0],input=stage?.exporter||model.source,tuple={source:model.source,collector:Boolean(stage),final:input==="prom"?"scrape":input};
  if(stage){tuple.exporter=stage.exporter;if(model.source==="prom")tuple.receiver_honor=stage.honorLabels;if(["prom","rw2"].includes(stage.exporter))tuple.strategy=stage.translationStrategy}
  if(input==="prom")tuple.final_honor=model.final.honorLabels;
  if(input==="otlp"){tuple.strategy=model.final.translationStrategy;tuple.keep=model.final.keepIdentifying}
  if(model.source==="prom")tuple.source_strategy=model.sourceStrategy;
  return tuple;
}
function sameTuple(a,b){const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);keys.delete("id");keys.delete("source_case");return [...keys].every(key=>a?.[key]===b?.[key])}
function matchedCoverageCase(){const tuple=currentCoverageTuple();return tuple?COVERAGE_CASES.find(item=>sameTuple(item,tuple))||null:null}
function pairedCoverageCase(evidence=matchedCoverageCase()){if(!evidence||evidence.source!=="prom")return null;const pairedId=evidence.source_case||DOTTED_SOURCE_PAIRS[evidence.id];return pairedId?COVERAGE_CASES.find(item=>item.id===pairedId)||null:null}
function translatedKey(key,strategy){return strategy==="NoTranslation"?key:key.replaceAll(".","_")}
function putLabel(target,key,value,prepend=false){if(value==null)return;if(target[key]&&target[key]!==value)target[key]=prepend?`${value};${target[key]}`:`${target[key]};${value}`;else target[key]=value}

function initialState(){
  if(model.source==="otlp")return {protocol:"otlp",kind:"OTel resource",resource:{"service.namespace":"payments","service.name":"checkout","service.instance.id":"sdk-1","deployment.environment.name":"lab","resource.custom":"resource-value"},labels:null,targetInfo:null};
  const resource={"service.name":"checkout","service.namespace":"payments","service.instance.id":"sdk-1","deployment.environment.name":"lab","resource.custom":"resource-value"};
  return {protocol:"prom",kind:"Prometheus exposition",resource:null,labels:{job:null,instance:null},targetInfo:Object.fromEntries(Object.entries(resource).map(([key,value])=>[translatedKey(key,model.sourceStrategy),value]))};
}
function receiverIdentity(input,stage){
  if(stage.honorLabels&&input.labels?.job)return {job:input.labels.job,instance:input.labels.instance};
  if(matchedCoverageCase())return {job:"identity-lab-source",instance:"c36-sdk:9464"};
  return {job:"configured receiver job_name",instance:"configured scrape target"};
}
function receiveResource(input,stage){
  if(input.protocol==="otlp")return clone(input.resource||{});
  const identity=receiverIdentity(input,stage);const resource={"service.name":identity.job,"service.instance.id":identity.instance};
  resource["server.address"]="c36-sdk";resource["server.port"]="9464";resource["url.scheme"]="http";
  for(const [k,v] of Object.entries(input.targetInfo||{}))resource[k]=v;
  return resource;
}
function projectResource(resource,protocol,strategy=DEFAULT_TRANSLATION){
  const semanticName=resource["service.name"],namespace=resource["service.namespace"],job=namespace?`${namespace}/${semanticName}`:semanticName,instance=resource["service.instance.id"],targetInfo={};
  for(const [k,v] of Object.entries(resource)){if(["service.name","service.namespace","service.instance.id"].includes(k))continue;putLabel(targetInfo,translatedKey(k,strategy),v)}
  return {protocol,kind:protocol==="rw2"?"Remote Write series":"Prometheus exposition",resource:null,labels:{job,instance},targetInfo};
}
function applyCollector(input,stage){
  const resource=receiveResource(input,stage);
  if(stage.exporter==="otlp")return {protocol:"otlp",kind:"OTel resource",resource,labels:null,targetInfo:null};
  return projectResource(resource,stage.exporter,stage.translationStrategy);
}
function activeExporterTranslation(){for(let i=model.stages.length-1;i>=0;i--){const stage=model.stages[i];if(stage.type==="collector"&&["prom","rw2"].includes(stage.exporter))return stage.translationStrategy}return DEFAULT_TRANSLATION}
function scrapeTarget(context){
  if(matchedCoverageCase())return {job:"identity-lab-final",instance:model.stages.length?"c36-collector:9464":"c36-sdk:9464"};
  return {job:"configured job_name",instance:"configured scrape target"};
}
function scrapeLabels(labels,server,context){
  const incoming=clone(labels||{}),target=scrapeTarget(context);
  if(!incoming.job)return {...incoming,job:target.job,instance:target.instance};
  if(server.honorLabels)return incoming;
  const stored={...incoming,job:target.job,instance:target.instance};
  for(const key of ["job","instance"]){let exported=`exported_${key}`;while(Object.hasOwn(incoming,exported))exported=`exported_${exported}`;stored[exported]=incoming[key]}
  return stored;
}
function nativeProjection(resource,server){
  const stored=projectResource(resource,"prom",server.translationStrategy);
  if(server.keepIdentifying){for(const key of ["service.name","service.namespace","service.instance.id"])putLabel(stored.targetInfo,translatedKey(key,server.translationStrategy),resource?.[key],true)}
  return stored;
}
function ingestPrometheus(input,server,context,isFinal){
  let stored;
  if(input.protocol==="otlp")stored=nativeProjection(input.resource||{},server);
  else if(input.protocol==="rw2")stored=clone(input);
  else{
    stored=clone(input);stored.labels=scrapeLabels(stored.labels,server,context);
    if(stored.targetInfo)stored.targetInfoLabels=scrapeLabels(input.labels,server,context);
  }
  stored.protocol=isFinal?"storage":"rw2";stored.kind=isFinal?"Prometheus storage":"Prometheus storage → Remote Write 2.0";return stored;
}
function compute(){
  const logical=[{type:"source"},...model.stages,{type:"final",...model.final}],states=[initialState()];let state=states[0];
  model.stages.forEach(stage=>{state=applyCollector(state,stage);states.push(state)});
  state=ingestPrometheus(state,model.final,"final",true);states.push(state);return {logical,states};
}
function profileIdForLane(lane){
  const option=variantOptions[lane];
  if(option==="current")return null;
  if(option==="B")return "B";
  if(option==="E")return "E-symbolic";
  return `${option}-${variantDerivations[lane]}`;
}
function predictionForLane(lane){
  const evidence=matchedCoverageCase(),profileId=profileIdForLane(lane);
  return evidence&&profileId?alternativesIndex.get(`${evidence.id}|${profileId}`)||null:null;
}
function variantStatus(lane,prediction=predictionForLane(lane)){
  if(variantOptions[lane]==="current")return {label:"CURRENT · MEASURED",confidence:"measured"};
  if(!alternatives)return {label:"LOADING PREDICTIONS",confidence:"loading"};
  if(alternatives.error)return {label:"PREDICTIONS UNAVAILABLE",confidence:"missing"};
  if(!prediction)return {label:"NO PREDICTION",confidence:"missing"};
  if(prediction.confidence==="measured")return {label:`${variantOptions[lane]} · UNAFFECTED / MEASURED`,confidence:"measured"};
  if(prediction.confidence==="symbolic")return {label:`${variantOptions[lane]} · SYMBOLIC`,confidence:"symbolic"};
  return {label:`${variantOptions[lane].replace("C1","C.1")} · SPECIFICATION-PREDICTED`,confidence:"conditional"};
}
function variantEvidenceLabel(result,evidence){
  const variant=result.variant;
  if(variant.option==="current")return evidence?`LAB OBSERVATION · ${evidence.id}`:"COMPONENT RULE · OUTSIDE COMPLETE MATRIX";
  if(!variant.prediction)return `NO PREDICTION · ${evidence?.id||"NO EXACT CASE"}`;
  if(variant.prediction.confidence==="measured")return `UNAFFECTED / MEASURED · ${evidence.id} · OPTION ${variant.option}`;
  if(variant.prediction.confidence==="symbolic")return `SYMBOLIC DESIGN · ${evidence.id} · OPTION E`;
  return `SPECIFICATION-PREDICTED · ${evidence.id} · ${variant.profileId.replace("C1","C.1").replace("-default-derive"," · current derivation").replace("-never-derive"," · never derive")}`;
}
function variantNarrative(result){
  const prediction=result.variant.prediction;
  if(result.variant.option==="current")return "";
  if(!prediction)return " No counterfactual row is available for this pipeline tuple.";
  if(prediction.confidence==="measured")return " This path is outside the proposal's affected surface, so the measured result is unchanged.";
  if(prediction.confidence==="symbolic")return " Option E proposes a stable resource join key, but its synthesis and output-label policy are unresolved; exact job and instance values are intentionally not invented.";
  const receiver=prediction.collector_resources?.[0],authority=receiver?.identity_authority?` The proposal selects ${receiver.identity_authority} as identity authority.`:"";
  const masked=prediction.predicted_final?.upstream_preserved_as?" The final scrape target masks that upstream identity; the proposal result remains visible as exported_job and exported_instance.":"";
  return `${authority}${masked}`;
}
function identityKeys(){return ["service.name","service.namespace","service.instance.id","service_name","service_namespace","service_instance_id","prometheus.job","prometheus.instance","otel_resource_id"]}
function proposedResource(baseResource,receiver){
  const resource=clone(baseResource||{});
  identityKeys().forEach(key=>delete resource[key]);
  Object.assign(resource,clone(receiver?.resource_attributes||{}));
  if(receiver?.otel_resource_id)resource.otel_resource_id="unresolved Resource ID (canonical hash not standardized)";
  return resource;
}
function proposedTargetInfo(prediction,strategy){
  const targetInfo={};
  const projection=prediction?.target_info||{};
  for(const source of [projection.scrape_provenance_attributes,projection.semantic_service_attributes,projection.raw_underscore_service_metadata]){
    for(const [key,value] of Object.entries(source||{}))putLabel(targetInfo,translatedKey(key,strategy),value);
  }
  const receiver=prediction?.collector_resources?.[0];
  if(receiver?.otel_resource_id)targetInfo.otel_resource_id="unresolved Resource ID";
  return targetInfo;
}
function displayIdentity(pair,option){
  if(option!=="E")return clone(pair||{});
  return {job:"unresolved by Option E",instance:"unresolved by Option E"};
}
function computeVariant(lane="a"){
  const result=compute(),prediction=predictionForLane(lane),profileId=profileIdForLane(lane);
  result.variant={option:variantOptions[lane],profileId,prediction,status:variantStatus(lane,prediction)};
  if(!prediction||!prediction.applicable)return result;
  const receiver=prediction.collector_resources?.[0],stage=model.stages[0];
  if(!receiver||!stage)return result;
  const receiverIndex=1,resource=proposedResource(result.states[receiverIndex]?.resource,receiver),selected=displayIdentity(receiver.selected_prometheus_identity,variantOptions[lane]);
  if(stage.exporter==="otlp")result.states[receiverIndex]={protocol:"otlp",kind:"OTel resource",resource,labels:null,targetInfo:null};
  else{
    const projected=projectResource(resource,stage.exporter,stage.translationStrategy);
    projected.labels=selected;
    result.states[receiverIndex]=projected;
  }
  const finalIndex=result.states.length-1,finalState=clone(result.states[finalIndex]),finalIdentity=displayIdentity(prediction.predicted_final?.job_instance,variantOptions[lane]),upstream=displayIdentity(prediction.predicted_final?.upstream_job_instance,variantOptions[lane]);
  finalState.labels={...(finalState.labels||{}),...finalIdentity};
  delete finalState.labels.exported_job;delete finalState.labels.exported_instance;
  if(prediction.predicted_final?.upstream_preserved_as){finalState.labels.exported_job=upstream.job;finalState.labels.exported_instance=upstream.instance}
  const targetStrategy=finalInputProtocol()==="otlp"?model.final.translationStrategy:activeExporterTranslation(),predictedInfo=proposedTargetInfo(prediction,targetStrategy);
  if(Object.keys(predictedInfo).length){
    const preserved={};
    for(const [key,value] of Object.entries(finalState.targetInfo||{}))if(!identityKeys().includes(key))preserved[key]=value;
    finalState.targetInfo={...preserved,...predictedInfo};
    finalState.targetInfoLabels=clone(finalState.labels);
  }
  result.states[finalIndex]=finalState;
  return result;
}
function stateRows(state){
  const rows=[];
  if(state.resource)for(const [k,v]of Object.entries(state.resource))rows.push([k,v]);
  if(state.labels)for(const [k,v]of Object.entries(state.labels))if(v)rows.push([k,v]);
  if(state.targetInfo){const entries={...(state.targetInfoLabels||state.labels||{}),...state.targetInfo};rows.push(["target_info","present"]);for(const [k,v]of Object.entries(entries))if(v)rows.push([`target_info.${k}`,v])}
  return rows.sort(([left],[right])=>left<right?-1:left>right?1:0);
}
function comparable(value){return String(value??"").trim().toLowerCase()}
function valuesRelated(a,b){
  const left=comparable(a),right=comparable(b);
  if(!left||!right||left==="present"||right==="present")return false;
  if(left===right)return true;
  // Only recognize compositions that this experiment actually creates. A
  // slash joins namespace/name into `job`; a semicolon joins colliding values.
  // General substring matching is unsafe (`lab` is not the source of
  // `identity-lab-source`).
  const parts=value=>value.split(/[;/]/).map(part=>part.trim()).filter(Boolean);
  const leftParts=parts(left),rightParts=parts(right);
  if(leftParts.length===1&&rightParts.length===1)return false;
  return leftParts.some(part=>rightParts.includes(part));
}
function classifyRows(rows,otherRows,side){
  return rows.map(([key,value])=>{
    const exact=otherRows.some(([otherKey,otherValue])=>otherKey===key&&comparable(otherValue)===comparable(value));
    if(exact)return [key,value,"unchanged"];
    const sameKey=otherRows.some(([otherKey])=>otherKey===key);
    if(sameKey)return [key,value,"remapped","value changed"];
    const remapped=otherRows.some(([,otherValue])=>comparable(otherValue)===comparable(value))||otherRows.some(([,otherValue])=>valuesRelated(value,otherValue));
    if(remapped)return [key,value,"remapped"];
    return [key,value,side==="before"?"lost":"derived"];
  });
}
function classifyComparisonRows(rows,otherRows,side){
  return rows.map(([key,value])=>{
    const exact=otherRows.some(([otherKey,otherValue])=>otherKey===key&&comparable(otherValue)===comparable(value));
    if(exact)return [key,value,"unchanged"];
    return [key,value,side==="before"?"lost":"derived"];
  });
}
function connectionPairs(beforeRows,afterRows,mode="trace"){
  if(mode==="compare"){
    const used=new Set(),pairs=[];
    beforeRows.forEach(([beforeKey,beforeValue,beforeStatus],from)=>{
      if(beforeStatus==="lost")return;
      const candidates=afterRows.map(([key,value,status],to)=>({key,value,status,to})).filter(item=>!used.has(item.to)&&item.status!=="derived");
      const match=candidates.find(item=>item.key===beforeKey&&comparable(item.value)===comparable(beforeValue))||candidates.find(item=>item.key===beforeKey)||candidates.find(item=>comparable(item.value)===comparable(beforeValue))||candidates.find(item=>valuesRelated(beforeValue,item.value));
      if(match){used.add(match.to);pairs.push({from,to:match.to,status:beforeStatus==="unchanged"&&match.status==="unchanged"?"unchanged":"remapped"})}
    });
    return pairs;
  }
  const pairs=[];
  beforeRows.forEach(([beforeKey,beforeValue,beforeStatus],from)=>{
    if(beforeStatus==="lost")return;
    let matches=afterRows.map(([key,value],to)=>({key,value,to})).filter(item=>item.key===beforeKey&&comparable(item.value)===comparable(beforeValue));
    if(!matches.length)matches=afterRows.map(([key,value],to)=>({key,value,to})).filter(item=>item.key===beforeKey);
    if(!matches.length)matches=afterRows.map(([key,value],to)=>({key,value,to})).filter(item=>comparable(item.value)===comparable(beforeValue));
    if(!matches.length)matches=afterRows.map(([key,value],to)=>({key,value,to})).filter(item=>valuesRelated(beforeValue,item.value));
    matches.forEach(item=>{const afterStatus=afterRows[item.to][2];if(afterStatus!=="derived"&&afterStatus!=="lost")pairs.push({from,to:item.to,status:beforeStatus==="unchanged"&&afterStatus==="unchanged"?"unchanged":"remapped"})});
  });
  // Classification is symmetric, while the primary matching pass above starts
  // from the input side. A source field can therefore prefer its same-name
  // output and leave another valid remapped output (for example `job`) without
  // an incoming connector. Backfill any classified field that is still
  // uncovered, using the same match precedence as the primary pass.
  const addBestMatches=(row,rows,onMatch)=>{
    const [key,value]=row,eligible=rows.map(([otherKey,otherValue,status],index)=>({key:otherKey,value:otherValue,status,index})).filter(item=>item.status!=="derived"&&item.status!=="lost");
    let matches=eligible.filter(item=>item.key===key&&comparable(item.value)===comparable(value));
    if(!matches.length)matches=eligible.filter(item=>item.key===key);
    if(!matches.length)matches=eligible.filter(item=>comparable(item.value)===comparable(value));
    if(!matches.length)matches=eligible.filter(item=>valuesRelated(value,item.value));
    matches.forEach(onMatch);
  };
  const addPair=(from,to)=>{if(!pairs.some(pair=>pair.from===from&&pair.to===to)){const beforeStatus=beforeRows[from][2],afterStatus=afterRows[to][2];pairs.push({from,to,status:beforeStatus==="unchanged"&&afterStatus==="unchanged"?"unchanged":"remapped"})}};
  afterRows.forEach((row,to)=>{if(row[2]!=="derived"&&row[2]!=="lost"&&!pairs.some(pair=>pair.to===to))addBestMatches(row,beforeRows,item=>addPair(item.index,to))});
  beforeRows.forEach((row,from)=>{if(row[2]!=="derived"&&row[2]!=="lost"&&!pairs.some(pair=>pair.from===from))addBestMatches(row,afterRows,item=>addPair(from,item.index))});
  return pairs;
}
function drawFieldConnectors(){
  const grid=document.querySelector(".inspector-grid"),svg=document.querySelector("#field-connectors");
  if(!grid||!svg)return;
  const gridRect=grid.getBoundingClientRect(),beforePanel=document.querySelector("#before-state").closest(".state-panel").getBoundingClientRect(),afterPanel=document.querySelector("#after-state").closest(".state-panel").getBoundingClientRect(),vertical=afterPanel.top>=beforePanel.bottom-2;
  svg.setAttribute("viewBox",`0 0 ${gridRect.width} ${gridRect.height}`);
  svg.setAttribute("width",gridRect.width);svg.setAttribute("height",gridRect.height);
  const paths=activeConnections.map(({from,to,status})=>{
    const fromEl=document.querySelector(`#before-state [data-row-index="${from}"]`),toEl=document.querySelector(`#after-state [data-row-index="${to}"]`);
    if(!fromEl||!toEl)return "";
    const a=fromEl.getBoundingClientRect(),b=toEl.getBoundingClientRect();let d;
    if(vertical){const x1=a.left+a.width/2-gridRect.left,y1=a.bottom-gridRect.top,x2=b.left+b.width/2-gridRect.left,y2=b.top-gridRect.top,mid=(y1+y2)/2;d=connectionMode==="compare"?`M ${x1} ${y1} L ${x2} ${y2}`:`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
    else{const x1=a.right-gridRect.left,y1=a.top+a.height/2-gridRect.top,x2=b.left-gridRect.left,y2=b.top+b.height/2-gridRect.top,mid=(x1+x2)/2;d=connectionMode==="compare"?`M ${x1} ${y1} L ${x2} ${y2}`:`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
    return `<path class="field-link ${connectionMode==="compare"?"compare-field-link ":""}link-${status}" data-from-row="${from}" data-to-row="${to}" d="${d}" ${connectionMode==="trace"?`marker-end="url(#arrow-${status})"`:""}/>`;
  }).join("");
  svg.innerHTML=`<defs><marker id="arrow-unchanged" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#69737a"/></marker><marker id="arrow-remapped" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#9a7200"/></marker></defs>${paths}`;
  grid.classList.toggle("has-field-links",Boolean(paths));grid.classList.toggle("is-comparison",connectionMode==="compare");
  if(fieldFocus)applyFieldFocus(fieldFocus.side,fieldFocus.index);
}
function clearFieldFocus(){
  fieldFocus=null;
  const grid=document.querySelector(".inspector-grid");
  if(!grid)return;
  grid.classList.remove("has-field-focus");
  grid.querySelectorAll(".is-field-focus").forEach(element=>element.classList.remove("is-field-focus"));
}
function applyFieldFocus(side,index){
  fieldFocus={side,index};
  const grid=document.querySelector(".inspector-grid");
  if(!grid)return;
  grid.querySelectorAll(".is-field-focus").forEach(element=>element.classList.remove("is-field-focus"));
  grid.classList.add("has-field-focus");
  const before=new Set(side==="before"?[index]:[]),after=new Set(side==="after"?[index]:[]);
  activeConnections.forEach(({from,to})=>{
    if((side==="before"&&from===index)||(side==="after"&&to===index)){before.add(from);after.add(to)}
  });
  before.forEach(row=>document.querySelector(`#before-state [data-row-index="${row}"]`)?.classList.add("is-field-focus"));
  after.forEach(row=>document.querySelector(`#after-state [data-row-index="${row}"]`)?.classList.add("is-field-focus"));
  grid.querySelectorAll(".field-link").forEach(path=>{
    const related=side==="before"?+path.dataset.fromRow===index:+path.dataset.toRow===index;
    path.classList.toggle("is-field-focus",related);
  });
}
function bindFieldFocus(){
  [["before","#before-state"],["after","#after-state"]].forEach(([side,selector])=>{
    document.querySelectorAll(`${selector} .state-row`).forEach(row=>{
      const index=+row.dataset.rowIndex;
      row.onmouseenter=()=>applyFieldFocus(side,index);
      row.onmouseleave=()=>{if(document.activeElement!==row)clearFieldFocus()};
      row.onfocus=()=>applyFieldFocus(side,index);
      row.onblur=()=>{if(!row.matches(":hover"))clearFieldFocus()};
    });
  });
}
function renderLegend(mode){document.querySelector("#diff-legend").innerHTML=mode==="compare"?`<span><i class="diff-swatch diff-unchanged"></i>Unchanged</span><span><i class="diff-swatch diff-derived"></i>New</span><span><i class="diff-swatch diff-lost"></i>Lost</span>`:`<span><i class="diff-swatch diff-unchanged"></i>Same</span><span><i class="diff-swatch diff-remapped"></i>Remapped</span><span><i class="diff-swatch diff-derived"></i>New / derived</span><span><i class="diff-swatch diff-lost"></i>Lost</span>`}
function nodeAction(node,input){if(node.type==="collector")return `${RECEIVER[input.protocol]} → ${EXPORTER[node.exporter]}`;return `${INGEST[input.protocol]} → storage`}
function interpretation(node,input){
  if(node.type==="collector"){const receive=input.protocol==="otlp"?"The OTLP receiver preserves structured resource identity.":`The ${RECEIVER[input.protocol]} uses its scrape identity, then reconstructs primary resource identity from job and instance and consumes target_info into resource attributes.`;const send=node.exporter==="otlp"?"The OTLP exporter keeps the resulting resource structured.":`The ${EXPORTER[node.exporter]} projects the resulting resource into job, instance, and target_info using its translation strategy.`;return `${receive} ${send}`}
  if(input.protocol==="prom")return node.honorLabels?"This server's scrape honors incoming job and instance when they exist; otherwise it assigns configured target identity.":"This server's scrape target wins job and instance collisions; incoming values survive as exported_job and exported_instance.";
  if(input.protocol==="otlp"){const collision=node.keepIdentifying&&node.translationStrategy===DEFAULT_TRANSLATION&&Object.keys(input.resource||{}).some(key=>key==="service_name")?" Here underscore translation collapses dotted primary identity with recovered underscore identity, so Prometheus preserves both as semicolon-joined target_info values.":"";return `This Prometheus server's native OTLP receiver derives job and instance from service identity. keep_identifying_resource_attributes controls identifying labels on target_info.${collision}`}
  return "Remote Write 2.0 transports the existing Prometheus label set without reinterpreting job or instance.";
}

function renderControls(){
  const hasCollector=Boolean(model.stages.length);
  const compareHasCollector=Boolean(compareModel?.stages.length);
  document.querySelector("#component-list").innerHTML=comparisonMode?`<button class="component-button" data-add="collector" data-target-pipeline="a" ${hasCollector?"disabled":""}>${hasCollector?"Pipeline A · Collector added":"Add Collector to Pipeline A"}</button><button class="component-button" data-add="collector" data-target-pipeline="b" ${compareHasCollector?"disabled":""}>${compareHasCollector?"Pipeline B · Collector added":"Add Collector to Pipeline B"}</button><p class="control-help">Each pipeline independently supports a direct SDK route or one Collector before Prometheus.</p>`:`<button class="component-button" data-add="collector" data-target-pipeline="a" ${hasCollector?"disabled":""}>${hasCollector?"Collector already added":"Add Collector"}</button><p class="control-help">The experiment covers a direct SDK route or one Collector before the fixed final Prometheus server.</p>`;
  document.querySelectorAll('[data-add="collector"]:not(:disabled)').forEach(add=>add.onclick=()=>{const lane=add.dataset.targetPipeline,target=lane==="b"?compareModel:model;target.stages.push(collector("otlp"));if(comparisonMode)compareSelections[lane]=target.stages.length;else selectedRange={start:0,end:0};render()});
}
function settingToggle(owner,index,key,label,value,scope){return `<div class="node-setting"><span><b>${label}</b><small>${scope}</small></span><label class="switch" aria-label="Toggle ${label}"><input type="checkbox" data-setting-owner="${owner}" data-setting-index="${index}" data-setting-key="${key}" ${value?"checked":""}><i></i></label></div>`}
function translationControl(owner,index,value,scope){return `<label class="translation-setting"><span><b>translation_strategy</b><small>${scope}</small></span><select data-setting-owner="${owner}" data-setting-index="${index}" data-setting-key="translationStrategy">${TRANSLATION_OPTIONS.map(([v,label])=>`<option value="${v}" ${value===v?"selected":""}>${label}</option>`).join("")}</select></label>`}
function componentSettings(component,input,owner,index){
  const controls=[];
  if(input==="prom")controls.push(settingToggle(owner,index,"honorLabels","honor_labels",component.honorLabels,"receiver scrape"));
  if(owner==="stage"&&component.type==="collector"&&["prom","rw2"].includes(component.exporter))controls.push(translationControl(owner,index,component.translationStrategy,`${EXPORTER[component.exporter]} translation`));
  if(owner==="final"&&input==="otlp"){controls.push(settingToggle(owner,index,"keepIdentifying","keep identifying attrs",component.keepIdentifying,"native OTLP receiver"));controls.push(translationControl(owner,index,component.translationStrategy,"native OTLP receiver"))}
  return controls.length?`<div class="node-settings"><span class="settings-title">Component configuration</span>${controls.join("")}</div>`:"";
}
function sourceNode(){const strategy=model.source==="prom"?`<div class="node-settings"><span class="settings-title">Component configuration</span>${translationControl("source",0,model.sourceStrategy,"Prometheus exporter source labels")}</div>`:"";return `<div class="pipe-node composite fixed-node" data-family="otel"><span class="node-kind">Fixed source</span><b>OpenTelemetry SDK</b><label>output<select data-source-output><option value="otlp" ${model.source==="otlp"?"selected":""}>OTLP exporter</option><option value="prom" ${model.source==="prom"?"selected":""}>Prometheus exporter</option></select></label>${strategy}<small>Semantic resource: payments / checkout / sdk-1</small></div>`}
function stageNode(stage,i){const input=inputProtocolAt(i);return `<div class="pipe-node composite" data-family="otel"><span class="node-kind">Collector ${i+1}</span><b>OpenTelemetry Collector</b><label>receiver<input value="${RECEIVER[input]}" disabled></label><label>exporter<select data-exporter="${i}"><option value="otlp" ${stage.exporter==="otlp"?"selected":""}>OTLP exporter</option><option value="prom" ${stage.exporter==="prom"?"selected":""}>Prometheus exporter</option><option value="rw2" ${stage.exporter==="rw2"?"selected":""}>RW 2.0 exporter</option></select></label>${componentSettings(stage,input,"stage",i)}${stageButtons(i)}</div>`}
function stageButtons(i){return `<div class="stage-actions"><button data-move-left="${i}" ${i===0?"disabled":""} aria-label="Move stage left">←</button><button data-move-right="${i}" ${i===model.stages.length-1?"disabled":""} aria-label="Move stage right">→</button><button data-remove-stage="${i}" aria-label="Remove stage">Remove</button></div>`}
function finalNode(){const input=finalInputProtocol();return `<div class="pipe-node composite fixed-node" data-family="prom"><span class="node-kind">Fixed destination</span><b>Prometheus server</b><label>ingestion<input value="${INGEST[input]}" disabled></label>${componentSettings(model.final,input,"final",0)}<small>Final queryable storage · cannot be removed</small></div>`}
function componentFamily(node){return node?.type==="final"?"prom":"otel"}
function protocolFamily(protocol){return protocol==="otlp"?"otel":"prom"}
function variantControls(lane){
  const option=variantOptions[lane],deriveVisible=["C","C1"].includes(option),status=variantStatus(lane);
  return `<div class="variant-controls" data-variant-controls="${lane}"><label><span>Behavior</span><select data-variant-option="${lane}">${VARIANT_OPTIONS.map(([value,label])=>`<option value="${value}" ${option===value?"selected":""}>${label}</option>`).join("")}</select></label>${deriveVisible?`<label><span>service.* defaulting</span><select data-variant-derive="${lane}"><option value="default-derive" ${variantDerivations[lane]==="default-derive"?"selected":""}>Current derivation</option><option value="never-derive" ${variantDerivations[lane]==="never-derive"?"selected":""}>Never derive</option></select></label>`:""}<strong data-confidence="${status.confidence}">${status.label}</strong></div>`;
}
function pipelineMarkup(target,lane){return usingModel(target,()=>{const isActive=index=>comparisonMode?compareSelections[lane]===index:index>=selectedRange.start&&index<=selectedRange.end,parts=[sourceNode()];model.stages.forEach((s,i)=>{const active=isActive(i),fromFamily=i===0?"otel":componentFamily(model.stages[i-1]),toFamily=componentFamily(s);parts.push(`<button class="pipe-arrow ${active?"active":""}" data-boundary="${i}" data-from-family="${fromFamily}" data-to-family="${toFamily}" aria-pressed="${active}" aria-label="Select boundary ${i+1} in Pipeline ${lane.toUpperCase()}"><span></span></button>`);parts.push(stageNode(s,i))});const finalBoundary=model.stages.length,finalActive=isActive(finalBoundary),finalFrom=model.stages.length?componentFamily(model.stages.at(-1)):"otel";parts.push(`<button class="pipe-arrow ${finalActive?"active":""}" data-boundary="${finalBoundary}" data-from-family="${finalFrom}" data-to-family="prom" aria-pressed="${finalActive}" aria-label="Select final boundary in Pipeline ${lane.toUpperCase()}"><span></span></button>`);parts.push(finalNode());return `<div class="pipeline" data-pipeline-lane="${lane}" aria-label="Pipeline ${lane.toUpperCase()}">${parts.join("")}</div>`})}
function laneMarkup(target,lane){const evidence=evidenceFor(target);return `<section class="pipeline-lane pipeline-lane-${lane}"><header><div class="lane-title"><b>Pipeline ${lane.toUpperCase()}</b><span>${evidence?`LAB CASE · ${evidence.id}`:"NO EXACT MATRIX MATCH"}</span></div>${variantControls(lane)}</header>${pipelineMarkup(target,lane)}</section>`}
function bindPipelineInteractions(lane,target){
  const laneName=lane.dataset.pipelineLane;
  lane.querySelector("[data-source-output]").onchange=e=>{target.source=e.target.value;render()};
  lane.querySelectorAll("[data-exporter]").forEach(el=>el.onchange=e=>{target.stages[+e.target.dataset.exporter].exporter=e.target.value;render()});
  lane.querySelectorAll("[data-setting-key]").forEach(el=>el.onchange=e=>updateSetting(e.target,target));
  lane.querySelectorAll("[data-boundary]").forEach(b=>b.onclick=()=>comparisonMode?selectCompareBoundary(laneName,+b.dataset.boundary):selectBoundary(+b.dataset.boundary));
  lane.querySelectorAll("[data-remove-stage]").forEach(b=>b.onclick=()=>{target.stages.splice(+b.dataset.removeStage,1);if(comparisonMode)compareSelections[laneName]=target.stages.length;clampSelections();render()});
}
function renderWorkbench(){
  const host=document.querySelector("#pipeline-host");host.classList.toggle("compare-lanes",comparisonMode);host.innerHTML=comparisonMode?laneMarkup(model,"a")+laneMarkup(compareModel,"b"):`<div class="trace-variant-bar">${variantControls("a")}</div>${pipelineMarkup(model,"a")}`;
  host.querySelectorAll("[data-pipeline-lane]").forEach((lane,index)=>bindPipelineInteractions(lane,index===0?model:compareModel));
  host.querySelectorAll("[data-variant-option]").forEach(select=>select.onchange=e=>{variantOptions[e.target.dataset.variantOption]=e.target.value;render()});
  host.querySelectorAll("[data-variant-derive]").forEach(select=>select.onchange=e=>{variantDerivations[e.target.dataset.variantDerive]=e.target.value;render()});
  document.querySelectorAll("[data-workbench-mode]").forEach(button=>{const active=button.dataset.workbenchMode===(comparisonMode?"compare":"trace");button.setAttribute("aria-pressed",String(active));button.onclick=()=>setWorkbenchMode(button.dataset.workbenchMode)});
  document.querySelector("#workbench-title").textContent=comparisonMode?"PIPELINE COMPARISON":"BOUNDARY TRACE";
  const selectedCount=selectedRange.end-selectedRange.start+1;document.querySelector("#boundary-selection-help").textContent=comparisonMode?"Each pipeline has its own selected output. Click a connector in either lane to compare those two boundary states.":selectedCount===1?"One boundary selected. Click another arrow to extend the comparison across every component between them.":`${selectedCount} consecutive boundaries selected. Click a selected arrow to start a new range.`;
  const evidence=evidenceFor(model),comparisonEvidence=comparisonMode?evidenceFor(compareModel):null,paired=pairedCoverageCase(evidence),status=document.querySelector("#coverage-status"),matrixCase=document.querySelector("#matrix-current-case"),allTested=Boolean(evidence)&&(!comparisonMode||Boolean(comparisonEvidence));status.textContent=comparisonMode?`A · ${evidence?.id||"—"}  ↔  B · ${comparisonEvidence?.id||"—"}`:evidence?`LAB TESTED · ${evidence.id}${paired?` · PAIRED WITH ${paired.id}`:""}`:"NO EXACT MATRIX MATCH";status.style.background=allTested?"#e7f5f2":"#fff6dc";status.style.color=allTested?"#087368":"#775d00";if(matrixCase)matrixCase.textContent=comparisonMode?`A ${evidence?.id||"—"} · B ${comparisonEvidence?.id||"—"}`:evidence?`${evidence.id}${paired?` ↔ ${paired.id}`:""}`:"—";const banner=document.querySelector("#unsupported-banner");banner.hidden=allTested;banner.textContent=comparisonMode?"At least one pipeline does not match an exact Lab tuple.":"This combination does not match an exact Lab tuple.";renderInspector();
}
function setWorkbenchMode(mode){const next=mode==="compare";if(next&&!comparisonMode){compareModel=clone(model);variantOptions.b=variantOptions.a;variantDerivations.b=variantDerivations.a;const selected=Math.min(selectedRange.end,model.stages.length);compareSelections={a:selected,b:selected}}comparisonMode=next;render()}
function selectBoundary(index){
  const {start,end}=selectedRange;
  if(start===end&&index!==start)selectedRange={start:Math.min(start,index),end:Math.max(start,index)};
  else if(index<start||index>end)selectedRange={start:Math.min(start,index),end:Math.max(end,index)};
  else selectedRange={start:index,end:index};
  renderWorkbench();
}
function selectCompareBoundary(lane,index){compareSelections[lane]=index;renderWorkbench()}
function clampSelection(){const max=model.stages.length;selectedRange.start=Math.min(selectedRange.start,max);selectedRange.end=Math.min(selectedRange.end,max);if(selectedRange.start>selectedRange.end)selectedRange.start=selectedRange.end}
function clampSelections(){clampSelection();if(compareModel){compareSelections.a=Math.min(compareSelections.a,model.stages.length);compareSelections.b=Math.min(compareSelections.b,compareModel.stages.length)}}
function updateSetting(el,targetModel=model){
  if(el.dataset.settingOwner==="source")targetModel.sourceStrategy=el.value;
  else{const target=el.dataset.settingOwner==="final"?targetModel.final:targetModel.stages[+el.dataset.settingIndex];target[el.dataset.settingKey]=el.type==="checkbox"?el.checked:el.value}
  render();
}
function moveStage(i,delta){const j=i+delta;if(j<0||j>=model.stages.length)return;[model.stages[i],model.stages[j]]=[model.stages[j],model.stages[i]];render()}
function componentName(node){return node.type==="source"?"OTel SDK":node.type==="collector"?"Collector":"Prometheus server"}
function componentPathName(node,index,logical){if(node.type==="collector"){const total=logical.filter(item=>item.type==="collector").length,ordinal=logical.slice(0,index+1).filter(item=>item.type==="collector").length;return total>1?`Collector ${ordinal}`:"Collector"}return componentName(node)}
function renderInspector(){
  if(comparisonMode){renderComparisonInspector();return}
  clearFieldFocus();
  connectionMode="trace";renderLegend("trace");
  const result=computeVariant("a"),{logical,states}=result,start=selectedRange.start,end=selectedRange.end,before=states[start],after=states[end+1],nodes=logical.slice(start+1,end+2),path=logical.slice(start,end+2),beforeRows=stateRows(before),afterRows=stateRows(after),classifiedBefore=classifyRows(beforeRows,afterRows,"before"),classifiedAfter=classifyRows(afterRows,beforeRows,"after"),total=logical.length-1,count=end-start+1,beforePanel=document.querySelector("#before-state").closest(".state-panel"),afterPanel=document.querySelector("#after-state").closest(".state-panel");
  beforePanel.dataset.family=protocolFamily(before.protocol);afterPanel.dataset.family=protocolFamily(after.protocol);
  document.querySelector("#inspector-range-label").textContent=count===1?"SELECTED BOUNDARY":"SELECTED BOUNDARY RANGE";
  document.querySelector("#inspector-title").textContent=path.map((node,i)=>componentPathName(node,start+i,logical)).join(" → ");
  document.querySelector("#boundary-stepper").textContent=count===1?`${String(start+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`:`${String(start+1).padStart(2,"0")}–${String(end+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`;
  document.querySelector("#before-panel-label").textContent="BEFORE";document.querySelector("#after-panel-label").textContent="AFTER";document.querySelector("#before-kind").textContent=`${before.kind} · ${PROTOCOL[before.protocol]}`;document.querySelector("#after-kind").textContent=`${after.kind} · ${PROTOCOL[after.protocol]}`;
  document.querySelector("#before-state").innerHTML=renderRows(classifiedBefore);document.querySelector("#after-state").innerHTML=renderRows(classifiedAfter);
  activeConnections=connectionPairs(classifiedBefore,classifiedAfter);bindFieldFocus();requestAnimationFrame(()=>requestAnimationFrame(drawFieldConnectors));
  document.querySelector("#transform-verb").textContent=count===1?nodeAction(nodes[0],before):`${count} components in sequence`;
  const explanation=nodes.map((node,i)=>count===1?interpretation(node,states[start+i]):`<strong>${i+1}. ${componentPathName(node,start+i+1,logical)}:</strong> ${interpretation(node,states[start+i])}`).join(" "),evidence=matchedCoverageCase();document.querySelector("#interpretation").innerHTML=`<span>${variantEvidenceLabel(result,evidence)}</span><p>${explanation}${variantNarrative(result)}</p>`;
}
function renderComparisonInspector(){
  clearFieldFocus();
  connectionMode="compare";renderLegend("compare");
  // Keep the data model lane aligned with the controls shown above it. Without
  // the explicit lane, both computations silently default to Pipeline A's
  // behavior selection even though Pipeline B displays its own selection.
  const a=computeFor(model,"a"),b=computeFor(compareModel,"b"),aIndex=compareSelections.a,bIndex=compareSelections.b,aState=a.states[aIndex+1],bState=b.states[bIndex+1],aRows=stateRows(aState),bRows=stateRows(bState),classifiedA=classifyComparisonRows(aRows,bRows,"before"),classifiedB=classifyComparisonRows(bRows,aRows,"after"),aEvidence=evidenceFor(model),bEvidence=evidenceFor(compareModel),beforePanel=document.querySelector("#before-state").closest(".state-panel"),afterPanel=document.querySelector("#after-state").closest(".state-panel"),aPath=a.logical.slice(0,aIndex+2).map((node,i)=>componentPathName(node,i,a.logical)).join(" → "),bPath=b.logical.slice(0,bIndex+2).map((node,i)=>componentPathName(node,i,b.logical)).join(" → ");
  beforePanel.dataset.family=protocolFamily(aState.protocol);afterPanel.dataset.family=protocolFamily(bState.protocol);
  document.querySelector("#inspector-range-label").textContent="PIPELINE OUTPUT COMPARISON";
  document.querySelector("#inspector-title").textContent=`A · ${aPath}  ↔  B · ${bPath}`;
  document.querySelector("#boundary-stepper").textContent=`A ${String(aIndex+1).padStart(2,"0")}/${String(a.logical.length-1).padStart(2,"0")} · B ${String(bIndex+1).padStart(2,"0")}/${String(b.logical.length-1).padStart(2,"0")}`;
  document.querySelector("#before-panel-label").textContent="PIPELINE A";document.querySelector("#after-panel-label").textContent="PIPELINE B";document.querySelector("#before-kind").textContent=`${aState.kind} · ${PROTOCOL[aState.protocol]}`;document.querySelector("#after-kind").textContent=`${bState.kind} · ${PROTOCOL[bState.protocol]}`;
  document.querySelector("#before-state").innerHTML=renderRows(classifiedA);document.querySelector("#after-state").innerHTML=renderRows(classifiedB);
  activeConnections=connectionPairs(classifiedA,classifiedB,"compare");bindFieldFocus();requestAnimationFrame(()=>requestAnimationFrame(drawFieldConnectors));
  document.querySelector("#transform-verb").textContent="label correlation · not data flow";
  const changed=new Set([...classifiedA.filter(row=>row[2]!=="unchanged").map(row=>row[0]),...classifiedB.filter(row=>row[2]!=="unchanged").map(row=>row[0])]).size,symbolic=[a,b].some(result=>result.variant.prediction?.confidence==="symbolic"),summary=symbolic?"Exact output comparison is unavailable because at least one selected design is symbolic.":changed?`${changed} identity field${changed===1?"":"s"} differ at this output.`:"The identity fields are identical at this output.",narratives=[variantNarrative(a),variantNarrative(b)].filter(Boolean).filter((value,index,items)=>items.indexOf(value)===index).join("");
  document.querySelector("#interpretation").innerHTML=`<span>A: ${variantEvidenceLabel(a,aEvidence)} · B: ${variantEvidenceLabel(b,bEvidence)}</span><p>${summary} Change protocols, component configuration, or the behavior alternative independently in either pipeline.${narratives}</p>`;
}
function renderRows(rows,empty="No identity fields recorded here."){const labels={unchanged:connectionMode==="compare"?"unchanged":"same",remapped:"remapped",derived:"new",lost:"lost"};return rows.length?rows.map(([k,v,status,detail],index)=>`<div class="state-row diff-${status}" data-row-index="${index}" tabindex="0"><span>${k}<em class="change-tag">${detail||labels[status]}</em></span><b>${v??"—"}</b></div>`).join(""):`<div class="empty-state">${empty}</div>`}
function render(){clampSelections();renderControls();renderWorkbench()}
render();
fetch(ALTERNATIVES_URL).then(response=>{if(!response.ok)throw new Error(`Alternative data: ${response.status}`);return response.json()}).then(data=>{alternatives=data;alternativesIndex=new Map(data.predictions.map(prediction=>[`${prediction.case_id}|${prediction.profile_id}`,prediction]));render()}).catch(error=>{console.error(error);alternatives={error:true};render()});
window.addEventListener("resize",()=>requestAnimationFrame(drawFieldConnectors));
