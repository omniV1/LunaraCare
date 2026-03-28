import { render, screen } from '@testing-library/react';
import { Card } from '../../components/ui/Card';

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;

    expect(card).toHaveClass('bg-dash-card');
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('p-6');
    expect(card).toHaveClass('border-dash-border');
  });

  it('should apply sage variant styles', () => {
    const { container } = render(<Card variant="sage">Content</Card>);
    const card = container.firstChild;

    expect(card).toHaveClass('bg-sage');
  });

  it('should apply olive variant styles', () => {
    const { container } = render(<Card variant="olive">Content</Card>);
    const card = container.firstChild;

    expect(card).toHaveClass('bg-olive');
  });

  it('should accept custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild;

    expect(card).toHaveClass('custom-class');
  });

  it('should combine custom className with default styles', () => {
    const { container } = render(
      <Card className="custom-class" variant="sage">
        Content
      </Card>
    );
    const card = container.firstChild;

    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('bg-sage');
    expect(card).toHaveClass('rounded-2xl');
  });
});
