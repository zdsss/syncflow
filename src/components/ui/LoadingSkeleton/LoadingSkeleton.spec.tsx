import { render, screen } from '@testing-library/react';
import LoadingSkeleton from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders without crashing', () => {
    render(<LoadingSkeleton />);
    expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
  });

  it('renders with default 5 rows', () => {
    const { container } = render(<LoadingSkeleton />);
    const skeletonParagraph = container.querySelector('.ant-skeleton-paragraph');
    const rows = skeletonParagraph?.querySelectorAll('li');
    expect(rows).toHaveLength(5);
  });

  it('renders correct number of skeleton rows', () => {
    const { container } = render(<LoadingSkeleton rows={3} />);
    const skeletonParagraph = container.querySelector('.ant-skeleton-paragraph');
    const rows = skeletonParagraph?.querySelectorAll('li');
    expect(rows).toHaveLength(3);
  });

  it('renders avatar when avatar prop is true', () => {
    const { container } = render(<LoadingSkeleton avatar />);
    expect(container.querySelector('.ant-skeleton-avatar')).toBeInTheDocument();
  });

  it('does not render avatar when avatar prop is false', () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.querySelector('.ant-skeleton-avatar')).not.toBeInTheDocument();
  });
});
