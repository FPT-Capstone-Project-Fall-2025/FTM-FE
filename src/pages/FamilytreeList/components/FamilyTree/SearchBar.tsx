// components/SearchBar.tsx
import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import type { FamilyMember } from '@/types/familytree';

interface SearchBarProps {
    onSelectMember: (memberId: string) => void;
}

const SearchBar = ({ onSelectMember }: SearchBarProps) => {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FamilyMember[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const members = useAppSelector(state => state.familyTree.members);

    // Search logic
    const handleSearch = useCallback((value: string) => {
        setQuery(value);

        if (value.trim() === '') {
            setSearchResults([]);
            setIsOpen(false);
            return;
        }

        const lowercaseQuery = value.toLowerCase();
        const results = Object.values(members).filter(member =>
            member.name.toLowerCase().includes(lowercaseQuery) ||
            member.birthday?.includes(value) ||
            member.bio?.toLowerCase().includes(lowercaseQuery)
        );

        setSearchResults(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
    }, [members]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || searchResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < searchResults.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && searchResults[selectedIndex]) {
                    handleSelectMember(searchResults[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    // Handle member selection
    const handleSelectMember = (member: FamilyMember) => {
        onSelectMember(member.id);
        setQuery(member.name);
        setIsOpen(false);
    };

    // Clear search
    const handleClear = () => {
        setQuery('');
        setSearchResults([]);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.search-container')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="search-container relative w-80">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && searchResults.length > 0 && setIsOpen(true)}
                    placeholder="Tìm kiếm thành viên..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                    {searchResults.map((member, index) => (
                        <button
                            key={member.id}
                            onClick={() => handleSelectMember(member)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors ${index === selectedIndex ? 'bg-blue-50' : ''
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full ${member.gender === 1 ? 'bg-pink-300' : 'bg-blue-300'
                                } flex items-center justify-center flex-shrink-0`}>
                                <span className="text-white font-semibold">
                                    {member.name.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">Sinh: {member.birthday}</div>
                            </div>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${member.gender === 1 ? 'bg-pink-400' : 'bg-blue-400'
                                }`} />
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && query && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 z-50">
                    Không tìm thấy kết quả
                </div>
            )}
        </div>
    );
};

export default SearchBar;