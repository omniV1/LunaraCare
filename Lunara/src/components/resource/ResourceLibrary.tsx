/**
 * @module components/resource/ResourceLibrary
 * Browsable, filterable library of postpartum/pregnancy resources.
 * Displays personalized recommendations for clients and supports search,
 * category, difficulty, week-range, and author filters.
 */
import React, { useState, useEffect } from 'react';
import { useResource } from '../../contexts/useResource';
import { useAuth } from '../../contexts/useAuth';
import { Card } from '../ui/Card';
import { Resource, ResourceFilters } from '../../services/resourceService';
import {
  RecommendationService,
  ResourceRecommendation,
} from '../../services/recommendationService';

/** Props for {@link ResourceLibrary}. */
interface ResourceLibraryProps {
  showFilters?: boolean;
  onResourceSelect?: (resource: Resource) => void;
}

/** Renders the resource library grid with optional filter panel and recommendation section. */
export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  showFilters = true,
  onResourceSelect,
}) => {
  const { user, isProvider } = useAuth();
  const { resources, categories, loadResources, loadCategories, loading, error } = useResource();

  const [filters, setFilters] = useState<ResourceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTargetWeeks, setSelectedTargetWeeks] = useState<string>('');
  const [selectedPregnancyWeeks, setSelectedPregnancyWeeks] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [recommendations, setRecommendations] = useState<ResourceRecommendation | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Extract unique authors for filter (only if resources exist)
  const authors =
    resources && resources.length > 0
      ? Array.from(
          new Set(
            resources.map(r => `${r.author?.firstName ?? ''} ${r.author?.lastName ?? ''}`.trim())
          )
        )
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      : [];

  // Load recommendations for clients
  useEffect(() => {
    if (!isProvider && user?.role === 'client') {
      setLoadingRecommendations(true);
      RecommendationService.getInstance()
        .getResourceRecommendations()
        .then(recs => {
          setRecommendations(recs);
        })
        .catch(() => {
          // Set recommendations to empty object so the section still shows with error message
          setRecommendations({
            resources: [],
            postpartumWeek: 0,
            reason: 'Unable to load recommendations at this time.',
          });
        })
        .finally(() => {
          setLoadingRecommendations(false);
        });
    }
  }, [isProvider, user]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadResources(filters);
  }, [filters, loadResources]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilters(prev => ({ ...prev, search: searchQuery.trim() }));
    } else {
      const newFilters = { ...filters };
      delete newFilters.search;
      setFilters(newFilters);
    }
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      setFilters(prev => ({ ...prev, category: categoryId }));
    } else {
      const newFilters = { ...filters };
      delete newFilters.category;
      setFilters(newFilters);
    }
  };

  const handleDifficultyFilter = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    if (difficulty) {
      setFilters(prev => ({
        ...prev,
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
      }));
    } else {
      const newFilters = { ...filters };
      delete newFilters.difficulty;
      setFilters(newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSelectedTargetWeeks('');
    setSelectedPregnancyWeeks('');
    setSelectedAuthor('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-[#8C9A8C]/30 text-[#3F4E4F]';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-[#DED7CD]/50 text-[#4E1B00]';
    }
  };

  if (loading && (!resources || resources.length === 0)) {
    return (
      <Card className="p-8 text-center">
        <div className="text-[#6B4D37]">Loading resources...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden w-full max-w-full">
      {showFilters && (
        <Card className="min-w-0">
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-[#4E1B00]">Filter Resources</h3>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-4 min-w-0">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="min-w-0 flex-1 w-full sm:w-auto px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e]"
              >
                Search
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label
                  htmlFor="filterCategory"
                  className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
                >
                  Category
                </label>
                <select
                  id="filterCategory"
                  value={selectedCategory}
                  onChange={e => handleCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filterDifficulty"
                  className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
                >
                  Difficulty
                </label>
                <select
                  id="filterDifficulty"
                  value={selectedDifficulty}
                  onChange={e => handleDifficultyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="resource-library-pregnancy-weeks"
                  className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
                >
                  Pregnancy Week
                </label>
                <input
                  id="resource-library-pregnancy-weeks"
                  type="number"
                  min="1"
                  max="42"
                  value={selectedPregnancyWeeks}
                  onChange={e => {
                    const value = e.target.value;
                    setSelectedPregnancyWeeks(value);
                    if (value) {
                      const weeks = [Number(value)];
                      setFilters(prev => ({ ...prev, targetPregnancyWeeks: weeks }));
                    } else {
                      const newFilters = { ...filters };
                      delete newFilters.targetPregnancyWeeks;
                      setFilters(newFilters);
                    }
                  }}
                  placeholder="Week (1-42)"
                  className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
                />
              </div>

              <div>
                <label
                  htmlFor="resource-library-target-weeks"
                  className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
                >
                  Postpartum Week
                </label>
                <input
                  id="resource-library-target-weeks"
                  type="number"
                  min="1"
                  max="52"
                  value={selectedTargetWeeks}
                  onChange={e => {
                    const value = e.target.value;
                    setSelectedTargetWeeks(value);
                    if (value) {
                      const weeks = [Number(value)];
                      setFilters(prev => ({ ...prev, targetWeeks: weeks }));
                    } else {
                      const newFilters = { ...filters };
                      delete newFilters.targetWeeks;
                      setFilters(newFilters);
                    }
                  }}
                  placeholder="Week (1-52)"
                  className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
                />
              </div>

              <div>
                <label
                  htmlFor="resource-library-author-filter"
                  className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
                >
                  Author
                </label>
                <select
                  id="resource-library-author-filter"
                  value={selectedAuthor}
                  onChange={e => {
                    const value = e.target.value;
                    setSelectedAuthor(value);
                    if (value) {
                      // Find author ID from resources
                      const authorResource = resources.find(
                        r =>
                          `${r.author?.firstName ?? ''} ${r.author?.lastName ?? ''}`.trim() ===
                          value
                      );
                      if (authorResource?.author?.id) {
                        setFilters(prev => ({ ...prev, author: authorResource.author.id }));
                      }
                    } else {
                      const newFilters = { ...filters };
                      delete newFilters.author;
                      setFilters(newFilters);
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
                >
                  <option value="">All Authors</option>
                  {authors.map(author => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    setSelectedTargetWeeks('');
                    setSelectedPregnancyWeeks('');
                    setSelectedAuthor('');
                  }}
                  className="w-full px-4 py-2 border border-[#CAC3BC] text-[#4E1B00]/80 rounded-md hover:bg-[#FAF7F2]"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="text-red-700">{error}</div>
        </Card>
      )}

      {/* Recommended Resources Section (for clients) */}
      {!isProvider && (recommendations || loadingRecommendations) && (
        <Card className="bg-dash-card border-dash-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#4E1B00]">Recommended for You</h3>
                {recommendations ? (
                  <p className="text-sm text-[#6B4D37] mt-1">{recommendations.reason}</p>
                ) : (
                  <p className="text-sm text-[#6B4D37] mt-1">Loading recommendations...</p>
                )}
              </div>
              {recommendations && recommendations.postpartumWeek > 0 && (
                <span className="px-3 py-1 bg-[#6B4D37] text-white text-sm rounded-full">
                  Week {recommendations.postpartumWeek}
                </span>
              )}
            </div>
            {loadingRecommendations ? (
              <div className="bg-white rounded-lg p-6 border border-[#DED7CD] text-center">
                <p className="text-[#6B4D37]">Loading recommendations...</p>
              </div>
            ) : (
              (() => {
                if (recommendations && recommendations.resources.length > 0) {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendations.resources.slice(0, 3).map(resource => (
                        <button
                          type="button"
                          key={resource.id}
                          onClick={() => onResourceSelect?.(resource)}
                          className="text-left hover:shadow-md transition-shadow bg-white rounded-lg p-4 border border-[#DED7CD]"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="text-md font-semibold text-[#4E1B00] line-clamp-2">
                                {resource.title}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(resource.difficulty)}`}
                              >
                                {resource.difficulty}
                              </span>
                            </div>
                            <p className="text-[#6B4D37] text-sm line-clamp-2">
                              {resource.description}
                            </p>
                            <div className="text-xs text-[#6B4D37]">
                              {resource.category?.name ?? 'Uncategorized'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                }
                return (
                  <div className="bg-white rounded-lg p-6 border border-[#DED7CD] text-center">
                    <p className="text-[#6B4D37]">
                      No personalized recommendations available yet. Add your delivery date to
                      your profile to see recommendations based on your postpartum journey.
                    </p>
                  </div>
                );
              })()
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(resources ?? []).map(resource => (
          <button
            type="button"
            key={resource.id}
            onClick={() => onResourceSelect?.(resource)}
            className="text-left hover:shadow-lg transition-shadow"
          >
            <Card>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-[#4E1B00] line-clamp-2">
                    {resource.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(resource.difficulty)}`}
                  >
                    {resource.difficulty}
                  </span>
                </div>

                <p className="text-[#6B4D37] text-sm line-clamp-3">{resource.description}</p>

                <div className="flex items-center justify-between text-sm text-[#6B4D37]">
                  <span>{resource.category?.name ?? 'Uncategorized'}</span>
                  <span>{formatDate(resource.createdAt)}</span>
                </div>

                {(resource.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(resource.tags ?? []).slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-[#DED7CD]/50 text-[#4E1B00]/80 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {(resource.tags || []).length > 3 && (
                      <span className="px-2 py-1 bg-[#DED7CD]/50 text-[#4E1B00]/80 text-xs rounded">
                        +{(resource.tags ?? []).length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {(resource.targetPregnancyWeeks ?? []).length > 0 && (
                  <div className="text-xs text-[#6B4D37]">
                    Pregnancy weeks: {(resource.targetPregnancyWeeks ?? []).join(', ')}
                  </div>
                )}

                {(resource.targetWeeks ?? []).length > 0 && (
                  <div className="text-xs text-[#3F4E4F]">
                    Postpartum weeks: {(resource.targetWeeks ?? []).join(', ')}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6B4D37]">
                    By {resource.author?.firstName ?? 'Unknown'}{' '}
                    {resource.author?.lastName ?? 'Author'}
                  </div>
                  {resource.isPublished && (
                    <span className="px-2 py-1 bg-[#8C9A8C]/30 text-[#3F4E4F] text-xs rounded-full">
                      Published
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {(!resources || resources.length === 0) && !loading && (
        <Card className="text-center py-12">
          <div className="space-y-2">
            <div className="text-[#6B4D37]">
              {searchQuery || selectedCategory || selectedDifficulty
                ? 'No resources found matching your filters.'
                : 'No resources available.'}
            </div>
            {!isProvider && (
              <div className="text-sm text-[#BCADA5] mt-2">
                Only published resources are visible to clients. Ask your provider to publish
                resources.
              </div>
            )}
            {isProvider && (
              <div className="text-sm text-[#BCADA5] mt-2">
                You can see all resources (published and unpublished). Create resources and check
                "Publish this resource" to make them visible to clients.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
