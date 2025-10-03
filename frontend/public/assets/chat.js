const API_BASE = "http://127.0.0.1:8000/api/v1";

const msgs = document.getElementById('msgs');
const chips = document.getElementById('chips');
const field = document.getElementById('field');
document.getElementById('send').onclick = send;

function addMsg(text, cls){
  const div = document.createElement('div');
  div.className = 'msg ' + cls;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

async function loadChips(){
  try{
    const r = await fetch(`${API_BASE}/faqs`);
    const data = await r.json();
    chips.innerHTML = '';
    data.forEach(d=>{
      const b=document.createElement('button');
      b.className='chip';
      b.textContent=d.question;
      b.onclick=()=>{ field.value=d.question; send(); };
      chips.appendChild(b);
    });
  }catch(e){
    console.error(e);
  }
}

async function send(){
  const text = field.value.trim(); if(!text) return;
  addMsg(text, 'user'); field.value='';
  addMsg('Pensando...', 'bot'); const ghost = msgs.lastChild;
  try{
    const r = await fetch(`${API_BASE}/ask`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message: text})
    });
    const data = await r.json();
    ghost.remove();
    if(data.status === 'answered'){
      addMsg(data.answer, 'bot');
    } else if(data.status === 'suggestions'){
      addMsg('¿Quisiste decir?', 'bot');
      data.suggestions.forEach(s => addMsg('• ' + s, 'bot'));
    } else {
      addMsg('No comprendí tu consulta. Prueba con:', 'bot');
      (data.suggestions || []).slice(0,5).forEach(s => addMsg('• ' + s, 'bot'));
    }
  }catch(e){
    ghost.remove();
    addMsg('Error de red. Intenta de nuevo.', 'bot');
  }
}

(async function init(){
  // Comprobar salud opcional
  try{ await fetch(`${API_BASE}/health`); }catch(_){}
  await loadChips();
})();
