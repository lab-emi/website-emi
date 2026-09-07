// Make content links work at both / and a GitHub Pages project path.
export default function baseLinks() {
  const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
  return (tree) => {
    function visit(node) {
      if (typeof node.url === 'string' && /^\/(?!\/)/.test(node.url)) node.url = base + node.url;
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
