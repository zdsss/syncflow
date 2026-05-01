import { useFileStore } from '@/stores/useFileStore';
import styles from './StorageStatsBar.module.css';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)}GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)}MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)}KB`;
}

export default function StorageStatsBar() {
  const { storageStats } = useFileStore();
  const { totalFiles, usedSpace, totalSpace } = storageStats;
  const availableSpace = totalSpace - usedSpace;
  const percent = totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0;

  return (
    <div className={styles.statsBar}>
      <span className={styles.statsText}>
        共 {totalFiles} 个文件 | {formatBytes(usedSpace)}/{formatBytes(totalSpace)} | 可用 {formatBytes(availableSpace)}
      </span>
      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>
        <span className={styles.progressLabel}>{percent.toFixed(1)}%</span>
      </div>
    </div>
  );
}
