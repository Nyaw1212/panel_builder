/* Native photo measuring for Material Runs. Lengths are in feet. */
(() => {
"use strict";
let host, canvas, ctx, image, imageURL, points=[], corners=[], mode="measure", runIndex=0, runs=[], transform={scale:1,x:0,y:0,rotation:0}, pan=false, drag=null, hover=null, calibration=null, measured=null, tracing=false, traceKind="wire", conduitSegments={}, runPaths={}, materialsMode=false, materialCatalog=[], fittingSizes=["1\""];
const $ = id => host?.querySelector("#"+id);
// Store the original uploaded image as a Blob in IndexedDB, not in project JSON.
// Cache is scoped to this browser origin and the active project.
const PHOTO_DB="PanelBuilderPhotoMeasureCache",PHOTO_STORE="photos";
function projectPhotoKey(){
 const project=typeof window.getProjectState==="function"?window.getProjectState():null;
 const id=String(project?.id||"").trim(),name=String(project?.jobName||"").trim();
 return id?"id:"+id:name?"job:"+name:"unsaved-project";
}
function openPhotoDb(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(PHOTO_DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(PHOTO_STORE))req.result.createObjectStore(PHOTO_STORE)};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function cachePhoto(file){
 const db=await openPhotoDb();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction(PHOTO_STORE,"readwrite");
  tx.objectStore(PHOTO_STORE).put({blob:file,name:file.name,modified:Date.now()},projectPhotoKey());
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });}finally{db.close();}
}
async function readCachedPhoto(){
 const db=await openPhotoDb();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(PHOTO_STORE,"readonly"),req=tx.objectStore(PHOTO_STORE).get(projectPhotoKey());
  req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
 });}finally{db.close();}
}
const settingsKey=()=>PHOTO_DB+":settings:"+projectPhotoKey();
async function loadCalibrationPresets(){
 const select=$("pm-calipreset");
 if(!select)return;
 try{
  const result=await apiRequest({action:"getCaliPresets"});
  if(!result?.success)throw Error(result?.message||"Could not read CALIPRESET");
  const items=Array.isArray(result.presets)?result.presets:[];
  select.replaceChildren(new Option("Custom / manual entry",""));
  items.forEach(item=>{
   if(!(Number(item.width)>0&&Number(item.height)>0))return;
   const unit=String(item.unit||"").toLowerCase();
   if(unit!=="in"&&unit!=="ft")return;
   const option=new Option(item.name+" — "+item.width+" × "+item.height+" "+unit,item.name);
   option.dataset.width=item.width;
   option.dataset.height=item.height;
   option.dataset.unit=unit;
   select.add(option);
  });
  select.onchange=()=>{
   const option=select.selectedOptions[0];
   if(!option?.value)return;
   $("pm-width").value=option.dataset.width;
   $("pm-height").value=option.dataset.height;
   $("pm-width-unit").value=option.dataset.unit;
   $("pm-height-unit").value=option.dataset.unit;
   if(corners.length===4)try{calibrate()}catch(e){status(e.message)}
   cacheSettings();
  };
 }catch(error){
  select.replaceChildren(new Option("Calibration presets unavailable",""));
  console.warn("CALIPRESET load failed",error);
 }
}
function cacheSettings(){try{localStorage.setItem(settingsKey(),JSON.stringify({width:$("pm-width")?.value,height:$("pm-height")?.value,widthUnit:$("pm-width-unit")?.value,heightUnit:$("pm-height-unit")?.value,corners,calibration,runPaths,conduitSegments,runIndex,rotation:transform.rotation}))}catch(e){console.warn(e)}}
function restoreSettings(){try{const x=JSON.parse(localStorage.getItem(settingsKey())||"null");if(!x)return;if(x.width)$("pm-width").value=x.width;if(x.height)$("pm-height").value=x.height;if(x.widthUnit)$("pm-width-unit").value=x.widthUnit;if(x.heightUnit)$("pm-height-unit").value=x.heightUnit;corners=Array.isArray(x.corners)?x.corners:[];calibration=Array.isArray(x.calibration)&&x.calibration.length===8?x.calibration:null;runPaths=x.runPaths&&typeof x.runPaths==="object"?x.runPaths:{};conduitSegments=x.conduitSegments&&typeof x.conduitSegments==="object"?x.conduitSegments:{};runIndex=Math.max(0,Math.min(runs.length-1,Number(x.runIndex)||0));transform.rotation=Number(x.rotation)||0}catch(e){console.warn(e)}}
function rememberRun(){const r=currentRun();if(r&&points.length&&!tracing&&traceKind==="wire"){runPaths[String(r.id)]={points:points.map(p=>({...p})),length:Number.isFinite(measured)?measured:null};}cacheSettings()}
function restoreRun(){const saved=runPaths[String(currentRun()?.id)];points=Array.isArray(saved?.points)?saved.points.map(p=>({...p})):[];measured=Number.isFinite(saved?.length)?saved.length:null;hover=null;tracing=false;traceKind="wire";label();draw()}
function loadPhotoBlob(blob,name){
 if(imageURL)URL.revokeObjectURL(imageURL);
 imageURL=URL.createObjectURL(blob);
 const im=new Image();
 im.onload=()=>{
  image=im;tracing=false;hover=null;
  fit();restoreRun();status("Loaded "+name+(calibration?". Cached reference and plotted points restored.":". Set the reference rectangle."));
 };
 im.onerror=()=>status("Unable to open cached photo.");
 im.src=imageURL;
}

const escape = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function currentRun(){return runs[runIndex];}
function status(message){if($("pm-status"))$("pm-status").textContent=message;}
function endpointDetails(id){
 const item=typeof getCanvasItem==="function"?getCanvasItem(id):null;
 if(!item)return {name:"Not assigned",image:""};
 const name=String(item.preset||item.data?.CatalogNumber||item.data?.Description||"Canvas item").trim();
 const image=typeof getRunCanvasComponentImage==="function"?getRunCanvasComponentImage(item):"";
 return {name,image};
}
function endpointCard(id,side){
 const item=endpointDetails(id);
 const image=item.image?`<img src="${escape(item.image)}" alt="" style="width:66px;height:66px;object-fit:contain;background:#f1f5f9;border-radius:4px" onerror="this.style.display='none'">`:`<span style="width:66px;height:66px;display:grid;place-items:center;background:#23364b;border-radius:4px">—</span>`;
 return `<div class="pm-endpoint"><span class="pm-endpoint-role">${side}</span>${image}<strong class="pm-endpoint-name">${escape(item.name)}</strong></div>`;
}
function label(){
 const r=currentRun();
 $("pm-run").textContent=r?`Run ${runIndex+1} of ${runs.length}: ${r.name||"Run"}`:"No runs available";
 const indicator=$("pm-mode-indicator");if(indicator){indicator.setAttribute("aria-label",tracing?(traceKind==="wire"?"G wire active. Click for Q conduit":"Q conduit active. Click for G wire"):"Click to select Q or G measurement mode");const active=tracing&&mode==="measure";indicator.textContent=active?(traceKind==="wire"?"● G ACTIVE — WIRE ROUTE":"● Q ACTIVE — CONDUIT ROUTE"):"○ READY — PRESS Q OR G";indicator.className="pm-mode-indicator "+(active?(traceKind==="wire"?"pm-mode-wire":"pm-mode-conduit"):"pm-mode-idle");}
 const g=conduitSegments[String(r?.id)];$("pm-value").textContent=measured==null?"—":measured.toFixed(3)+" ft";const summary=$("pm-length-summary");if(summary)summary.textContent=(g?`Q conduit: ${g.length.toFixed(3)} ft · `:"")+(measured!=null?`G extra wire: ${measured.toFixed(3)} ft · Wire total: ${((g?.length||0)+measured).toFixed(3)} ft`:"Press Q for conduit or G for extra wire");
 const el=$("pm-endpoints");
 if(el)el.innerHTML=r?`${endpointCard(r.fromCanvasItemId,"FROM")}<span class="pm-endpoint-arrow">→</span>${endpointCard(r.toCanvasItemId,"TO")}`:"";
}
function position(p){const cx=canvas.clientWidth/2,cy=canvas.clientHeight/2,a=transform.rotation*Math.PI/180;let x=(p.x-image.width/2)*transform.scale,y=(p.y-image.height/2)*transform.scale;return {x:cx+transform.x+x*Math.cos(a)-y*Math.sin(a),y:cy+transform.y+x*Math.sin(a)+y*Math.cos(a)};}
function unposition(p){const a=-transform.rotation*Math.PI/180,x=(p.x-canvas.clientWidth/2-transform.x)/transform.scale,y=(p.y-canvas.clientHeight/2-transform.y)/transform.scale;return {x:(x*Math.cos(a)-y*Math.sin(a))+image.width/2,y:(x*Math.sin(a)+y*Math.cos(a))+image.height/2};}
function draw(){
 if(!canvas)return;
 const rect=canvas.getBoundingClientRect(), W=rect.width,H=rect.height;
 const dpr=window.devicePixelRatio||1;
 canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle="#101827";ctx.fillRect(0,0,W,H);
 if(!image)return;
 const a=transform.rotation*Math.PI/180;
 const point=p=>{const x=(p.x-image.width/2)*transform.scale,y=(p.y-image.height/2)*transform.scale;return{x:W/2+transform.x+x*Math.cos(a)-y*Math.sin(a),y:H/2+transform.y+x*Math.sin(a)+y*Math.cos(a)}};
 ctx.save();ctx.translate(W/2+transform.x,H/2+transform.y);ctx.rotate(a);ctx.scale(transform.scale,transform.scale);ctx.drawImage(image,-image.width/2,-image.height/2);ctx.restore();
 const line=(p,q,color,dashed=false)=>{const x=point(p),y=point(q);ctx.beginPath();ctx.setLineDash(dashed?[7,5]:[]);ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.moveTo(x.x,x.y);ctx.lineTo(y.x,y.y);ctx.stroke();ctx.setLineDash([])};
 const dot=(p,color)=>{const x=point(p);ctx.beginPath();ctx.fillStyle=color;ctx.arc(x.x,x.y,5,0,Math.PI*2);ctx.fill()};
 for(let i=1;i<corners.length;i++)line(corners[i-1],corners[i],"#fbbf24");
 if(corners.length===4)line(corners[3],corners[0],"#fbbf24");
 corners.forEach(p=>dot(p,"#fbbf24"));
 const g=conduitSegments[String(currentRun()?.id)];if(g?.points){for(let i=1;i<g.points.length;i++)line(g.points[i-1],g.points[i],"#38bdf8");g.points.forEach(p=>dot(p,"#38bdf8"));}alternatingSegments.forEach(seg=>{const color=seg.kind==="conduit"?"#38bdf8":"#f97316";for(let i=1;i<seg.points.length;i++)line(seg.points[i-1],seg.points[i],color);});const traceColor=traceKind==="conduit"?"#38bdf8":"#f97316";for(let i=1;i<points.length;i++)line(points[i-1],points[i],traceColor);
 if(points.length>=1&&hover&&tracing&&mode==="measure") {
  line(points[points.length-1],hover,traceColor,true);
  if(calibration){try{const p=physical(points[points.length-1]),q=physical(hover),ft=(measured||0)+Math.hypot(p.x-q.x,p.y-q.y);const v=point(hover);ctx.font="bold 13px Arial";const text=ft.toFixed(3)+" ft";const tw=ctx.measureText(text).width;ctx.fillStyle="#101827";ctx.fillRect(v.x+12,v.y-31,tw+16,25);ctx.fillStyle="#4ade80";ctx.fillText(text,v.x+20,v.y-14)}catch(_){}}
 }
 points.forEach(p=>dot(p,traceColor));
}
function fit(){if(!image)return;const rect=canvas.getBoundingClientRect();transform.scale=Math.min(rect.width/image.width,rect.height/image.height)*0.92;transform.x=0;transform.y=0;draw();}
function solve(A,b){for(let i=0;i<8;i++){let k=i;for(let j=i+1;j<8;j++)if(Math.abs(A[j][i])>Math.abs(A[k][i]))k=j;[A[i],A[k]]=[A[k],A[i]];[b[i],b[k]]=[b[k],b[i]];let pivot=A[i][i];if(Math.abs(pivot)<1e-10)throw Error("Invalid reference rectangle");for(let j=i;j<8;j++)A[i][j]/=pivot;b[i]/=pivot;for(let k2=0;k2<8;k2++){if(k2===i)continue;const v=A[k2][i];for(let j=i;j<8;j++)A[k2][j]-=v*A[i][j];b[k2]-=v*b[i]}}return b;}
function calibrate(){const w=Number($("pm-width").value)*($("pm-width-unit")?.value==="in"?1/12:1),h=Number($("pm-height").value)*($("pm-height-unit")?.value==="in"?1/12:1);if(!(w>0&&h>0)||corners.length!==4)return;const targets=[[0,0],[w,0],[w,h],[0,h]],A=[],b=[];corners.forEach((p,i)=>{const [X,Y]=targets[i];A.push([p.x,p.y,1,0,0,0,-X*p.x,-X*p.y]);b.push(X);A.push([0,0,0,p.x,p.y,1,-Y*p.x,-Y*p.y]);b.push(Y)});calibration=solve(A,b);status("Reference calibrated. Press Q to start tracing.");mode="measure";cacheSettings();}
function physical(p){const h=calibration,d=h[6]*p.x+h[7]*p.y+1;if(Math.abs(d)<1e-8)throw Error("Measurement outside calibrated plane");return{x:(h[0]*p.x+h[1]*p.y+h[2])/d,y:(h[3]*p.x+h[4]*p.y+h[5])/d};}
function measure(){
 if(!calibration)return status("Calibrate the reference rectangle first.");
 try{let sum=0;for(let i=1;i<points.length;i++){const a=physical(points[i-1]),b=physical(points[i]);sum+=Math.hypot(b.x-a.x,b.y-a.y)}
 measured=sum;label();rememberRun();status("Click another point, or press "+(traceKind==="conduit"?"Q":"G")+" to finish.");
 }catch(e){measured=null;status(e.message)}
}
function setRun(i){alternatingSegments=[];if(materialsMode){materialsMode=false;if($("pm-materials"))$("pm-materials").style.display="none";}runIndex=Math.max(0,Math.min(runs.length-1,i));restoreRun();cacheSettings();status(points.length?"Restored measured path. Press Q to remeasure.":"Press Q to start tracing this run.");}
function photoMaterialImage(material){
 const catalog=String(material?.CatalogNumber||"").trim();
 const local=catalog?"images/materials/"+encodeURIComponent(catalog)+".png":"";
 const driveId=String(material?.DriveFileID||"").trim();
 const drive=driveId&&typeof getDriveImageUrl==="function"?getDriveImageUrl(driveId,400):"";
 return {src:local||drive||"images/placeholder.png",drive};
}
window.photoMaterialImageError=function photoMaterialImageError(img){
 if(!img||!img.isConnected)return;
 if(img.dataset.fallbackStage==="local"&&img.dataset.driveImage){
  img.dataset.fallbackStage="drive";
  img.src=img.dataset.driveImage;
 }else if(img.dataset.fallbackStage!=="placeholder"){
  img.dataset.fallbackStage="placeholder";
  img.src="images/placeholder.png";
 }else{
  img.onerror=null;
 }
}
function renderPhotoMaterialSummary(){
 const target=$("pm-material-summary"),api=window.photoRunMaterialsAPI,run=currentRun();
 if(!target||!api||!run)return;
 const saved=api.getRun(run.id);
 const fittings=Array.isArray(saved?.fittings)?saved.fittings.filter(m=>Number(m.qty)>0):[];
 const conduit=saved?.conduit;
 const items=conduit?[{...conduit,qty:1},...fittings]:fittings;
 const count=items.reduce((sum,m)=>sum+Number(m.qty||0),0);
 $("pm-summary-count").textContent=items.length+" items · "+count+" qty";
 target.replaceChildren();
 if(!items.length){target.textContent="No materials selected";return;}
 items.forEach(m=>{
  const row=document.createElement("div");row.className="pm-summary-item";
  const photo=photoMaterialImage(m);
  {const img=document.createElement("img");img.src=photo.src;img.alt="";img.dataset.driveImage=photo.drive;img.dataset.fallbackStage=photo.src.startsWith("images/materials/")?"local":photo.drive?"drive":"placeholder";img.onerror=()=>window.photoMaterialImageError(img);row.appendChild(img);}
  const info=document.createElement("div");info.className="pm-summary-info";
  const code=document.createElement("strong");code.textContent=m.CatalogNumber||"Material";
  const desc=document.createElement("small");desc.textContent=m.Description||"";
  info.append(code,desc);
  const qty=document.createElement("b");qty.textContent=Number(m.qty)||1;
  const remove=document.createElement("button");
  remove.type="button";
  remove.className="pm-summary-remove";
  remove.textContent="×";
  remove.title="Remove "+(m.CatalogNumber||"material")+" from this run";
  remove.setAttribute("aria-label",remove.title);
  remove.onclick=()=>preserveMaterialsScroll(async()=>{
   if(m===items[0]&&conduit){
    api.setConduit(run.id,null);
    await showMaterials();
   }else{
    api.setFitting(run.id,m,-Number(m.qty||0));
    await showFittings();
   }
   renderPhotoMaterialSummary();
  });
  row.append(info,qty,remove);target.appendChild(row);
 });
}
function preserveMaterialsScroll(task){
 const side=$("pm-materials");
 const top=side?.scrollTop||0;
 const restore=()=>{
  if(!side?.isConnected)return;
  side.scrollTop=top;
  requestAnimationFrame(()=>{if(side.isConnected)side.scrollTop=top;});
 };
 return Promise.resolve().then(task).finally(restore);
}
async function showMaterials(){
 const api=window.photoRunMaterialsAPI,run=currentRun();
 if(!api||!run)return status("Material sidebar unavailable.");
 materialsMode=true;
 const side=$("pm-materials");side.style.display="flex";
 $("pm-material-title").textContent="Run "+(runIndex+1)+" · Conduit & Fittings";
 $("pm-material-status").textContent="Loading materials…";
 try{
  // listConduits filters strictly by MML NodeType=PIPE and Color=EMT/PVC/LT.
  const conduits=await api.listConduits();
  if(!host||!materialsMode)return;
  const actual=api.getRun(run.id);
  const current=actual?.conduit;
  $("pm-conduit-name").textContent=current?[current.CatalogNumber,current.Description,current.Size].filter(Boolean).join(" · "):"No conduit selected";
  $("pm-conduit-clear").onclick=()=>preserveMaterialsScroll(async()=>{api.setConduit(run.id,null);await showMaterials();});
  ["1","2","all"].forEach(key=>{
   const checkbox=$("pm-conduit-size-"+key);
   if(checkbox)checkbox.onchange=()=>openConduitTable(run.id,conduits);
  });
  openConduitTable(run.id,conduits);
  await showFittings();
  renderPhotoMaterialSummary();
 }catch(e){$("pm-material-status").textContent="Could not load materials: "+e.message;}
}
function closeConduitTable() {
 const target=$("pm-conduit-grid");
 if(target)target.innerHTML="";
}
function openConduitTable(runId,conduits) {
 const target=$("pm-conduit-grid"),api=window.photoRunMaterialsAPI,run=api?.getRun(runId);
 if(!target||!api||!run)return;
 const selected=String(run.conduit?.CatalogNumber||"");
 const enabled=new Set(["1","2","all"].filter(key=>$("pm-conduit-size-"+key)?.checked));
 const families=["EMT","PVC","LT"];
 const groups=new Map();
 conduits.forEach((m,i)=>{
  const size=String(m.Size||"Other size").trim()||"Other size";
  const key=size.replace(/\\s/g,"").replace(/"/g,"");
  if(!(enabled.has(key)||(key!=="1"&&key!=="2"&&enabled.has("all"))))return;
  const family=String(m.Color||"").trim().toUpperCase();
  if(!families.includes(family))return;
  if(!groups.has(size))groups.set(size,new Map());
  const columns=groups.get(size);
  if(!columns.has(family))columns.set(family,[]);
  columns.get(family).push({m,i});
 });
 const sizes=Array.from(groups.keys()).sort((a,b)=>Number(a)-Number(b)||a.localeCompare(b));
 const rows=sizes.map(size=>{
  const columns=groups.get(size);
  const cells=families.map(family=>{
   const entries=columns.get(family)||[];
   const cards=entries.map(({m,i})=>{
    const photo=photoMaterialImage(m),active=String(m.CatalogNumber||"")===selected;
    return `<button type="button" class="pm-conduit-option${active?" selected":""}" data-conduit="${i}" title="${escape(m.Description||"")}"><img src="${escape(photo.src)}" alt="" data-drive-image="${escape(photo.drive)}" data-fallback-stage="${photo.src.startsWith("images/materials/")?"local":photo.drive?"drive":"placeholder"}" onerror="window.photoMaterialImageError(this)"><strong>${escape(m.CatalogNumber||"Conduit")}</strong><span>${escape(m.Description||"")}</span>${active?'<em>Selected</em>':""}</button>`;
   }).join("");
   return `<td><div class="pm-conduit-items">${cards||'<span class="pm-conduit-empty">—</span>'}</div></td>`;
  }).join("");
  return `<tr><th scope="row">${escape(size)}</th>${cells}</tr>`;
 }).join("");
 target.innerHTML=`<table class="pm-conduit-table pm-conduit-matrix"><thead><tr><th>SIZE</th><th>EMT</th><th>PVC</th><th>LT</th></tr></thead><tbody>${rows||'<tr><td colspan="4">No conduit matches these size filters.</td></tr>'}</tbody></table>`;
 target.querySelectorAll("[data-conduit]").forEach(btn=>btn.onclick=async()=>{
  const item=conduits[Number(btn.dataset.conduit)];
  if(!item)return;
  await preserveMaterialsScroll(async()=>{api.setConduit(runId,item);await showMaterials();});
 });
}
const nippleDropdownSelections=Object.create(null);
function openNippleSelectionModal(materials,runId){
 const api=window.photoRunMaterialsAPI;
 if(!api||!materials.length)return;
 document.getElementById("pm-nipple-modal")?.remove();
 const overlay=document.createElement("div");
 overlay.id="pm-nipple-modal";
 overlay.className="pm-nipple-modal-overlay";
 overlay.innerHTML='<div class="pm-nipple-modal-dialog" role="dialog" aria-modal="true" aria-label="Choose nipple lengths"><div class="pm-nipple-modal-head"><strong>Choose Nipple Lengths</strong><button type="button" class="pm-nipple-modal-close" aria-label="Close">×</button></div><p>Click a material to add 1. Click again to increase quantity.</p><div class="pm-nipple-modal-list"></div><div class="pm-nipple-modal-foot"><button type="button" class="pm-nipple-modal-done">Done</button></div></div>';
 document.body.appendChild(overlay);
 const list=overlay.querySelector(".pm-nipple-modal-list");
 let changed=false;
 const close=()=>{
  document.removeEventListener("keydown",onKey);
  overlay.remove();
  if(changed)preserveMaterialsScroll(async()=>{await showFittings();renderPhotoMaterialSummary();});
 };
 const onKey=e=>{if(e.key==="Escape"){e.stopPropagation();close();}};
 document.addEventListener("keydown",onKey,true);
 overlay.querySelector(".pm-nipple-modal-close").onclick=close;
 overlay.querySelector(".pm-nipple-modal-done").onclick=close;
 overlay.onclick=e=>{if(e.target===overlay)close();};
 materials.forEach(material=>{
  const photo=photoMaterialImage(material);
  const card=document.createElement("button");
  card.type="button";
  card.className="pm-nipple-choice";
  const img=document.createElement("img");
  img.src=photo.src;img.alt="";
  img.dataset.driveImage=photo.drive;
  img.dataset.fallbackStage=photo.src.startsWith("images/materials/")?"local":photo.drive?"drive":"placeholder";
  img.onerror=()=>window.photoMaterialImageError(img);
  const info=document.createElement("span");info.className="pm-nipple-choice-info";
  const name=document.createElement("strong");name.textContent=material.CatalogNumber||"Nipple";
  const desc=document.createElement("small");desc.textContent=material.Description||"";
  const count=document.createElement("b");
  const update=()=>{count.textContent="Qty "+api.getFittingQty(runId,material);};
  update();info.append(name,desc);card.append(img,info,count);
  card.onclick=()=>{
   api.setFitting(runId,material,1);
   changed=true;update();renderPhotoMaterialSummary();
  };
  list.appendChild(card);
 });
}
async function showFittings(){
 const api=window.photoRunMaterialsAPI,run=currentRun();
 if(!api||!run)return;
 const target=$("pm-fitting-grid");
 target.textContent="Loading fittings…";
 const matrix=await api.fittingMatrix(run.id,fittingSizes);
 if(!host||!materialsMode||run.id!==currentRun()?.id)return;
 materialCatalog=[];
 const headers='<th class="pm-matrix-corner">SYSTEM</th>'+matrix.columns.map(c=>`<th>${escape(c.label)}</th>`).join("");
 const rows=matrix.rows.map((row,ri)=>{
  const cells=matrix.columns.map((col,ci)=>{
   const m=matrix.cells[ri]?.[ci];
   const variants=col.key==="NIPPLE"?(matrix.nippleOptions?.[ri]||[]):[];
   if(!m&&!variants.length)return '<td class="pm-matrix-empty">—</td>';
   const selected=m||variants[0];
   const index=materialCatalog.push(selected)-1;
   const qty=api.getFittingQty(run.id,selected),photo=photoMaterialImage(selected);
   const nippleButton=variants.length?`<button type="button" class="pm-nipple-open" data-nipple-row="${ri}" title="Choose nipple lengths">Choose lengths ▸</button>`:"";
   return `<td><div class="pm-matrix-item" title="${escape(selected.Description||"")}"><button type="button" class="pm-matrix-image pm-matrix-add" data-fit="${index}" data-delta="1" ${variants.length?`data-nipple-row="${ri}"`:""} title="${variants.length?"Choose nipple lengths":"Add one "+escape(selected.CatalogNumber||"fitting")}"><img src="${escape(photo.src)}" alt="" data-drive-image="${escape(photo.drive)}" data-fallback-stage="${photo.src.startsWith("images/materials/")?"local":photo.drive?"drive":"placeholder"}" onerror="window.photoMaterialImageError(this)"></button><div class="pm-matrix-code">${escape(selected.CatalogNumber||selected.Description||"Fitting")}</div>${nippleButton}<div class="pm-matrix-qty"><button data-fit="${index}" data-delta="-1">−</button><strong>${qty}</strong><button data-fit="${index}" data-delta="1">+</button></div></div></td>`;
  }).join("");
  return `<tr><th scope="row">${escape(row.label)}</th>${cells}</tr>`;
 }).join("");
 target.innerHTML=`<table class="pm-matrix"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
 target.querySelectorAll(".pm-nipple-open, .pm-matrix-image[data-nipple-row]").forEach(btn=>{
  btn.onclick=()=>openNippleSelectionModal(matrix.nippleOptions?.[Number(btn.dataset.nippleRow)]||[],run.id);
 });
  target.querySelectorAll("[data-fit]:not([data-nipple-row])").forEach(btn=>btn.onclick=()=>{
  if(btn.hasAttribute("data-nipple-row"))return;
  const material=materialCatalog[Number(btn.dataset.fit)];if(!material)return;
  preserveMaterialsScroll(async()=>{
   api.setFitting(run.id,material,Number(btn.dataset.delta));
   await showFittings();
   renderPhotoMaterialSummary();
  });
 });
 $("pm-material-status").textContent="Changes save directly to Material Runs.";
 renderPhotoMaterialSummary();
}
function closeMaterials(){closeConduitTable();
 materialsMode=false;$("pm-materials").style.display="none";
 if(runIndex<runs.length-1){setRun(runIndex+1);status("Materials saved. Press Q for next conduit route.");}
 else status("Materials saved. All runs complete.");
 requestAnimationFrame(draw);
}
function finishMaterialSelection(){
 if(!host)return;
 host.style.display="flex";
 if(runIndex<runs.length-1){setRun(runIndex+1);status("Conduit and fittings updated. Press Q to start the next conduit route.");}
 else{tracing=false;label();draw();status("Conduit and fittings updated. All runs measured.");}
 requestAnimationFrame(draw);
}
window.photoMeasureMaterialsDone=finishMaterialSelection;
function confirm(){
 if(!currentRun()||points.length<2||!Number.isFinite(measured))return status("Add at least two points.");
 const run=currentRun(),actual=typeof window.findRun==="function"?window.findRun(run.id):null;
 if(!actual)return status("Run no longer exists; reopen the tool.");
 // Photo measurements represent the wire route, not the conduit footage.
 // Freeze the current conduit footage before changing the wire length,
 // otherwise getRunConduitLength() implicitly follows run.length.
 if(actual.conduitLength===""||actual.conduitLength===null||actual.conduitLength===undefined){
  actual.conduitLength=Math.max(0,Number(actual.length)||0);
 }
 const g=conduitSegments[String(run.id)];if(g)actual.conduitLength=Math.ceil(Math.max(0,g.length));actual.length=Math.ceil(Math.max(0,(g?.length||0)+measured));
 try{window.captureRunsHistory?.("Photo-measured multipoint run");window.saveRunsDraft?.();window.refreshRunsBOM?.();window.renderRunsModal?.();}
 catch(e){status("Could not refresh Runs: "+e.message);return}
 traceKind="wire";rememberRun();
 status("Saved wire: "+actual.length+" ft"+(g?", conduit: "+actual.conduitLength+" ft":", conduit unchanged")+".");
 showMaterials();
}
// Preserve every Q/G segment until the run is finished.
let alternatingSegments=[];
function saveActiveTraceSegment(){
 if(points.length<2||!Number.isFinite(measured))return false;
 alternatingSegments.push({
  kind:traceKind,
  points:points.map(p=>({...p})),
  length:measured
 });
 return true;
}
function completeAlternatingTrace(){
 const run=currentRun(),actual=typeof window.findRun==="function"?window.findRun(run?.id):null;
 if(!actual)return status("Run not found.");
 const conduit=alternatingSegments.filter(s=>s.kind==="conduit");
 const wire=alternatingSegments.filter(s=>s.kind==="wire");
 const conduitLength=conduit.reduce((n,s)=>n+s.length,0);
 const extraWire=wire.reduce((n,s)=>n+s.length,0);
 if(!conduit.length&&!wire.length)return status("Click at least two points.");
 actual.conduitLength=Math.ceil(Math.max(0,conduitLength));
 actual.length=Math.ceil(Math.max(0,conduitLength+extraWire));
 conduitSegments[String(run.id)]={
  points:conduit.flatMap((s,i)=>i?s.points.slice(1):s.points),
  length:conduitLength,
  segments:conduit.map(s=>s.points)
 };
 runPaths[String(run.id)]={
  points:wire.flatMap((s,i)=>i?s.points.slice(1):s.points),
  length:extraWire,
  segments:wire.map(s=>s.points)
 };
 try{
  window.captureRunsHistory?.("Photo-measured Q/G route");
  window.saveRunsDraft?.();
  window.refreshRunsBOM?.();
  window.renderRunsModal?.();
 }catch(e){status("Could not refresh Runs: "+e.message);return;}
 tracing=false;points=[];hover=null;measured=null;traceKind="wire";
 alternatingSegments=[];cacheSettings();label();draw();
 status("Saved conduit: "+actual.conduitLength+" ft, wire: "+actual.length+" ft.");
 showMaterials();
}
function toggleTrace(kind="wire"){
 if(!image)return status("Upload a photo first.");
 if(!calibration)return status("Calibrate the reference rectangle first.");
 if(materialsMode)return;
 if(tracing){
  if(points.length<2)return status("Click at least two points.");
  const lastPoint={...points[points.length-1]};
  if(!saveActiveTraceSegment())return;
  if(traceKind===kind){
   completeAlternatingTrace();
   return;
  }
  // The last point of Q becomes the first point of G (and vice versa).
  traceKind=kind;
  points=[lastPoint];hover=null;measured=0;tracing=true;
  label();draw();cacheSettings();
  status((kind==="conduit"?"Q conduit":"G extra wire")+" active. Continue from the shared endpoint.");
  return;
 }
 alternatingSegments=[];
 points=[];hover=null;measured=null;traceKind=kind;tracing=true;label();draw();
 status((kind==="conduit"?"BLUE Q conduit":"ORANGE G additional wire")+" tracing: click points, then press "+(kind==="conduit"?"Q":"G")+" to finish.");
}
function open(){if(host){host.style.display="flex";return}runs=typeof window.getProjectRuns==="function"?window.getProjectRuns().map(r=>({id:r.id,name:r.name,fromCanvasItemId:r.fromCanvasItemId,toCanvasItemId:r.toCanvasItemId})):[];if(!runs.length){alert("Add a Material Run first.");return}host=document.createElement("div");host.id="photoMeasureModal";host.style.cssText="position:fixed;inset:0;z-index:2147483000;background:#0b1220;color:#e5edf8;display:flex;flex-direction:column;font:22px Arial,sans-serif";
host.innerHTML=`<style>
#photoMeasureModal *{box-sizing:border-box}
#photoMeasureModal button{background:#243449;color:#e5edf8;border:1px solid #3a4b62;border-radius:5px;padding:9px 11px;cursor:pointer;font-size:20px}
#photoMeasureModal button:hover{background:#344b67}
#photoMeasureModal button.primary{background:#2478bc;border-color:#3894d4;font-weight:700}
#photoMeasureModal input[type=number]{width:100%;padding:9px;background:#0e1726;border:1px solid #3a4b62;border-radius:5px;color:white}
#photoMeasureModal .pm-group{border-bottom:1px solid #314156;padding:16px 16px 18px;display:flex;flex-direction:column;gap:10px}
#photoMeasureModal .pm-heading{font-size:18px;letter-spacing:1.5px;color:#9db0c8;font-weight:700}
#photoMeasureModal .pm-side{width:400px;flex:0 0 400px;overflow-y:auto;background:#172236;border-right:1px solid #334155}
#photoMeasureModal .pm-row{display:flex;gap:8px}
#photoMeasureModal .pm-materials{display:none;width:min(1200px, 55vw);flex:0 0 min(1200px, 55vw);height:100%;min-height:0;align-self:stretch;flex-direction:column;overflow-y:auto;background:#172236;border-left:1px solid #334155}
#photoMeasureModal .pm-materials .pm-group{padding:14px}
#photoMeasureModal .pm-fitting-toolbar{display:flex;align-items:flex-start;gap:16px;margin:8px 0 12px}
#photoMeasureModal .pm-fitting-toolbar>.pm-size-controls{flex:0 0 auto;align-self:flex-start}
#photoMeasureModal .pm-fitting-toolbar>.pm-summary-group{flex:1;min-width:0;padding:0;border:0}
#photoMeasureModal .pm-fitting-toolbar .pm-summary-list{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}
#photoMeasureModal .pm-fitting-toolbar .pm-summary-item{flex:0 1 165px;padding:4px}
#photoMeasureModal .pm-fitting-toolbar .pm-summary-item img{width:30px;height:30px}
#photoMeasureModal .pm-fitting-toolbar .pm-summary-info strong{font-size:11px}
#photoMeasureModal .pm-fitting-toolbar .pm-summary-info small{font-size:9px}
#photoMeasureModal .pm-fitting-toolbar .pm-summary-item>b{font-size:13px;padding:3px 5px}
@media(max-width:700px){#photoMeasureModal .pm-fitting-toolbar{flex-direction:column}}
#photoMeasureModal .pm-summary-group{border-top:1px solid #334155}
#photoMeasureModal .pm-summary-heading{display:flex;justify-content:space-between;align-items:center;gap:10px}
#photoMeasureModal .pm-summary-heading small{color:#93a7c1}
#photoMeasureModal .pm-summary-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:8px;margin-top:10px}
#photoMeasureModal .pm-summary-item{display:flex;align-items:center;gap:8px;min-width:0;background:#0b1728;border:1px solid #256083;border-radius:5px;padding:7px}
#photoMeasureModal .pm-summary-item img{width:42px;height:42px;object-fit:contain;background:white;border-radius:3px;flex:none}
#photoMeasureModal .pm-summary-info{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}
#photoMeasureModal .pm-summary-info strong{font-size:13px;overflow-wrap:anywhere}
#photoMeasureModal .pm-summary-info small{font-size:11px;color:#a9c3db;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#photoMeasureModal .pm-summary-item>b{background:#0b536b;color:#8fe5ff;padding:5px 8px;border-radius:4px;font-size:18px}
#photoMeasureModal .pm-summary-item{position:relative;padding-right:22px}
#photoMeasureModal .pm-summary-remove{position:absolute;top:2px;right:2px;width:17px;height:17px;padding:0;border:0;border-radius:3px;background:#762d3a;color:#fff;font-size:15px;line-height:15px;cursor:pointer}
#photoMeasureModal .pm-summary-remove:hover{background:#dc3545}


#photoMeasureModal #pm-conduit{width:100%;padding:10px;background:#0e1726;color:white;border:1px solid #4b617d;font-size:16px}
#photoMeasureModal #pm-calipreset{width:100%;background:#24364d;color:#f1f5f9;border:1px solid #536b88;border-radius:5px;padding:7px;font-weight:700}\n#photoMeasureModal .pm-unit-field{display:flex;gap:6px;align-items:stretch}
#photoMeasureModal .pm-unit-field input{min-width:0;flex:1}
#photoMeasureModal .pm-unit-field select{width:65px;flex:none;background:#24364d;color:#f1f5f9;border:1px solid #536b88;border-radius:5px;padding:4px;font-weight:700}
#photoMeasureModal .pm-size-chips{display:flex;gap:10px;padding:12px 0;align-items:center}
#photoMeasureModal .pm-size-chip{display:inline-flex;cursor:pointer;align-items:center;justify-content:center;min-width:76px;min-height:43px;border:1px solid #526b89;border-radius:9px;background:#22334b;color:#c8d6e8;font-weight:800;font-size:17px;transition:background .15s,border-color .15s}
#photoMeasureModal .pm-size-chip input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
#photoMeasureModal .pm-size-chip:has(input:checked){background:#2d7fbd;border-color:#8bd4ff;color:#fff;box-shadow:0 0 0 1px #8bd4ff66}
#photoMeasureModal .pm-size-chip:has(input:focus-visible){outline:3px solid #c4e8ff;outline-offset:2px}
#photoMeasureModal .pm-size-chip:hover{border-color:#9ccdf5;background:#355372}
#photoMeasureModal .pm-size-controls,#photoMeasureModal .pm-conduit-sizes{display:flex;gap:16px;align-items:center;padding:8px 0;font-size:14px}\n#photoMeasureModal .pm-conduit-sizes{padding:8px 0;flex-wrap:wrap}\n#photoMeasureModal .pm-conduit-overlay{position:absolute;inset:0;z-index:25;background:#050b15b8;display:flex;align-items:center;justify-content:center;padding:24px}
#photoMeasureModal .pm-conduit-dialog{width:min(1180px,96%);max-height:94%;display:flex;flex-direction:column;background:#111c30;border:1px solid #48607c;border-radius:8px;overflow:hidden}
#photoMeasureModal .pm-conduit-head,#photoMeasureModal .pm-conduit-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;gap:12px}
#photoMeasureModal .pm-conduit-scroll{overflow:auto;flex:1;min-height:0}
#photoMeasureModal .pm-conduit-table{border-collapse:collapse;width:100%;table-layout:fixed}
#photoMeasureModal .pm-conduit-table th,#photoMeasureModal .pm-conduit-table td{border:1px solid #334155;padding:6px;vertical-align:top}
#photoMeasureModal .pm-conduit-table th{background:#1b3049;font-size:12px}
#photoMeasureModal .pm-conduit-table tbody th{width:90px}
#photoMeasureModal .pm-conduit-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(115px,1fr));gap:6px;min-width:0}\n#photoMeasureModal .pm-conduit-cell{min-width:0}\n#photoMeasureModal .pm-conduit-scroll{max-height:350px;overflow:auto;border:1px solid #334155}\n#photoMeasureModal .pm-conduit-table{table-layout:auto}\n#photoMeasureModal .pm-conduit-table tbody th{width:55px;min-width:55px}\n#photoMeasureModal .pm-conduit-matrix{width:100%;table-layout:fixed}
#photoMeasureModal .pm-conduit-matrix thead th:first-child,#photoMeasureModal .pm-conduit-matrix tbody th{width:48px}
#photoMeasureModal .pm-conduit-matrix td{width:calc((100% - 48px)/3)}
#photoMeasureModal .pm-conduit-matrix tbody th{font-size:24pt;font-weight:700;line-height:1.15;text-align:center;vertical-align:middle}
#photoMeasureModal .pm-conduit-matrix .pm-conduit-items{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start}
#photoMeasureModal .pm-conduit-matrix .pm-conduit-option{width:110px;max-width:100%}
#photoMeasureModal .pm-conduit-empty{color:#8495ad;display:block;text-align:center;padding:20px 0}
#photoMeasureModal .pm-conduit-option{width:100%;display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px;border:1px solid #344862;border-radius:5px;background:#1a2940;color:#e2e8f0;cursor:pointer}
#photoMeasureModal .pm-conduit-option:hover,#photoMeasureModal .pm-conduit-option.selected{border-color:#60a5fa;background:#25415e}
#photoMeasureModal .pm-conduit-option img{width:100%;height:55px;object-fit:contain;background:#eef2f7;border-radius:3px}
#photoMeasureModal .pm-conduit-option strong{font-size:12px;overflow-wrap:anywhere}
#photoMeasureModal .pm-conduit-option span{font-size:11px;max-height:42px;overflow:hidden}
#photoMeasureModal .pm-conduit-option em{color:#6ee7b7;font-size:11px}
#photoMeasureModal .pm-fitting-grid{display:block;overflow:auto;max-width:100%;min-height:0;border:1px solid #334155}
#photoMeasureModal .pm-matrix{border-collapse:separate;border-spacing:0;width:100%;min-width:920px;table-layout:fixed;font-size:12px}
#photoMeasureModal .pm-matrix th,#photoMeasureModal .pm-matrix td{border-right:1px solid #334155;border-bottom:1px solid #334155;padding:5px;vertical-align:middle;text-align:center}
#photoMeasureModal .pm-matrix thead th{position:sticky;top:0;z-index:2;background:#183047;color:#c4e5fa;text-transform:uppercase;font-size:11px}
#photoMeasureModal .pm-matrix thead th:first-child{left:0;z-index:4}
#photoMeasureModal .pm-matrix tbody th{position:sticky;left:0;z-index:1;background:#17263b;color:#dbeafe;text-align:left;width:92px}
#photoMeasureModal .pm-matrix .pm-matrix-corner{width:92px}
#photoMeasureModal .pm-matrix-empty{color:#8ca1b7}
#photoMeasureModal .pm-matrix-item{display:flex;flex-direction:column;gap:3px;min-width:0}
#photoMeasureModal .pm-nipple-open{width:100%;background:#254a6b;border:1px solid #5d91bd;border-radius:3px;color:#fff;font-size:10px;cursor:pointer;padding:3px 1px}
.pm-nipple-modal-overlay{position:fixed;inset:0;z-index:2147483500;background:#000a;display:flex;align-items:center;justify-content:center;padding:20px}
.pm-nipple-modal-dialog{width:min(780px,96vw);max-height:85vh;display:flex;flex-direction:column;gap:12px;background:#152238;color:#edf5ff;border:1px solid #6384ab;border-radius:9px;padding:18px;box-shadow:0 18px 60px #000b}
.pm-nipple-modal-head{display:flex;justify-content:space-between;align-items:center;font-size:19px}
.pm-nipple-modal-head button{background:#823044;color:white;border:0;border-radius:4px;font-size:20px;cursor:pointer}
.pm-nipple-modal-dialog p{margin:0;color:#b8c9df;font-size:13px}
.pm-nipple-modal-list{overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px}
.pm-nipple-choice{display:flex;align-items:center;gap:9px;text-align:left;padding:9px;background:#20334d;border:1px solid #496784;border-radius:6px;color:#fff;cursor:pointer;min-width:0}
.pm-nipple-choice:hover{border-color:#74c7ff;background:#294a68}
.pm-nipple-choice img{width:48px;height:48px;object-fit:contain;background:white;border-radius:3px;flex:none}
.pm-nipple-choice-info{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
.pm-nipple-choice-info strong{font-size:14px;overflow-wrap:anywhere}
.pm-nipple-choice-info small{font-size:12px;color:#c0d0e3}
.pm-nipple-choice>b{font-size:12px;white-space:nowrap;color:#91e4ff}
.pm-nipple-modal-foot{display:flex;justify-content:flex-end}
.pm-nipple-modal-done{background:#277fbd;color:white;border:0;border-radius:5px;padding:9px 24px;cursor:pointer}
#photoMeasureModal .pm-nipple-dropdown-host{position:relative}
#photoMeasureModal .pm-nipple-dropdown-host:has(.pm-nipple-select:focus-within){z-index:20}
#photoMeasureModal .pm-nipple-select[size]:not([size="1"]){position:fixed;left:var(--pm-nipple-left,50%);top:var(--pm-nipple-top,30%);width:360px;max-width:calc(100vw - 20px);z-index:2147483000;box-shadow:0 8px 22px #0009;font-size:10pt;line-height:1.45;padding:6px}
#photoMeasureModal .pm-nipple-select{width:100%;min-width:0;background:#24364d;color:#fff;border:1px solid #54718e;border-radius:4px;font-size:10px;padding:3px 1px;cursor:pointer}
#photoMeasureModal .pm-nipple-popover{display:none;position:fixed;z-index:2147483005;width:min(490px,70vw);max-height:330px;overflow:auto;background:#14243a;border:1px solid #76a9df;border-radius:8px;box-shadow:0 15px 35px #000b;padding:10px;text-align:left}
#photoMeasureModal .pm-nipple-popover>strong{display:block;font-size:13px;margin-bottom:8px}
#photoMeasureModal .pm-nipple-variants{display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:8px}
#photoMeasureModal .pm-nipple-card{background:#1d304a;border:1px solid #405977;border-radius:6px;padding:5px}
#photoMeasureModal .pm-nipple-card>button{display:flex;flex-direction:column;align-items:center;width:100%;gap:3px;padding:5px;font-size:11px}
#photoMeasureModal .pm-nipple-card img{height:48px;max-width:100%;object-fit:contain;background:#fff}
#photoMeasureModal .pm-nipple-card span{font-size:10px;max-height:42px;overflow:hidden}

#photoMeasureModal .pm-matrix-image{height:55px;display:flex;align-items:center;justify-content:center}
#photoMeasureModal .pm-matrix-add{width:100%;border:0;background:transparent;padding:0;cursor:pointer;border-radius:4px}\n#photoMeasureModal .pm-matrix-add:hover{outline:2px solid #60a5fa;background:#243d5b}\n#photoMeasureModal .pm-matrix-add:focus-visible{outline:2px solid #93c5fd}\n#photoMeasureModal .pm-matrix-image img{max-width:100%;height:55px;object-fit:contain;border-radius:3px;background:#e9eef3}
#photoMeasureModal .pm-matrix-code{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}
#photoMeasureModal .pm-matrix-qty{display:flex;align-items:center;justify-content:center;gap:3px}
#photoMeasureModal .pm-matrix-qty button{padding:3px 7px;min-width:26px}
#photoMeasureModal .pm-matrix-qty strong{min-width:16px}
#photoMeasureModal .pm-endpoints{display:flex;align-items:stretch;gap:6px}
#photoMeasureModal .pm-endpoint{flex:1;min-width:0;border:1px solid #354b65;border-radius:5px;padding:8px;display:flex;align-items:center;gap:8px}
#photoMeasureModal .pm-endpoint-role{font-size:12px;color:#8fa5c1;font-weight:700}
#photoMeasureModal .pm-endpoint-name{font-size:14px;overflow-wrap:anywhere;min-width:0}
#photoMeasureModal .pm-endpoint-arrow{align-self:center;font-size:22px;color:#74bdf2}
#photoMeasureModal .pm-endpoint img{flex-shrink:0}

#photoMeasureModal .pm-row button{flex:1}
#photoMeasureModal .pm-side label{font-size:20px;color:#bdcce0;display:block}
#photoMeasureModal .pm-side label input{margin-top:6px}
#photoMeasureModal .pm-mode-indicator{width:100%;cursor:pointer;line-height:1.3;padding:13px 12px;border-radius:8px;text-align:center;font-size:19px;font-weight:800;letter-spacing:.6px;border:2px solid #52627b}
#photoMeasureModal .pm-mode-idle{background:#263246;color:#c4d0e0}
#photoMeasureModal .pm-mode-conduit{background:#083b59;color:#7dd3fc;border-color:#38bdf8}
#photoMeasureModal .pm-mode-wire{background:#67300c;color:#fed7aa;border-color:#f97316;animation:pm-wire-pulse 1.2s ease-in-out infinite alternate}
@keyframes pm-wire-pulse{from{box-shadow:0 0 0 0 #f9731640}to{box-shadow:0 0 0 6px #f9731618}}
#photoMeasureModal #pm-value{font-size:38px;font-weight:700;color:#4ade80}
#photoMeasureModal #pm-status{font-size:20px;line-height:1.5;color:#b6c7db;white-space:normal}
#photoMeasureModal .pm-canvas{flex:1;min-width:0;position:relative;background:#101827}
@media(max-width:700px){#photoMeasureModal .pm-side{width:310px;flex-basis:310px}}
</style>
<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 17px;background:#111a2a;border-bottom:1px solid #334155">
 <strong style="font-size:24px">▣ Photo Measuring Tool</strong><button id="pm-close">✕ Close</button>
</div>
<div style="display:flex;flex:1;min-height:0">
 <aside class="pm-side">
  <div class="pm-group"><span class="pm-heading">PHOTO</span><input id="pm-file" type="file" accept="image/*"><div class="pm-row"><button id="pm-fit">Fit Image</button><button id="pm-left">↶ 90°</button><button id="pm-right">90° ↷</button></div></div>
  <div class="pm-group"><span class="pm-heading">CALIBRATION</span><label>Reference preset <select id="pm-calipreset" aria-label="Calibration preset"><option value="">Loading presets...</option></select></label><label>Reference width <span class="pm-unit-field"><input id="pm-width" type="number" value="1.3333" step=".001" min=".001"><select id="pm-width-unit" aria-label="Width unit"><option value="ft">ft</option><option value="in">in</option></select></span></label><label>Reference height <span class="pm-unit-field"><input id="pm-height" type="number" value="2.125" step=".001" min=".001"><select id="pm-height-unit" aria-label="Height unit"><option value="ft">ft</option><option value="in">in</option></select></span></label><button id="pm-cal">Set Reference Rectangle</button><span style="font-size:19px;color:#93a7c1">Click 4 corners clockwise, starting at the top-left.</span></div>
  <div class="pm-group"><span class="pm-heading">ACTIVE MATERIAL RUN</span><strong id="pm-run" style="line-height:1.5"></strong><div id="pm-endpoints" class="pm-endpoints"></div><span class="pm-heading">MEASUREMENT MODE</span><button type="button" id="pm-mode-indicator" class="pm-mode-indicator pm-mode-idle" title="Click to switch between Q conduit and G wire routes">○ READY — PRESS Q OR G</button><span class="pm-heading">MEASURED LENGTH</span><span id="pm-value">—</span><span id="pm-length-summary" style="font-size:16px;color:#9bc9ee"></span><button id="pm-confirm" class="primary">Finish & Next · G / Enter</button><div class="pm-row"><button id="pm-prev">← Previous</button><button id="pm-skip">Skip →</button></div><button id="pm-remeasure">Remeasure Current Run</button><button id="pm-edit-materials">Edit Conduit & Fittings</button></div>
  <div class="pm-group"><span class="pm-heading">COMMAND / STATUS</span><div id="pm-status">Upload a photo to begin.</div><span style="font-size:19px;color:#93a7c1">Space + drag: pan · Wheel: zoom · Q: conduit to gutter (blue) · G: extra wire (orange) · Same key: finish</span></div>
 </aside>
 <main class="pm-canvas"><canvas id="pm-canvas" style="width:100%;height:100%;display:block;touch-action:none;cursor:crosshair"></canvas></main><aside id="pm-materials" class="pm-materials"><div class="pm-group"><span class="pm-heading">MATERIALS EDITOR</span><strong id="pm-material-title"></strong><button id="pm-material-done" class="primary">Done · Next Run →</button><span id="pm-material-status" style="font-size:14px;color:#a9c3db"></span></div><div class="pm-group"><span class="pm-heading">CONDUIT</span><div id="pm-conduit-name" style="font-size:14px;overflow-wrap:anywhere;margin-bottom:8px"></div><div class="pm-conduit-sizes"><label><input type="checkbox" id="pm-conduit-size-1" checked> 1&quot;</label><label><input type="checkbox" id="pm-conduit-size-2" checked> 2&quot;</label><label><input type="checkbox" id="pm-conduit-size-all"> Other sizes</label></div><div id="pm-conduit-grid" class="pm-conduit-scroll"></div><button type="button" id="pm-conduit-clear">Clear conduit</button></div><div class="pm-group"><span class="pm-heading">FITTINGS</span><div class="pm-fitting-toolbar"><div class="pm-size-controls pm-size-chips" role="group" aria-label="Fittings size"><label class="pm-size-chip"><input type="checkbox" id="pm-size-1" checked> <span>1&quot;</span></label><label class="pm-size-chip"><input type="checkbox" id="pm-size-2"> <span>2&quot;</span></label></div><div class="pm-summary-group"><div class="pm-summary-heading"><span class="pm-heading">MATERIAL SUMMARY</span><small id="pm-summary-count">0 items</small></div><div id="pm-material-summary" class="pm-summary-list"></div></div></div><div id="pm-fitting-grid" class="pm-fitting-grid"></div></aside>
</div>`;document.body.appendChild(host);canvas=$("pm-canvas");ctx=canvas.getContext("2d");$("pm-close").onclick=()=>{closeConduitTable();materialsMode=false;host.remove();host=null;image=null;if(imageURL){URL.revokeObjectURL(imageURL);imageURL=null;}};$("pm-file").onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 corners=[];calibration=null;runPaths={};conduitSegments={};alternatingSegments=[];runIndex=0;cacheSettings();loadPhotoBlob(f,f.name);
 try{await cachePhoto(f);status("Photo attached to local cache for this project. Set the reference rectangle.");}
 catch(err){console.warn("Photo cache unavailable",err);status("Photo loaded, but local cache failed: "+err.message);}
};$("pm-cal").onclick=()=>{mode="calibrate";corners=[];calibration=null;points=[];tracing=false;measured=null;cacheSettings();status("Click reference corners in order: top-left, top-right, bottom-right, bottom-left.");draw()};$("pm-fit").onclick=fit;$("pm-left").onclick=()=>{transform.rotation-=90;draw();cacheSettings()};$("pm-right").onclick=()=>{transform.rotation+=90;draw();cacheSettings()};$("pm-prev").onclick=()=>setRun(runIndex-1);$("pm-skip").onclick=()=>setRun(runIndex+1);$("pm-remeasure").onclick=()=>{alternatingSegments=[];points=[];hover=null;measured=null;tracing=false;delete runPaths[String(currentRun()?.id)];delete conduitSegments[String(currentRun()?.id)];traceKind="wire";cacheSettings();mode="measure";label();draw();status("Press Q to start the conduit trace.")};$("pm-mode-indicator").onclick=()=>toggleTrace(tracing&&traceKind==="conduit"?"wire":tracing&&traceKind==="wire"?"conduit":"conduit");$("pm-confirm").onclick=()=>{if(tracing)toggleTrace(traceKind);else confirm();};$("pm-material-done").onclick=closeMaterials;["1","2"].forEach(size=>{$("pm-size-"+size).onchange=()=>{const other=size==="1"?"2":"1";$("pm-size-"+size).checked=true;$("pm-size-"+other).checked=false;fittingSizes=[size+'"'];showFittings();};});$("pm-edit-materials").onclick=showMaterials;$("pm-width").onchange=()=>{if(corners.length===4)try{calibrate()}catch(e){status(e.message)}cacheSettings()};$("pm-height").onchange=$("pm-width").onchange;["pm-width-unit","pm-height-unit"].forEach(id=>{$(id).onchange=$("pm-width").onchange;});canvas.onpointerdown=e=>{if(!image)return;const p={x:e.offsetX,y:e.offsetY};if(pan||e.button===1){drag={x:p.x,y:p.y,tx:transform.x,ty:transform.y};canvas.setPointerCapture(e.pointerId);return}const q=unposition(p);if(mode==="calibrate"){if(corners.length===4)corners=[];corners.push(q);if(corners.length===4)try{calibrate()}catch(err){status(err.message)}else status("Corner "+corners.length+"/4 selected.");}else{if(!tracing){status("Press Q for conduit or G for extra wire.");return;}points.push(q);measure();rememberRun();}draw()};canvas.onpointermove=e=>{if(!drag){if(image&&points.length>=1&&tracing&&mode==="measure"){hover=unposition({x:e.offsetX,y:e.offsetY});draw()}return;}const x=e.offsetX,y=e.offsetY;transform.x=drag.tx+x-drag.x;transform.y=drag.ty+y-drag.y;draw();return};canvas.onpointerup=()=>{drag=null};canvas.onwheel=e=>{e.preventDefault();transform.scale=Math.max(0.01,Math.min(100,transform.scale*(e.deltaY<0?1.1:1/1.1)));draw()};restoreSettings();restoreRun();loadCalibrationPresets();requestAnimationFrame(draw);
 readCachedPhoto().then(entry=>{
  if(!host||image||!entry?.blob)return;
  loadPhotoBlob(entry.blob,entry.name||"cached photo");
  status("Restored cached project photo.");
 }).catch(err=>{console.warn("Photo cache read failed",err);});
}
document.addEventListener("keydown",e=>{
 if(!host||e.key!=="Escape")return;
 e.preventDefault();e.stopImmediatePropagation();
 if(tracing||mode==="calibrate"){
  tracing=false;hover=null;points=[];measured=null;
  if(mode==="calibrate"){mode="measure";corners=[];}
  restoreRun();status("Measurement canceled. Press Q to start again.");
  return;
 }
 // Close the photo tool and its parent Runs workspace in one action.
 $("pm-close")?.click();
 if(typeof window.closeRunsModal==="function")window.closeRunsModal();
},true);
document.addEventListener("keydown",e=>{if(!host)return;if(e.key==="Enter"&&materialsMode&&!e.repeat&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){e.preventDefault();closeMaterials();return;}if(e.code==="Space"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();pan=true;canvas.style.cursor="grab";return}if(["q","Q"].includes(e.key)&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();if(!e.repeat)toggleTrace("conduit")}else if(e.key.toLowerCase()==="g"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();if(!e.repeat)toggleTrace("wire")}else if(e.key==="Enter"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();if(tracing&&points.length>=2){toggleTrace(traceKind)}}});document.addEventListener("keyup",e=>{if(e.code==="Space"){pan=false;if(canvas)canvas.style.cursor="crosshair"}});window.addEventListener("resize",()=>{if(host)draw()});window.openPhotoMeasureRuns=open;
})();