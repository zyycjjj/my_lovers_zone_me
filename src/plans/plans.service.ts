import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PlanKey = 'experience' | 'pro' | 'team';
export type PlanLimitWindow = 'daily' | 'total';

export type PlanConfigItem = {
  key: PlanKey;
  name: string;
  desc: string;
  priceFen: number;
  priceText: string;
  suffix: string;
  durationDays: number | null;
  quotaLimit: number;
  quotaWindow: PlanLimitWindow;
  features: string[];
  action: string;
  enabled: boolean;
  recommended: boolean;
};

const CONFIG_KEY = 'plan_config';

const DEFAULT_PLANS: PlanConfigItem[] = [
  {
    key: 'experience',
    name: '体验版',
    desc: '先看结果，再决定是否继续',
    priceFen: 100,
    priceText: '¥1',
    suffix: '/7天',
    durationDays: 7,
    quotaLimit: 3,
    quotaWindow: 'total',
    features: ['3条内容生成', '1次爆款复刻', '结果截断预览', '7天体验期', '可升级正式套餐'],
    action: '立即体验',
    enabled: true,
    recommended: false,
  },
  {
    key: 'pro',
    name: '专业版',
    desc: '适合持续做内容的个人创作者',
    priceFen: 990,
    priceText: '¥9.9',
    suffix: '/月',
    durationDays: 30,
    quotaLimit: 10,
    quotaWindow: 'daily',
    features: ['每日10条生成', '完整内容解锁', '模板保存', '社群入口', '适合稳定日更'],
    action: '立即订阅',
    enabled: true,
    recommended: true,
  },
  {
    key: 'team',
    name: '终身版',
    desc: '适合长期轻量使用',
    priceFen: 6600,
    priceText: '¥66',
    suffix: '/终身',
    durationDays: null,
    quotaLimit: 5,
    quotaWindow: 'daily',
    features: ['每日5条生成', '永久模板', '完整内容解锁', '社群入口', '长期复用'],
    action: '立即购买',
    enabled: true,
    recommended: false,
  },
];

function parseConfig(raw?: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as { plans?: unknown };
  } catch {
    return null;
  }
}

function normalizePlan(input: unknown, fallback: PlanConfigItem): PlanConfigItem {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const features = Array.isArray(raw.features)
    ? raw.features.filter((item): item is string => typeof item === 'string')
    : fallback.features;
  const quotaWindow = raw.quotaWindow === 'total' || raw.quotaWindow === 'daily' ? raw.quotaWindow : fallback.quotaWindow;
  const durationDays =
    raw.durationDays === null
      ? null
      : typeof raw.durationDays === 'number' && Number.isFinite(raw.durationDays) && raw.durationDays > 0
        ? Math.floor(raw.durationDays)
        : fallback.durationDays;

  return {
    key: fallback.key,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fallback.name,
    desc: typeof raw.desc === 'string' && raw.desc.trim() ? raw.desc.trim() : fallback.desc,
    priceFen:
      typeof raw.priceFen === 'number' && Number.isFinite(raw.priceFen) && raw.priceFen > 0
        ? Math.round(raw.priceFen)
        : fallback.priceFen,
    priceText: typeof raw.priceText === 'string' && raw.priceText.trim() ? raw.priceText.trim() : fallback.priceText,
    suffix: typeof raw.suffix === 'string' ? raw.suffix.trim() : fallback.suffix,
    durationDays,
    quotaLimit:
      typeof raw.quotaLimit === 'number' && Number.isFinite(raw.quotaLimit) && raw.quotaLimit >= 0
        ? Math.floor(raw.quotaLimit)
        : fallback.quotaLimit,
    quotaWindow,
    features,
    action: typeof raw.action === 'string' && raw.action.trim() ? raw.action.trim() : fallback.action,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : fallback.enabled,
    recommended: typeof raw.recommended === 'boolean' ? raw.recommended : fallback.recommended,
  };
}

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma as unknown as {
      appConfig: any;
    };
  }

  private mergePlans(config: { plans?: unknown } | null) {
    const rawPlans = Array.isArray(config?.plans) ? config.plans : [];
    return DEFAULT_PLANS.map((fallback) => {
      const raw = rawPlans.find(
        (item) =>
          item &&
          typeof item === 'object' &&
          (item as Record<string, unknown>).key === fallback.key,
      );
      return normalizePlan(raw, fallback);
    });
  }

  async getPlanConfig() {
    const row = await this.db.appConfig.findUnique({
      where: { key: CONFIG_KEY },
      select: { value: true },
    });
    return { plans: this.mergePlans(parseConfig(row?.value)) };
  }

  async getEnabledPlans() {
    const config = await this.getPlanConfig();
    return config.plans.filter((plan) => plan.enabled);
  }

  async getPlan(planKey: PlanKey) {
    const config = await this.getPlanConfig();
    return config.plans.find((plan) => plan.key === planKey && plan.enabled) ?? null;
  }

  async savePlanConfig(input: { plans?: unknown }) {
    const normalized = { plans: this.mergePlans(input) };
    await this.db.appConfig.upsert({
      where: { key: CONFIG_KEY },
      create: {
        key: CONFIG_KEY,
        value: JSON.stringify(normalized),
      },
      update: {
        value: JSON.stringify(normalized),
      },
    });
    return normalized;
  }
}
