/**
 * @file
 * Olark-provided JS to load chat widget.
 */

(function(o,l,a,r,k,y){if(o.olark)return; r="script";y=l.createElement(r);r=l.getElementsByTagName(r)[0]; y.async=1;y.src="//"+a;r.parentNode.insertBefore(y,r); y=o.olark=function(){k.s.push(arguments);k.t.push(+new Date)}; y.extend=function(i,j){y("extend",i,j)}; y.identify=function(i){y("identify",k.i=i)}; y.configure=function(i,j){y("configure",i,j);k.c[i]=j}; k=y._={s:[],t:[+new Date],c:{},l:a}; })(window,document,"static.olark.com/jsclient/loader.js");
olark.configure('system.hb_primary_color', '#6aaf58');
olark.configure('system.hb_chatbox_size', 'md');
olark.configure('system.hb_show_button_text', false);
olark.configure('system.hb_custom_style', {
  general: {
    fonts: ['MontserratVariable', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
    corners: 'soft',
    secondaryColor: '#6aaf58'
  }
});
olark.identify('3820-172-10-7725');
