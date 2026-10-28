/* Native photo measuring for Material Runs. Lengths are in feet. */
(() => {
"use strict";
let host, canvas, ctx, image, imageURL, points=[], corners=[], mode="measure", runIndex=0, runs=[], transform={scale:1,x:0,y:0,rotation:0}, pan=false, drag=null, hover=null, calibration=null, measured=null, tracing=false, runPaths={}, materialsMode=false, materialCatalog=[];
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
function cacheSettings(){try{localStorage.setItem(settingsKey(),JSON.stringify({width:$("pm-width")?.value,height:$("pm-height")?.value,corners,calibration,runPaths,runIndex,rotation:transform.rotation}))}catch(e){console.warn(e)}}
function restoreSettings(){try{const x=JSON.parse(localStorage.getItem(settingsKey())||"null");if(!x)return;if(x.width)$("pm-width").value=x.width;if(x.height)$("pm-height").value=x.height;corners=Array.isArray(x.corners)?x.corners:[];calibration=Array.isArray(x.calibration)&&x.calibration.length===8?x.calibration:null;runPaths=x.runPaths&&typeof x.runPaths==="object"?x.runPaths:{};runIndex=Math.max(0,Math.min(runs.length-1,Number(x.runIndex)||0));transform.rotation=Number(x.rotation)||0}catch(e){console.warn(e)}}
function rememberRun(){const r=currentRun();if(r&&points.length){runPaths[String(r.id)]={points:points.map(p=>({...p})),length:Number.isFinite(measured)?measured:null};}cacheSettings()}
function restoreRun(){const saved=runPaths[String(currentRun()?.id)];points=Array.isArray(saved?.points)?saved.points.map(p=>({...p})):[];measured=Number.isFinite(saved?.length)?saved.length:null;hover=null;tracing=false;label();draw()}
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
 $("pm-value").textContent=measured==null?"—":measured.toFixed(3)+" ft";
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
 for(let i=1;i<points.length;i++)line(points[i-1],points[i],"#4ade80");
 if(points.length>=1&&hover&&tracing&&mode==="measure") {
  line(points[points.length-1],hover,"#4ade80",true);
  if(calibration){try{const p=physical(points[points.length-1]),q=physical(hover),ft=(measured||0)+Math.hypot(p.x-q.x,p.y-q.y);const v=point(hover);ctx.font="bold 13px Arial";const text=ft.toFixed(3)+" ft";const tw=ctx.measureText(text).width;ctx.fillStyle="#101827";ctx.fillRect(v.x+12,v.y-31,tw+16,25);ctx.fillStyle="#4ade80";ctx.fillText(text,v.x+20,v.y-14)}catch(_){}}
 }
 points.forEach(p=>dot(p,"#4ade80"));
}
function fit(){if(!image)return;const rect=canvas.getBoundingClientRect();transform.scale=Math.min(rect.width/image.width,rect.height/image.height)*0.92;transform.x=0;transform.y=0;draw();}
function solve(A,b){for(let i=0;i<8;i++){let k=i;for(let j=i+1;j<8;j++)if(Math.abs(A[j][i])>Math.abs(A[k][i]))k=j;[A[i],A[k]]=[A[k],A[i]];[b[i],b[k]]=[b[k],b[i]];let pivot=A[i][i];if(Math.abs(pivot)<1e-10)throw Error("Invalid reference rectangle");for(let j=i;j<8;j++)A[i][j]/=pivot;b[i]/=pivot;for(let k2=0;k2<8;k2++){if(k2===i)continue;const v=A[k2][i];for(let j=i;j<8;j++)A[k2][j]-=v*A[i][j];b[k2]-=v*b[i]}}return b;}
function calibrate(){const w=Number($("pm-width").value),h=Number($("pm-height").value);if(!(w>0&&h>0)||corners.length!==4)return;const targets=[[0,0],[w,0],[w,h],[0,h]],A=[],b=[];corners.forEach((p,i)=>{const [X,Y]=targets[i];A.push([p.x,p.y,1,0,0,0,-X*p.x,-X*p.y]);b.push(X);A.push([0,0,0,p.x,p.y,1,-Y*p.x,-Y*p.y]);b.push(Y)});calibration=solve(A,b);status("Reference calibrated. Press Q to start tracing.");mode="measure";cacheSettings();}
function physical(p){const h=calibration,d=h[6]*p.x+h[7]*p.y+1;if(Math.abs(d)<1e-8)throw Error("Measurement outside calibrated plane");return{x:(h[0]*p.x+h[1]*p.y+h[2])/d,y:(h[3]*p.x+h[4]*p.y+h[5])/d};}
function measure(){
 if(!calibration)return status("Calibrate the reference rectangle first.");
 try{let sum=0;for(let i=1;i<points.length;i++){const a=physical(points[i-1]),b=physical(points[i]);sum+=Math.hypot(b.x-a.x,b.y-a.y)}
 measured=sum;label();rememberRun();status("Click another point to extend the run, or press Q to finish and save.");
 }catch(e){measured=null;status(e.message)}
}
function setRun(i){if(materialsMode){materialsMode=false;if($("pm-materials"))$("pm-materials").style.display="none";}runIndex=Math.max(0,Math.min(runs.length-1,i));restoreRun();cacheSettings();status(points.length?"Restored measured path. Press Q to remeasure.":"Press Q to start tracing this run.");}
async function showMaterials(){
 const api=window.photoRunMaterialsAPI,run=currentRun();
 if(!api||!run)return status("Material sidebar unavailable.");
 materialsMode=true;
 const side=$("pm-materials");side.style.display="flex";
 $("pm-material-title").textContent="Run "+(runIndex+1)+" · Conduit & Fittings";
 $("pm-material-status").textContent="Loading materials…";
 try{
  const conduits=await api.listConduits();
  if(!host||!materialsMode)return;
  const actual=api.getRun(run.id),select=$("pm-conduit");
  const esc=v=>escape(v);
  select.innerHTML='<option value="">Select conduit</option>'+conduits.map((m,i)=>`<option value="${i}">${esc([m.CatalogNumber,m.Description,m.Size].filter(Boolean).join(" · "))}</option>`).join("");
  const current=String(actual?.conduit?.CatalogNumber||"");
  const ix=conduits.findIndex(m=>String(m.CatalogNumber)===current);
  select.value=ix>=0?String(ix):"";
  select.onchange=async()=>{api.setConduit(run.id,select.value===""?null:conduits[Number(select.value)]);await showFittings();};
  await showFittings();
 }catch(e){$("pm-material-status").textContent="Could not load materials: "+e.message;}
}
async function showFittings(){
 const api=window.photoRunMaterialsAPI,run=currentRun();
 if(!api||!run)return;
 const target=$("pm-fitting-grid");
 target.textContent="Loading fittings…";
 const items=await api.listFittings(run.id);
 if(!host||!materialsMode)return;
 materialCatalog=items;
 target.innerHTML=items.length?items.map((m,i)=>{
  const qty=api.getFittingQty(run.id,m),src=api.getImage(m);
  return `<div class="pm-fitting-tile"><img src="${escape(src)}" alt="" onerror="this.style.display='none'"><div class="pm-fitting-desc" title="${escape(m.Description||"")}">${escape(m.CatalogNumber||m.Description||"Fitting")}</div><div class="pm-row"><button data-fit="${i}" data-delta="-1">−</button><strong>${qty}</strong><button data-fit="${i}" data-delta="1">+</button></div></div>`;
 }).join(""):"No fittings for the selected size.";
 target.querySelectorAll("[data-fit]").forEach(btn=>btn.onclick=()=>{
  const material=materialCatalog[Number(btn.dataset.fit)];if(!material)return;
  api.setFitting(run.id,material,Number(btn.dataset.delta));
  showFittings();
 });
 $("pm-material-status").textContent="Changes save directly to Material Runs.";
}
function closeMaterials(){
 materialsMode=false;$("pm-materials").style.display="none";
 if(runIndex<runs.length-1){setRun(runIndex+1);status("Materials saved. Press Q for next run.");}
 else status("Materials saved. All runs complete.");
 requestAnimationFrame(draw);
}
function finishMaterialSelection(){
 if(!host)return;
 host.style.display="flex";
 if(runIndex<runs.length-1){setRun(runIndex+1);status("Conduit and fittings updated. Press Q to start the next run.");}
 else{tracing=false;label();draw();status("Conduit and fittings updated. All runs measured.");}
 requestAnimationFrame(draw);
}
window.photoMeasureMaterialsDone=finishMaterialSelection;
function confirm(){
 if(!currentRun()||points.length<2||!Number.isFinite(measured))return status("Add at least two points.");
 const run=currentRun(),actual=typeof window.findRun==="function"?window.findRun(run.id):null;
 if(!actual)return status("Run no longer exists; reopen the tool.");
 actual.length=Math.ceil(Math.max(0,measured));
 try{window.captureRunsHistory?.("Photo-measured multipoint run");window.saveRunsDraft?.();window.refreshRunsBOM?.();window.renderRunsModal?.();}
 catch(e){status("Could not refresh Runs: "+e.message);return}
 rememberRun();
 status("Saved "+actual.length+" ft. Select or edit conduit and fittings in the right sidebar.");
 showMaterials();
}
function toggleTrace(){
 if(!image)return status("Upload a photo first.");
 if(!calibration)return status("Calibrate the reference rectangle first.");
 if(!tracing){if(points.length>=2){status("Existing plotted points restored. Use Remeasure Current Run to replace them, or Q to start a new trace.");return;}points=[];hover=null;measured=null;tracing=true;label();draw();status("Tracing started. Click the start point, then every bend. Press Q again to finish.");}
 else if(points.length<2)status("Click at least two points before finishing.");
 else{tracing=false;confirm();}
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
#photoMeasureModal .pm-materials{display:none;width:620px;flex:0 0 620px;height:1200px;max-height:100%;flex-direction:column;overflow-y:auto;background:#172236;border-left:1px solid #334155}
#photoMeasureModal .pm-materials .pm-group{padding:14px}
#photoMeasureModal #pm-conduit{width:100%;padding:10px;background:#0e1726;color:white;border:1px solid #4b617d;font-size:16px}
#photoMeasureModal .pm-fitting-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#photoMeasureModal .pm-fitting-tile{border:1px solid #3a4b62;border-radius:6px;padding:7px;min-width:0}
#photoMeasureModal .pm-fitting-tile img{height:76px;width:100%;object-fit:contain;background:#edf2f7}
#photoMeasureModal .pm-fitting-desc{font-size:13px;overflow-wrap:anywhere;padding:5px 0}
#photoMeasureModal .pm-fitting-tile button{padding:5px}
#photoMeasureModal .pm-endpoints{display:flex;align-items:stretch;gap:6px}
#photoMeasureModal .pm-endpoint{flex:1;min-width:0;border:1px solid #354b65;border-radius:5px;padding:8px;display:flex;align-items:center;gap:8px}
#photoMeasureModal .pm-endpoint-role{font-size:12px;color:#8fa5c1;font-weight:700}
#photoMeasureModal .pm-endpoint-name{font-size:14px;overflow-wrap:anywhere;min-width:0}
#photoMeasureModal .pm-endpoint-arrow{align-self:center;font-size:22px;color:#74bdf2}
#photoMeasureModal .pm-endpoint img{flex-shrink:0}

#photoMeasureModal .pm-row button{flex:1}
#photoMeasureModal .pm-side label{font-size:20px;color:#bdcce0;display:block}
#photoMeasureModal .pm-side label input{margin-top:6px}
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
  <div class="pm-group"><span class="pm-heading">CALIBRATION</span><label>Reference width (ft)<input id="pm-width" type="number" value="1.3333" step=".001" min=".001"></label><label>Reference height (ft)<input id="pm-height" type="number" value="2.125" step=".001" min=".001"></label><button id="pm-cal">Set Reference Rectangle</button><span style="font-size:19px;color:#93a7c1">Click 4 corners clockwise, starting at the top-left.</span></div>
  <div class="pm-group"><span class="pm-heading">ACTIVE MATERIAL RUN</span><strong id="pm-run" style="line-height:1.5"></strong><div id="pm-endpoints" class="pm-endpoints"></div><span class="pm-heading">MEASURED LENGTH</span><span id="pm-value">—</span><button id="pm-confirm" class="primary">Finish & Next · Q / Enter</button><div class="pm-row"><button id="pm-prev">← Previous</button><button id="pm-skip">Skip →</button></div><button id="pm-remeasure">Remeasure Current Run</button><button id="pm-edit-materials">Edit Conduit & Fittings</button></div>
  <div class="pm-group"><span class="pm-heading">COMMAND / STATUS</span><div id="pm-status">Upload a photo to begin.</div><span style="font-size:19px;color:#93a7c1">Space + drag: pan · Mouse wheel: zoom · Q: start · Click multiple points · Q: finish/save</span></div>
 </aside>
 <main class="pm-canvas"><canvas id="pm-canvas" style="width:100%;height:100%;display:block;touch-action:none;cursor:crosshair"></canvas></main><aside id="pm-materials" class="pm-materials"><div class="pm-group"><span class="pm-heading">MATERIALS EDITOR</span><strong id="pm-material-title"></strong><button id="pm-material-done" class="primary">Done · Next Run →</button><span id="pm-material-status" style="font-size:14px;color:#a9c3db"></span></div><div class="pm-group"><span class="pm-heading">CONDUIT</span><select id="pm-conduit"></select></div><div class="pm-group"><span class="pm-heading">FITTINGS</span><div id="pm-fitting-grid" class="pm-fitting-grid"></div></div></aside>
</div>`;document.body.appendChild(host);canvas=$("pm-canvas");ctx=canvas.getContext("2d");$("pm-close").onclick=()=>{materialsMode=false;host.remove();host=null;image=null;if(imageURL){URL.revokeObjectURL(imageURL);imageURL=null;}};$("pm-file").onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 corners=[];calibration=null;runPaths={};runIndex=0;cacheSettings();loadPhotoBlob(f,f.name);
 try{await cachePhoto(f);status("Photo attached to local cache for this project. Set the reference rectangle.");}
 catch(err){console.warn("Photo cache unavailable",err);status("Photo loaded, but local cache failed: "+err.message);}
};$("pm-cal").onclick=()=>{mode="calibrate";corners=[];calibration=null;points=[];tracing=false;measured=null;cacheSettings();status("Click reference corners in order: top-left, top-right, bottom-right, bottom-left.");draw()};$("pm-fit").onclick=fit;$("pm-left").onclick=()=>{transform.rotation-=90;draw();cacheSettings()};$("pm-right").onclick=()=>{transform.rotation+=90;draw();cacheSettings()};$("pm-prev").onclick=()=>setRun(runIndex-1);$("pm-skip").onclick=()=>setRun(runIndex+1);$("pm-remeasure").onclick=()=>{points=[];hover=null;measured=null;tracing=false;delete runPaths[String(currentRun()?.id)];cacheSettings();mode="measure";label();draw();status("Press Q to start tracing.")};$("pm-confirm").onclick=confirm;$("pm-material-done").onclick=closeMaterials;$("pm-edit-materials").onclick=showMaterials;$("pm-width").onchange=()=>{if(corners.length===4)try{calibrate()}catch(e){status(e.message)}cacheSettings()};$("pm-height").onchange=$("pm-width").onchange;canvas.onpointerdown=e=>{if(!image)return;const p={x:e.offsetX,y:e.offsetY};if(pan||e.button===1){drag={x:p.x,y:p.y,tx:transform.x,ty:transform.y};canvas.setPointerCapture(e.pointerId);return}const q=unposition(p);if(mode==="calibrate"){if(corners.length===4)corners=[];corners.push(q);if(corners.length===4)try{calibrate()}catch(err){status(err.message)}else status("Corner "+corners.length+"/4 selected.");}else{if(!tracing){status("Press Q to start measuring.");return;}points.push(q);measure();rememberRun();}draw()};canvas.onpointermove=e=>{if(!drag){if(image&&points.length>=1&&tracing&&mode==="measure"){hover=unposition({x:e.offsetX,y:e.offsetY});draw()}return;}const x=e.offsetX,y=e.offsetY;transform.x=drag.tx+x-drag.x;transform.y=drag.ty+y-drag.y;draw();return};canvas.onpointerup=()=>{drag=null};canvas.onwheel=e=>{e.preventDefault();transform.scale=Math.max(0.01,Math.min(100,transform.scale*(e.deltaY<0?1.1:1/1.1)));draw()};restoreSettings();restoreRun();requestAnimationFrame(draw);
 readCachedPhoto().then(entry=>{
  if(!host||image||!entry?.blob)return;
  loadPhotoBlob(entry.blob,entry.name||"cached photo");
  status("Restored cached project photo.");
 }).catch(err=>{console.warn("Photo cache read failed",err);});
}
document.addEventListener("keydown",e=>{if(!host)return;if(e.code==="Space"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();pan=true;canvas.style.cursor="grab";return}if(["q","Q"].includes(e.key)&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();if(!e.repeat)toggleTrace()}else if(e.key==="Enter"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();if(tracing&&points.length>=2){tracing=false;confirm()}}if(e.key==="Escape"){$("pm-close").click()}});document.addEventListener("keyup",e=>{if(e.code==="Space"){pan=false;if(canvas)canvas.style.cursor="crosshair"}});window.addEventListener("resize",()=>{if(host)draw()});window.openPhotoMeasureRuns=open;
})();