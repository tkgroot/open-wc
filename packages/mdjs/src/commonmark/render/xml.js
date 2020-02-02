import Renderer from './renderer.js';
import { escapeXml } from '../common.js';

const reXMLTag = /\<[^>]*\>/;

function toTagName(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

function XmlRenderer(options) {
  options = options || {};

  this.disableTags = 0;
  this.lastOut = '\n';

  this.indentLevel = 0;
  this.indent = '  ';

  this.options = options;
}

function render(ast) {
  this.buffer = '';

  let attrs;
  let tagname;
  const walker = ast.walker();
  let event;
  let node;
  let entering;
  let container;
  let selfClosing;
  let nodetype;

  const { options } = this;

  if (options.time) {
    console.time('rendering');
  }

  this.buffer += '<?xml version="1.0" encoding="UTF-8"?>\n';
  this.buffer += '<!DOCTYPE document SYSTEM "CommonMark.dtd">\n';

  while ((event = walker.next())) {
    entering = event.entering;
    node = event.node;
    nodetype = node.type;

    container = node.isContainer;

    selfClosing =
      nodetype === 'thematic_break' || nodetype === 'linebreak' || nodetype === 'softbreak';

    tagname = toTagName(nodetype);

    if (entering) {
      attrs = [];

      switch (nodetype) {
        case 'document':
          attrs.push(['xmlns', 'http://commonmark.org/xml/1.0']);
          break;
        case 'list':
          if (node.listType !== null) {
            attrs.push(['type', node.listType.toLowerCase()]);
          }
          if (node.listStart !== null) {
            attrs.push(['start', String(node.listStart)]);
          }
          if (node.listTight !== null) {
            attrs.push(['tight', node.listTight ? 'true' : 'false']);
          }
          var delim = node.listDelimiter;
          if (delim !== null) {
            let delimword = '';
            if (delim === '.') {
              delimword = 'period';
            } else {
              delimword = 'paren';
            }
            attrs.push(['delimiter', delimword]);
          }
          break;
        case 'code_block':
          if (node.info) {
            attrs.push(['info', node.info]);
          }
          break;
        case 'heading':
          attrs.push(['level', String(node.level)]);
          break;
        case 'link':
        case 'image':
          attrs.push(['destination', node.destination]);
          attrs.push(['title', node.title]);
          break;
        case 'custom_inline':
        case 'custom_block':
          attrs.push(['on_enter', node.onEnter]);
          attrs.push(['on_exit', node.onExit]);
          break;
        default:
          break;
      }
      if (options.sourcepos) {
        const pos = node.sourcepos;
        if (pos) {
          attrs.push([
            'sourcepos',
            `${String(pos[0][0])}:${String(pos[0][1])}-${String(pos[1][0])}:${String(pos[1][1])}`,
          ]);
        }
      }

      this.cr();
      this.out(this.tag(tagname, attrs, selfClosing));
      if (container) {
        this.indentLevel += 1;
      } else if (!container && !selfClosing) {
        const lit = node.literal;
        if (lit) {
          this.out(this.esc(lit));
        }
        this.out(this.tag(`/${tagname}`));
      }
    } else {
      this.indentLevel -= 1;
      this.cr();
      this.out(this.tag(`/${tagname}`));
    }
  }
  if (options.time) {
    console.timeEnd('rendering');
  }
  this.buffer += '\n';
  return this.buffer;
}

function out(s) {
  if (this.disableTags > 0) {
    this.buffer += s.replace(reXMLTag, '');
  } else {
    this.buffer += s;
  }
  this.lastOut = s;
}

function cr() {
  if (this.lastOut !== '\n') {
    this.buffer += '\n';
    this.lastOut = '\n';
    for (let i = this.indentLevel; i > 0; i--) {
      this.buffer += this.indent;
    }
  }
}

// Helper function to produce an XML tag.
function tag(name, attrs, selfclosing) {
  let result = `<${name}`;
  if (attrs && attrs.length > 0) {
    let i = 0;
    let attrib;
    while ((attrib = attrs[i]) !== undefined) {
      result += ` ${attrib[0]}="${this.esc(attrib[1])}"`;
      i++;
    }
  }
  if (selfclosing) {
    result += ' /';
  }
  result += '>';
  return result;
}

// quick browser-compatible inheritance
XmlRenderer.prototype = Object.create(Renderer.prototype);

XmlRenderer.prototype.render = render;
XmlRenderer.prototype.out = out;
XmlRenderer.prototype.cr = cr;
XmlRenderer.prototype.tag = tag;
XmlRenderer.prototype.esc = escapeXml;

export default XmlRenderer;
