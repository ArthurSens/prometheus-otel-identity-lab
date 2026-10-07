const COMPONENTS={
  sdkOtel:{name:"OTel SDK resource",short:"SDK resource",family:"otel",kind:"OTLP",note:"payments / checkout / sdk-1"},
  sdkProm:{name:"SDK Prometheus page",short:"SDK Prom page",family:"prom",kind:"Exposition",note:"target_info carries service_*"},
  promScrape:{name:"Prometheus scrape",short:"Prom scrape",family:"prom",kind:"Scrape",note:"assigns target identity"},
  promReceiver:{name:"Collector Prometheus receiver",short:"Prom receiver",family:"otel",kind:"Receiver",note:"reconstructs resource"},
  promExporter:{name:"Collector Prometheus exporter",short:"Prom exporter",family:"prom",kind:"Exporter",note:"derives job / instance"},
  otlpTransport:{name:"OTLP transport",short:"OTLP transport",family:"otel",kind:"Transport",note:"preserves resource"},
  rw2Transport:{name:"Remote Write 2.0",short:"RW 2.0",family:"prom",kind:"Transport",note:"transports label sets"},
  rwReceiver:{name:"Collector RW receiver",short:"RW receiver",family:"otel",kind:"Receiver",note:"reconstructs resource"},
  nativeOtlp:{name:"Prometheus native OTLP",short:"Native OTLP",family:"prom",kind:"Ingestion",note:"derives stored identity"},
  promStorage:{name:"Prometheus storage",short:"Prom storage",family:"prom",kind:"Storage",note:"queryable label sets"},
  otlpSink:{name:"Collector OTLP sink",short:"OTLP sink",family:"otel",kind:"Sink",note:"structured resource"}
};

const PRESETS=[
  {id:"p1",label:"01 · direct SDK scrape",chain:["sdkProm","promScrape","promStorage"]},
  {id:"p2",label:"02 · Prom receiver → OTLP",chain:["sdkProm","promReceiver","otlpTransport","otlpSink"]},
  {id:"p3",label:"03 · Prom round trip",chain:["sdkProm","promReceiver","promExporter","promScrape","promStorage"]},
  {id:"p4",label:"04 · OTLP → Prom exporter",chain:["sdkOtel","otlpTransport","promExporter","promScrape","promStorage"]},
  {id:"p5",label:"05 · pull → RW2",chain:["sdkOtel","promExporter","promScrape","promStorage","rw2Transport","promStorage"]},
  {id:"p6",label:"06 · direct Collector RW2",chain:["sdkOtel","otlpTransport","rw2Transport","promStorage"]},
  {id:"p7",label:"07 · Prom → RW receiver",chain:["sdkProm","promScrape","promStorage","rw2Transport","rwReceiver","otlpTransport","otlpSink"]},
  {id:"p8",label:"08 · honor_labels control",chain:["sdkProm","promScrape","promStorage"]},
  {id:"p9",label:"09 · translation strategies",chain:["sdkOtel","promExporter","promScrape","promStorage"]},
  {id:"p10",label:"10 · native OTLP",chain:["sdkOtel","nativeOtlp","promStorage"]}
];

const states={
  sdkOtel:{kind:"OTel resource",rows:[["service.namespace","payments"],["service.name","checkout"],["service.instance.id","sdk-1"],["deployment.environment.name","lab"],["resource.custom","resource-value"]]},
  sdkProm:{kind:"Prometheus exposition",rows:[["ordinary metric job","—"],["ordinary metric instance","—"],["target_info service_name","checkout"],["target_info service_namespace","payments"],["target_info service_instance_id","sdk-1"]]}
};

const edge=(verb,after,why)=>({verb,after,why});
function edgeResult(a,b,index){
  const honor=config.honorLabels,keep=config.keepIdentifying,strategy=config.translation;
  if(a==="sdkProm"&&b==="promScrape") return edge("scrape assigns",{kind:"Prometheus series",rows:[["job",honor&&activePreset==="p8"?"sdk-metric-job":"path1-direct"],["instance",honor&&activePreset==="p8"?"sdk-metric-instance":"sdk-app:9464"],...(activePreset==="p8"&&!honor?[["exported_job","sdk-metric-job"],["exported_instance","sdk-metric-instance"]]:[]),["target_info","present · original service_* retained"]]},honor&&activePreset==="p8"?"The collision probe already supplied job and instance, so honor_labels=true kept the incoming pair.":activePreset==="p8"?"The target pair won the collision; the source pair moved to exported_job and exported_instance.":"The ordinary SDK metric had no job or instance. The scrape therefore assigned its configured target identity.");
  if(a==="sdkProm"&&b==="promReceiver") return edge("receiver reconstructs",{kind:"OTel resource",rows:[["service.name",activePreset==="p3"?"path3-prom-receiver":"path2-prom-receiver"],["service.instance.id","sdk-app:9464"],["service_name","checkout"],["service_namespace","payments"],["service_instance_id","sdk-1"],["target_info metric","consumed"]]},"The receiver promoted scrape-target job and instance to primary resource identity, then consumed target_info into normalized underscore attributes.");
  if((a==="sdkOtel"||a==="otlpTransport")&&b==="promExporter") return edge("exporter derives",{kind:"Prometheus exposition",rows:[["job","payments/checkout"],["instance","sdk-1"],["target_info service_*","not duplicated"],["target_info other attrs","deployment_environment_name · resource_custom"],["translation strategy",strategy+" · identity unchanged"]]},"The exporter projected semantic service identity into job and instance. Across the three tested translation strategies, that identity mapping did not change.");
  if(a==="promReceiver"&&b==="promExporter") return edge("exporter derives",{kind:"Prometheus exposition",rows:[["job","path3-prom-receiver"],["instance","sdk-app:9464"],["target_info service_name","checkout"],["target_info service_namespace","payments"],["target_info service_instance_id","sdk-1"]]},"The exporter used the receiver-reconstructed resource for job and instance, while the original SDK identity reappeared as labels on a newly created target_info series.");
  if(a==="promExporter"&&b==="promScrape") return edge(honor?"scrape preserves":"scrape overrides",{kind:"Scrape output",rows:honor?[["job",activePreset==="p3"?"path3-prom-receiver":"payments/checkout"],["instance",activePreset==="p3"?"sdk-app:9464":"sdk-1"],["target_info","present"]]:[["job",activePreset==="p9"?`path9-${strategyKey(strategy)}`:"scrape-job"],["instance",activePreset==="p9"?`collector:${strategyPort(strategy)}`:"exporter:port"],["exported_job",activePreset==="p3"?"path3-prom-receiver":"payments/checkout"],["exported_instance",activePreset==="p3"?"sdk-app:9464":"sdk-1"]]},honor?"With honor_labels=true, the exporter-provided identity remained attached to both the ordinary series and target_info.":"With honor_labels=false, the configured scrape target won. The exporter identity survived only as exported_job and exported_instance.");
  if(a==="promScrape"&&b==="promStorage") return edge("storage retains",withKind(stateAt(index-1),"Prometheus storage"),"Prometheus stored the label set produced by the scrape. Storage did not reinterpret the identity in this observed path.");
  if(a==="promStorage"&&b==="rw2Transport") return edge("RW2 transports",withKind(stateAt(index-1),"Remote Write series"),"Remote Write 2.0 transported the ordinary series and target_info label sets without reinterpreting job or instance.");
  if((a==="otlpTransport"||a==="sdkOtel")&&b==="rw2Transport") return edge("RW2 exporter derives",{kind:"Remote Write series",rows:[["job","payments/checkout"],["instance","sdk-1"],["target_info","present"],["target_info other attrs","deployment_environment_name · resource_custom"]]},"The Collector Remote Write 2.0 exporter projected the OTel service identity into Prometheus labels and emitted target_info for remaining resource attributes.");
  if(a==="rw2Transport"&&b==="promStorage") return edge("storage retains",{kind:"Prometheus storage",rows:[["job","payments/checkout"],["instance","sdk-1"],["target_info","present"],["lab_path",activePreset==="p5"?"path5":"path6"]]},"The destination Prometheus retained both the ordinary series and target_info. This is the corrected clean-rerun result for both RW2 routes.");
  if(a==="rw2Transport"&&b==="rwReceiver") return edge("receiver reconstructs",{kind:"OTel resource",rows:[["service.name","path7-source"],["service.instance.id","sdk-app:9464"],["service_name","checkout"],["service_namespace","payments"],["service_instance_id","sdk-1"],["target_info metric","consumed"]]},"The Remote Write receiver treated surviving Prometheus job and instance as primary service identity and recovered the original SDK identity from target_info.");
  if((a==="promReceiver"||a==="rwReceiver"||a==="sdkOtel")&&b==="otlpTransport") return edge("OTLP preserves",stateAt(index-1),"Across the observed Collector OTLP hop, resource identity did not change.");
  if(a==="otlpTransport"&&b==="otlpSink") return edge("sink observes",withKind(stateAt(index-1),"OTel resource at sink"),"The final OTLP checkpoint preserved the structured resource received over the OTLP hop.");
  if(a==="sdkOtel"&&b==="nativeOtlp") return edge("ingestion derives",{kind:"Prometheus storage",rows:[["job","payments/checkout"],["instance","sdk-1"],["target_info service_name",keep?"checkout":"omitted"],["target_info service_namespace",keep?"payments":"omitted"],["target_info service_instance_id",keep?"sdk-1":"omitted"],["target_info other attrs","deployment_environment_name · resource_custom"]]},"Both settings derived the same job and instance. keep_identifying_resource_attributes only controlled whether the three identifying resource attributes were repeated on target_info.");
  if(a==="nativeOtlp"&&b==="promStorage") return edge("storage exposes",withKind(stateAt(index-1),"Prometheus storage"),"The API-observed stored identity matched the native OTLP ingestion result.");
  return null;
}

let chain=[...PRESETS[3].chain],activePreset="p4",selectedBoundary=1;
let config={honorLabels:true,keepIdentifying:false,translation:"Underscore + suffixes"};
function strategyKey(v){return v.startsWith("Underscore")?"underscore":v.startsWith("UTF")?"utf8-suffixes":"no-translation"}
function strategyPort(v){return v.startsWith("Underscore")?"9471":v.startsWith("UTF")?"9472":"9473"}
function stateAt(index){if(index<=0)return states[chain[0]]||{kind:COMPONENTS[chain[0]].kind,rows:[]};const result=edgeResult(chain[index-1],chain[index],index);return result?result.after:{kind:"Not covered",rows:[]}}
function withKind(state,kind){return {...state,kind}}

function renderControls(){
  document.querySelector("#preset-list").innerHTML=PRESETS.map(p=>`<button class="preset-button ${activePreset===p.id?"active":""}" data-preset="${p.id}">${p.label}<small>${p.chain.length} nodes</small></button>`).join("");
  const addable=["promReceiver","promExporter","promScrape","otlpTransport","rw2Transport","rwReceiver","nativeOtlp","promStorage","otlpSink"];
  document.querySelector("#component-list").innerHTML=addable.map(id=>`<button class="component-button" data-add="${id}">${COMPONENTS[id].short}</button>`).join("");
  document.querySelector("#config-controls").innerHTML=`
    <div class="config-row"><label>honor_labels <span class="switch"><input id="honor" type="checkbox" ${config.honorLabels?"checked":""}><i></i></span></label></div>
    <div class="config-row"><label>keep identifying resource attrs <span class="switch"><input id="keep" type="checkbox" ${config.keepIdentifying?"checked":""}><i></i></span></label></div>
    <div class="config-row"><label for="translation">translation_strategy</label><select id="translation"><option ${config.translation==="Underscore + suffixes"?"selected":""}>Underscore + suffixes</option><option ${config.translation==="UTF-8 + suffixes"?"selected":""}>UTF-8 + suffixes</option><option ${config.translation==="No translation"?"selected":""}>No translation</option></select></div>`;
  document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>selectPreset(b.dataset.preset));
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{chain.push(b.dataset.add);activePreset="custom";selectedBoundary=Math.max(0,chain.length-2);render()});
  document.querySelector("#honor").onchange=e=>{config.honorLabels=e.target.checked;renderWorkbench()};
  document.querySelector("#keep").onchange=e=>{config.keepIdentifying=e.target.checked;renderWorkbench()};
  document.querySelector("#translation").onchange=e=>{config.translation=e.target.value;renderWorkbench()};
}
function selectPreset(id){const p=PRESETS.find(x=>x.id===id);activePreset=id;chain=[...p.chain];selectedBoundary=Math.min(1,chain.length-2);if(["p1","p8","p9"].includes(id))config.honorLabels=false;else config.honorLabels=true;render()}
function renderWorkbench(){
  const pipe=document.querySelector("#pipeline");
  pipe.innerHTML=chain.map((id,i)=>`${i?`<button class="pipe-arrow ${selectedBoundary===i-1?"active":""}" data-boundary="${i-1}" aria-label="Inspect boundary ${i}"></button>`:""}<div class="pipe-node" data-family="${COMPONENTS[id].family}"><span class="node-kind">${COMPONENTS[id].kind}</span><b>${COMPONENTS[id].short}</b><small>${COMPONENTS[id].note}</small><button class="remove-node" data-remove="${i}" aria-label="Remove ${COMPONENTS[id].short}">×</button></div>`).join("");
  document.querySelectorAll("[data-boundary]").forEach(b=>b.onclick=()=>{selectedBoundary=+b.dataset.boundary;renderWorkbench()});
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{chain.splice(+b.dataset.remove,1);activePreset="custom";selectedBoundary=Math.max(0,Math.min(selectedBoundary,chain.length-2));render()});
  let coverage=true;for(let i=0;i<chain.length-1;i++)if(!edgeResult(chain[i],chain[i+1],i+1))coverage=false;
  const status=document.querySelector("#coverage-status");status.textContent=coverage?"FULLY COVERED BY RERUN":"PARTIAL / UNSUPPORTED";status.style.background=coverage?"#e7f5f2":"#fff2ea";status.style.color=coverage?"#087368":"#8b3b12";
  const banner=document.querySelector("#unsupported-banner");banner.hidden=coverage;banner.textContent="At least one transition was not exercised by the Lab report. Unsupported boundaries are not simulated; select their arrows to see the gap.";
  renderInspector();
}
function renderInspector(){
  if(chain.length<2){document.querySelector("#inspector-title").textContent="Add another component";return}
  const a=chain[selectedBoundary],b=chain[selectedBoundary+1],r=edgeResult(a,b,selectedBoundary+1),before=stateAt(selectedBoundary);
  document.querySelector("#inspector-title").textContent=`${COMPONENTS[a].short} → ${COMPONENTS[b].short}`;
  document.querySelector("#boundary-stepper").textContent=`${String(selectedBoundary+1).padStart(2,"0")} / ${String(chain.length-1).padStart(2,"0")}`;
  document.querySelector("#before-kind").textContent=before.kind;
  document.querySelector("#before-state").innerHTML=renderRows(before.rows);
  document.querySelector("#after-kind").textContent=r?r.after.kind:"NOT COVERED";
  document.querySelector("#after-state").innerHTML=r?renderRows(r.after.rows):`<div class="empty-state">This component transition was not part of the experiment. No result is inferred.</div>`;
  document.querySelector("#transform-verb").textContent=r?r.verb:"no evidence";
  document.querySelector("#interpretation").innerHTML=`<span>${r?"WHY IT CHANGED":"EVIDENCE GAP"}</span><p>${r?r.why:"The Lab report does not contain this adjacency. Choose a tested route or treat this as a proposal for a new experiment."}</p>`;
}
function renderRows(rows=[]){return rows.length?rows.map(([k,v])=>`<div class="state-row"><span>${k}</span><b>${v}</b></div>`).join(""):`<div class="empty-state">No identity fields recorded here.</div>`}
function render(){renderControls();renderWorkbench()}
render();
