
interface MdNode {
  type: string
  value?: string
  children?: MdNode[]
  depth?: number
  [key: string]: unknown
}

function nodeText(node: MdNode): string {
  if (!node) return ''
  if (node.value) return node.value
  if (node.children) return node.children.map(nodeText).join(' ').trim()
  return ''
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function remarkSections() {
  return (tree: { children: MdNode[] }) => {
    const result: MdNode[] = []
    let current: MdNode | null = null

    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 1) {
        const title = nodeText(node)
        current = {
          type: 'mdxJsxFlowElement',
          name: 'Section',
          attributes: [
            { type: 'mdxJsxAttribute', name: 'title', value: title },
            { type: 'mdxJsxAttribute', name: 'id', value: slugify(title) },
          ],
          children: [],
        }
        result.push(current)
      } else if (current) {
        ;(current!.children as MdNode[]).push(node)
      } else {
        result.push(node)
      }
    }

    tree.children = result
  }
}
