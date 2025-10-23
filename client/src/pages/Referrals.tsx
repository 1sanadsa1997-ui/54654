import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function Referrals() {
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [codeRes, listRes, statsRes] = await Promise.all([
        api.get('/referrals/code'),
        api.get('/referrals/list'),
        api.get('/referrals/stats'),
      ]);
      setReferralCode(codeRes.data.link);
      setReferrals(listRes.data.referrals);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load referrals');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral link copied!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Referrals</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.total || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats?.approved || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Bonus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                ${stats?.totalBonus?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="flex-1 px-4 py-2 border rounded"
              />
              <Button onClick={copyLink}>Copy</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral List</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No referrals yet</p>
            ) : (
              <div className="space-y-4">
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex justify-between items-center border-b pb-4">
                    <div>
                      <p className="font-semibold">{ref.referred.fullName}</p>
                      <p className="text-sm text-gray-500">@{ref.referred.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${ref.bonus}</p>
                      <p className="text-sm text-gray-500">
                        {ref.referred.isApproved ? 'Approved' : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
