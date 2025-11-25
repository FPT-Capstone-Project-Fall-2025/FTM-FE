import React from 'react';

const EventCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse flex flex-col h-[520px]">
      {/* Header Bar */}
      <div className="h-2 bg-gradient-to-r from-gray-300 to-gray-400 flex-shrink-0"></div>
      
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-gray-200 flex-shrink-0"></div>
      
      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Type Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Title */}
        <div className="space-y-2 mb-4">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Members */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default EventCardSkeleton;

