import { Result, Button } from 'antd';

export default function ServerErrorPage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Result
      status="500"
      title="500"
      subTitle="系统异常"
      extra={
        <Button type="primary" onClick={handleRefresh}>
          刷新页面
        </Button>
      }
    />
  );
}
