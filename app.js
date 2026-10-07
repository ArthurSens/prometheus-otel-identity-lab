const PRESETS=[
  {id:"p1",label:"01 · direct SDK scrape",source:"prom",stages:[],config:{honorLabels:false}},
  {id:"p3",label:"03 · Prom receiver round trip",source:"prom",stages:[{type:"collector",exporter:"prom"}],config:{honorLabels:true}},
  {id:"p4",label:"04 · OTLP → Prom exporter",source:"otlp",stages:[{type:"collector",exporter:"prom"}],config:{honorLabels:true}},
  {id:"p5",label:"05 · pull → RW2",source:"otlp",stages:[{type:"collector",exporter:"prom"},{type:"promRelay"}],config:{honorLabels:true}},
  {id:"p6",label:"06 · direct Collector RW2",source:"otlp",stages:[{type:"collector",exporter:"rw2"}],config:{}},
  {id:"p8",label:"08 · honor_labels control",source:"prom",stages:[],config:{honorLabels:false}},
  {id:"p9",label:"09 · translation strategies",source:"otlp",stages:[{type:"collector",exporter:"prom"}],config:{honorLabels:false}},
  {id:"p10",label:"10 · native OTLP",source:"otlp",stages:[{type:"collector",exporter:"otlp"}],config:{keepIdentifying:false}}
];

const PROTOCOL={otlp:"OTLP",prom:"Prometheus exposition",rw2:"Remote Write 2.0",storage:"stored series"};
const EXPORTER={otlp:"OTLP exporter",prom:"Prometheus exporter",rw2:"Remote Write 2.0 exporter"};
const INGEST={otlp:"native OTLP receiver",prom:"scrape",rw2:"Remote Write 2.0 receiver"};
const RECEIVER={otlp:"OTLP receiver",prom:"Prometheus receiver",rw2:"Remote Write 2.0 receiver"};

let model={source:"otlp",stages:[{type:"collector",exporter:"prom"}]};
let config={honorLabels:true,keepIdentifying:false,translation:"Underscore + suffixes"};
let activePreset="p4",selectedBoundary=0;

const clone=value=>JSON.parse(JSON.stringify(value));
function selectPreset(id){
  const p=PRESETS.find(x=>x.id===id);
  model={source:p.source,stages:clone(p.stages)};
  config={honorLabels:true,keepIdentifying:false,translation:"Underscore + suffixes",...p.config};
  activePreset=id;selectedBoundary=0;render();
}
function markCustom(){activePreset="custom"}
function outputOfStage(stage){return stage.type==="collector"?stage.exporter:"rw2"}
function inputProtocolAt(stageIndex){let p=model.source;for(let i=0;i<stageIndex;i++)p=outputOfStage(model.stages[i]);return p}
function finalInputProtocol(){return model.stages.length?outputOfStage(model.stages.at(-1)):model.source}
function strategyKey(v){return v.startsWith("Underscore")?"underscore":v.startsWith("UTF")?"utf8-suffixes":"no-translation"}
function strategyPort(v){return v.startsWith("Underscore")?"9471":v.startsWith("UTF")?"9472":"9473"}

function initialState(){
  if(model.source==="otlp") return {protocol:"otlp",kind:"OTel resource",resource:{"service.namespace":"payments","service.name":"checkout","service.instance.id":"sdk-1","deployment.environment.name":"lab","resource.custom":"resource-value"},labels:null,targetInfo:null};
  return {protocol:"prom",kind:"Prometheus exposition",resource:null,labels:{job:null,instance:null},targetInfo:{service_name:"checkout",service_namespace:"payments",service_instance_id:"sdk-1",deployment_environment_name:"lab",resource_custom:"resource-value"}};
}
function receiverIdentity(input){
  if(input.labels?.job) return {job:input.labels.job,instance:input.labels.instance};
  if(activePreset==="p3") return {job:"path3-prom-receiver",instance:"sdk-app:9464"};
  return {job:"configured receiver job_name",instance:"configured scrape target"};
}
function receiveResource(input){
  if(input.protocol==="otlp") return clone(input.resource||{});
  const identity=receiverIdentity(input);
  const resource={"service.name":identity.job,"service.instance.id":identity.instance};
  for(const [k,v] of Object.entries(input.targetInfo||{})) resource[k]=v;
  return resource;
}
function projectResource(resource,protocol){
  const semanticName=resource["service.name"];
  const namespace=resource["service.namespace"];
  const job=namespace?`${namespace}/${semanticName}`:semanticName;
  const instance=resource["service.instance.id"];
  const targetInfo={};
  for(const [k,v] of Object.entries(resource)){
    if(["service.name","service.namespace","service.instance.id"].includes(k))continue;
    targetInfo[k.replaceAll(".","_")]=v;
  }
  return {protocol,kind:protocol==="rw2"?"Remote Write series":"Prometheus exposition",resource:null,labels:{job,instance},targetInfo};
}
function applyCollector(input,stage){
  const resource=receiveResource(input);
  if(stage.exporter==="otlp") return {protocol:"otlp",kind:"OTel resource",resource,labels:null,targetInfo:null};
  return projectResource(resource,stage.exporter);
}
function scrapeTarget(context){
  if(activePreset==="p1")return {job:"path1-direct",instance:"sdk-app:9464"};
  if(activePreset==="p8")return {job:"path8-prom-false",instance:"sdk-app:9464"};
  if(activePreset==="p9")return {job:`path9-${strategyKey(config.translation)}`,instance:`collector:${strategyPort(config.translation)}`};
  if(context==="relay"&&activePreset==="p5")return {job:"path5-origin",instance:"collector:port"};
  return {job:"configured job_name",instance:"configured scrape target"};
}
function ingestPrometheus(input,context,isFinal){
  let stored;
  if(input.protocol==="otlp"){
    stored=projectResource(input.resource||{},"prom");
    if(config.keepIdentifying){
      const r=input.resource||{};
      if(r["service.name"])stored.targetInfo.service_name=r["service.name"];
      if(r["service.namespace"])stored.targetInfo.service_namespace=r["service.namespace"];
      if(r["service.instance.id"])stored.targetInfo.service_instance_id=r["service.instance.id"];
    }
  }else if(input.protocol==="rw2") stored=clone(input);
  else{
    stored=clone(input);const incoming=stored.labels||{};const target=scrapeTarget(context);
    if(!incoming.job)stored.labels={job:target.job,instance:target.instance};
    else if(!config.honorLabels)stored.labels={job:target.job,instance:target.instance,exported_job:incoming.job,exported_instance:incoming.instance};
  }
  stored.protocol=isFinal?"storage":"rw2";
  stored.kind=isFinal?"Prometheus storage":"Prometheus storage → Remote Write 2.0";
  return stored;
}
function compute(){
  const logical=[{type:"source"},...model.stages,{type:"final"}];
  const states=[initialState()];let state=states[0];
  model.stages.forEach(stage=>{state=stage.type==="collector"?applyCollector(state,stage):ingestPrometheus(state,"relay",false);states.push(state)});
  state=ingestPrometheus(state,"final",true);states.push(state);
  return {logical,states};
}
function stateRows(state){
  const rows=[];
  if(state.resource)for(const [k,v] of Object.entries(state.resource))rows.push([k,v]);
  if(state.labels)for(const [k,v] of Object.entries(state.labels))if(v)rows.push([k,v]);
  if(state.targetInfo){
    const entries=Object.entries(state.targetInfo);rows.push(["target_info",entries.length?"present":"present · no additional labels"]);
    for(const [k,v] of entries)rows.push([`target_info.${k}`,v]);
  }
  return rows;
}
function nodeAction(node,input){
  if(node.type==="collector")return `${RECEIVER[input.protocol]} → ${EXPORTER[node.exporter]}`;
  if(node.type==="promRelay")return `${INGEST[input.protocol]} → Remote Write 2.0`;
  return `${INGEST[input.protocol]} → storage`;
}
function interpretation(node,input){
  if(node.type==="collector"){
    const receive=input.protocol==="otlp"?"The OTLP receiver preserves structured resource identity.":`The ${RECEIVER[input.protocol]} reconstructs primary resource identity from the surviving job and instance, and consumes target_info into resource attributes.`;
    const send=node.exporter==="otlp"?"The OTLP exporter keeps that resource structured.":`The ${EXPORTER[node.exporter]} projects the resulting resource back into job, instance, and target_info.`;
    return `${receive} ${send}`;
  }
  if(input.protocol==="prom")return config.honorLabels?"The scrape honors incoming job and instance when they exist; otherwise it assigns configured target identity.":"The scrape target wins job and instance collisions; incoming values survive as exported_job and exported_instance.";
  if(input.protocol==="otlp")return "Prometheus native OTLP ingestion derives job and instance from service identity. keep_identifying_resource_attributes only controls duplication on target_info.";
  return "Remote Write 2.0 transports the existing Prometheus label set without reinterpreting job or instance.";
}

function renderControls(){
  document.querySelector("#preset-list").innerHTML=PRESETS.map(p=>`<button class="preset-button ${activePreset===p.id?"active":""}" data-preset="${p.id}">${p.label}<small>${p.stages.length+2} roles</small></button>`).join("");
  document.querySelector("#component-list").innerHTML=`<button class="component-button" data-add="collector">Add Collector</button><button class="component-button" data-add="promRelay">Add Prometheus relay</button><p class="control-help">Stages are inserted before the fixed final Prometheus server. Protocol-compatible receivers are selected automatically.</p>`;
  document.querySelector("#config-controls").innerHTML=`
    <div class="config-row"><label>honor_labels <span class="switch"><input id="honor" type="checkbox" ${config.honorLabels?"checked":""}><i></i></span></label></div>
    <div class="config-row"><label>keep identifying resource attrs <span class="switch"><input id="keep" type="checkbox" ${config.keepIdentifying?"checked":""}><i></i></span></label></div>
    <div class="config-row"><label for="translation">translation_strategy</label><select id="translation"><option ${config.translation==="Underscore + suffixes"?"selected":""}>Underscore + suffixes</option><option ${config.translation==="UTF-8 + suffixes"?"selected":""}>UTF-8 + suffixes</option><option ${config.translation==="No translation"?"selected":""}>No translation</option></select></div>`;
  document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>selectPreset(b.dataset.preset));
  document.querySelector('[data-add="collector"]').onclick=()=>{model.stages.push({type:"collector",exporter:"otlp"});markCustom();selectedBoundary=model.stages.length-1;render()};
  document.querySelector('[data-add="promRelay"]').onclick=()=>{model.stages.push({type:"promRelay"});markCustom();selectedBoundary=model.stages.length-1;render()};
  document.querySelector("#honor").onchange=e=>{config.honorLabels=e.target.checked;if(!["p8","p9"].includes(activePreset))markCustom();renderWorkbench()};
  document.querySelector("#keep").onchange=e=>{config.keepIdentifying=e.target.checked;if(activePreset!=="p10")markCustom();renderWorkbench()};
  document.querySelector("#translation").onchange=e=>{config.translation=e.target.value;if(activePreset!=="p9")markCustom();renderWorkbench()};
}
function sourceNode(){return `<div class="pipe-node composite fixed-node" data-family="otel"><span class="node-kind">Fixed source</span><b>OpenTelemetry SDK</b><label>output<select data-source-output><option value="otlp" ${model.source==="otlp"?"selected":""}>OTLP exporter</option><option value="prom" ${model.source==="prom"?"selected":""}>Prometheus exporter</option></select></label><small>Semantic resource: payments / checkout / sdk-1</small></div>`}
function stageNode(stage,i){
  const input=inputProtocolAt(i);
  if(stage.type==="collector")return `<div class="pipe-node composite" data-family="otel"><span class="node-kind">Collector ${i+1}</span><b>OpenTelemetry Collector</b><label>receiver<input value="${RECEIVER[input]}" disabled></label><label>exporter<select data-exporter="${i}"><option value="otlp" ${stage.exporter==="otlp"?"selected":""}>OTLP exporter</option><option value="prom" ${stage.exporter==="prom"?"selected":""}>Prometheus exporter</option><option value="rw2" ${stage.exporter==="rw2"?"selected":""}>RW 2.0 exporter</option></select></label>${stageButtons(i)}</div>`;
  return `<div class="pipe-node composite" data-family="prom"><span class="node-kind">Intermediate server</span><b>Prometheus relay</b><label>ingestion<input value="${INGEST[input]}" disabled></label><label>output<input value="Remote Write 2.0" disabled></label>${stageButtons(i)}</div>`;
}
function stageButtons(i){return `<div class="stage-actions"><button data-move-left="${i}" ${i===0?"disabled":""} aria-label="Move stage left">←</button><button data-move-right="${i}" ${i===model.stages.length-1?"disabled":""} aria-label="Move stage right">→</button><button data-remove-stage="${i}" aria-label="Remove stage">Remove</button></div>`}
function finalNode(){const input=finalInputProtocol();return `<div class="pipe-node composite fixed-node" data-family="prom"><span class="node-kind">Fixed destination</span><b>Prometheus server</b><label>ingestion<input value="${INGEST[input]}" disabled></label><small>Final queryable storage · cannot be removed</small></div>`}
function renderWorkbench(){
  const parts=[sourceNode()];
  model.stages.forEach((s,i)=>{parts.push(`<button class="pipe-arrow ${selectedBoundary===i?"active":""}" data-boundary="${i}" aria-label="Inspect boundary ${i+1}"></button>`);parts.push(stageNode(s,i))});
  const finalBoundary=model.stages.length;parts.push(`<button class="pipe-arrow ${selectedBoundary===finalBoundary?"active":""}" data-boundary="${finalBoundary}" aria-label="Inspect final boundary"></button>`);parts.push(finalNode());
  document.querySelector("#pipeline").innerHTML=parts.join("");
  document.querySelector("[data-source-output]").onchange=e=>{model.source=e.target.value;markCustom();render()};
  document.querySelectorAll("[data-exporter]").forEach(el=>el.onchange=e=>{model.stages[+e.target.dataset.exporter].exporter=e.target.value;markCustom();render()});
  document.querySelectorAll("[data-boundary]").forEach(b=>b.onclick=()=>{selectedBoundary=+b.dataset.boundary;renderWorkbench()});
  document.querySelectorAll("[data-remove-stage]").forEach(b=>b.onclick=()=>{model.stages.splice(+b.dataset.removeStage,1);markCustom();selectedBoundary=Math.min(selectedBoundary,model.stages.length);render()});
  document.querySelectorAll("[data-move-left]").forEach(b=>b.onclick=()=>moveStage(+b.dataset.moveLeft,-1));
  document.querySelectorAll("[data-move-right]").forEach(b=>b.onclick=()=>moveStage(+b.dataset.moveRight,1));
  const exact=activePreset!=="custom";const status=document.querySelector("#coverage-status");
  status.textContent=exact?"TESTED ROUTE":"VALID TOPOLOGY · NOT RUN END-TO-END";status.style.background=exact?"#e7f5f2":"#fff6dc";status.style.color=exact?"#087368":"#775d00";
  const banner=document.querySelector("#unsupported-banner");banner.hidden=exact;banner.textContent="This topology is protocol-valid. Its complete composition was not run in the Lab; the inspector applies component-level rules observed elsewhere in the matrix.";
  renderInspector();
}
function moveStage(i,delta){const j=i+delta;if(j<0||j>=model.stages.length)return;[model.stages[i],model.stages[j]]=[model.stages[j],model.stages[i]];markCustom();render()}
function renderInspector(){
  const {logical,states}=compute();const before=states[selectedBoundary],after=states[selectedBoundary+1],node=logical[selectedBoundary+1];
  const from=logical[selectedBoundary];const fromName=from.type==="source"?"OTel SDK":from.type==="collector"?"Collector":"Prometheus relay";
  const toName=node.type==="collector"?"Collector":node.type==="promRelay"?"Prometheus relay":"Prometheus server";
  document.querySelector("#inspector-title").textContent=`${fromName} → ${toName}`;
  document.querySelector("#boundary-stepper").textContent=`${String(selectedBoundary+1).padStart(2,"0")} / ${String(logical.length-1).padStart(2,"0")}`;
  document.querySelector("#before-kind").textContent=`${before.kind} · ${PROTOCOL[before.protocol]}`;
  document.querySelector("#after-kind").textContent=`${after.kind} · ${PROTOCOL[after.protocol]}`;
  document.querySelector("#before-state").innerHTML=renderRows(stateRows(before));document.querySelector("#after-state").innerHTML=renderRows(stateRows(after));
  document.querySelector("#transform-verb").textContent=nodeAction(node,before);
  document.querySelector("#interpretation").innerHTML=`<span>${activePreset==="custom"?"COMPONENT RULE · COMPOSITION NOT RUN":"WHY IT CHANGED"}</span><p>${interpretation(node,before)}</p>`;
}
function renderRows(rows){return rows.length?rows.map(([k,v])=>`<div class="state-row"><span>${k}</span><b>${v??"—"}</b></div>`).join(""):`<div class="empty-state">No identity fields recorded here.</div>`}
function render(){renderControls();selectedBoundary=Math.min(selectedBoundary,model.stages.length);renderWorkbench()}
render();
