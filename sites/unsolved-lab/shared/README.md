# unsolved-lab shared kit

Zero-dependency vanilla JS + CSS shared by all sprint apps. Include in every app:

```html
<link rel="stylesheet" href="../shared/kit.css">
<script src="../shared/kit.js"></script>
```

Neutral dark theme by default; apps override accents via CSS vars (`--accent`, `--accent2`, `--good`, `--warn`, `--bad`, `--bg`, `--panel`, `--panel2`, `--ink`, `--muted`, `--line`).

## API

### Random / ids
- `Kit.rng(seedStr)` → deterministic PRNG function returning values in `[0,1)`. Same seed → same sequence. `var r = Kit.rng('lvl-7'); r()`
- `Kit.pick(fn, arr)` → one random element of `arr`. `Kit.pick(r, ['a','b'])`
- `Kit.int(fn, a, b)` → random integer in `[a,b]` inclusive. `Kit.int(r, 1, 6)`
- `Kit.shuffle(fn, arr)` → new shuffled array (input untouched). `Kit.shuffle(r, [1,2,3])`
- `Kit.uid(p)` → unique string id, e.g. `row-labc1-3x9k`. `Kit.uid('row')`

### DOM
- `Kit.esc(s)` → HTML-escaped string. `Kit.esc('<b>x</b>')`
- `Kit.el(html)` → first Element parsed from an HTML string. `Kit.el('<div class="k-card">hi</div>')`

### Storage
- `Kit.store(ns)` → `{get(k,fallback), set(k,v), del(k)}` backed by localStorage JSON under `ulab:<ns>:`. `Kit.store('game').set('best', 42)`

### Chrome
- `Kit.nav({title, sub, actions:[{label,href}]})` → prepends fixed top nav bar to body, returns the element. `Kit.nav({title:'Quiz', actions:[{label:'Home',href:'index.html'}]})`
- `Kit.toast(msg, kind)` → toast, `kind` = info|ok|warn|bad. `Kit.toast('Saved','ok')`
- `Kit.modal({title, body /*html string*/, actions:[{label,primary,fn}]})` → opens modal, returns `close()`. `var close = Kit.modal({title:'Sure?', body:'...', actions:[{label:'Cancel'},{label:'Delete',primary:true,fn:doDelete}]})`
- `Kit.tabs(host, [{id,label,render(el)}])` → tab bar; `render` is called with the content element on each tab select. `Kit.tabs('#app',[{id:'a',label:'A',render:function(el){el.textContent='A'}}])`

### Data displays
- `Kit.table(host, cols[{key,label,fmt?,num?}], rows, {search:true,pageSize:25})` → sortable, searchable, paginated table. `fmt(value,row)` custom cell HTML. `Kit.table('#t',[{key:'name',label:'Name'},{key:'score',label:'Score',num:true}],[{name:'Ada',score:9}])`
- `Kit.bars(host, items[{label,value,color?}], {height:220})` → horizontal bar chart, inline SVG. `Kit.bars('#b',[{label:'A',value:40},{label:'B',value:70}])`
- `Kit.line(host, series[{name,color,points:[numbers]}], {height:220, ylabel:''})` → multi-series line chart with axes, inline SVG. `Kit.line('#l',[{name:'v1',points:[1,2,3]}])`
- `Kit.donut(host, items[{label,value,color}], {height:220})` → donut chart with legend, inline SVG. `Kit.donut('#d',[{label:'A',value:1,color:'#5b8def'}])`
- `Kit.timeline(host, events[{t,title,body,kind}])` → vertical timeline; `kind` colors the dot. `Kit.timeline('#t',[{t:'Jan 1',title:'Launch',kind:'ok'}])`
- `Kit.graph(host, {nodes:[{id,label,sub?,color?}], edges:[{a,b,label?}]})` → layered top-down DAG as inline SVG with labeled edges. `Kit.graph('#g',{nodes:[{id:'a',label:'Start'},{id:'b',label:'End'}],edges:[{a:'a',b:'b',label:'then'}]})`
- `Kit.badge(txt, kind)` → HTML string for an inline badge, `kind` = info|ok|warn|bad. `el.innerHTML = Kit.badge('NEW','ok')`
- `Kit.kpi(host, {label,value,delta?,hint?})` → KPI card; negative-leading `delta` renders red, else green. `Kit.kpi('#k',{label:'Users',value:'1.2k',delta:'+5%',hint:'this week'})`
- `Kit.empty(host, title, sub, actionLabel?, actionFn?)` → empty state with optional action button. `Kit.empty('#e','No results','Try a different query')`

### Formatting
- `Kit.money(n)` → `"$1,234"`. `Kit.money(1234)`
- `Kit.num(n)` → compact: `"1.2k"`, `"3.4M"`, `"2B"`. `Kit.num(1200)`
- `Kit.pct(x)` → `"12%"` (x as fraction). `Kit.pct(0.12)`
- `Kit.when(d)` → `"Mar 4, 2026"` (Date or parseable). `Kit.when(new Date(2026,2,4))`
- `Kit.initials(name)` → `"AB"`. `Kit.initials('Ada Byron')`

### Clipboard
- `Kit.copy(txt)` → copies to clipboard, toasts confirmation (with `execCommand` fallback). `Kit.copy('hello')`

## CSS classes

Layout: `.k-wrap` (max-width 1180px container), `.k-grid` (responsive auto-fill grid), `.k-split` (2-col at ≥760px, 1-col below), `.k-card`, `.k-hero`, `.k-muted`.

Components: `.k-nav` (+ `.k-nav-inner`, `.k-nav-title`, `.k-nav-sub`, `.k-nav-actions`), `.k-btn`, `.k-primary`, `.k-input`, `.k-select`, `.k-table` (wrapper) + `.k-num`, `.k-table-search`, `.k-table-pager`, `.k-badge` (`.k-badge-ok/.k-badge-warn/.k-badge-bad/.k-badge-info`), `.k-tabs` + `.k-tab(.k-active)` + `.k-tab-pane`, `.k-kpi` (+ `.k-kpi-label/value/delta/hint`, `.k-pos/.k-neg`), `.k-toast` (`.k-toast-ok/warn/bad/show`) in `.k-toasts`, `.k-modal-overlay` + `.k-modal` (+ `-head/body/actions/-x`), `.k-empty` (+ `-title/-action`), `.k-chart` (+ `-label/-val`, `.k-gridline`, `.k-donut-total`, `.k-graph-node/label`), `.k-timeline` (+ `.k-tl-item/dot/body/t/title/desc`).

All buttons, inputs, selects, and tabs have `touch-action: manipulation` — double-tap zoom is suppressed on tap targets; pinch zoom still works.
