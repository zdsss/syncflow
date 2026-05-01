import { Skeleton } from 'antd';

interface LoadingSkeletonProps {
  rows?: number;
  avatar?: boolean;
}

export default function LoadingSkeleton({ rows = 5, avatar = false }: LoadingSkeletonProps) {
  return (
    <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 8 }}>
      {avatar && <Skeleton.Avatar active size="large" style={{ marginBottom: 16 }} />}
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
}
