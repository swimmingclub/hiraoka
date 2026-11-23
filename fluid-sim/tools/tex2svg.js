// 標準入力の JSON 配列 [{tex, display}] を受け取り、{key: svg} を標準出力に返す
// key は display ? 'D:'+tex : tex
const {mathjax} = require('mathjax-full/js/mathjax.js');
const {TeX} = require('mathjax-full/js/input/tex.js');
const {AllPackages} = require('mathjax-full/js/input/tex/AllPackages.js');
const {SVG} = require('mathjax-full/js/output/svg.js');
const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', {InputJax: new TeX({packages: AllPackages}), OutputJax: new SVG({fontCache: 'none'})});
let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  const items = JSON.parse(input), out = {}, errors = [];
  for (const {tex, display} of items) {
    const node = doc.convert(tex, {display: !!display, em: 16, ex: 8, containerWidth: 800});
    const svg = adaptor.innerHTML(node);
    if (svg.includes('data-mjx-error') || svg.includes('merror')) errors.push(tex);
    out[(display ? 'D:' : '') + tex] = svg;
  }
  if (errors.length) { console.error('TeX errors:\n' + errors.join('\n')); process.exitCode = 1; }
  process.stdout.write(JSON.stringify(out));
});
