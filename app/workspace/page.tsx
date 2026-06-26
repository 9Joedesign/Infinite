import Header from '@/components/layout/Header'
import ReportWorkspace from '@/components/workspace/ReportWorkspace'

type WorkspaceSearchParams = Promise<Record<string, string | string[] | undefined>>

const stageMeta = [
  ['需求理解', '提炼核心意图，识别信息缺口'],
  ['需求拆解', 'MECE拆解功能点，含验收标准'],
  ['需求完整性', '检查用户、场景、路径和成功标准是否完整'],
  ['风险假设', '标注隐含假设、验证方法和待确认事项'],
  ['流程与信息架构', '梳理用户路径、业务流转和信息实体'],
  ['设计机会', '识别功能机会、体验机会和风险转机会'],
  ['设计优先级', '按设计价值、实现成本和验证必要性排序'],
]

function NativeAnalysisFallback({ requirement }: { requirement: string }) {
  if (!requirement) return null

  const script = `
(() => {
  const requirement = ${JSON.stringify(requirement)};
  if (!requirement || window.__nativeAnalysisFallbackStarted) return;
  window.__nativeAnalysisFallbackStarted = true;

  const stages = ${JSON.stringify(stageMeta)};
  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const unwrapMarkdownFence = (value) => {
    const trimmed = String(value || '').trim();
    const openingFence = trimmed.match(/^\\\`\\\`\\\`(?:markdown|md)\\s*\\n/i);
    if (!openingFence) return value;
    return trimmed.slice(openingFence[0].length).replace(/\\n\\\`\\\`\\\`[\\t ]*$/u, '').trim();
  };

  const renderInlineMarkdown = (value) => escapeHtml(value)
    .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\\`([^\\\`]+)\\\`/g, '<code>$1</code>');

  const renderTable = (lines) => {
    const rows = lines
      .filter((line) => !/^\\s*\\|?\\s*:?-{3,}:?/.test(line.replace(/\\|/g, '').trim()))
      .map((line) => line.trim().replace(/^\\||\\|$/g, '').split('|').map((cell) => renderInlineMarkdown(cell.trim())));

    if (!rows.length) return '';

    return '<div class="my-5 overflow-x-auto"><table class="w-full border-collapse text-xs">' +
      rows.map((row, index) => {
        const tag = index === 0 ? 'th' : 'td';
        const cellClass = index === 0
          ? 'border border-slate-200 bg-slate-50 px-3 py-2 text-left font-medium text-slate-700'
          : 'border border-slate-200 px-3 py-2 align-top text-slate-700';

        return '<tr>' + row.map((cell) => '<' + tag + ' class="' + cellClass + '">' + cell + '</' + tag + '>').join('') + '</tr>';
      }).join('') +
    '</table></div>';
  };

  const renderMarkdown = (value) => {
    const content = unwrapMarkdownFence(value);
    const lines = String(content || '').split('\\n');
    const parts = [];
    let paragraph = [];
    let list = [];
    let table = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      parts.push('<p class="my-3 text-sm leading-7 text-slate-700">' + renderInlineMarkdown(paragraph.join(' ')) + '</p>');
      paragraph = [];
    };

    const flushList = () => {
      if (!list.length) return;
      parts.push('<ul class="my-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">' + list.map((item) => '<li>' + renderInlineMarkdown(item) + '</li>').join('') + '</ul>');
      list = [];
    };

    const flushTable = () => {
      if (!table.length) return;
      parts.push(renderTable(table));
      table = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        flushTable();
        continue;
      }

      if (/^\\|.+\\|$/.test(trimmed)) {
        flushParagraph();
        flushList();
        table.push(trimmed);
        continue;
      }

      flushTable();

      const heading = trimmed.match(/^(#{1,4})\\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const levelClass = heading[1].length <= 2
          ? 'mt-8 mb-4 text-xl font-semibold tracking-[-0.02em] text-slate-950'
          : 'mt-6 mb-3 text-lg font-semibold tracking-[-0.02em] text-slate-950';
        parts.push('<h3 class="' + levelClass + '">' + renderInlineMarkdown(heading[2]) + '</h3>');
        continue;
      }

      const listItem = trimmed.match(/^[-*]\\s+(.+)$/);
      if (listItem) {
        flushParagraph();
        list.push(listItem[1]);
        continue;
      }

      paragraph.push(trimmed);
    }

    flushParagraph();
    flushList();
    flushTable();

    return '<div class="mt-6 rounded-[24px] border border-black/6 bg-white/70 p-5">' + parts.join('') + '</div>';
  };

  const renderStage = (index, status, content = '') => {
    const statusText = status === 'running' ? '分析中' : status === 'done' ? '已完成' : status === 'error' ? '出错' : '等待中';
    const statusClass = status === 'running' ? 'text-slate-950' : status === 'done' ? 'text-emerald-600' : status === 'error' ? 'text-red-600' : 'text-slate-400';
    return '<section class="rounded-[30px] border border-black/6 bg-white/78 p-5">' +
      '<div class="flex items-start justify-between gap-4">' +
        '<div><div class="flex items-center gap-2"><span class="font-mono text-xs text-slate-400">' + String(index + 1).padStart(2, '0') + '</span><h3 class="text-sm font-semibold text-slate-950">' + escapeHtml(stages[index][0]) + '</h3></div>' +
        '<p class="mt-1 text-xs text-slate-500">' + escapeHtml(stages[index][1]) + '</p></div>' +
        '<span class="text-xs font-medium ' + statusClass + '">' + statusText + '</span>' +
      '</div>' +
      (content ? renderMarkdown(content) : '') +
    '</section>';
  };

  const renderAll = (results, activeIndex, error) => {
    const container = document.getElementById('native-analysis-fallback');
    if (!container) return;
    container.innerHTML =
      '<div class="flex flex-col gap-4">' +
        '<div><p class="text-[11px] uppercase tracking-[0.3em] text-slate-400">Pipeline</p><h2 class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">分析过程</h2></div>' +
        stages.map((_, index) => {
          const content = results[index] || '';
          const status = error && index === activeIndex ? 'error' : content ? 'done' : index === activeIndex ? 'running' : 'idle';
          return renderStage(index, status, error && index === activeIndex ? error : content);
        }).join('') +
      '</div>';
  };

  window.setTimeout(async () => {
    const container = document.getElementById('native-analysis-fallback');
    if (!container || container.textContent.trim()) return;

    const results = {};
    const previousResults = {};
    renderAll(results, 0);

    try {
      for (let stage = 0; stage < stages.length; stage += 1) {
        renderAll(results, stage);
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirement, stage, previousResults }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(errorText || '分析服务暂时不可用，请稍后重试。');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          results[stage] = content;
          renderAll(results, stage);
        }

        const normalizedContent = unwrapMarkdownFence(content);
        previousResults[stage] = normalizedContent;
        results[stage] = normalizedContent;
        renderAll(results, stage + 1);
      }

      if (window.location.search) {
        window.history.replaceState(null, '', '/workspace');
      }
    } catch (error) {
      renderAll(results, Math.min(Object.keys(results).length, stages.length - 1), error instanceof Error ? error.message : '分析服务暂时不可用，请稍后重试。');
    }
  }, 800);
})();
`

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams?: WorkspaceSearchParams
}) {
  const params = searchParams ? await searchParams : {}
  const rawRequirement = params.requirement
  const requirement = Array.isArray(rawRequirement) ? rawRequirement[0] : rawRequirement ?? ''

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(243,246,249,0.9)_34%,rgba(231,236,242,0.82)_72%,rgba(224,230,236,0.76))]">
      <Header />
      <ReportWorkspace />
      <NativeAnalysisFallback requirement={requirement} />
    </div>
  )
}
