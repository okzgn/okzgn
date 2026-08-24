const XVars_prefix = '${';
const XVars_postfix = '}';
const XVarsNamesRE = /[^a-z_0-9]/i;
const XVarsNodes = new WeakMap();
const XVarsSuscriptors = new Map();
const XElementDataStr = 'data-x';
const XElements = new WeakSet();

const UpdaterObserver = UpdaterStart(document, {
    childList: {
        [Node.ELEMENT_NODE]: {
            added: (elementNode, parentNode) => {
                const hasX = elementNode.hasAttribute(XElementDataStr);
                if (hasX) {
                  console.log('X ELEMENT ADDED:', elementNode);
                  XElements.add(elementNode);
                }
            },
            removed: (elementNode, parentNode) => {
                if (XElements.has(elementNode)) {
                  XElements.delete(elementNode);
                  console.log('X ELEMENT REMOVED:', elementNode);
                }
            }
        },

        [Node.COMMENT_NODE]: {
            added: (commentNode, parentNode, newValue) => {
                // console.log('COMMENT ADD:', commentNode, parentNode, newValue);
            },
            removed: (commentNode, parentNode, oldValue) => {
                // console.log('COMMENT DEL:', commentNode, parentNode, oldValue);
            }
        },

        [Node.TEXT_NODE]: {
            added: (textNode, parentNode, newValue) => {
                if (newValue.trim() === '') { return; }

                const XParent = parentNode.closest('[' + XElementDataStr + ']');
                if (XParent && XElements.has(XParent) && newValue.includes(XVars_prefix)) {
                  const varsList = [];
                  const varsTemplate = [];
                  const vars = newValue
                    .split(XVars_prefix)
                    .reduce((array, str) => {
                      if (str.includes(XVars_postfix)){
                        let varPos = str.indexOf(XVars_postfix) + 1;
                        let varName = str.slice(0, varPos - 1);

                        if (!XVarsNamesRE.test(varName)) {
                          varsList.push(varName);
                          varsTemplate.push(() => { return XState[varName]; });
                          varsTemplate.push(str.slice(varPos));
                          return array.concat(str);
                        }
                      }

                      varsTemplate.push(str);
                      return array.concat(str);
                    }, []);

                  if (varsList.length) {
                    for (let varName of varsList) {
                      if (!XVarsSuscriptors.has(varName)) {
                        XVarsSuscriptors.set(varName, new Set());
                      }

                      const xVarSuscriptor = XVarsSuscriptors.get(varName);
                      if (!xVarSuscriptor.has(textNode)){
                        xVarSuscriptor.add(textNode);
                      }

                      if (!XVarsNodes.has(textNode)) {
                        XVarsNodes.set(textNode, varsTemplate);
                      }
                    }

                    console.log('X TEXT ADD:', varsList, varsTemplate);
                    for (let varName of varsList) {
                      XState[varName] = XState[varName] || '';
                    }
                  }
                }
            },
            removed: (textNode, parentNode, oldValue) => {
                // console.log('TEXT DEL:', textNode, parentNode, oldValue);
                for (const [varName, nodeSet] of XVarsSuscriptors.entries()) {
                    nodeSet.delete(textNode);
                    if (nodeSet.size === 0) {
                        XVarsSuscriptors.delete(varName);
                    }
                }
            }
        }
    }
});

let XStateBatchState = false;
let XStateBatch = new Set();

const XState = State({
    onSet: (mutation) => {
      const xVarName = mutation.path[0];

      if (XVarsSuscriptors.has(xVarName)) {
        const subs = XVarsSuscriptors.get(xVarName);
        if (subs) {
            for (const node of subs) {
                XStateBatch.add(node);
            }
        }
      }

      XStateBatchExecution();
    },

    onDelete: (mutation) => {

    }
});

function XStateBatchExecution() {
  if (XStateBatchState) {
    return;
  }

  XStateBatchState = true;

  requestAnimationFrame(() => {
    XStateBatchState = false;

    for (const suscriptor of XStateBatch.values()) {
      if (XVarsNodes.has(suscriptor)) {
        const varValue = XVarsNodes.get(suscriptor).map((varPart) => (typeof varPart === 'function' ? varPart() : varPart)).join('');

        switch (suscriptor.nodeType) {
          case Node.TEXT_NODE:
            suscriptor.data = varValue;
          break;
        }
      }
    }

    XStateBatch.clear();
  });
}
