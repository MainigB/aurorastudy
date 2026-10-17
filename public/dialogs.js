// One sticky close bar for lessons, chapters, tutorials, account and administration.
window.AuroraDialogs={prepare(dialog){
 dialog.querySelector(':scope > .dialog-toolbar')?.remove();
 let body=dialog.querySelector(':scope > .dialog-body');
 if(!body){body=document.createElement('div');body.className='dialog-body';body.append(...dialog.childNodes);dialog.append(body)}
 const close=body.querySelector('button.close')||document.createElement('button');
 close.className='close';close.type='button';close.textContent='×';
 if(!close.hasAttribute('aria-label'))close.setAttribute('aria-label','Fechar janela');
 close.title='Fechar janela';close.onclick=()=>dialog.close();
 const bar=document.createElement('div');bar.className='dialog-toolbar';bar.append(close);dialog.prepend(bar);
 dialog.classList.add('persistent-close');dialog.scrollTop=0;
}};
