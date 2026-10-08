const KEY="meds_v1";
let meds=JSON.parse(localStorage.getItem(KEY)||"[]");
let editing=null;
const $=id=>document.getElementById(id);
const days=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

function save(){localStorage.setItem(KEY,JSON.stringify(meds));render()}
function fmt(t){if(!t)return "";let [h,m]=t.split(":").map(Number);let ap=h>=12?"PM":"AM";h=h%12||12;return `${h}:${String(m).padStart(2,"0")} ${ap}`}
function activeToday(m){
  const d=new Date().getDay();
  return m.freq==="daily" || (m.freq==="weekdays"&&d>=1&&d<=5) || (m.freq==="weekends"&&(d===0||d===6));
}
function dateKey(){return new Date().toISOString().slice(0,10)}
function doseKey(id){return `dose_${id}_${dateKey()}`}
function render(){
  $("today").textContent=new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});
  const active=meds.filter(activeToday).sort((a,b)=>a.time.localeCompare(b.time));
  const now=new Date().toTimeString().slice(0,5);
  const next=active.find(m=>m.time>=now)||active[0];
  $("nextName").textContent=next?next.name:"Sin medicamentos";
  $("nextTime").textContent=next?`${fmt(next.time)} · ${next.dose}`:"Agrega tu primer recordatorio";
  $("todayList").innerHTML=active.length?active.map(m=>{
    const done=localStorage.getItem(doseKey(m.id))==="1";
    return `<div class="item ${done?"done":""}">
      <button class="check" onclick="toggleDose('${m.id}')">${done?"✓":"○"}</button>
      <div class="info"><div class="name">${esc(m.name)}</div><div class="dose">${esc(m.dose)}</div></div>
      <div class="time">${fmt(m.time)}</div>
    </div>`}).join(""):`<div class="empty">No tienes tomas programadas para hoy.</div>`;
  $("medList").innerHTML=meds.length?meds.map(m=>`<div class="item">
    <div class="pill-icon" style="font-size:21px;padding:8px">💊</div>
    <div class="info"><div class="name">${esc(m.name)}</div><div class="dose">${esc(m.dose)} · ${fmt(m.time)}</div></div>
    <div class="actions"><button class="small" onclick="editMed('${m.id}')">✎</button><button class="small" onclick="deleteMed('${m.id}')">🗑</button></div>
  </div>`).join(""):`<div class="empty">Aquí aparecerán tus medicamentos.</div>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
window.toggleDose=id=>{const k=doseKey(id);localStorage.setItem(k,localStorage.getItem(k)==="1"?"0":"1");render()}
window.deleteMed=id=>{if(confirm("¿Eliminar este recordatorio?")){meds=meds.filter(m=>m.id!==id);save()}}
window.editMed=id=>{const m=meds.find(x=>x.id===id);if(!m)return;editing=id;$("modalTitle").textContent="Editar medicamento";$("name").value=m.name;$("dose").value=m.dose;$("time").value=m.time;$("freq").value=m.freq;$("modal").classList.remove("hidden")}
function openNew(){editing=null;$("modalTitle").textContent="Nuevo medicamento";["name","dose","time"].forEach(x=>$(x).value="");$("freq").value="daily";$("modal").classList.remove("hidden")}
$("addBtn").onclick=openNew;
$("closeBtn").onclick=()=>$("modal").classList.add("hidden");
$("modal").onclick=e=>{if(e.target===$("modal"))$("modal").classList.add("hidden")};
$("saveBtn").onclick=()=>{
  const name=$("name").value.trim(),dose=$("dose").value.trim(),time=$("time").value;
  if(!name||!dose||!time){alert("Completa nombre, dosis y hora.");return}
  const data={name,dose,time,freq:$("freq").value};
  if(editing) Object.assign(meds.find(m=>m.id===editing),data); else meds.push({id:crypto.randomUUID(),...data});
  save();$("modal").classList.add("hidden");
};
$("notifyBtn").onclick=async()=>{
  if(!("Notification"in window)){alert("Este navegador no permite notificaciones.");return}
  const p=await Notification.requestPermission();
  if(p==="granted") new Notification("Recordatorios activados",{body:"Te avisaré cuando sea la hora programada."});
  else alert("No se concedieron permisos de notificación.");
};
if("serviceWorker"in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
