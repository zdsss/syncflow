import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#3366FF',
    colorLink: '#3366FF',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF4D4F',
    colorInfo: '#3366FF',
    borderRadius: 4,
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    colorBorder: '#E8E8E8',
    colorBgLayout: '#F5F7FA',
    colorBgContainer: '#FFFFFF',
  },
  components: {
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#333333',
      rowHoverBg: '#F0F5FF',
      borderColor: '#E8E8E8',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      borderRadius: 8,
      headerBorderRadius: 8,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Button: {
      borderRadius: 4,
      controlHeight: 32,
    },
    Input: {
      borderRadius: 4,
      controlHeight: 32,
    },
    Select: {
      borderRadius: 4,
      controlHeight: 32,
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#EBF0FF',
      itemSelectedColor: '#3366FF',
      itemHoverBg: '#F5F7FA',
      itemColor: '#8C8C8C',
      itemBorderRadius: 0,
      itemMarginInline: 0,
      iconSize: 20,
    },
  },
};

export default theme;
