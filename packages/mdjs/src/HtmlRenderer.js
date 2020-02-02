import { Node, HtmlRenderer as CmHtmlRenderer } from './commonmark/index.js';
import { Parser } from './Parser.js';

export class HtmlRenderer {
  constructor() {
    this.parser = new Parser();
    this.options = {
      storyTag: 'div',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  process(parsed) {
    let templateCounter = 0;
    const templateStories = [];

    const walker = parsed.walker();
    let event = walker.next();
    while (event) {
      const { node } = event;
      if (event.entering && node.type === 'code_block') {
        if (node.info === 'js story') {
          const htmlBlock = new Node('html_block');
          htmlBlock.literal = `<div id="story-${templateCounter}"></div>`;
          node.insertAfter(htmlBlock);
          templateStories.push(node.literal);
          templateCounter += 1;
          node.unlink();
        }
        if (node.info === 'html story') {
          const htmlBlock = new Node('html_block');
          htmlBlock.literal = node.literal;
          node.insertAfter(htmlBlock);
          node.unlink();
        }
      }
      event = walker.next();
    }

    return parsed;
  }

  render(parsed) {
    const processed = this.process(parsed);
    const foo = new CmHtmlRenderer();
    return foo.render(processed);
  }
}
