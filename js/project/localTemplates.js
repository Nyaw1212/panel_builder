// Browser-local named layout templates. These do not save a project or generate a report.
(() => {
  const KEY = "panelBuilderNamedTemplatesV1";
  const title = document.getElementById("canvasTemplateName");
  // Place the caption in the visible workspace rather than the oversized
  // scrollable canvas. Its position follows the workspace viewport.
  const workspace = document.querySelector(".workspace");
  if (title && workspace) workspace.appendChild(title);
  // Keep Runs outside transformed/scrolled canvas ancestors so fixed positioning
  // is relative to the browser viewport, not the canvas coordinate system.
  const runsShortcut = document.getElementById("runsButton");
  if (runsShortcut) document.body.appendChild(runsShortcut);
  const saveButton = document.getElementById("saveAsTemplateButton");
  const openButton = document.getElementById("openTemplateButton");
  const read = () => {
    try { const rows = JSON.parse(localStorage.getItem(KEY) || "{}"); return rows && typeof rows === "object" ? rows : {}; }
    catch { return {}; }
  };

  // Template thumbnails live in IndexedDB; the project snapshots remain in localStorage.
  const PHOTO_DB = "PanelBuilderTemplatePhotosV1";
  const PHOTO_STORE = "images";
  const photoDb = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(PHOTO_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function putPhoto(key, blob) {
    const db = await photoDb();
    try { await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).put(blob, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    }); } finally { db.close(); }
  }
  async function getPhoto(key) {
    const db = await photoDb();
    try { return await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readonly");
      const req = tx.objectStore(PHOTO_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }); } finally { db.close(); }
  }
  function conduitTags(project) {
    const types = new Set(), sizes = new Set();
    (project.runs || []).forEach(run => {
      const c = run.conduit;
      if (!c) return;
      const desc = [c.Description, c.description, c.CatalogNumber, c.catalogNumber, c.Name, c.name].filter(Boolean).join(" ").toUpperCase();
      if (/\bEMT\b/.test(desc)) types.add("EMT");
      if (/\bPVC\b|SCHEDULE\s*\d+|\bSCH\s*\d+/.test(desc)) types.add("PVC");
      if (/LIQUID|SEALTIGHT|\bL\/?T\b|\bLFNC\b|\bLFMC\b/.test(desc)) types.add("LT");
      if (/(?:^|[^0-9])1\s*(?:INCH|IN\b|["″])/.test(desc)) sizes.add('1"');
      if (/(?:^|[^0-9])2\s*(?:INCH|IN\b|["″])/.test(desc)) sizes.add('2"');
    });
    return {types:[...types], sizes:[...sizes]};
  }
  function choosePhoto() {
    return new Promise(resolve => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      input.onchange = () => resolve(input.files?.[0] || null);
      input.addEventListener("cancel", () => resolve(null), {once:true});
      input.click();
    });
  }
  function showSaveTemplateDialog() {
    const old = document.getElementById("local-template-save-dialog");
    old?.remove();
    const overlay = document.createElement("div");
    overlay.id = "local-template-save-dialog";
    overlay.style.cssText = "position:fixed;inset:0;z-index:100100;background:#000a;display:grid;place-items:center;padding:20px";
    overlay.innerHTML = '<div style="width:min(440px,95vw);background:#152236;color:#f8fafc;border:1px solid #475569;border-radius:14px;padding:22px;display:grid;gap:13px;box-shadow:0 20px 70px #0008"><strong style="font-size:20px">Save as Visual Template</strong><label>Template group (e.g. DURACELL, SONNEN)<input data-group list="template-groups" placeholder="DURACELL" style="display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;background:#0f172a;color:white;border:1px solid #64748b;border-radius:7px"></label><datalist id="template-groups"></datalist><label>Template name<input data-name style="display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;background:#0f172a;color:white;border:1px solid #64748b;border-radius:7px"></label><div data-tags style="font-size:13px;color:#cbd5e1"></div><label style="font-size:13px">Electrical layout photo (optional, can attach later)<input data-photo type="file" accept="image/*" style="display:block;width:100%;margin-top:8px"></label><div style="display:flex;justify-content:flex-end;gap:10px"><button data-cancel type="button">Cancel</button><button data-save type="button">Save Template</button></div></div>';
    const input = overlay.querySelector("[data-name]");
    const groupInput=overlay.querySelector("[data-group]");
    const existingGroups=[...new Set(Object.values(read()).map(record=>String(record.group||"").trim()).filter(Boolean))].sort();
    overlay.querySelector("#template-groups").replaceChildren(...existingGroups.map(group=>{const option=document.createElement("option");option.value=group;return option;}));
    groupInput.value=String(state().model||"").trim().match(/DURACELL|SONNEN|TESLA/i)?.[0]?.toUpperCase()||"";
    input.value = String(state().model || state().jobName || "").trim();
    const tags = conduitTags({runs:typeof serializeRuns==="function"?serializeRuns():[]});
    overlay.querySelector("[data-tags]").textContent = "Detected conduit: "+(tags.types.join(", ")||"None")+" · Sizes: "+(tags.sizes.join(", ")||"None");
    const close=()=>overlay.remove();
    overlay.querySelector("[data-cancel]").onclick=close;
    overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
    overlay.querySelector("[data-save]").onclick=async()=>{
      const name=input.value.trim(),group=groupInput.value.trim().toUpperCase();
      if(!group){alert("Enter a template group (e.g. DURACELL).");return;}
      if(!name){alert("Enter a template name.");return;}
      const all=read(), existing=Object.keys(all).find(k=>(String(all[k].group||"").toUpperCase()===group && k.toLowerCase()===name.toLowerCase()) || (!all[k].group && k.toLowerCase()===name.toLowerCase()));
      if(existing&&!confirm('Replace existing template "'+existing+'"?'))return;
      const button=overlay.querySelector("[data-save]");button.disabled=true;
      try{
        const project={...buildProject(),layout:serializeLayout(),links:serializeLinks(),runs:typeof serializeRuns==="function"?serializeRuns():[],gutters:typeof serializeGutters==="function"?serializeGutters():[]};
        project.id="";project.jobName="";project.address="";project.model=name;
        const key=existing||(Object.hasOwn(all,name)?group+" — "+name:name), file=overlay.querySelector("[data-photo]").files?.[0];
        // Keep existing photo on replacement unless a new one was chosen.
        if(file)await putPhoto(key,file);
        all[key]={project,group,templateName:name,savedAt:new Date().toISOString()};
        localStorage.setItem(KEY,JSON.stringify(all));
        state().model=name;label(name);close();
        alert('Template "'+group+" — "+name+'" saved locally.');
      }catch(err){alert("Unable to save template: "+err.message);button.disabled=false;}
    };
    document.body.appendChild(overlay);input.focus();input.select();
  }

  const label = name => { if (title) title.textContent = name || "Template Name"; };
  const state = () => typeof getProjectState === "function" ? getProjectState() : {};
  label(state().model);
  saveButton?.addEventListener("click", showSaveTemplateDialog);
  // Lightweight anchored dropdown: selecting a template loads it immediately.
  let templateMenu = null;
  const closeTemplateMenu = () => {
    templateMenu?.remove();
    templateMenu = null;
  };
  const loadTemplate = async (name, record) => {
    if (!record?.project) return;
    if (typeof deserializeProject !== "function") {
      window.alert("Project loader unavailable.");
      return;
    }
    try {
      const snapshot = structuredClone(record.project);
      await deserializeProject(snapshot);
      if (typeof setProjectState === "function") {
        setProjectState({ ...state(), id: "", jobName: "", address: "", model: name, usedMaterialsSpreadsheetId: "", usedMaterialsSpreadsheetUrl: "" });
      }
      label(name);
      if (typeof finalizeLoadedProjectHistory === "function") finalizeLoadedProjectHistory();
      closeTemplateMenu();
    } catch (err) {
      window.alert("Unable to load template: " + err.message);
    }
  };

  const openTemplateMenu = async anchor => {
    if(templateMenu){closeTemplateMenu();return;}
    const all=read(),names=Object.keys(all).sort();
    if(!names.length){alert("No saved templates in this browser yet.");return;}
    const overlay=document.createElement("div");
    overlay.className="visual-template-library-page";
    overlay.setAttribute("role","dialog");
    overlay.setAttribute("aria-modal","true");
    overlay.setAttribute("aria-label","Visual Template Library");
    overlay.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;box-sizing:border-box;z-index:2147483000;background:#0b1220;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;padding:clamp(14px,3vw,32px);";
    overlay.innerHTML='<section style="width:100%;max-width:1600px;min-height:calc(100vh - 64px);box-sizing:border-box;margin:0 auto;background:#142136;color:#f8fafc;border:1px solid #475569;border-radius:15px;padding:clamp(14px,2vw,28px);box-shadow:0 20px 70px #0009"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px"><strong style="font-size:23px">Visual Template Library</strong><button data-close type="button">✕ Close</button></div><div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:15px"><select data-group-filter style="padding:10px;background:#0f172a;color:white"><option value="">All template groups</option></select><input data-search placeholder="Search templates..." style="flex:1;min-width:190px;padding:10px;border-radius:7px;background:#0f172a;color:white;border:1px solid #64748b"><select data-type style="padding:10px;background:#0f172a;color:white"><option value="">All conduit types</option><option>EMT</option><option>PVC</option><option>LT</option></select><select data-size style="padding:10px;background:#0f172a;color:white"><option value="">Both sizes</option><option value="1&#34;">1"</option><option value="2&#34;">2"</option></select></div><div data-grid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:15px"></div></section>';
    document.body.appendChild(overlay);templateMenu=overlay;
    overlay.querySelector("[data-close]").onclick=closeTemplateMenu;
    overlay.addEventListener("click",e=>{if(e.target===overlay)closeTemplateMenu()});
    const groupFilter=overlay.querySelector("[data-group-filter]");
    [...new Set(names.map(n=>String(all[n].group||"Uncategorized").trim()))].sort().forEach(group=>{const option=document.createElement("option");option.value=group;option.textContent=group;groupFilter.appendChild(option);});
    const grid=overlay.querySelector("[data-grid]");
    const cards=[];
    for(const name of names){
      const record=all[name],tags=conduitTags(record.project||{});
      const card=document.createElement("article");
      card.style.cssText="background:#0c1728;border:1px solid #334155;border-radius:10px;padding:14px;display:grid;gap:11px;align-content:start";
      const img=document.createElement("div");
      img.style.cssText="height:220px;background:#233348;border-radius:7px;display:grid;place-items:center;overflow:hidden;color:#94a3b8";
      img.textContent="No photo attached";
      const blob=await getPhoto(name).catch(()=>null);
      if(blob){
        const url=URL.createObjectURL(blob),pic=document.createElement("img");
        pic.src=url;pic.alt="Electrical layout for "+name;pic.style.cssText="width:100%;height:100%;object-fit:cover";
        pic.onload=()=>URL.revokeObjectURL(url);
        img.replaceChildren(pic);
      }
      const heading=document.createElement("strong");heading.textContent=record.templateName||name;
      const groupLabel=document.createElement("small");groupLabel.style.cssText="font-weight:700;color:#7dd3fc;letter-spacing:.08em";groupLabel.textContent=record.group||"UNCATEGORIZED";
      const details=document.createElement("small");details.style.color="#aabbd0";
      details.textContent=(record.project?.runs?.length||0)+" runs · "+(tags.types.join(" / ")||"Conduit unclassified")+" · "+(tags.sizes.join(" / ")||"Size unclassified");
      const actions=document.createElement("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
      const use=document.createElement("button");use.textContent="Use Template";use.onclick=()=>loadTemplate(name,record);
      const attach=document.createElement("button");attach.textContent=blob?"Replace Photo":"Attach Photo";
      attach.onclick=async()=>{
        const file=await choosePhoto();if(!file)return;
        try{await putPhoto(name,file);closeTemplateMenu();openTemplateMenu(anchor);}
        catch(e){alert("Could not store photo: "+e.message);}
      };
      const edit=document.createElement("button");edit.type="button";edit.textContent="Edit Details";
      edit.onclick=()=>{
        const panel=document.createElement("div");
        panel.style.cssText="position:fixed;inset:0;z-index:2147483100;background:#000b;display:grid;place-items:center;padding:16px";
        panel.innerHTML='<div style="width:min(440px,96vw);background:#17263b;border:1px solid #64748b;border-radius:12px;padding:20px;display:grid;gap:12px;color:#f8fafc"><strong style="font-size:20px">Edit Template Details</strong><label>Template Group<input data-edit-group list="edit-template-groups" style="display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;background:#0b1627;color:white;border:1px solid #64748b;border-radius:6px"></label><datalist id="edit-template-groups"></datalist><label>Template Name<input data-edit-name style="display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;background:#0b1627;color:white;border:1px solid #64748b;border-radius:6px"></label><small style="color:#aabbd0">Your layout, material runs, and attached photo will not change.</small><div style="display:flex;gap:10px;justify-content:flex-end"><button data-cancel>Cancel</button><button data-confirm>Save Changes</button></div></div>';
        const groupField=panel.querySelector("[data-edit-group]"),nameField=panel.querySelector("[data-edit-name]");
        groupField.value=record.group||"";nameField.value=record.templateName||name;
        [...new Set(Object.values(read()).map(item=>String(item.group||"").trim()).filter(Boolean))].forEach(group=>{const option=document.createElement("option");option.value=group;panel.querySelector("#edit-template-groups").appendChild(option);});
        panel.querySelector("[data-cancel]").onclick=()=>panel.remove();
        panel.addEventListener("click",e=>{if(e.target===panel)panel.remove()});
        panel.querySelector("[data-confirm]").onclick=()=>{
          const group=groupField.value.trim().toUpperCase(),newName=nameField.value.trim();
          if(!group||!newName){alert("Enter both a group and template name.");return;}
          const latest=read();
          if(!latest[name]){alert("Template no longer exists. Refresh the library.");return;}
          latest[name]={...latest[name],group,templateName:newName};
          try{localStorage.setItem(KEY,JSON.stringify(latest));}
          catch(e){alert("Unable to update template: "+e.message);return;}
          panel.remove();closeTemplateMenu();openTemplateMenu(openButton);
        };
        document.body.appendChild(panel);groupField.focus();
      };
      actions.append(use,attach,edit);card.append(img,groupLabel,heading,details,actions);grid.append(card);
      cards.push({name,group:record.group||"Uncategorized",tags,card});
    }
    const update=()=>{
      const query=overlay.querySelector("[data-search]").value.toLowerCase();
      const type=overlay.querySelector("[data-type]").value,size=overlay.querySelector("[data-size]").value,group=groupFilter.value;
      cards.forEach(x=>x.card.style.display=(x.name+" "+x.group).toLowerCase().includes(query)&&(!group||x.group===group)&&(!type||x.tags.types.includes(type))&&(!size||x.tags.sizes.includes(size))?"grid":"none");
    };
    overlay.querySelectorAll("input,select").forEach(el=>el.addEventListener("input",update));
    overlay.querySelector("[data-search]").focus();
  };
  openButton?.addEventListener("click", () => openTemplateMenu(openButton));
  document.addEventListener("pointerdown", event => {
    if (templateMenu && !templateMenu.contains(event.target) && event.target !== title && event.target !== openButton) closeTemplateMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && templateMenu) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeTemplateMenu();
    }
  }, true);
  // The large workspace title doubles as a shortcut to the existing
  // template dropdown, so there is only one picker to maintain.
  if (title) {
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-label", "Choose a saved template");
    title.setAttribute("title", "Click to choose a saved template");
    title.addEventListener("click", () => openTemplateMenu(title));
    title.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTemplateMenu(title);
      }
    });
  }
  // Keep the canvas title synchronized when project state changes on Open/New.
  const originalSet = window.setProjectState;
  if (typeof originalSet === "function") {
    window.setProjectState = function (...args) {
      const result = originalSet.apply(this, args);
      label(state().model);
      return result;
    };
  }
  const originalClear = window.clearProjectState;
  if (typeof originalClear === "function") {
    window.clearProjectState = function (...args) {
      const result = originalClear.apply(this, args);
      label(state().model);
      return result;
    };
  }
})();
