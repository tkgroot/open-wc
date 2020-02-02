import encode from 'mdurl/encode.js';
import * as entities from 'entities';

const C_BACKSLASH = 92;

const ENTITY = '&(?:#x[a-f0-9]{1,6}|#[0-9]{1,7}|[a-z][a-z0-9]{1,31});';

const TAGNAME = '[A-Za-z][A-Za-z0-9-]*';
const ATTRIBUTENAME = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
const UNQUOTEDVALUE = '[^"\'=<>`\\x00-\\x20]+';
const SINGLEQUOTEDVALUE = "'[^']*'";
const DOUBLEQUOTEDVALUE = '"[^"]*"';
const ATTRIBUTEVALUE = `(?:${UNQUOTEDVALUE}|${SINGLEQUOTEDVALUE}|${DOUBLEQUOTEDVALUE})`;
const ATTRIBUTEVALUESPEC = `${'(?:' + '\\s*=' + '\\s*'}${ATTRIBUTEVALUE})`;
const ATTRIBUTE = `${'(?:' + '\\s+'}${ATTRIBUTENAME}${ATTRIBUTEVALUESPEC}?)`;
const OPENTAG = `<${TAGNAME}${ATTRIBUTE}*` + `\\s*/?>`;
const CLOSETAG = `</${TAGNAME}\\s*[>]`;
const HTMLCOMMENT = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->';
const PROCESSINGINSTRUCTION = '[<][?].*?[?][>]';
const DECLARATION = '<![A-Z]+' + '\\s+[^>]*>';
const CDATA = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>';
const HTMLTAG = `(?:${OPENTAG}|${CLOSETAG}|${HTMLCOMMENT}|${PROCESSINGINSTRUCTION}|${DECLARATION}|${CDATA})`;
const reHtmlTag = new RegExp(`^${HTMLTAG}`, 'i');

const reBackslashOrAmp = /[\\&]/;

const ESCAPABLE = '[!"#$%&\'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]';

const reEntityOrEscapedChar = new RegExp(`\\\\${ESCAPABLE}|${ENTITY}`, 'gi');

const XMLSPECIAL = '[&<>"]';

const reXmlSpecial = new RegExp(XMLSPECIAL, 'g');

const unescapeChar = function(s) {
  if (s.charCodeAt(0) === C_BACKSLASH) {
    return s.charAt(1);
  }
  return entities.decodeHTML(s);
};

// Replace entities and backslash escapes with literal characters.
const unescapeString = function(s) {
  if (reBackslashOrAmp.test(s)) {
    return s.replace(reEntityOrEscapedChar, unescapeChar);
  }
  return s;
};

const normalizeURI = function(uri) {
  try {
    return encode(uri);
  } catch (err) {
    return uri;
  }
};

const replaceUnsafeChar = function(s) {
  switch (s) {
    case '&':
      return '&amp;';
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    case '"':
      return '&quot;';
    default:
      return s;
  }
};

const escapeXml = function(s) {
  if (reXmlSpecial.test(s)) {
    return s.replace(reXmlSpecial, replaceUnsafeChar);
  }
  return s;
};

export { unescapeString, normalizeURI, escapeXml, reHtmlTag, OPENTAG, CLOSETAG, ENTITY, ESCAPABLE };
