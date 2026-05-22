import { Link } from 'react-router-dom'
import { Zap, Map, Calendar, Shield, Clock, CreditCard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/UI/Button'
import { Card } from '@/components/UI/Card'
import { useAuthStore } from '@/store/authStore'

const features = [
  { icon: <Map className="w-6 h-6 text-primary-600" />, title: 'Live Station Map', desc: 'Find EV charging stations near you with real-time availability.' },
  { icon: <Calendar className="w-6 h-6 text-primary-600" />, title: 'Smart Reservations', desc: 'Book charging slots in advance — no more waiting in line.' },
  { icon: <Zap className="w-6 h-6 text-primary-600" />, title: 'Fast Charging', desc: 'Access 50–350 kW chargers supporting CCS, CHAdeMO, and more.' },
  { icon: <Shield className="w-6 h-6 text-primary-600" />, title: 'Secure & Reliable', desc: 'JWT-secured accounts with real-time status updates.' },
  { icon: <Clock className="w-6 h-6 text-primary-600" />, title: 'Real-Time Updates', desc: 'Live WebSocket feeds for charger availability and booking status.' },
  { icon: <CreditCard className="w-6 h-6 text-primary-600" />, title: 'Flexible Plans', desc: 'Free, Basic, and Premium plans with discounts and priority access.' },
]

export function HomePage() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="text-center py-20 px-4">
        <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-4 h-4" /> EV Charging — Simplified
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
          Charge smarter,<br />
          <span className="text-primary-600">drive further.</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Find, reserve, and manage EV charging stations in real time. Never worry about availability again.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/map">
            <Button size="lg" className="gap-2">
              <Map className="w-5 h-5" /> Explore Map <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link to="/register">
              <Button size="lg" variant="secondary">Get Started Free</Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16">
          {[['3+', 'Stations'], ['5+', 'Chargers'], ['24/7', 'Support']].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-primary-600">{num}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Everything you need
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
          ChargeLink brings together all the tools you need for a seamless EV charging experience.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon, title, desc }) => (
            <Card key={title} className="hover:shadow-md transition-shadow duration-200">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl w-fit mb-4">{icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-16 text-center">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to start charging?</h2>
            <p className="text-primary-200 mb-8 text-lg">
              Create a free account and reserve your first charging slot in minutes.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="bg-white text-primary-700 hover:bg-gray-100">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
