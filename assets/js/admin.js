const $=s=>document.querySelector(s);const digits=v=>v.replace(/\D/g,'');const formatCpf=v=>digits(v).slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
['#cpf','#request-cpf'].forEach(s=>$(s)?.addEventListener('input',e=>e.target.value=formatCpf(e.target.value)));

const cpfInput=$('#cpf'),cpfOptions=$('#cpf-options');
const roleIcon=role=>role==='master'?'★':'●';
const roleLabel=role=>role==='master'?'Administrador Master':'Administrador do Site';
function renderCpfOptions(){
  const accounts=window.sspDemoAccounts?window.sspDemoAccounts():[];
  cpfOptions.innerHTML=accounts.map(a=>`<button type="button" class="cpf-option" role="option" data-cpf="${a.cpf}" data-password="${a.password}"><span class="cpf-option-icon role-${a.role}" aria-hidden="true">${roleIcon(a.role)}</span><span class="sr-only">${roleLabel(a.role)}</span><span class="cpf-option-name">${a.name}</span><span class="cpf-option-cpf">${formatCpf(a.cpf)}</span></button>`).join('');
}
function openCpfOptions(){renderCpfOptions();cpfOptions.hidden=false;cpfInput.setAttribute('aria-expanded','true')}
function closeCpfOptions(){cpfOptions.hidden=true;cpfInput.setAttribute('aria-expanded','false')}
cpfInput?.addEventListener('click',openCpfOptions);
cpfInput?.addEventListener('focus',openCpfOptions);
cpfOptions?.addEventListener('click',e=>{const option=e.target.closest('.cpf-option');if(!option)return;cpfInput.value=formatCpf(option.dataset.cpf);$('#password').value=option.dataset.password;closeCpfOptions();$('#password').focus()});
document.addEventListener('click',e=>{if(!e.target.closest('.cpf-field'))closeCpfOptions()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCpfOptions()});
$('.password-toggle').addEventListener('click',e=>{const input=$('#password');const show=input.type==='password';input.type=show?'text':'password';e.currentTarget.setAttribute('aria-pressed',String(show));e.currentTarget.setAttribute('aria-label',show?'Ocultar senha':'Visualizar senha')});
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const msg=$('#login-message');msg.textContent='';try{const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf:digits($('#cpf').value),password:$('#password').value})});const data=await response.json();if(!response.ok)throw new Error(data.error);location.href='painel.html'}catch(error){msg.textContent=error.message||'Não foi possível entrar.'}});
const dialog=$('#request-dialog');$('#request-open').onclick=()=>dialog.showModal();$('.dialog-close').onclick=()=>dialog.close();
$('#request-form').addEventListener('submit',async e=>{e.preventDefault();const fields=['#request-name','#request-cpf','#request-email','#request-unit'];if(fields.some(s=>!$(s).value.trim())){$('#request-message').textContent='Preencha todos os campos.';return}const response=await fetch('/api/access-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('#request-name').value,cpf:$('#request-cpf').value,email:$('#request-email').value,unit:$('#request-unit').value})});const data=await response.json();$('#request-message').style.color=response.ok?'#19734a':'#b42318';$('#request-message').textContent=data.message||data.error;if(response.ok)setTimeout(()=>{dialog.close();e.target.reset();$('#request-message').textContent=''},1300)});
