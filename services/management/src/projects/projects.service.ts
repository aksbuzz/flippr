import crypto from 'crypto';
import { ConflictError, NotFoundError } from '../common/errors';
import { db } from '../config/database';
import { projectTasksQueue } from '../config/queue';
import { Environment } from '../db/models/environment';
import { FeatureFlag } from '../db/models/feature-flag';
import { Project } from '../db/models/project';

interface FlagResponse extends FeatureFlag {
  environments: { id: string; name: string; is_enabled: boolean }[];
}

export class ProjectsService {
  async createProject(data: { name: string }): Promise<Project> {
    try {
      return await db.one<Project>(
        `INSERT INTO projects (name, created_at)
         VALUES ($1, NOW())
         RETURNING id, name, created_at`,
        [data.name]
      );
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictError(`Project "${data.name}" already exists`);
      }
      throw err;
    }
  }

  async getProjects(): Promise<Project[]> {
    return db.manyOrNone<Project>(`SELECT id, name, created_at FROM projects ORDER BY id ASC`);
  }

  async createEnvironment(projectId: string, data: { name: string }): Promise<Environment> {
    const exists = await db.oneOrNone<Project>(`SELECT id FROM projects WHERE id = $1`, [
      projectId,
    ]);
    if (!exists) throw new NotFoundError('Project not found');

    const sdkKey = `${data.name}_sdk_key_${projectId}_${crypto.randomBytes(16).toString('hex')}`;
    const newEnvironment = await db.one<Environment>(
      `INSERT INTO environments (project_id, name, sdk_key)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, name, sdk_key`,
      [projectId, data.name, sdkKey]
    );

    await projectTasksQueue.add(
      'link-new-environment',
      { environmentId: newEnvironment.id, projectId: projectId },
      { removeOnComplete: true, removeOnFail: 50 }
    );

    return newEnvironment;
  }

  async getEnvironments(projectId: string): Promise<Omit<Environment, 'sdk_key'>[]> {
    return db.manyOrNone<Omit<Environment, 'sdk_key'>>(
      `SELECT id, project_id, name FROM environments WHERE project_id = $1 ORDER BY id ASC`,
      [projectId]
    );
  }

  async createFlag(
    projectId: string,
    data: { name: string; key: string; description: string }
  ): Promise<FeatureFlag> {
    return db.tx<FeatureFlag>(async tx => {
      const project = await tx.oneOrNone<Project>(`SELECT id FROM projects WHERE id = $1`, [
        projectId,
      ]);
      if (!project) throw new NotFoundError('Project not found');

      const flag = await tx.one<FeatureFlag>(
        `INSERT INTO feature_flags (project_id, name, key, description, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, project_id, key, description, created_at`,
        [projectId, data.name, data.key, data.description]
      );

      await tx.none(
        `INSERT INTO environment_flag_states (environment_id, feature_flag_id, is_enabled)
       SELECT e.id, $1, false
       FROM environments e WHERE e.project_id = $2`,
        [flag.id, projectId]
      );

      return flag;
    });
  }

  async getFlags(projectId: string): Promise<FlagResponse[]> {
    const rows = await db.manyOrNone(
      `SELECT f.id as flag_id, f.name as flag_name, f.key, f.description, f.created_at,
              e.id as env_id, e.name as env_name, s.is_enabled
       FROM feature_flags f
       LEFT JOIN environment_flag_states s ON s.feature_flag_id = f.id
       LEFT JOIN environments e ON e.id = s.environment_id
       WHERE f.project_id = $1
       ORDER BY f.id, e.id`,
      [projectId]
    );

    const grouped: Record<string, FlagResponse> = {};
    for (const row of rows) {
      if (!grouped[row.flag_id]) {
        grouped[row.flag_id] = {
          id: row.flag_id,
          project_id: projectId,
          name: row.flag_name,
          key: row.key,
          description: row.description,
          created_at: row.created_at,
          environments: [],
        };
      }

      if (row.env_id) {
        grouped[row.flag_id].environments.push({
          id: row.env_id,
          name: row.env_name,
          is_enabled: row.is_enabled,
        });
      }
    }

    return Object.values(grouped);
  }
}
