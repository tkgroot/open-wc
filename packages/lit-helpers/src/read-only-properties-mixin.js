/** @typedef {import('lit-element').UpdatingElement} UpdatingElement */
/** @typedef {import('lit-element').PropertyDeclaration} PropertyDeclaration */
/** @typedef {PropertyDeclaration & { readOnly?: Boolean }} ReadOnlyPropertyDeclaration */

/**
 * @template T
 * @typedef {new(...args: any[]) => T} Constructor
 * */

/**
 * Enables the `readOnly` option for properties.
 *
 * @param {Constructor<UpdatingElement>} superclass
 */
export const ReadOnlyPropertiesMixin = superclass => {
  /**
   * @type {Map<string, Symbol>}
   * @private
   */
  const readOnlyPropertyNamesMap = new Map();

  return class ReadOnlyPropertiesClass extends superclass {
    /**
     * @inheritdoc
     * @param  {string} name property name
     * @param  {ReadOnlyPropertyDeclaration} options property declaration with optional `readOnly` boolean.
     */
    static createProperty(name, options) {
      let finalOptions = options;

      if (options.readOnly) {
        const privateName = Symbol(name);

        readOnlyPropertyNamesMap.set(name, privateName);

        Object.defineProperty(this.prototype, name, {
          get() {
            return this[privateName];
          },

          set(value) {
            // allow for class field initialization
            /* istanbul ignore if */
            if (this.readOnlyPropertyInitializedMap.get(name)) return;
            this[privateName] = value;
            this.readOnlyPropertyInitializedMap.set(name, true);
          },
        });

        finalOptions = { ...options, noAccessor: true };
      }

      super.createProperty(name, finalOptions);
    }

    /**
     * @type {Map<string, boolean>}
     * @private
     */
    readOnlyPropertyInitializedMap = new Map();

    /**
     * Set read-only properties
     * @param  {Object<string, unknown>}  properties object mapping of properties
     * @private
     */
    async setReadOnlyProperties(properties) {
      await Promise.all(
        Object.entries(properties).map(([name, newVal]) => {
          /** @type {any} */ // https://github.com/microsoft/TypeScript/issues/1863
          const privateName = readOnlyPropertyNamesMap.get(name);
          const oldVal = this[privateName];
          this[privateName] = newVal;
          return this.requestUpdate(name, oldVal);
        }),
      );
    }
  };
};
