/**
 * Codemod: add a dependency array `[]` to any
 *   useEffect(callback)            // no second arg
 *
 * The simple rule: if useEffect is called without a dependency array,
 * we add an empty dependency array to make it run only once on mount.
 */
module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Find all useEffect calls
  root
    .find(j.CallExpression, {
      callee: { name: "useEffect" },
    })
    .forEach(path => {
      const args = path.node.arguments;
      // If there's only one argument (the callback), add an empty array as second argument
      if (args.length === 1) {
        console.log(`Adding empty dependency array to useEffect in ${fileInfo.path}`);
        args.push(j.arrayExpression([]));
      }
    });

  return root.toSource({ quote: 'single' });
};
