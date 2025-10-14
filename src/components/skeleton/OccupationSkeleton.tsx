import React from 'react';
import Skeleton from 'react-loading-skeleton';

const OccupationSkeleton: React.FC = () => {
    return (
        <div className="p-8 space-y-8">
            {/* Work Section Skeleton */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <Skeleton height={24} width={120} />
                    <Skeleton height={32} width={140} />
                </div>

                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="border border-gray-300 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                                <div className="flex-1 space-y-2">
                                    <Skeleton width={180} height={18} />
                                    <Skeleton width={120} height={14} />
                                    <Skeleton width={160} height={14} />
                                </div>
                                <Skeleton circle width={24} height={24} />
                            </div>
                            <Skeleton count={2} height={14} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Education Section Skeleton */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <Skeleton height={24} width={100} />
                    <Skeleton height={32} width={140} />
                </div>

                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="border border-gray-300 rounded-lg p-4 space-y-2">
                            <Skeleton width={200} height={18} />
                            <Skeleton width={160} height={14} />
                            <Skeleton width={120} height={14} />
                            <Skeleton count={2} height={14} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
                <Skeleton width={80} height={36} />
                <Skeleton width={80} height={36} />
            </div>
        </div>
    );
};

export default OccupationSkeleton;
