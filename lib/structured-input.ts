import type { StructuredInputState } from './types'

const GOAL_PATTERNS = [
  /(提升|提高|优化|增加)(.+?)(率|效率|转化|留存|激活|点击|绑定)/,
  /(冷启动|激活|留存|转化|推荐|需求分析|拆解|监控|提醒)/,
]

const USER_PATTERNS = [
  /(面向|针对|用户是|目标用户是|用户为)(.+?)(。|，|\n|$)/,
  /(泛电商用户|商家|运营|产品经理|分析师|创作者|达人)/,
]

const SCENARIO_PATTERNS = [
  /(场景是|核心场景是|在.+?时|当用户.+?时)(.+?)(。|，|\n|$)/,
  /(冷启动|首次进入|权限拦截|浏览|搜索|上传|生成报告|接收提醒)/,
]

const SUCCESS_PATTERNS = [
  /(成功标准|指标|核心指标|目标指标)(.+?)(。|，|\n|$)/,
  /(绑定率|激活率|点击率|留存率|转化率|完成率)/,
]

function normalizeMatch(match?: string | null) {
  return match?.trim().replace(/\s+/g, ' ') ?? ''
}

function findPattern(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const result = text.match(pattern)
    if (result) {
      return normalizeMatch(result[2] || result[0])
    }
  }
  return ''
}

export function extractStructuredInput(text: string): Partial<StructuredInputState> {
  const normalized = text.trim()
  if (!normalized) return {}

  return {
    businessGoal: findPattern(normalized, GOAL_PATTERNS),
    targetUser: findPattern(normalized, USER_PATTERNS),
    scenario: findPattern(normalized, SCENARIO_PATTERNS),
    successCriteria: findPattern(normalized, SUCCESS_PATTERNS),
  }
}
