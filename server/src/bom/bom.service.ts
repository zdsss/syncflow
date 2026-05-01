import { Injectable } from '@nestjs/common';
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
}
