import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Zap, Star } from 'lucide-react'
import { subscriptionsApi } from '@/api/subscriptionsApi'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { Spinner } from '@/components/UI/Spinner'
import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { SubscriptionPlan } from '@/types'
import { clsx } from 'clsx'

function PlanCard({
  plan, currentPlanId, onSubscribe, loading,
}: {
  plan: SubscriptionPlan
  currentPlanId?: string
  onSubscribe: (id: string) => void
  loading: boolean
}) {
  const isCurrent = plan.id === currentPlanId
  const isPremium = plan.name === 'Premium'

  return (
    <div className={clsx(
      'relative flex flex-col rounded-2xl border-2 p-6 transition-all duration-200',
      isPremium
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800',
    )}>
      {isPremium && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" /> Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
            {plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly}`}
          </span>
          {plan.priceMonthly > 0 && <span className="text-gray-500 dark:text-gray-400">/month</span>}
        </div>
        {plan.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {[
          plan.maxReservationsPerMonth >= 999999 ? 'Unlimited reservations' : `${plan.maxReservationsPerMonth} reservations/month`,
          `Up to ${plan.maxReservationDurationMinutes} min per session`,
          plan.discountPercentage > 0 ? `${plan.discountPercentage}% discount on charging` : 'Standard pricing',
          plan.priorityBooking ? 'Priority booking access' : 'Standard booking',
        ].map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <Check className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <Button variant="secondary" disabled className="w-full">Current Plan</Button>
      ) : (
        <Button
          className="w-full"
          variant={isPremium ? 'primary' : 'secondary'}
          loading={loading}
          onClick={() => onSubscribe(plan.id)}
        >
          {plan.priceMonthly === 0 ? 'Get Started Free' : 'Subscribe'}
        </Button>
      )}
    </div>
  )
}

export function SubscriptionPage() {
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionsApi.getPlans(),
  })

  const { data: mySub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.getMy(),
    enabled: isAuthenticated,
  })

  const subscribe = useMutation({
    mutationFn: (planId: string) => subscriptionsApi.subscribe({ planId }),
    onSuccess: () => {
      toast.success('Subscribed successfully!')
      qc.invalidateQueries({ queryKey: ['my-subscription'] })
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Subscription failed')
    },
  })

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          Choose your plan
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Start for free and upgrade when you need more reservations, longer sessions, or priority access.
        </p>
        {mySub?.currentlyActive && (
          <div className="inline-flex items-center gap-2 mt-4 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm px-4 py-2 rounded-full">
            <Zap className="w-4 h-4" />
            Current plan: <strong>{mySub.plan.name}</strong> (expires {mySub.endDate})
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={mySub?.plan.id}
              loading={subscribe.isPending}
              onSubscribe={(id) => {
                if (!isAuthenticated) {
                  toast.error('Please login to subscribe')
                  return
                }
                subscribe.mutate(id)
              }}
            />
          ))}
        </div>
      )}

      {!isAuthenticated && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
          <Link to="/login" className="text-primary-600 hover:underline font-medium">Login</Link>
          {' '}or{' '}
          <Link to="/register" className="text-primary-600 hover:underline font-medium">create an account</Link>
          {' '}to subscribe.
        </p>
      )}
    </div>
  )
}
