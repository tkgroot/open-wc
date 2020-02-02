```js script
import { html, render } from '/node_modules/lit-html/lit-html.js';
import { DemoWcCard } from '/demo/src/DemoWcCard.js';

import '/demo/demo-wc-card.js';
```

# Demo Web Component Card

A component meant to display small information with additional data on the back.

### Installation

```bash
yarn add @foo/demo-wc-card
```

```js
import '@foo/demo-wc-card/demo-wc-card.js';
```

## An html story

Just html, only supports title

```html story
<demo-wc-card back-side>Hello World</demo-wc-card>
```

[using a search](http://google.com)
