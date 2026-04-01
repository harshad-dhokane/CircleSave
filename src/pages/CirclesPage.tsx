import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCard } from '@/components/circles/CircleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCircles } from '@/hooks/useCircle';
import { getCategoryLabel, CircleCategory } from '@/lib/constants';
import { Search, Plus, X, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: '0', label: getCategoryLabel(CircleCategory.FRIENDS) },
  { value: '1', label: getCategoryLabel(CircleCategory.FAMILY) },
  { value: '2', label: getCategoryLabel(CircleCategory.COWORKERS) },
  { value: '3', label: getCategoryLabel(CircleCategory.NEIGHBORS) },
  { value: '4', label: getCategoryLabel(CircleCategory.INTEREST) },
];

export function CirclesPage() {
  const { circles, isLoading, error } = useCircles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Filter circles
  const filteredCircles = circles.filter(circle => {
    const matchesSearch = circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         circle.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || circle.category.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort circles
  const sortedCircles = [...filteredCircles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.createdAt - a.createdAt;
      case 'almostFull':
        return (b.currentMembers / b.maxMembers) - (a.currentMembers / a.maxMembers);
      case 'lowestAmount':
        return Number(a.monthlyAmount - b.monthlyAmount);
      case 'highestAmount':
        return Number(b.monthlyAmount - a.monthlyAmount);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      {/* Page Header */}
      <div className="content-divider-bottom bg-white border-b-[2px] border-black">
        <div className="page-shell py-8 md:py-9">
          <div className="animate-fade-in flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-[2.7rem] font-black mb-2">Discover Circles</h1>
              <p className="text-gray-600 font-medium text-base md:text-lg">
                Find a savings circle that fits your goals
              </p>
            </div>
            <Link to="/circles/create">
              <Button className="neo-button-primary">
                <Plus className="w-5 h-5 mr-2" />
                Create Circle
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="content-divider-bottom bg-white border-b-[2px] border-black">
        <div className="page-shell py-4 md:py-5">
          <div className="animate-fade-in stagger-1 flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search circles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neo-input pl-12 w-full"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="neo-input w-full lg:w-52">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="border-[2px] border-black">
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="neo-input w-full lg:w-52">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="border-[2px] border-black">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="almostFull">Almost Full</SelectItem>
                <SelectItem value="lowestAmount">Lowest Amount</SelectItem>
                <SelectItem value="highestAmount">Highest Amount</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchQuery || selectedCategory !== 'all' || sortBy !== 'newest') && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-[2px] border-black font-bold text-[15px]"
              >
                <X className="w-5 h-5 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="page-shell py-8 md:py-10">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-14 h-14 animate-spin mx-auto mb-4 text-[#FF6B6B]" />
            <p className="font-bold text-gray-600 text-lg">Loading circles from blockchain...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 bg-red-100 border-[2px] border-black mx-auto mb-6 flex items-center justify-center">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-3xl font-black mb-2">Error Loading Circles</h3>
            <p className="text-gray-600 mb-4 text-lg">{error}</p>
            <p className="text-base text-gray-500">Make sure contracts are deployed and addresses are configured.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600 font-medium text-lg">
                Showing <span className="font-bold text-black">{sortedCircles.length}</span> circles
              </p>
            </div>

            {sortedCircles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCircles.map((circle, index) => (
                  <div key={circle.id} className={`animate-fade-in stagger-${Math.min(index + 1, 6)}`}>
                    <CircleCard circle={circle} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 animate-fade-in">
                <div className="w-24 h-24 bg-gray-200 border-[2px] border-black mx-auto mb-6 flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-3xl font-black mb-2">No circles found</h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {circles.length === 0 
                    ? 'No circles have been created yet. Be the first!' 
                    : 'Try adjusting your filters or search query'}
                </p>
                <div className="flex gap-4 justify-center">
                  {circles.length === 0 && (
                    <Link to="/circles/create">
                      <Button className="neo-button-primary">
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Circle
                      </Button>
                    </Link>
                  )}
                  {circles.length > 0 && (
                    <Button onClick={clearFilters} className="neo-button-secondary">
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
