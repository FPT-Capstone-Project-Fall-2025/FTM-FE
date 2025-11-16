import React from 'react';
import { Megaphone, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  onRequestCreate?: () => void;
  onOpenDetail: (id: string) => void;
  onDonate: (id: string) => void;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getCampaignStatusLabel: (status: StatusKey) => string;
  getCampaignStatusBadgeClasses: (status: StatusKey) => string;
  metrics: Record<string, CampaignMetricSummary>;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  title?: string;
  subtitle?: string;
  showCreateButton?: boolean;
  showStatusFilter?: boolean;
  showAllCampaigns?: boolean;
  categorizedCampaigns?: {
    active: FundCampaign[];
    inactive: FundCampaign[];
  };
}

const FundCampaignsSection: React.FC<FundCampaignsSectionProps> = ({
  campaigns,
  campaignSearch,
  campaignFilter,
  onSearchChange,
  onFilterChange,
  onRequestCreate,
  onOpenDetail,
  onDonate,
  formatCurrency,
  formatDate,
  getCampaignStatusLabel,
  getCampaignStatusBadgeClasses,
  metrics,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  title = 'Chiến dịch gây quỹ',
  subtitle = 'Quản lý và theo dõi các chiến dịch quyên góp của gia phả',
  showCreateButton = true,
  showStatusFilter = true,
  showAllCampaigns: _showAllCampaigns = false,
}) => {
  const normalizedSearch = campaignSearch.trim().toLowerCase();

  const effectiveFilter = showStatusFilter ? campaignFilter : 'all';

  const filteredCampaigns = campaigns.filter(campaign => {
    // Compute status by comparing start/end date with current time
    const now = new Date();
    const start = campaign.startDate ? new Date(campaign.startDate) : null;
    const end = campaign.endDate ? new Date(campaign.endDate) : null;

    let statusKey: StatusKey = 'active';
    if (start && !Number.isNaN(start.getTime()) && now < start) {
      statusKey = 'upcoming';
    } else if (end && !Number.isNaN(end.getTime()) && now > end) {
      statusKey = 'completed';
    } else {
      statusKey = 'active';
    }
    const matchesFilter = effectiveFilter === 'all' || effectiveFilter === statusKey;
    if (!matchesFilter) return false;

    if (!normalizedSearch) return true;

    const nameMatch = campaign.campaignName?.toLowerCase().includes(normalizedSearch);
    const organizerMatch = campaign.accountHolderName?.toLowerCase().includes(normalizedSearch);
    return Boolean(nameMatch || organizerMatch);
  });

  // Sort for "Tất cả": by endDate ascending (nearer end first, nulls last)
  const sortedCampaigns =
    effectiveFilter === 'all'
      ? [...filteredCampaigns].sort((a, b) => {
          const aEnd = a.endDate ? new Date(a.endDate).getTime() : Number.POSITIVE_INFINITY;
          const bEnd = b.endDate ? new Date(b.endDate).getTime() : Number.POSITIVE_INFINITY;
          return aEnd - bEnd;
        })
      : filteredCampaigns;

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageStartIndex =
    totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEndIndex =
    totalCount === 0
      ? 0
      : Math.min(totalCount, pageStartIndex + sortedCampaigns.length - 1);

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        {showCreateButton && onRequestCreate && (
          <button
            onClick={onRequestCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            type="button"
          >
            <Megaphone className="w-4 h-4" /> Tạo chiến dịch
          </button>
        )}
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
        {showStatusFilter && (
          <select
            value={campaignFilter}
            onChange={e => onFilterChange(e.target.value as CampaignFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="active">Đang diễn ra</option>
            <option value="completed">Đã kết thúc</option>
          </select>
        )}
      </div>

      {sortedCampaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-12 h-12 text-gray-300" />}
          title="Chưa có chiến dịch phù hợp"
          description="Hãy tạo chiến dịch mới hoặc điều chỉnh bộ lọc tìm kiếm."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedCampaigns.map(campaign => {
              // Compute status by comparing start/end date with current time
              const now = new Date();
              const start = campaign.startDate ? new Date(campaign.startDate) : null;
              const end = campaign.endDate ? new Date(campaign.endDate) : null;

              let statusKey: StatusKey = 'active';
              if (start && !Number.isNaN(start.getTime()) && now < start) {
                statusKey = 'upcoming';
              } else if (end && !Number.isNaN(end.getTime()) && now > end) {
                statusKey = 'completed';
              } else {
                statusKey = 'active';
              }
              const metric =
                metrics[campaign.id] ?? { raisedAmount: campaign.currentBalance ?? 0, contributorCount: 0 };
              const progress = campaign.fundGoal
                ? Math.min((Number(metric.raisedAmount) / Number(campaign.fundGoal)) * 100, 100)
                : 0;

              const disableDonate = statusKey === 'upcoming' || statusKey === 'completed';
              return (
                <div
                  key={campaign.id}
                  className={`border border-gray-200 rounded-lg p-6 transition-shadow ${
                    disableDonate ? 'bg-gray-200' : 'hover:shadow-lg'
                  } cursor-pointer`}
                  onClick={() => onOpenDetail(campaign.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                        {campaign.campaignName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Tổ chức bởi: {campaign.accountHolderName || '—'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getCampaignStatusBadgeClasses(
                        statusKey
                      )}`}
                    >
                      {getCampaignStatusLabel(statusKey)}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {campaign.campaignDescription || 'Chưa có mô tả'}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
                      <span>Tiến độ</span>
                      <span className="font-semibold text-gray-900">
                        Đã kêu gọi được: {formatCurrency(metric.raisedAmount)} / {formatCurrency(campaign.fundGoal ?? 0)}
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
                    <div className="flex items-center gap-2">
                    {!disableDonate && (
                      <button
                        onClick={e => { e.stopPropagation(); onDonate(campaign.id); }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-semibold"
                        type="button"
                      >
                        Ủng hộ chiến dịch
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {Math.max(totalPages, 1)} · Tổng {totalCount} chiến dịch
                {filteredCampaigns.length > 0 && (
                  <span>
                    {' '}
                    (Hiển thị {pageStartIndex} - {pageEndIndex})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 font-semibold">{currentPage}</span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FundCampaignsSection;
