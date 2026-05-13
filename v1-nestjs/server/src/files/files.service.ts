import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';
import { AuditService } from '../audit/audit.service';

/**
 * FilesService - File management with version control and permissions.
 *
 * MinIO Integration Architecture (future):
 * - Current local disk storage (/uploads/) is a placeholder for development.
 * - Production: replace local paths with MinIO (S3-compatible) object storage.
 * - MinIO bucket: "syncflow-files", organized by projectId/fileId/version.
 * - Upload flow: stream Multer buffer -> MinIO PUT, store object key in DB (not local path).
 * - Download flow: generate pre-signed URL from MinIO (1h expiry) or proxy via server.
 * - Encryption: use MinIO server-side encryption (SSE-S3 or SSE-KMS) instead of
 *   the encryptFile/decryptFile placeholders below.
 * - Config: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY env vars.
 * - Use minio npm package: `new Minio.Client({ endPoint, port, useSSL, accessKey, secretKey })`.
 */

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private wsService: WebSocketService,
    private auditService: AuditService,
  ) {}

  async findAll(query: {
    type?: string;
    projectId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const where: Record<string, unknown> = { isDeleted: false };

    if (query.type) where.type = query.type;
    if (query.projectId) where.projectId = query.projectId;

    const [data, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        include: { project: true, uploader: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      code: 0,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.file.findFirst({
      where: { id, isDeleted: false },
      include: { project: true, uploader: true },
    });

    if (!data) return { code: 404, message: 'File not found' };
    return { code: 0, data };
  }

  async create(dto: {
    name: string;
    type: string;
    extension?: string;
    size: number | bigint;
    path: string;
    uploaderId: string;
    projectId?: string;
    parentFolderId?: string;
  }) {
    const data = await this.prisma.file.create({ data: dto as any });
    return { code: 0, data };
  }

  async update(id: string, dto: Record<string, unknown>) {
    const data = await this.prisma.file.update({
      where: { id },
      data: dto as any,
    });
    return { code: 0, data };
  }

  async remove(id: string) {
    await this.prisma.file.update({
      where: { id },
      data: { isDeleted: true },
    });
    return { code: 0, message: 'File deleted' };
  }

  async getStats() {
    const totalFiles = await this.prisma.file.count({
      where: { isDeleted: false },
    });

    const usedResult = await this.prisma.file.aggregate({
      where: { isDeleted: false },
      _sum: { size: true },
    });

    const deletedResult = await this.prisma.file.aggregate({
      where: { isDeleted: true },
      _sum: { size: true },
    });

    const usedSpace = Number(usedResult._sum.size || 0);
    const deletedSpace = Number(deletedResult._sum.size || 0);
    const totalSpace = usedSpace + deletedSpace;

    return {
      code: 0,
      data: { totalFiles, usedSpace, totalSpace },
    };
  }

  async uploadFile(
    file: Express.Multer.File,
    body: { uploaderId: string; projectId?: string; parentFolderId?: string },
  ) {
    const name = file.originalname;
    const extension = name.includes('.')
      ? '.' + name.split('.').pop()
      : null;

    // File security: validate file type against allowed categories
    const fileType = this.getFileType(extension);
    const allowedTypes = ['DOCUMENT', 'IMAGE', 'CODE', 'SPREADSHEET', 'VIDEO', 'CAD', 'OTHER'];
    if (!allowedTypes.includes(fileType)) {
      throw new BadRequestException(`File type '${fileType}' is not allowed`);
    }
    // Also reject files with known dangerous extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.msi', '.dll', '.scr'];
    if (extension && dangerousExtensions.includes(extension.toLowerCase())) {
      throw new BadRequestException(`File extension '${extension}' is not allowed for security reasons`);
    }

    const existing = await this.prisma.file.findFirst({
      where: { name, projectId: body.projectId || null, isDeleted: false },
      orderBy: { version: 'desc' },
    });
    const version = existing ? existing.version + 1 : 1;

    const data = await this.prisma.file.create({
      data: {
        name,
        type: this.getFileType(extension) as any,
        extension,
        size: Number(file.size) as number,
        path: `/uploads/${file.filename}`,
        uploaderId: body.uploaderId,
        projectId: body.projectId,
        parentFolderId: body.parentFolderId,
        version,
      },
    });

    this.wsService.emitNotification(body.uploaderId, {
      title: 'File Uploaded',
      desc: `File "${name}" has been uploaded`,
      type: 'file_uploaded',
    });

    // Create FileVersion record
    await this.prisma.fileVersion.create({
      data: {
        fileId: data.id,
        version: data.version,
        size: file.size,
        path: data.path,
        uploaderId: body.uploaderId,
        comment: null,
      },
    });

    // Audit log for file upload
    await this.auditService.log(body.uploaderId, 'upload', 'file', data.id, {
      fileName: name,
      size: file.size,
      version,
    });

    return { code: 0, data };
  }

  async getFileVersions(fileId: string) {
    const data = await this.prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { version: 'desc' },
    });
    return { code: 0, data };
  }

  async rollbackVersion(fileId: string, targetVersion: number) {
    const target = await this.prisma.fileVersion.findFirst({
      where: { fileId, version: targetVersion },
    });

    if (!target) {
      throw new Error(`Version ${targetVersion} not found for file ${fileId}`);
    }

    // Find current max version to determine new version number
    const latestVersion = await this.prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { version: 'desc' },
    });
    const newVersionNum = latestVersion ? latestVersion.version + 1 : 1;

    // Update the file to point to the target version's path and size
    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        path: target.path,
        size: Number(target.size) as number,
        version: newVersionNum,
      },
    });

    // Create a new version record for the rollback
    await this.prisma.fileVersion.create({
      data: {
        fileId,
        version: newVersionNum,
        size: target.size,
        path: target.path,
        uploaderId: target.uploaderId,
        comment: `Rollback to version ${targetVersion}`,
      },
    });

    return { code: 0, data: updatedFile };
  }

  async getFileInfo(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        permissions: { select: { userId: true, level: true } },
        versions: { orderBy: { version: 'desc' }, take: 5 },
      },
    });
    if (!file || file.isDeleted) throw new NotFoundException('File not found');
    return file;
  }

  async getFilePath(fileId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.isDeleted) throw new NotFoundException('File not found');

    // Increment download count
    await this.prisma.file.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    });

    return { path: file.path, name: file.name, type: file.type };
  }

  async getBreadcrumbs(fileId: string) {
    const breadcrumbs: Array<{ id: string; name: string }> = [];
    let currentId: string | null = fileId;

    while (currentId) {
      const file: any = await this.prisma.file.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentFolderId: true },
      });
      if (!file) break;
      breadcrumbs.unshift({ id: file.id, name: file.name });
      currentId = file.parentFolderId;
    }

    return breadcrumbs;
  }

  async setPermission(fileId: string, userId: string, level: string) {
    return (this.prisma as any).filePermission.upsert({
      where: { fileId_userId: { fileId, userId } },
      update: { level },
      create: { fileId, userId, level },
    });
  }

  async getPermission(fileId: string, userId: string) {
    return (this.prisma as any).filePermission.findUnique({
      where: { fileId_userId: { fileId, userId } },
    });
  }

  async removePermission(fileId: string, userId: string) {
    try {
      return await (this.prisma as any).filePermission.delete({
        where: { fileId_userId: { fileId, userId } },
      });
    } catch {
      throw new Error('Permission not found');
    }
  }

  async getFilePermissions(fileId: string) {
    return (this.prisma as any).filePermission.findMany({
      where: { fileId },
    });
  }

  async getBatchDownloadInfo(fileIds: string[]) {
    const files = await this.prisma.file.findMany({
      where: { id: { in: fileIds }, isDeleted: false },
      select: { id: true, name: true, path: true, size: true },
    });
    const totalSize = files.reduce((sum, f) => sum + Number(f.size), 0);
    return { files, totalSize, count: files.length };
  }

  async batchDelete(fileIds: string[]) {
    const result = await this.prisma.file.updateMany({
      where: { id: { in: fileIds }, isDeleted: false },
      data: { isDeleted: true },
    });
    return { deletedCount: result.count };
  }

  async batchGetFiles(fileIds: string[]) {
    return this.prisma.file.findMany({
      where: { id: { in: fileIds }, isDeleted: false },
    });
  }

  // --- Encryption utilities (placeholder) ---

  /**
   * Encrypt a file buffer. Currently a no-op placeholder that returns
   * the input unchanged. Replace with real AES/RSA encryption when
   * key management infrastructure is ready.
   */
  encryptFile(data: Buffer): Buffer {
    // TODO: implement real encryption (e.g. AES-256-GCM)
    return data;
  }

  /**
   * Decrypt a file buffer. Currently a no-op placeholder that returns
   * the input unchanged. Replace with the corresponding decryption
   * algorithm when encryptFile is implemented.
   */
  decryptFile(data: Buffer): Buffer {
    // TODO: implement real decryption
    return data;
  }

  private getFileType(extension: string | null): string {
    if (!extension) return 'OTHER';
    const map: Record<string, string> = {
      '.pdf': 'DOCUMENT',
      '.doc': 'DOCUMENT',
      '.docx': 'DOCUMENT',
      '.xls': 'SPREADSHEET',
      '.xlsx': 'SPREADSHEET',
      '.ppt': 'DOCUMENT',
      '.pptx': 'DOCUMENT',
      '.txt': 'DOCUMENT',
      '.png': 'IMAGE',
      '.jpg': 'IMAGE',
      '.jpeg': 'IMAGE',
      '.gif': 'IMAGE',
      '.svg': 'IMAGE',
      '.webp': 'IMAGE',
      '.mp4': 'VIDEO',
      '.avi': 'VIDEO',
      '.mov': 'VIDEO',
      '.mp3': 'OTHER',
      '.wav': 'OTHER',
      '.zip': 'OTHER',
      '.rar': 'OTHER',
      '.7z': 'OTHER',
      '.dwg': 'CAD',
      '.dxf': 'CAD',
      '.step': 'CAD',
      '.stp': 'CAD',
    };
    return map[extension.toLowerCase()] || 'OTHER';
  }
}
