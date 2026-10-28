/* Native photo measuring for Material Runs. Lengths are in feet. */
(() => {
"use strict";
let host, canvas, ctx, image, imageURL, points=[], corners=[], mode="measure", runIndex=0, runs=[], transform={scale:1,x:0,y:0,rotation:0}, pan=false, drag=null, hover=null, calibration=null, measured=null;
const $ = id => host?.querySelector("#"+id);
const escape = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function currentRun(){return runs[runIndex];}
function status(message){if($("pm-status"))$("pm-status").textContent=message;}
function label(){const r=currentRun();$("pm-run").textContent=r?`Run ${runIndex+1} of ${runs.length}: ${r.name||"Run"}`:"No runs available";$("pm-value").textContent=measured==null?"—":measured.toFixed(3)+" ft";}
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
 if(points.length===2)line(points[0],points[1],"#4ade80");
 if(points.length===1&&hover&&mode==="measure") {
  line(points[0],hover,"#4ade80",true);
  if(calibration){try{const p=physical(points[0]),q=physical(hover),ft=Math.hypot(p.x-q.x,p.y-q.y);const v=point(hover);ctx.font="bold 13px Arial";const text=ft.toFixed(3)+" ft";const tw=ctx.measureText(text).width;ctx.fillStyle="#101827";ctx.fillRect(v.x+12,v.y-31,tw+16,25);ctx.fillStyle="#4ade80";ctx.fillText(text,v.x+20,v.y-14)}catch(_){}}
 }
 points.forEach(p=>dot(p,"#4ade80"));
}
function fit(){if(!image)return;const rect=canvas.getBoundingClientRect();transform.scale=Math.min(rect.width/image.width,rect.height/image.height)*0.92;transform.x=0;transform.y=0;draw();}
function solve(A,b){for(let i=0;i<8;i++){let k=i;for(let j=i+1;j<8;j++)if(Math.abs(A[j][i])>Math.abs(A[k][i]))k=j;[A[i],A[k]]=[A[k],A[i]];[b[i],b[k]]=[b[k],b[i]];let pivot=A[i][i];if(Math.abs(pivot)<1e-10)throw Error("Invalid reference rectangle");for(let j=i;j<8;j++)A[i][j]/=pivot;b[i]/=pivot;for(let k2=0;k2<8;k2++){if(k2===i)continue;const v=A[k2][i];for(let j=i;j<8;j++)A[k2][j]-=v*A[i][j];b[k2]-=v*b[i]}}return b;}
function calibrate(){const w=Number($("pm-width").value),h=Number($("pm-height").value);if(!(w>0&&h>0)||corners.length!==4)return;const targets=[[0,0],[w,0],[w,h],[0,h]],A=[],b=[];corners.forEach((p,i)=>{const [X,Y]=targets[i];A.push([p.x,p.y,1,0,0,0,-X*p.x,-X*p.y]);b.push(X);A.push([0,0,0,p.x,p.y,1,-Y*p.x,-Y*p.y]);b.push(Y)});calibration=solve(A,b);status("Reference calibrated. Select two points to measure.");mode="measure";}
function physical(p){const h=calibration,d=h[6]*p.x+h[7]*p.y+1;if(Math.abs(d)<1e-8)throw Error("Measurement outside calibrated plane");return{x:(h[0]*p.x+h[1]*p.y+h[2])/d,y:(h[3]*p.x+h[4]*p.y+h[5])/d};}
function measure(){if(!calibration){status("Calibrate the reference rectangle first.");return}try{const a=physical(points[0]),b=physical(points[1]);measured=Math.hypot(b.x-a.x,b.y-a.y);label();status("Press Enter or Q to save "+measured.toFixed(3)+" ft to this run.");}catch(e){measured=null;status(e.message)}}
function setRun(i){runIndex=Math.max(0,Math.min(runs.length-1,i));points=[];hover=null;measured=null;label();draw();}
function confirm(){if(!currentRun()||!Number.isFinite(measured))return status("Measure two points first.");const run=currentRun();const actual=typeof window.findRun==="function"?window.findRun(run.id):null;if(!actual)return status("Run no longer exists; reopen the tool.");actual.length=Math.round(measured*1000)/1000;try{window.captureRunsHistory?.("Photo-measured run length");window.saveRunsDraft?.();window.refreshRunsBOM?.();window.renderRunsModal?.();}catch(e){status("Could not refresh Runs: "+e.message);return}status("Saved "+actual.length+" ft to "+run.name);if(runIndex<runs.length-1)setRun(runIndex+1);else{points=[];measured=null;label();status("All runs measured. You can close this window.");}}
function open(){if(host){host.style.display="flex";return}runs=typeof window.getProjectRuns==="function"?window.getProjectRuns().map(r=>({id:r.id,name:r.name})):[];if(!runs.length){alert("Add a Material Run first.");return}host=document.createElement("div");host.id="photoMeasureModal";host.style.cssText="position:fixed;inset:0;z-index:2147483000;background:#0b1220;color:#e5edf8;display:flex;flex-direction:column;font:22px Arial,sans-serif";
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
  <div class="pm-group"><span class="pm-heading">ACTIVE MATERIAL RUN</span><strong id="pm-run" style="line-height:1.5"></strong><span class="pm-heading">MEASURED LENGTH</span><span id="pm-value">—</span><button id="pm-confirm" class="primary">Confirm & Next · Enter / Q</button><div class="pm-row"><button id="pm-prev">← Previous</button><button id="pm-skip">Skip →</button></div><button id="pm-remeasure">Remeasure Current Run</button></div>
  <div class="pm-group"><span class="pm-heading">COMMAND / STATUS</span><div id="pm-status">Upload a photo to begin.</div><span style="font-size:19px;color:#93a7c1">Space + drag: pan · Mouse wheel: zoom · Click A then B: measure · Enter/Q: save</span></div>
 </aside>
 <main class="pm-canvas"><canvas id="pm-canvas" style="width:100%;height:100%;display:block;touch-action:none;cursor:crosshair"></canvas></main>
</div>`;document.body.appendChild(host);canvas=$("pm-canvas");ctx=canvas.getContext("2d");$("pm-close").onclick=()=>{host.remove();host=null;image=null;if(imageURL){URL.revokeObjectURL(imageURL);imageURL=null;}};$("pm-file").onchange=e=>{const f=e.target.files[0];if(!f)return;if(imageURL)URL.revokeObjectURL(imageURL);imageURL=URL.createObjectURL(f);const im=new Image();im.onload=()=>{image=im;corners=[];points=[];calibration=null;measured=null;fit();label();};im.src=imageURL};$("pm-cal").onclick=()=>{mode="calibrate";corners=[];calibration=null;points=[];measured=null;status("Click reference corners in order: top-left, top-right, bottom-right, bottom-left.");draw()};$("pm-fit").onclick=fit;$("pm-left").onclick=()=>{transform.rotation-=90;draw()};$("pm-right").onclick=()=>{transform.rotation+=90;draw()};$("pm-prev").onclick=()=>setRun(runIndex-1);$("pm-skip").onclick=()=>setRun(runIndex+1);$("pm-remeasure").onclick=()=>{points=[];hover=null;measured=null;mode="measure";label();draw()};$("pm-confirm").onclick=confirm;$("pm-width").onchange=()=>{if(corners.length===4)try{calibrate()}catch(e){status(e.message)}};$("pm-height").onchange=$("pm-width").onchange;canvas.onpointerdown=e=>{if(!image)return;const p={x:e.offsetX,y:e.offsetY};if(pan||e.button===1){drag={x:p.x,y:p.y,tx:transform.x,ty:transform.y};canvas.setPointerCapture(e.pointerId);return}const q=unposition(p);if(mode==="calibrate"){if(corners.length===4)corners=[];corners.push(q);if(corners.length===4)try{calibrate()}catch(err){status(err.message)}else status("Corner "+corners.length+"/4 selected.");}else{if(points.length===2)points=[];points.push(q);if(points.length===2)hover=null;if(points.length===2)measure();}draw()};canvas.onpointermove=e=>{if(!drag){if(image&&points.length===1&&mode==="measure"){hover=unposition({x:e.offsetX,y:e.offsetY});draw()}return;}const x=e.offsetX,y=e.offsetY;transform.x=drag.tx+x-drag.x;transform.y=drag.ty+y-drag.y;draw();return};canvas.onpointerup=()=>{drag=null};canvas.onwheel=e=>{e.preventDefault();transform.scale=Math.max(0.01,Math.min(100,transform.scale*(e.deltaY<0?1.1:1/1.1)));draw()};setRun(0);requestAnimationFrame(draw);}
document.addEventListener("keydown",e=>{if(!host)return;if(e.code==="Space"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();pan=true;canvas.style.cursor="grab";return}if(["Enter","q","Q"].includes(e.key)&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();confirm()}if(e.key==="Escape"){$("pm-close").click()}});document.addEventListener("keyup",e=>{if(e.code==="Space"){pan=false;if(canvas)canvas.style.cursor="crosshair"}});window.addEventListener("resize",()=>{if(host)draw()});window.openPhotoMeasureRuns=open;
})();