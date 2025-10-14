import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const BioAndEventsSkeleton: React.FC = () => {
    return (
        <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
            <div className="bg-white rounded-lg border border-gray-300 p-6">
                {/* Bio Description Section */}
                <div className="mb-6">
                    <Skeleton width={100} height={20} className="mb-3" />
                    <Skeleton height={48} className="rounded" />
                </div>

                {/* Events Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <Skeleton width={100} height={20} />
                        <Skeleton width={100} height={20} />
                    </div>

                    {/* Event Entries */}
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                            >
                                {/* Date Column */}
                                <div className="flex-shrink-0 w-24">
                                    <Skeleton width={70} height={15} />
                                </div>

                                {/* Content Column */}
                                <div className="flex-1">
                                    <Skeleton width="50%" height={20} className="mb-2" />
                                    <Skeleton count={2} height={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <Skeleton width={80} height={40} />
                    <Skeleton width={80} height={40} />
                </div>
            </div>
        </SkeletonTheme>
    )
};

export default BioAndEventsSkeleton;