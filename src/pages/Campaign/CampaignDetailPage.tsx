import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import fundService from '@/services/fundService';
import type { FundCampaign } from '@/types/fund';
import { LoadingState, EmptyState } from '@/pages/FamilytreeList/components/Fund/FundLoadingEmpty';

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<FundCampaign | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await fundService.fetchCampaignById(id);
        setCampaign(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState message="Đang tải chi tiết chiến dịch..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <EmptyState title="Không tìm thấy chiến dịch" description="Vui lòng quay lại danh sách." />
        <div className="mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{campaign.campaignName}</h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          Quay lại
        </button>
      </div>
      <p className="text-gray-700">{campaign.campaignDescription || 'Chưa có mô tả'}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Bắt đầu</p>
          <p className="font-semibold text-gray-900">{campaign.startDate || '—'}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Kết thúc</p>
          <p className="font-semibold text-gray-900">{campaign.endDate || '—'}</p>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;


