import api, { unwrap } from './axiosInstance'
import type { ApiResponse, SubscriptionPlan, UserSubscription, SubscribeRequest } from '@/types'

export const subscriptionsApi = {
  getPlans: () =>
    api.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans').then(unwrap),

  getAllPlans: () =>
    api.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans/all').then(unwrap),

  subscribe: (data: SubscribeRequest) =>
    api.post<ApiResponse<UserSubscription>>('/subscriptions/subscribe', data).then(unwrap),

  getMy: () =>
    api.get<ApiResponse<UserSubscription | null>>('/subscriptions/my').then(r => r.data.data ?? null),

  cancel: () =>
    api.delete('/subscriptions/my'),

  createPlan: (data: Partial<SubscriptionPlan>) =>
    api.post<ApiResponse<SubscriptionPlan>>('/subscriptions/plans', data).then(unwrap),
}
