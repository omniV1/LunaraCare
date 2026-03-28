import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DocumentSearchFilter } from '../../../components/documents/DocumentSearchFilter';

describe('DocumentSearchFilter', () => {
  it('updates query, triggers search, changes filters and clears', () => {
    const onSearchQueryChange = jest.fn();
    const onSearch = jest.fn((e) => e.preventDefault());
    const onFilterChange = jest.fn();
    const onClearFilters = jest.fn();

    render(
      <DocumentSearchFilter
        searchQuery=""
        onSearchQueryChange={onSearchQueryChange}
        onSearch={onSearch}
        filters={{ documentType: undefined, submissionStatus: undefined, startDate: '', endDate: '' }}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Search documents/), { target: { value: 'x' } });
    expect(onSearchQueryChange).toHaveBeenCalledWith('x');

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Document Type'), { target: { value: 'other' } });
    expect(onFilterChange).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Submission Status'), { target: { value: 'draft' } });
    expect(onFilterChange).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-01-01' } });
    expect(onFilterChange).toHaveBeenCalledWith('startDate', '2026-01-01');

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});

