import Skeleton from "react-loading-skeleton";

const DetailInformationSkeleton = () => {
    return (
        <div className="grid grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-3">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 text-center">
                    <Skeleton circle width={128} height={128} className="mx-auto mb-4" />
                    <Skeleton width="70%" height={20} className="mx-auto mb-2" />
                    <Skeleton width="60%" height={15} className="mx-auto mb-6" />
                    <Skeleton width={160} height={40} className="mx-auto" />
                </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-9">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(10)].map((_, i) => (
                            <div key={i}>
                                <Skeleton width="40%" height={16} className="mb-2" />
                                <Skeleton width="100%" height={48} />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                        <Skeleton width={120} height={40} />
                        <Skeleton width={120} height={40} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailInformationSkeleton;