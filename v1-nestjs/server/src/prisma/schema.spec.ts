import * as fs from 'fs';
import * as path from 'path';

describe('Prisma Schema Validation', () => {
  let schema: string;

  beforeAll(() => {
    schema = fs.readFileSync(
      path.join(__dirname, '../../prisma/schema.prisma'),
      'utf-8',
    );
  });

  it('TaskDependency model exists with correct fields and relations (Task 1)', () => {
    // Model declaration
    expect(schema).toContain('model TaskDependency');
    // Fields
    expect(schema).toContain('taskId');
    expect(schema).toContain('dependsOnId');
    // Relations
    expect(schema).toContain('@relation("TaskDependencyTask"');
    expect(schema).toContain('@relation("TaskDependencyDependsOn"');
    // Unique constraint
    expect(schema).toContain('@@unique([taskId, dependsOnId])');
    // Table mapping
    expect(schema).toContain('@@map("task_dependencies")');
  });

  it('Team and Project have proper leaderId FK relations (Task 2)', () => {
    // Team leader relation
    expect(schema).toMatch(/Team[\s\S]*leader\s+User\?\s+@relation\("TeamLeader"/);
    // Project leader relation
    expect(schema).toMatch(/Project[\s\S]*leader\s+User\?\s+@relation\("ProjectLeader"/);
    // User reverse relations
    expect(schema).toContain('ledTeams     Team[]       @relation("TeamLeader")');
    expect(schema).toContain('ledProjects  Project[]    @relation("ProjectLeader")');
  });
});
