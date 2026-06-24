import mermaid from 'mermaid'

export function configureMermaid(background = 'transparent') {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    suppressErrorRendering: true,
    theme: 'base',
    themeVariables: {
      background,
      primaryColor: '#ffffff',
      primaryBorderColor: '#d8e0ea',
      primaryTextColor: '#0f172a',
      lineColor: '#94a3b8',
      edgeLabelBackground: '#ffffff',
      tertiaryColor: '#f8fafc',
      fontFamily: 'var(--font-geist-sans)',
    },
    flowchart: {
      curve: 'basis',
      htmlLabels: true,
      padding: 18,
    },
  })
}

export async function renderMermaid(id: string, chart: string, background = 'transparent') {
  configureMermaid(background)
  await mermaid.parse(chart, { suppressErrors: false })
  return mermaid.render(id, chart)
}

export function removeMermaidErrorArtifacts() {
  document.querySelectorAll('[id^="dmermaid-"], .mermaid, svg[aria-roledescription="error"]').forEach((node) => {
    const text = node.textContent || ''
    if (text.includes('Syntax error in text') || text.includes('mermaid version')) {
      node.remove()
    }
  })
}
