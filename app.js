const DEFAULT_TRANSLATION="UnderscoreEscapingWithSuffixes";
const TRANSLATION_OPTIONS=[
  ["UnderscoreEscapingWithSuffixes","UnderscoreEscapingWithSuffixes"],
  ["NoTranslation","NoTranslation"]
];
const collector=(exporter,settings={})=>({type:"collector",exporter,honorLabels:false,translationStrategy:DEFAULT_TRANSLATION,...settings});
const relay=(settings={})=>({type:"promRelay",honorLabels:true,keepIdentifying:false,translationStrategy:DEFAULT_TRANSLATION,...settings});
const destination=settings=>({honorLabels:true,keepIdentifying:false,translationStrategy:DEFAULT_TRANSLATION,...settings});

const PRESETS=[
  {id:"p1",label:"01 · direct SDK scrape",source:"prom",stages:[],final:destination({honorLabels:false})},
  {id:"p3",label:"03 · Prom receiver round trip",source:"prom",stages:[collector("prom")],final:destination({honorLabels:true})},
  {id:"p4",label:"04 · OTLP → Prom exporter",source:"otlp",stages:[collector("prom")],final:destination({honorLabels:true})},
  {id:"p5",label:"05 · pull → RW2",source:"otlp",stages:[collector("prom"),relay({honorLabels:true})],final:destination()},
  {id:"p6",label:"06 · direct Collector RW2",source:"otlp",stages:[collector("rw2")],final:destination()},
  {id:"p8",label:"08 · honor_labels control",source:"prom",stages:[],final:destination({honorLabels:false})},
  {id:"p9",label:"09 · translation strategies",source:"otlp",stages:[collector("prom")],final:destination({honorLabels:false})},
  {id:"p10",label:"10 · native OTLP",source:"otlp",stages:[collector("otlp")],final:destination({keepIdentifying:false})}
];
const PROTOCOL={otlp:"OTLP",prom:"Prometheus exposition",rw2:"Remote Write 2.0",storage:"stored series"};
const EXPORTER={otlp:"OTLP exporter",prom:"Prometheus exporter",rw2:"Remote Write 2.0 exporter"};
const INGEST={otlp:"native OTLP receiver",prom:"scrape",rw2:"Remote Write 2.0 receiver"};
const RECEIVER={otlp:"OTLP receiver",prom:"Prometheus receiver",rw2:"Remote Write 2.0 receiver"};

// Exact route tuples from the Lab's 36/36 coverage manifest. Intermediate
// Prometheus relays and routes with more than one Collector remain out of scope.
const COVERAGE_CASES=[
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

let model={source:"otlp",stages:[collector("prom")],final:destination({honorLabels:true})};
let activePreset="p4",selectedRange={start:0,end:0};
let activeConnections=[];
const clone=value=>JSON.parse(JSON.stringify(value));
function selectPreset(id){const p=PRESETS.find(x=>x.id===id);model={source:p.source,stages:clone(p.stages),final:clone(p.final)};activePreset=id;selectedRange={start:0,end:0};render()}
function markCustom(){activePreset="custom"}
function outputOfStage(stage){return stage.type==="collector"?stage.exporter:"rw2"}
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
  return tuple;
}
function sameTuple(a,b){const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);keys.delete("id");return [...keys].every(key=>a?.[key]===b?.[key])}
function matchedCoverageCase(){const tuple=currentCoverageTuple();return tuple?COVERAGE_CASES.find(item=>sameTuple(item,tuple))||null:null}
function caseSlug(){return matchedCoverageCase()?.id.toLowerCase()||"configured"}
function translatedKey(key,strategy){return strategy==="NoTranslation"?key:key.replaceAll(".","_")}
function putLabel(target,key,value,prepend=false){if(value==null)return;if(target[key]&&target[key]!==value)target[key]=prepend?`${value};${target[key]}`:`${target[key]};${value}`;else target[key]=value}

function initialState(){
  if(model.source==="otlp")return {protocol:"otlp",kind:"OTel resource",resource:{"service.namespace":"payments","service.name":"checkout","service.instance.id":"sdk-1","deployment.environment.name":"lab","resource.custom":"resource-value"},labels:null,targetInfo:null};
  return {protocol:"prom",kind:"Prometheus exposition",resource:null,labels:{job:null,instance:null},targetInfo:{service_name:"checkout",service_namespace:"payments",service_instance_id:"sdk-1",deployment_environment_name:"lab",resource_custom:"resource-value"}};
}
function receiverIdentity(input,stage){
  if(stage.honorLabels&&input.labels?.job)return {job:input.labels.job,instance:input.labels.instance};
  if(matchedCoverageCase())return {job:`case-${caseSlug()}-receiver`,instance:"c36-sdk:9464"};
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
  if(matchedCoverageCase())return {job:`case-${caseSlug()}-final`,instance:model.stages.length?"c36-collector:9464":"c36-sdk:9464"};
  if(context==="relay"&&activePreset==="p5")return {job:"path5-origin",instance:"collector:port"};
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
  model.stages.forEach(stage=>{state=stage.type==="collector"?applyCollector(state,stage):ingestPrometheus(state,stage,"relay",false);states.push(state)});
  state=ingestPrometheus(state,model.final,"final",true);states.push(state);return {logical,states};
}
function stateRows(state){
  const rows=[];
  if(state.resource)for(const [k,v]of Object.entries(state.resource))rows.push([k,v]);
  if(state.labels)for(const [k,v]of Object.entries(state.labels))if(v)rows.push([k,v]);
  if(state.targetInfo){const entries={...(state.targetInfoLabels||state.labels||{}),...state.targetInfo};rows.push(["target_info","present"]);for(const [k,v]of Object.entries(entries))if(v)rows.push([`target_info.${k}`,v])}
  return rows;
}
function comparable(value){return String(value??"").trim().toLowerCase()}
function valuesRelated(a,b){
  const left=comparable(a),right=comparable(b);
  if(!left||!right||left==="present"||right==="present")return false;
  if(left===right)return true;
  if(left.length<3||right.length<3)return false;
  return left.includes(right)||right.includes(left);
}
function classifyRows(rows,otherRows,side){
  return rows.map(([key,value])=>{
    const exact=otherRows.some(([otherKey,otherValue])=>otherKey===key&&comparable(otherValue)===comparable(value));
    if(exact)return [key,value,"unchanged"];
    const remapped=otherRows.some(([,otherValue])=>comparable(otherValue)===comparable(value))||otherRows.some(([,otherValue])=>valuesRelated(value,otherValue));
    if(remapped)return [key,value,"remapped"];
    return [key,value,side==="before"?"lost":"derived"];
  });
}
function connectionPairs(beforeRows,afterRows){
  const pairs=[];
  beforeRows.forEach(([beforeKey,beforeValue,beforeStatus],from)=>{
    if(beforeStatus==="lost")return;
    let matches=afterRows.map(([key,value],to)=>({key,value,to})).filter(item=>item.key===beforeKey&&comparable(item.value)===comparable(beforeValue));
    if(!matches.length)matches=afterRows.map(([key,value],to)=>({key,value,to})).filter(item=>comparable(item.value)===comparable(beforeValue));
    if(!matches.length)matches=afterRows.map(([key,value],to)=>({key,value,to})).filter(item=>valuesRelated(beforeValue,item.value));
    matches.forEach(item=>{const afterStatus=afterRows[item.to][2];if(afterStatus!=="derived"&&afterStatus!=="lost")pairs.push({from,to:item.to,status:beforeStatus==="unchanged"&&afterStatus==="unchanged"?"unchanged":"remapped"})});
  });
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
    if(vertical){const x1=a.left+a.width/2-gridRect.left,y1=a.bottom-gridRect.top,x2=b.left+b.width/2-gridRect.left,y2=b.top-gridRect.top,mid=(y1+y2)/2;d=`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
    else{const x1=a.right-gridRect.left,y1=a.top+a.height/2-gridRect.top,x2=b.left-gridRect.left,y2=b.top+b.height/2-gridRect.top,mid=(x1+x2)/2;d=`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
    return `<path class="field-link link-${status}" d="${d}" marker-end="url(#arrow-${status})"/>`;
  }).join("");
  svg.innerHTML=`<defs><marker id="arrow-unchanged" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#69737a"/></marker><marker id="arrow-remapped" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#9a7200"/></marker></defs>${paths}`;
  grid.classList.toggle("has-field-links",Boolean(paths));
}
function nodeAction(node,input){if(node.type==="collector")return `${RECEIVER[input.protocol]} → ${EXPORTER[node.exporter]}`;if(node.type==="promRelay")return `${INGEST[input.protocol]} → Remote Write 2.0`;return `${INGEST[input.protocol]} → storage`}
function interpretation(node,input){
  if(node.type==="collector"){const receive=input.protocol==="otlp"?"The OTLP receiver preserves structured resource identity.":`The ${RECEIVER[input.protocol]} uses its scrape identity, then reconstructs primary resource identity from job and instance and consumes target_info into resource attributes.`;const send=node.exporter==="otlp"?"The OTLP exporter keeps the resulting resource structured.":`The ${EXPORTER[node.exporter]} projects the resulting resource into job, instance, and target_info using its translation strategy.`;return `${receive} ${send}`}
  if(input.protocol==="prom")return node.honorLabels?"This server's scrape honors incoming job and instance when they exist; otherwise it assigns configured target identity.":"This server's scrape target wins job and instance collisions; incoming values survive as exported_job and exported_instance.";
  if(input.protocol==="otlp"){const collision=node.keepIdentifying&&node.translationStrategy===DEFAULT_TRANSLATION&&Object.keys(input.resource||{}).some(key=>key==="service_name")?" Here underscore translation collapses dotted primary identity with recovered underscore identity, so Prometheus preserves both as semicolon-joined target_info values.":"";return `This Prometheus server's native OTLP receiver derives job and instance from service identity. keep_identifying_resource_attributes controls identifying labels on target_info.${collision}`}
  return "Remote Write 2.0 transports the existing Prometheus label set without reinterpreting job or instance.";
}

function renderControls(){
  document.querySelector("#preset-list").innerHTML=PRESETS.map(p=>`<button class="preset-button ${activePreset===p.id?"active":""}" data-preset="${p.id}">${p.label}<small>${p.stages.length+2} roles</small></button>`).join("");
  document.querySelector("#component-list").innerHTML=`<button class="component-button" data-add="collector">Add Collector</button><button class="component-button" data-add="promRelay">Add Prometheus relay</button><p class="control-help">Stages are inserted before the fixed final Prometheus server. Each component exposes only the configuration it actually owns.</p>`;
  document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>selectPreset(b.dataset.preset));
  document.querySelector('[data-add="collector"]').onclick=()=>{model.stages.push(collector("otlp"));markCustom();selectedRange={start:model.stages.length-1,end:model.stages.length-1};render()};
  document.querySelector('[data-add="promRelay"]').onclick=()=>{model.stages.push(relay());markCustom();selectedRange={start:model.stages.length-1,end:model.stages.length-1};render()};
}
function settingToggle(owner,index,key,label,value,scope){return `<div class="node-setting"><span><b>${label}</b><small>${scope}</small></span><label class="switch" aria-label="Toggle ${label}"><input type="checkbox" data-setting-owner="${owner}" data-setting-index="${index}" data-setting-key="${key}" ${value?"checked":""}><i></i></label></div>`}
function translationControl(owner,index,value,scope){return `<label class="translation-setting"><span><b>translation_strategy</b><small>${scope}</small></span><select data-setting-owner="${owner}" data-setting-index="${index}" data-setting-key="translationStrategy">${TRANSLATION_OPTIONS.map(([v,label])=>`<option value="${v}" ${value===v?"selected":""}>${label}</option>`).join("")}</select></label>`}
function componentSettings(component,input,owner,index){
  const controls=[];
  if(input==="prom")controls.push(settingToggle(owner,index,"honorLabels","honor_labels",component.honorLabels,"receiver scrape"));
  if(owner==="stage"&&component.type==="collector"&&["prom","rw2"].includes(component.exporter))controls.push(translationControl(owner,index,component.translationStrategy,`${EXPORTER[component.exporter]} translation`));
  if((component.type==="promRelay"||owner==="final")&&input==="otlp"){controls.push(settingToggle(owner,index,"keepIdentifying","keep identifying attrs",component.keepIdentifying,"native OTLP receiver"));controls.push(translationControl(owner,index,component.translationStrategy,"native OTLP receiver"))}
  return controls.length?`<div class="node-settings"><span class="settings-title">Component configuration</span>${controls.join("")}</div>`:"";
}
function sourceNode(){return `<div class="pipe-node composite fixed-node" data-family="otel"><span class="node-kind">Fixed source</span><b>OpenTelemetry SDK</b><label>output<select data-source-output><option value="otlp" ${model.source==="otlp"?"selected":""}>OTLP exporter</option><option value="prom" ${model.source==="prom"?"selected":""}>Prometheus exporter</option></select></label><small>Semantic resource: payments / checkout / sdk-1</small></div>`}
function stageNode(stage,i){const input=inputProtocolAt(i);if(stage.type==="collector")return `<div class="pipe-node composite" data-family="otel"><span class="node-kind">Collector ${i+1}</span><b>OpenTelemetry Collector</b><label>receiver<input value="${RECEIVER[input]}" disabled></label><label>exporter<select data-exporter="${i}"><option value="otlp" ${stage.exporter==="otlp"?"selected":""}>OTLP exporter</option><option value="prom" ${stage.exporter==="prom"?"selected":""}>Prometheus exporter</option><option value="rw2" ${stage.exporter==="rw2"?"selected":""}>RW 2.0 exporter</option></select></label>${componentSettings(stage,input,"stage",i)}${stageButtons(i)}</div>`;return `<div class="pipe-node composite" data-family="prom"><span class="node-kind">Intermediate server</span><b>Prometheus relay</b><label>ingestion<input value="${INGEST[input]}" disabled></label><label>output<input value="Remote Write 2.0" disabled></label>${componentSettings(stage,input,"stage",i)}${stageButtons(i)}</div>`}
function stageButtons(i){return `<div class="stage-actions"><button data-move-left="${i}" ${i===0?"disabled":""} aria-label="Move stage left">←</button><button data-move-right="${i}" ${i===model.stages.length-1?"disabled":""} aria-label="Move stage right">→</button><button data-remove-stage="${i}" aria-label="Remove stage">Remove</button></div>`}
function finalNode(){const input=finalInputProtocol();return `<div class="pipe-node composite fixed-node" data-family="prom"><span class="node-kind">Fixed destination</span><b>Prometheus server</b><label>ingestion<input value="${INGEST[input]}" disabled></label>${componentSettings(model.final,input,"final",0)}<small>Final queryable storage · cannot be removed</small></div>`}
function componentFamily(node){return node?.type==="promRelay"||node?.type==="final"?"prom":"otel"}
function protocolFamily(protocol){return protocol==="otlp"?"otel":"prom"}
function renderWorkbench(){
  const parts=[sourceNode()];model.stages.forEach((s,i)=>{const active=i>=selectedRange.start&&i<=selectedRange.end,fromFamily=i===0?"otel":componentFamily(model.stages[i-1]),toFamily=componentFamily(s);parts.push(`<button class="pipe-arrow ${active?"active":""}" data-boundary="${i}" data-from-family="${fromFamily}" data-to-family="${toFamily}" aria-pressed="${active}" aria-label="Select boundary ${i+1}"><span></span></button>`);parts.push(stageNode(s,i))});const finalBoundary=model.stages.length,finalActive=finalBoundary>=selectedRange.start&&finalBoundary<=selectedRange.end,finalFrom=model.stages.length?componentFamily(model.stages.at(-1)):"otel";parts.push(`<button class="pipe-arrow ${finalActive?"active":""}" data-boundary="${finalBoundary}" data-from-family="${finalFrom}" data-to-family="prom" aria-pressed="${finalActive}" aria-label="Select final boundary"><span></span></button>`);parts.push(finalNode());document.querySelector("#pipeline").innerHTML=parts.join("");
  document.querySelector("[data-source-output]").onchange=e=>{model.source=e.target.value;markCustom();render()};
  document.querySelectorAll("[data-exporter]").forEach(el=>el.onchange=e=>{model.stages[+e.target.dataset.exporter].exporter=e.target.value;markCustom();render()});
  document.querySelectorAll("[data-setting-key]").forEach(el=>el.onchange=e=>updateSetting(e.target));
  document.querySelectorAll("[data-boundary]").forEach(b=>b.onclick=()=>selectBoundary(+b.dataset.boundary));
  document.querySelectorAll("[data-remove-stage]").forEach(b=>b.onclick=()=>{model.stages.splice(+b.dataset.removeStage,1);markCustom();clampSelection();render()});
  document.querySelectorAll("[data-move-left]").forEach(b=>b.onclick=()=>moveStage(+b.dataset.moveLeft,-1));document.querySelectorAll("[data-move-right]").forEach(b=>b.onclick=()=>moveStage(+b.dataset.moveRight,1));
  const selectedCount=selectedRange.end-selectedRange.start+1;document.querySelector("#boundary-selection-help").textContent=selectedCount===1?"One boundary selected. Click another arrow to extend the comparison across every component between them.":`${selectedCount} consecutive boundaries selected. Click a selected arrow to start a new range.`;
  const evidence=matchedCoverageCase(),status=document.querySelector("#coverage-status");status.textContent=evidence?`LAB TESTED · ${evidence.id}`:"OUTSIDE 36-CASE LAB SCOPE";status.style.background=evidence?"#e7f5f2":"#fff6dc";status.style.color=evidence?"#087368":"#775d00";const banner=document.querySelector("#unsupported-banner");banner.hidden=Boolean(evidence);banner.textContent="This graph is outside the Lab's complete zero-or-one-Collector matrix. The inspector applies component-level rules, but this full composition was not run end-to-end.";renderInspector();
}
function selectBoundary(index){
  const {start,end}=selectedRange;
  if(start===end&&index!==start)selectedRange={start:Math.min(start,index),end:Math.max(start,index)};
  else if(index<start||index>end)selectedRange={start:Math.min(start,index),end:Math.max(end,index)};
  else selectedRange={start:index,end:index};
  renderWorkbench();
}
function clampSelection(){const max=model.stages.length;selectedRange.start=Math.min(selectedRange.start,max);selectedRange.end=Math.min(selectedRange.end,max);if(selectedRange.start>selectedRange.end)selectedRange.start=selectedRange.end}
function updateSetting(el){
  const target=el.dataset.settingOwner==="final"?model.final:model.stages[+el.dataset.settingIndex];target[el.dataset.settingKey]=el.type==="checkbox"?el.checked:el.value;
  markCustom();renderWorkbench();
}
function moveStage(i,delta){const j=i+delta;if(j<0||j>=model.stages.length)return;[model.stages[i],model.stages[j]]=[model.stages[j],model.stages[i]];markCustom();render()}
function componentName(node){return node.type==="source"?"OTel SDK":node.type==="collector"?"Collector":node.type==="promRelay"?"Prometheus relay":"Prometheus server"}
function componentPathName(node,index,logical){if(node.type==="collector"){const total=logical.filter(item=>item.type==="collector").length,ordinal=logical.slice(0,index+1).filter(item=>item.type==="collector").length;return total>1?`Collector ${ordinal}`:"Collector"}if(node.type==="promRelay"){const total=logical.filter(item=>item.type==="promRelay").length,ordinal=logical.slice(0,index+1).filter(item=>item.type==="promRelay").length;return total>1?`Prometheus relay ${ordinal}`:"Prometheus relay"}return componentName(node)}
function renderInspector(){
  const {logical,states}=compute(),start=selectedRange.start,end=selectedRange.end,before=states[start],after=states[end+1],nodes=logical.slice(start+1,end+2),path=logical.slice(start,end+2),beforeRows=stateRows(before),afterRows=stateRows(after),classifiedBefore=classifyRows(beforeRows,afterRows,"before"),classifiedAfter=classifyRows(afterRows,beforeRows,"after"),total=logical.length-1,count=end-start+1,beforePanel=document.querySelector("#before-state").closest(".state-panel"),afterPanel=document.querySelector("#after-state").closest(".state-panel");
  beforePanel.dataset.family=protocolFamily(before.protocol);afterPanel.dataset.family=protocolFamily(after.protocol);
  document.querySelector("#inspector-range-label").textContent=count===1?"SELECTED BOUNDARY":"SELECTED BOUNDARY RANGE";
  document.querySelector("#inspector-title").textContent=path.map((node,i)=>componentPathName(node,start+i,logical)).join(" → ");
  document.querySelector("#boundary-stepper").textContent=count===1?`${String(start+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`:`${String(start+1).padStart(2,"0")}–${String(end+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`;
  document.querySelector("#before-kind").textContent=`${before.kind} · ${PROTOCOL[before.protocol]}`;document.querySelector("#after-kind").textContent=`${after.kind} · ${PROTOCOL[after.protocol]}`;
  document.querySelector("#before-state").innerHTML=renderRows(classifiedBefore);document.querySelector("#after-state").innerHTML=renderRows(classifiedAfter);
  activeConnections=connectionPairs(classifiedBefore,classifiedAfter);requestAnimationFrame(()=>requestAnimationFrame(drawFieldConnectors));
  document.querySelector("#transform-verb").textContent=count===1?nodeAction(nodes[0],before):`${count} components in sequence`;
  const explanation=nodes.map((node,i)=>count===1?interpretation(node,states[start+i]):`<strong>${i+1}. ${componentPathName(node,start+i+1,logical)}:</strong> ${interpretation(node,states[start+i])}`).join(" "),evidence=matchedCoverageCase();document.querySelector("#interpretation").innerHTML=`<span>${evidence?`LAB OBSERVATION · ${evidence.id}`:"COMPONENT RULE · OUTSIDE COMPLETE MATRIX"}</span><p>${explanation}</p>`;
}
function renderRows(rows,empty="No identity fields recorded here."){const labels={unchanged:"same",remapped:"remapped",derived:"new",lost:"lost"};return rows.length?rows.map(([k,v,status],index)=>`<div class="state-row diff-${status}" data-row-index="${index}"><span>${k}<em class="change-tag">${labels[status]}</em></span><b>${v??"—"}</b></div>`).join(""):`<div class="empty-state">${empty}</div>`}
function render(){renderControls();clampSelection();renderWorkbench()}
render();
window.addEventListener("resize",()=>requestAnimationFrame(drawFieldConnectors));
