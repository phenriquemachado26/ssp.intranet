const themeRgb=hex=>{const v=hex.replace('#','');return[0,2,4].map(i=>parseInt(v.slice(i,i+2),16))};
const themeLum=hex=>{const c=themeRgb(hex).map(v=>v/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const themeContrast=hex=>themeLum(hex)>.48?'#172635':'#FFFFFF';
const themeRatio=(a,b)=>{const [x,y]=[themeLum(a),themeLum(b)].sort((m,n)=>n-m);return(x+.05)/(y+.05)};
const themeVisibleOn=(color,background)=>themeRatio(color,background)>=3?color:themeContrast(background);
const themeMix=(hex,target,amount)=>{const a=themeRgb(hex),b=themeRgb(target);return'#'+a.map((v,i)=>Math.round(v+(b[i]-v)*amount).toString(16).padStart(2,'0')).join('')};
// Tipo MIME do favicon a partir do valor resolvido da logomarca (data URL de upload ou arquivo
// estático), para o navegador interpretar corretamente tanto SVG quanto PNG/JPEG/WebP/AVIF.
const faviconType=src=>{const m=/^data:([^;,]+)/.exec(src);if(m)return m[1];if(/\.svg$/i.test(src))return'image/svg+xml';if(/\.(jpe?g)$/i.test(src))return'image/jpeg';if(/\.webp$/i.test(src))return'image/webp';if(/\.avif$/i.test(src))return'image/avif';return'image/png'};
// Logomarcas pensadas para fundo preto (ex.: Governo Tarcísio, Período Eleitoral) costumam ter
// traço claro/branco sobre fundo transparente — exibidas direto como favicon (fundo claro da aba
// do navegador) ficam ilegíveis. Detectado pela cor primária do perfil ser (quase) preto puro;
// nesse caso, compõe o favicon com um fundo preto atrás da logo via canvas. Perfis com cor
// primária clara ou escura-mas-não-preta (ex.: a Paleta Padrão, azul-marinho) continuam exibindo a
// logo normalmente, sem composição.
const isNearBlack=hex=>themeRgb(hex).every(v=>v<=16);
function faviconOnBlackBacking(src){
  return new Promise(resolve=>{
    try{
      const img=new Image();
      img.onload=()=>{
        try{
          const size=64,canvas=document.createElement('canvas');
          canvas.width=size;canvas.height=size;
          const ctx=canvas.getContext('2d');
          ctx.fillStyle='#000000';ctx.fillRect(0,0,size,size);
          const pad=size*0.12,maxDim=size-pad*2;
          const w0=img.naturalWidth||size,h0=img.naturalHeight||size;
          const scale=Math.min(maxDim/w0,maxDim/h0);
          const w=w0*scale,h=h0*scale;
          ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
          resolve(canvas.toDataURL('image/png'));
        }catch{resolve(src)}
      };
      img.onerror=()=>resolve(src);
      img.src=src;
    }catch{resolve(src)}
  });
}

window.applySspTheme=async()=>{
  try{
    const response=await fetch('/api/theme',{cache:'no-store'});const {profile:p}=await response.json();if(!p)return;
    const root=document.documentElement.style;
    const primaryHover=themeMix(p.color_primary,themeLum(p.color_primary)>.48?'#000000':'#FFFFFF',.18);
    const secondaryHover=themeMix(p.color_secondary,themeLum(p.color_secondary)>.48?'#000000':'#FFFFFF',.18);
    root.setProperty('--navy',p.color_primary);root.setProperty('--blue',p.color_primary);root.setProperty('--blue-2',p.color_secondary);root.setProperty('--gold',p.color_detail);if(p.font_family&&p.font_family!=='Padrão institucional'){root.setProperty('--theme-font-body',`"${p.font_family}"`);root.setProperty('--theme-font-heading',`"${p.font_family}"`)}else{root.removeProperty('--theme-font-body');root.removeProperty('--theme-font-heading')}
    root.setProperty('--on-primary',themeContrast(p.color_primary));root.setProperty('--on-secondary',themeContrast(p.color_secondary));root.setProperty('--on-detail',themeContrast(p.color_detail));
    root.setProperty('--primary-hover',primaryHover);root.setProperty('--secondary-hover',secondaryHover);root.setProperty('--on-primary-hover',themeContrast(primaryHover));root.setProperty('--on-secondary-hover',themeContrast(secondaryHover));
    root.setProperty('--primary-on-light',themeVisibleOn(p.color_primary,'#FFFFFF'));root.setProperty('--secondary-on-light',themeVisibleOn(p.color_secondary,'#FFFFFF'));root.setProperty('--secondary-hover-border',themeVisibleOn(secondaryHover,'#FFFFFF'));root.setProperty('--detail-on-light',themeVisibleOn(p.color_detail,'#FFFFFF'));root.setProperty('--detail-on-primary',themeVisibleOn(p.color_detail,p.color_primary));
    const resolvedLogo=window.sspResolveImageSrc(p.logo,'assets/images');
    document.querySelectorAll('[data-theme-logo],img[src$="logo-ssp.svg"]').forEach(img=>{img.src=resolvedLogo;img.dataset.themeLogo='true'});
    document.querySelectorAll('.brand span').forEach(el=>{const small=el.querySelector('small');el.textContent=p.page_title;if(small)el.prepend(small)});
    const favicon=document.querySelector('#site-favicon');
    if(favicon){
      if(isNearBlack(p.color_primary)){
        const composed=await faviconOnBlackBacking(resolvedLogo);
        favicon.type='image/png';favicon.href=composed;
      }else{
        favicon.type=faviconType(resolvedLogo);favicon.href=resolvedLogo;
      }
    }
  }catch(error){console.warn('Não foi possível aplicar o perfil visual.',error)}
};
window.applySspTheme();

const escapeFooter=v=>{const el=document.createElement('div');el.textContent=v??'';return el.innerHTML.replace(/"/g,'&quot;').replace(/'/g,'&#39;')};
// Logomarcas reais (claro/escuro, 512px) em assets/images/social/<slug>-tema-<claro|escuro>-512.png.
// A variante é escolhida pelo contraste do fundo do rodapé (cor primária do perfil ativo): fundo
// escuro usa a logo "tema-escuro" (clara, legível sobre fundo escuro); fundo claro usa "tema-claro".
const SOCIAL_NETWORKS=[['social_facebook','Facebook','facebook'],['social_instagram','Instagram','instagram'],['social_youtube','YouTube','youtube'],['social_whatsapp','WhatsApp','whatsapp']];
window.applySspFooter=async()=>{
  try{
    const [footerResponse,themeResponse]=await Promise.all([fetch('/api/footer-settings',{cache:'no-store'}),fetch('/api/theme',{cache:'no-store'})]);
    const {settings:s}=await footerResponse.json();if(!s)return;
    const {profile:p}=await themeResponse.json();
    const socialTheme=(p&&themeLum(p.color_primary)>.48)?'tema-claro':'tema-escuro';
    const emailItem=document.querySelector('#footer-email-item'),emailLink=document.querySelector('#footer-email-link'),phoneItem=document.querySelector('#footer-phone-item'),phoneLink=document.querySelector('#footer-phone-link'),addressLine=document.querySelector('#footer-address-line'),addressText=document.querySelector('#footer-address-line .footer-info-text'),hoursLine=document.querySelector('#footer-hours-line'),hoursText=document.querySelector('#footer-hours-line .footer-info-text'),developedBy=document.querySelector('#footer-developed-by'),social=document.querySelector('#footer-social');
    if(emailItem&&emailLink){if(s.support_email){emailLink.href=`mailto:${s.support_email}`;emailLink.textContent=s.support_email;emailItem.hidden=false}else emailItem.hidden=true}
    if(phoneItem&&phoneLink){if(s.phone){phoneLink.href=`tel:${s.phone.replace(/\D/g,'')}`;phoneLink.textContent=s.phone;phoneItem.hidden=false}else phoneItem.hidden=true}
    if(addressLine&&addressText){const parts=[s.address_street&&(s.address_number?`${s.address_street}, ${s.address_number}`:s.address_street),s.address_district,s.address_city&&s.address_state?`${s.address_city} - ${s.address_state}`:(s.address_city||s.address_state||''),s.address_zip].filter(Boolean);if(parts.length){addressText.textContent=parts.join(' - ');addressLine.hidden=false}else addressLine.hidden=true}
    if(hoursLine&&hoursText){if(s.business_hours){hoursText.textContent=s.business_hours;hoursLine.hidden=false}else hoursLine.hidden=true}
    if(developedBy)developedBy.textContent=s.developed_by||'';
    if(social){const links=SOCIAL_NETWORKS.filter(([key])=>s[key]).map(([key,label,slug])=>`<a href="${escapeFooter(s[key])}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}"><img src="assets/images/social/${slug}-${socialTheme}-512.png" alt="${label}" width="16" height="16"></a>`);social.innerHTML=links.join('');social.hidden=!links.length}
  }catch(error){console.warn('Não foi possível aplicar as informações do rodapé.',error)}
};
window.applySspFooter();
