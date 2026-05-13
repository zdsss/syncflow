import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BomService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.bomItem.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.bomItem.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.bomItem.create({
      data: {
        name: data.name,
        partNumber: data.partNumber,
        specification: data.specification,
        supplier: data.supplier,
        unit: data.unit,
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        parentId: data.parentId,
        projectId: data.projectId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.bomItem.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.bomItem.delete({
      where: { id },
    });
  }

  async findTree(projectId: string) {
    const items = await this.findAll(projectId);
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }

    for (const item of items) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  // === Version Management ===

  async createVersion(projectId: string, description?: string) {
    // Find max version number
    const agg = await (this.prisma as any).bomVersion.aggregate({
      where: { projectId },
      _max: { version: true },
    });
    const maxVersion = agg._max.version ?? 0;
    const newVersionNumber = maxVersion + 1;

    // Create the version record
    const version = await (this.prisma as any).bomVersion.create({
      data: {
        projectId,
        version: newVersionNumber,
        description,
        status: 'draft',
      },
    });

    // Deep copy all current BOM items for this project
    const currentItems = await this.prisma.bomItem.findMany({
      where: { projectId },
    });

    if (currentItems.length > 0) {
      const copiedItems = currentItems.map((item) => ({
        name: item.name,
        partNumber: item.partNumber,
        specification: item.specification,
        supplier: item.supplier,
        unit: item.unit,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        parentId: item.parentId,
        projectId: item.projectId,
        version: newVersionNumber,
      }));

      await this.prisma.bomItem.createMany({
        data: copiedItems,
      });
    }

    return version;
  }

  async getVersions(projectId: string) {
    return (this.prisma as any).bomVersion.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }

  async compareVersions(projectId: string, versionA: number, versionB: number) {
    const itemsA = await this.prisma.bomItem.findMany({
      where: { projectId, version: versionA },
    });
    const itemsB = await this.prisma.bomItem.findMany({
      where: { projectId, version: versionB },
    });

    const mapA = new Map(itemsA.map((item) => [item.partNumber, item]));
    const mapB = new Map(itemsB.map((item) => [item.partNumber, item]));

    const added: any[] = [];
    const removed: any[] = [];
    const modified: any[] = [];

    // Items in B but not in A = added
    for (const [partNumber, itemB] of mapB) {
      if (!mapA.has(partNumber)) {
        added.push(itemB);
      }
    }

    // Items in A but not in B = removed
    for (const [partNumber, itemA] of mapA) {
      if (!mapB.has(partNumber)) {
        removed.push(itemA);
      }
    }

    // Items in both = check for modifications
    const compareFields = ['name', 'specification', 'supplier', 'unit', 'unitPrice', 'quantity', 'parentId'];
    for (const [partNumber, itemA] of mapA) {
      const itemB = mapB.get(partNumber);
      if (itemB) {
        const changes: Record<string, { old: any; new: any }> = {};
        let hasChanges = false;

        for (const field of compareFields) {
          const oldVal = (itemA as any)[field];
          const newVal = (itemB as any)[field];
          // Handle Decimal comparison
          if (String(oldVal) !== String(newVal)) {
            changes[field] = { old: oldVal, new: newVal };
            hasChanges = true;
          }
        }

        if (hasChanges) {
          modified.push({
            partNumber,
            changes,
            itemA,
            itemB,
          });
        }
      }
    }

    return { added, removed, modified };
  }

  async rollbackVersion(projectId: string, targetVersion: number) {
    // Find the target version
    const target = await (this.prisma as any).bomVersion.findFirst({
      where: { projectId, version: targetVersion },
    });

    if (!target) {
      throw new NotFoundException(
        `Version ${targetVersion} not found for project ${projectId}`,
      );
    }

    // Archive the current draft version(s)
    await (this.prisma as any).bomVersion.updateMany({
      where: { projectId, status: 'draft' },
      data: { status: 'archived' },
    });

    // Get max version to compute new version number
    const agg = await (this.prisma as any).bomVersion.aggregate({
      where: { projectId },
      _max: { version: true },
    });
    const newVersionNumber = (agg._max.version ?? 0) + 1;

    // Create a new version record
    const newVersion = await (this.prisma as any).bomVersion.create({
      data: {
        projectId,
        version: newVersionNumber,
        description: `Rollback to version ${targetVersion}`,
        status: 'draft',
      },
    });

    // Deep copy items from the target version
    const targetItems = await this.prisma.bomItem.findMany({
      where: { projectId, version: targetVersion },
    });

    if (targetItems.length > 0) {
      const copiedItems = targetItems.map((item) => ({
        name: item.name,
        partNumber: item.partNumber,
        specification: item.specification,
        supplier: item.supplier,
        unit: item.unit,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        parentId: item.parentId,
        projectId: item.projectId,
        version: newVersionNumber,
      }));

      await this.prisma.bomItem.createMany({
        data: copiedItems,
      });
    }

    return newVersion;
  }

  // === Import / Export ===

  async importFromData(
    projectId: string,
    items: Array<{
      name: string;
      partNumber: string;
      specification?: string;
      supplier?: string;
      unit?: string;
      unitPrice?: number;
      quantity?: number;
    }>,
  ) {
    for (const item of items) {
      if (!item.name || !item.partNumber) {
        throw new Error('Each item must have a name and partNumber');
      }
    }

    if (items.length === 0) {
      return { importedCount: 0 };
    }

    const results = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.bomItem.create({
          data: {
            name: item.name,
            partNumber: item.partNumber,
            specification: item.specification,
            supplier: item.supplier,
            unit: item.unit,
            unitPrice: item.unitPrice,
            quantity: item.quantity ?? 1,
            projectId,
            version: 1,
          },
        }),
      ),
    );

    return { importedCount: results.length };
  }

  async exportToData(projectId: string) {
    return this.prisma.bomItem.findMany({
      where: { projectId },
      orderBy: { partNumber: 'asc' },
    });
  }
}
