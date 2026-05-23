import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Policy } from '../entities/master/policy.entity';
import { CurrentUser } from '@/common/context/request-context.service';

type PolicyEffect = 'allow' | 'deny';

type MatchOperator = {
  eq?: unknown;
  ne?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  exists?: boolean;
};

type ConditionValue =
  | string
  | number
  | boolean
  | null
  | unknown[]
  | MatchOperator;

type PolicyConditions = {
  effect?: PolicyEffect;
  roles?: string[];
  user?: Record<string, ConditionValue>;
  tenant?: Record<string, ConditionValue>;
  request?: {
    method?: string | string[] | MatchOperator;
    params?: Record<string, ConditionValue>;
    query?: Record<string, ConditionValue>;
    body?: Record<string, ConditionValue>;
  };
};

type AbacContext = {
  user: CurrentUser;
  request: Request;
};

@Injectable()
export class AbacService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
  ) {}

  async evaluate(
    permission: string,
    context: AbacContext,
  ): Promise<PolicyEffect | 'none'> {
    const [resource, action] = permission.split('.');

    if (!resource || !action) {
      return 'none';
    }

    const policies = await this.policyRepo.find({
      where: {
        tenant_id: context.user.tenant_id,
        resource,
        action,
      },
      order: {
        created_at: 'ASC',
      },
    });

    let decision: PolicyEffect | 'none' = 'none';

    for (const policy of policies) {
      const conditions = policy.conditions as PolicyConditions;

      if (!this.matches(conditions, context)) {
        continue;
      }

      const effect = conditions.effect ?? 'allow';

      if (effect === 'deny') {
        return 'deny';
      }

      decision = 'allow';
    }

    return decision;
  }

  private matches(conditions: PolicyConditions, context: AbacContext): boolean {
    if (!conditions || typeof conditions !== 'object') {
      return true;
    }

    if (conditions.roles?.length) {
      const roles = context.user.roles ?? [];
      if (!conditions.roles.some((role) => roles.includes(role))) {
        return false;
      }
    }

    if (
      conditions.user &&
      !this.matchesObject(conditions.user, {
        id: context.user.id,
        email: context.user.email,
        tenant_id: context.user.tenant_id,
      })
    ) {
      return false;
    }

    if (
      conditions.tenant &&
      !this.matchesObject(conditions.tenant, {
        id: context.user.tenant_id,
      })
    ) {
      return false;
    }

    if (conditions.request) {
      const request = context.request;

      if (
        conditions.request.method &&
        !this.matchesValue(conditions.request.method, request.method)
      ) {
        return false;
      }

      if (
        conditions.request.params &&
        !this.matchesObject(conditions.request.params, request.params)
      ) {
        return false;
      }

      if (
        conditions.request.query &&
        !this.matchesObject(conditions.request.query, request.query)
      ) {
        return false;
      }

      if (
        conditions.request.body &&
        !this.matchesObject(
          conditions.request.body,
          this.asRecord(request.body),
        )
      ) {
        return false;
      }
    }

    return true;
  }

  private matchesObject(
    expected: Record<string, ConditionValue>,
    actual: Record<string, unknown>,
  ): boolean {
    return Object.entries(expected).every(([key, condition]) =>
      this.matchesValue(condition, actual?.[key]),
    );
  }

  private matchesValue(condition: ConditionValue, actual: unknown) {
    if (Array.isArray(condition)) {
      return condition.includes(actual);
    }

    if (this.isOperator(condition)) {
      if (
        'exists' in condition &&
        condition.exists !== (actual !== undefined)
      ) {
        return false;
      }

      if ('eq' in condition && actual !== condition.eq) {
        return false;
      }

      if ('ne' in condition && actual === condition.ne) {
        return false;
      }

      if ('in' in condition && !condition.in?.includes(actual)) {
        return false;
      }

      if ('notIn' in condition && condition.notIn?.includes(actual)) {
        return false;
      }

      return true;
    }

    return condition === actual;
  }

  private isOperator(value: unknown): value is MatchOperator {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return false;
    }

    return ['eq', 'ne', 'in', 'notIn', 'exists'].some((key) => key in value);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return {};
    }

    return value as Record<string, unknown>;
  }
}
