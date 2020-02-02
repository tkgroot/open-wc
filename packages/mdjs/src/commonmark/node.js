function isContainer(node) {
  switch (node._type) {
    case 'document':
    case 'block_quote':
    case 'list':
    case 'item':
    case 'paragraph':
    case 'heading':
    case 'emph':
    case 'strong':
    case 'link':
    case 'image':
    case 'custom_inline':
    case 'custom_block':
      return true;
    default:
      return false;
  }
}

const resumeAt = function(node, entering) {
  this.current = node;
  this.entering = entering === true;
};

const next = function() {
  const cur = this.current;
  const { entering } = this;

  if (cur === null) {
    return null;
  }

  const container = isContainer(cur);

  if (entering && container) {
    if (cur._firstChild) {
      this.current = cur._firstChild;
      this.entering = true;
    } else {
      // stay on node but exit
      this.entering = false;
    }
  } else if (cur === this.root) {
    this.current = null;
  } else if (cur._next === null) {
    this.current = cur._parent;
    this.entering = false;
  } else {
    this.current = cur._next;
    this.entering = true;
  }

  return { entering, node: cur };
};

const NodeWalker = function(root) {
  return {
    current: root,
    root,
    entering: true,
    next,
    resumeAt,
  };
};

const Node = function(nodeType, sourcepos) {
  this._type = nodeType;
  this._parent = null;
  this._firstChild = null;
  this._lastChild = null;
  this._prev = null;
  this._next = null;
  this._sourcepos = sourcepos;
  this._lastLineBlank = false;
  this._lastLineChecked = false;
  this._open = true;
  this._string_content = null;
  this._literal = null;
  this._listData = {};
  this._info = null;
  this._destination = null;
  this._title = null;
  this._isFenced = false;
  this._fenceChar = null;
  this._fenceLength = 0;
  this._fenceOffset = null;
  this._level = null;
  this._onEnter = null;
  this._onExit = null;
};

const proto = Node.prototype;

Object.defineProperty(proto, 'isContainer', {
  get() {
    return isContainer(this);
  },
});

Object.defineProperty(proto, 'type', {
  get() {
    return this._type;
  },
});

Object.defineProperty(proto, 'firstChild', {
  get() {
    return this._firstChild;
  },
});

Object.defineProperty(proto, 'lastChild', {
  get() {
    return this._lastChild;
  },
});

Object.defineProperty(proto, 'next', {
  get() {
    return this._next;
  },
});

Object.defineProperty(proto, 'prev', {
  get() {
    return this._prev;
  },
});

Object.defineProperty(proto, 'parent', {
  get() {
    return this._parent;
  },
});

Object.defineProperty(proto, 'sourcepos', {
  get() {
    return this._sourcepos;
  },
});

Object.defineProperty(proto, 'literal', {
  get() {
    return this._literal;
  },
  set(s) {
    this._literal = s;
  },
});

Object.defineProperty(proto, 'destination', {
  get() {
    return this._destination;
  },
  set(s) {
    this._destination = s;
  },
});

Object.defineProperty(proto, 'title', {
  get() {
    return this._title;
  },
  set(s) {
    this._title = s;
  },
});

Object.defineProperty(proto, 'info', {
  get() {
    return this._info;
  },
  set(s) {
    this._info = s;
  },
});

Object.defineProperty(proto, 'level', {
  get() {
    return this._level;
  },
  set(s) {
    this._level = s;
  },
});

Object.defineProperty(proto, 'listType', {
  get() {
    return this._listData.type;
  },
  set(t) {
    this._listData.type = t;
  },
});

Object.defineProperty(proto, 'listTight', {
  get() {
    return this._listData.tight;
  },
  set(t) {
    this._listData.tight = t;
  },
});

Object.defineProperty(proto, 'listStart', {
  get() {
    return this._listData.start;
  },
  set(n) {
    this._listData.start = n;
  },
});

Object.defineProperty(proto, 'listDelimiter', {
  get() {
    return this._listData.delimiter;
  },
  set(delim) {
    this._listData.delimiter = delim;
  },
});

Object.defineProperty(proto, 'onEnter', {
  get() {
    return this._onEnter;
  },
  set(s) {
    this._onEnter = s;
  },
});

Object.defineProperty(proto, 'onExit', {
  get() {
    return this._onExit;
  },
  set(s) {
    this._onExit = s;
  },
});

Node.prototype.appendChild = function(child) {
  child.unlink();
  child._parent = this;
  if (this._lastChild) {
    this._lastChild._next = child;
    child._prev = this._lastChild;
    this._lastChild = child;
  } else {
    this._firstChild = child;
    this._lastChild = child;
  }
};

Node.prototype.prependChild = function(child) {
  child.unlink();
  child._parent = this;
  if (this._firstChild) {
    this._firstChild._prev = child;
    child._next = this._firstChild;
    this._firstChild = child;
  } else {
    this._firstChild = child;
    this._lastChild = child;
  }
};

Node.prototype.unlink = function() {
  if (this._prev) {
    this._prev._next = this._next;
  } else if (this._parent) {
    this._parent._firstChild = this._next;
  }
  if (this._next) {
    this._next._prev = this._prev;
  } else if (this._parent) {
    this._parent._lastChild = this._prev;
  }
  this._parent = null;
  this._next = null;
  this._prev = null;
};

Node.prototype.insertAfter = function(sibling) {
  sibling.unlink();
  sibling._next = this._next;
  if (sibling._next) {
    sibling._next._prev = sibling;
  }
  sibling._prev = this;
  this._next = sibling;
  sibling._parent = this._parent;
  if (!sibling._next) {
    sibling._parent._lastChild = sibling;
  }
};

Node.prototype.insertBefore = function(sibling) {
  sibling.unlink();
  sibling._prev = this._prev;
  if (sibling._prev) {
    sibling._prev._next = sibling;
  }
  sibling._next = this;
  this._prev = sibling;
  sibling._parent = this._parent;
  if (!sibling._prev) {
    sibling._parent._firstChild = sibling;
  }
};

Node.prototype.walker = function() {
  const walker = new NodeWalker(this);
  return walker;
};

export default Node;

/* Example of use of walker:

 var walker = w.walker();
 var event;

 while (event = walker.next()) {
 console.log(event.entering, event.node.type);
 }

 */
