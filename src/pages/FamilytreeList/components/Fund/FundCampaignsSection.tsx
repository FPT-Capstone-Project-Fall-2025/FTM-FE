import React from 'react';
import { Megaphone, Search, Eye } from 'lucide-react';
import type { FundCampaign } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';

export type CampaignFilter = 'all' | 'active' | 'upcoming' | 'completed' | 'cancelled';

type StatusKey = 'active' | 'upcoming' | 'completed' | 'cancelled';

export interface CampaignMetricSummary {
  raisedAmount: number;
  contributorCount: number;
}

interface FundCampaignsSectionProps {
  campaigns: FundCampaign[];
  campaignSearch: string;
  campaignFilter: CampaignFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: CampaignFilter) => void;
  onRequestCreate: () => void;
  onOpenDetail: (id: string) => void;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getCampaignStatusKey: (status: unknown) => StatusKey;
  getCampaignStatusLabel: (status: StatusKey) => string;
  getCampaignStatusBadgeClasses: (status: StatusKey) => string;
  metrics: Record<string, CampaignMetricSummary>;
}

const FundCampaignsSection: React.FC<FundCampaignsSectionProps> = ({
  campaigns,
  campaignSearch,
  campaignFilter,
  onSearchChange,
  onFilterChange,
  onRequestCreate,
  onOpenDetail,
  formatCurrency,
  formatDate,
  getCampaignStatusKey,
  getCampaignStatusLabel,
  getCampaignStatusBadgeClasses,
  metrics,
}) => {
  const normalizedSearch = campaignSearch.trim().toLowerCase();

  const filteredCampaigns = campaigns.filter(campaign => {
    const statusKey = getCampaignStatusKey(campaign.status);
    const matchesFilter = campaignFilter === 'all' || campaignFilter === statusKey;
    if (!matchesFilter) return false;

    if (!normalizedSearch) return true;

    const nameMatch = campaign.campaignName?.toLowerCase().includes(normalizedSearch);
    const organizerMatch = campaign.accountHolderName?.toLowerCase().includes(normalizedSearch);
    return Boolean(nameMatch || organizerMatch);
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Chiến dịch gây quỹ</h3>
          <p className="text-sm text-gray-500 mt-1">Quản lý và theo dõi các chiến dịch quyên góp của gia phả</p>
        </div>
        <button
          onClick={onRequestCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          type="button"
        >
          <Megaphone className="w-4 h-4" /> Tạo chiến dịch
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={campaignSearch}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc người tổ chức"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={campaignFilter}
          onChange={e => onFilterChange(e.target.value as CampaignFilter)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang diễn ra</option>
          <option value="upcoming">Sắp diễn ra</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-12 h-12 text-gray-300" />}
          title="Chưa có chiến dịch phù hợp"
          description="Hãy tạo chiến dịch mới hoặc điều chỉnh bộ lọc tìm kiếm."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.map(campaign => {
            const statusKey = getCampaignStatusKey(campaign.status);
            const metric = metrics[campaign.id] ?? { raisedAmount: campaign.currentBalance ?? 0, contributorCount: 0 };
            const progress = campaign.fundGoal
              ? Math.min((Number(metric.raisedAmount) / Number(campaign.fundGoal)) * 100, 100)
              : 0;

            return (
              <div key={campaign.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                      {campaign.campaignName}
                    </h4>
                    <p className="text-sm text-gray-600">Tổ chức bởi: {campaign.accountHolderName || '—'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCampaignStatusBadgeClasses(statusKey)}`}>
                    {getCampaignStatusLabel(statusKey)}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">{campaign.campaignDescription || 'Chưa có mô tả'}</p>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
                    <span>Tiến độ</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(metric.raisedAmount)} / {formatCurrency(campaign.fundGoal ?? 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${Number.isFinite(progress) ? progress : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Number.isFinite(progress) ? progress.toFixed(1) : '0.0'}% hoàn thành
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div>
                    <span>Bắt đầu: </span>
                    <span className="font-semibold text-gray-900">{formatDate(campaign.startDate)}</span>
                  </div>
                  <div>
                    <span>Kết thúc: </span>
                    <span className="font-semibold text-gray-900">{formatDate(campaign.endDate)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {metric.contributorCount} người đóng góp
                  </span>
                  <button
                    onClick={() => onOpenDetail(campaign.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                    type="button"
                  >
                    <Eye className="w-4 h-4" /> Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FundCampaignsSection;
