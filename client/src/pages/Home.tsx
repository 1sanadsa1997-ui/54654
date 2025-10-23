import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <img src="/logo.png" alt="PromoHive" className="h-24 mx-auto mb-8" />
          <h1 className="text-5xl font-bold mb-4">PromoHive</h1>
          <p className="text-2xl mb-2">Global Promo Network</p>
          <p className="text-xl opacity-90">Complete tasks, earn rewards, withdraw USDT</p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Earn Money</h3>
            <p>Complete simple tasks and earn real money instantly</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Refer Friends</h3>
            <p>Invite friends and earn up to $180 per referral</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-2">Withdraw USDT</h3>
            <p>Cash out to USDT (TRC20/ERC20/BEP20)</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/register">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6">
              Get Started - $5 Welcome Bonus
            </Button>
          </Link>
          <p className="text-white mt-4">
            Already have an account?{' '}
            <Link href="/login" className="underline font-semibold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
