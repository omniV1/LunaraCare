import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  DashboardStatSkeleton,
  ListItemSkeleton,
  BlogPostSkeleton,
  ResourceCardSkeleton,
  FormSkeleton,
  PageSkeleton,
} from '../../../components/ui/Skeleton';

describe('Skeleton components', () => {
  it('Skeleton supports variants, sizing, and animation', () => {
    const { rerender } = render(<Skeleton variant="text" width={10} height={12} animation="none" />);
    const el = screen.getByLabelText('Loading...');
    expect(el).toHaveStyle({ width: '10px', height: '12px' });

    rerender(<Skeleton variant="circular" width="100%" animation="pulse" />);
    expect(screen.getByLabelText('Loading...')).toHaveClass('rounded-full');
  });

  it('renders composite skeletons without crashing', () => {
    render(
      <div>
        <CardSkeleton />
        <table>
          <tbody>
            <TableRowSkeleton columns={3} />
          </tbody>
        </table>
        <DashboardStatSkeleton />
        <ListItemSkeleton />
        <BlogPostSkeleton />
        <ResourceCardSkeleton />
        <FormSkeleton fields={2} />
        <PageSkeleton />
      </div>,
    );

    // At least one skeleton output exists
    expect(screen.getAllByLabelText('Loading...').length).toBeGreaterThan(0);
  });
});

